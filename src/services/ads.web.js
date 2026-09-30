export async function initializeAds() {}

export async function showRewardedAd() {
  return __DEV__ ? "earned" : "failed";
}
