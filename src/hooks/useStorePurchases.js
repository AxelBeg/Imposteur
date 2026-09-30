import { useCallback, useEffect, useRef } from "react";
import { ErrorCode, finishTransaction, useIAP } from "expo-iap";
import {
  trackPurchaseCancelled,
  trackPurchaseCompleted,
  trackPurchaseFailed,
} from "../services/analytics";
import { PRODUCT_SKUS, grantIdsForProduct } from "../services/themeProducts";

export function useStorePurchases({ onGrantThemeIds, onPurchaseError }) {
  const grantRef = useRef(onGrantThemeIds);
  const errorRef = useRef(onPurchaseError);
  const pendingSkuRef = useRef(null);
  grantRef.current = onGrantThemeIds;
  errorRef.current = onPurchaseError;

  const {
    connected,
    products,
    availablePurchases,
    fetchProducts,
    requestPurchase,
    getAvailablePurchases,
    restorePurchases,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      const granted = grantIdsForProduct(purchase.productId);
      if (granted.length) grantRef.current?.(granted);
      if (pendingSkuRef.current) {
        trackPurchaseCompleted(purchase.productId);
        pendingSkuRef.current = null;
      }
      try {
        await finishTransaction({ purchase, isConsumable: false });
      } catch {
        // ignore
      }
    },
    onPurchaseError: (error) => {
      const sku = error.productId ?? pendingSkuRef.current;
      pendingSkuRef.current = null;
      if (error.code === ErrorCode.UserCancelled) {
        trackPurchaseCancelled(sku);
        return;
      }
      if (error.code === ErrorCode.AlreadyOwned) {
        const granted = grantIdsForProduct(error.productId ?? sku);
        if (granted.length) grantRef.current?.(granted);
        return;
      }
      trackPurchaseFailed(sku, error);
      errorRef.current?.(error);
    },
  });

  useEffect(() => {
    if (!connected) return;
    fetchProducts({ skus: PRODUCT_SKUS, type: "in-app" }).catch(() => {});
    getAvailablePurchases().catch(() => {});
  }, [connected, fetchProducts, getAvailablePurchases]);

  useEffect(() => {
    const themeIds = (availablePurchases ?? []).flatMap((purchase) =>
      grantIdsForProduct(purchase.productId)
    );
    if (themeIds.length) grantRef.current?.(themeIds);
  }, [availablePurchases]);

  const purchaseSku = useCallback(
    async (sku) => {
      pendingSkuRef.current = sku;
      try {
        await requestPurchase({
          request: {
            apple: { sku },
            google: { skus: [sku] },
          },
          type: "in-app",
        });
      } catch (error) {
        pendingSkuRef.current = null;
        throw error;
      }
    },
    [requestPurchase]
  );

  const restore = useCallback(async () => {
    await restorePurchases();
    await getAvailablePurchases();
  }, [restorePurchases, getAvailablePurchases]);

  return { connected, products, purchaseSku, restore };
}
