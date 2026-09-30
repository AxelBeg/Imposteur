import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "imposteur.hideHowToPlay";

export async function shouldShowHowToPlay() {
  try {
    const hidden = await AsyncStorage.getItem(STORAGE_KEY);
    return hidden !== "1";
  } catch {
    return true;
  }
}

export async function hideHowToPlay() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}
