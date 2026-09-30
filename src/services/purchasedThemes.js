import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "imposteur.purchasedThemes";

export async function loadPurchasedThemeIds() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export async function savePurchasedThemeIds(ids) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    // ignore
  }
}
