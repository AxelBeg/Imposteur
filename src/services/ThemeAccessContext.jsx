import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useStorePurchases } from "../hooks/useStorePurchases";
import { initializeAds, showRewardedAd } from "./ads";
import {
  trackAdStarted,
  trackAdWatched,
  trackPurchaseStarted,
  trackPurchasesRestored,
} from "./analytics";
import { loadPurchasedThemeIds, savePurchasedThemeIds } from "./purchasedThemes";
import {
  ALL_THEMES_PRODUCT_ID,
  ALL_THEMES_UNLOCK_ID,
  FALLBACK_ALL_THEMES_PRICE_LABEL,
  FALLBACK_PRICE_LABEL,
  FREE_THEME_ID,
  PAID_THEME_IDS,
  isThemeFree,
  productIdForTheme,
} from "./themeProducts";

const ThemeAccessContext = createContext(null);

export function ThemeAccessProvider({ children }) {
  const [purchasedIds, setPurchasedIds] = useState([]);
  const [adUnlockedIds, setAdUnlockedIds] = useState([]);
  const [ready, setReady] = useState(false);
  const [busyAd, setBusyAd] = useState(false);
  const [busyPurchase, setBusyPurchase] = useState(false);

  const grantThemeIds = useCallback((themeIds) => {
    if (!themeIds?.length) return;
    setPurchasedIds((current) => {
      const next = [...new Set([...current, ...themeIds])];
      if (next.length === current.length && next.every((id) => current.includes(id))) {
        return current;
      }
      return next;
    });
  }, []);

  const { products, purchaseSku, restore } = useStorePurchases({
    onGrantThemeIds: grantThemeIds,
    onPurchaseError: (error) => {
      Alert.alert("Achat impossible", error.message || "Réessayez plus tard.");
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ids = await loadPurchasedThemeIds();
      if (!cancelled) {
        setPurchasedIds(ids);
        setReady(true);
      }
      initializeAds();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    savePurchasedThemeIds(purchasedIds);
  }, [ready, purchasedIds]);

  const ownsAllThemes = purchasedIds.includes(ALL_THEMES_UNLOCK_ID);
  const hasAllThemes =
    ownsAllThemes || PAID_THEME_IDS.every((themeId) => purchasedIds.includes(themeId));

  const isPurchased = useCallback(
    (themeId) => ownsAllThemes || purchasedIds.includes(themeId),
    [ownsAllThemes, purchasedIds]
  );

  const isUnlocked = useCallback(
    (themeId) =>
      isThemeFree(themeId) || ownsAllThemes || purchasedIds.includes(themeId) || adUnlockedIds.includes(themeId),
    [ownsAllThemes, purchasedIds, adUnlockedIds]
  );

  const needsReplayAd = useCallback(
    (themeId) => !isThemeFree(themeId) && !ownsAllThemes && !purchasedIds.includes(themeId),
    [ownsAllThemes, purchasedIds]
  );

  const getPriceLabel = useCallback(
    (themeId) => {
      const sku = productIdForTheme(themeId);
      const product = products.find((item) => item.id === sku);
      return product?.displayPrice || FALLBACK_PRICE_LABEL;
    },
    [products]
  );

  const getAllThemesPriceLabel = useCallback(() => {
    const product = products.find((item) => item.id === ALL_THEMES_PRODUCT_ID);
    return product?.displayPrice || FALLBACK_ALL_THEMES_PRICE_LABEL;
  }, [products]);

  const unlockWithAd = useCallback(async (themeId, placement = "theme_unlock") => {
    if (isThemeFree(themeId)) return true;
    setBusyAd(true);
    try {
      trackAdStarted({ themeId, placement });
      const result = await showRewardedAd();
      trackAdWatched({ themeId, placement, result });
      if (result !== "earned") {
        if (result === "failed") {
          Alert.alert(
            "Publicité indisponible",
            "La publicité n'a pas pu être affichée. Réessayez ou achetez le thème."
          );
        }
        return false;
      }
      setAdUnlockedIds((current) =>
        current.includes(themeId) ? current : [...current, themeId]
      );
      return true;
    } finally {
      setBusyAd(false);
    }
  }, []);

  const purchaseTheme = useCallback(
    async (themeId) => {
      const sku = productIdForTheme(themeId);
      if (!sku) return;
      setBusyPurchase(true);
      try {
        trackPurchaseStarted(sku);
        await purchaseSku(sku);
      } catch (error) {
        if (error?.code !== "user-cancelled") {
          Alert.alert("Achat impossible", error?.message || "Réessayez plus tard.");
        }
      } finally {
        setBusyPurchase(false);
      }
    },
    [purchaseSku]
  );

  const purchaseAllThemes = useCallback(async () => {
    setBusyPurchase(true);
    try {
      trackPurchaseStarted(ALL_THEMES_PRODUCT_ID);
      await purchaseSku(ALL_THEMES_PRODUCT_ID);
    } catch (error) {
      if (error?.code !== "user-cancelled") {
        Alert.alert("Achat impossible", error?.message || "Réessayez plus tard.");
      }
    } finally {
      setBusyPurchase(false);
    }
  }, [purchaseSku]);

  const restorePurchases = useCallback(async () => {
    try {
      await restore();
      trackPurchasesRestored();
      Alert.alert("Achats restaurés", "Vos thèmes achetés ont été récupérés.");
    } catch (error) {
      Alert.alert("Restauration impossible", error?.message || "Réessayez plus tard.");
    }
  }, [restore]);

  const clearAdUnlocks = useCallback(() => {
    setAdUnlockedIds([]);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      busyAd,
      busyPurchase,
      hasAllThemes,
      isPurchased,
      isUnlocked,
      needsReplayAd,
      getPriceLabel,
      getAllThemesPriceLabel,
      unlockWithAd,
      purchaseTheme,
      purchaseAllThemes,
      restorePurchases,
      clearAdUnlocks,
      freeThemeId: FREE_THEME_ID,
    }),
    [
      ready,
      busyAd,
      busyPurchase,
      hasAllThemes,
      isPurchased,
      isUnlocked,
      needsReplayAd,
      getPriceLabel,
      getAllThemesPriceLabel,
      unlockWithAd,
      purchaseTheme,
      purchaseAllThemes,
      restorePurchases,
      clearAdUnlocks,
    ]
  );

  return <ThemeAccessContext.Provider value={value}>{children}</ThemeAccessContext.Provider>;
}

export function useThemeAccess() {
  const value = useContext(ThemeAccessContext);
  if (!value) {
    throw new Error("useThemeAccess must be used within ThemeAccessProvider");
  }
  return value;
}
