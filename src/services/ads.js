import mobileAds, {
  AdsConsent,
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

const PRODUCTION_REWARDED_UNIT_ID = "ca-app-pub-9919137332387976/2167850915";
const LOAD_TIMEOUT_MS = 20000;

function rewardedUnitId() {
  return __DEV__ ? TestIds.REWARDED : PRODUCTION_REWARDED_UNIT_ID;
}

export async function initializeAds() {
  try {
    await mobileAds().setRequestConfiguration({
      testDeviceIdentifiers: __DEV__ ? ["EMULATOR"] : [],
    });
  } catch {
    // ignore
  }

  try {
    await AdsConsent.gatherConsent();
  } catch {
    // UMP optionnel tant que le message RGPD n'est pas cree dans AdMob.
  }

  try {
    const info = await AdsConsent.getConsentInfo();
    if (info?.canRequestAds === false) return;
  } catch {
    // ignore
  }

  try {
    await mobileAds().initialize();
  } catch {
    // SDK absent (Expo Go) ou init impossible.
  }
}

export function showRewardedAd() {
  return new Promise((resolve) => {
    let settled = false;
    let earned = false;
    let rewarded;

    const settle = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(loadTimeout);
      try {
        rewarded?.removeAllListeners();
      } catch {
        // ignore
      }
      resolve(value);
    };

    try {
      rewarded = RewardedAd.createForAdRequest(rewardedUnitId());
    } catch {
      resolve("failed");
      return;
    }

    const loadTimeout = setTimeout(() => {
      if (!rewarded.loaded) settle("failed");
    }, LOAD_TIMEOUT_MS);

    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      clearTimeout(loadTimeout);
      rewarded.show().catch(() => settle("failed"));
    });
    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
    });
    rewarded.addAdEventListener(AdEventType.CLOSED, () => settle(earned ? "earned" : "skipped"));
    rewarded.addAdEventListener(AdEventType.ERROR, () => settle("failed"));

    rewarded.load();
  });
}
