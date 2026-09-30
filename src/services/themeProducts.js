export const FREE_THEME_ID = "general";
export const FALLBACK_PRICE_LABEL = "1,99 €";
export const FALLBACK_ALL_THEMES_PRICE_LABEL = "4,99 €";

// SKUs a creer dans Google Play Console / App Store Connect.
// Themes unitaires : 1,99 EUR. Pack : 4,99 EUR (product id `themes_all`).
export const THEME_PRODUCT_IDS = {
  animaux: "theme_animaux",
  films: "theme_films",
  nourriture: "theme_nourriture",
  metiers: "theme_metiers",
  sport: "theme_sport",
};

export const ALL_THEMES_PRODUCT_ID = "themes_all";
export const ALL_THEMES_UNLOCK_ID = "all";
export const PAID_THEME_IDS = Object.keys(THEME_PRODUCT_IDS);

export const PRODUCT_SKUS = [...Object.values(THEME_PRODUCT_IDS), ALL_THEMES_PRODUCT_ID];

export function isThemeFree(themeId) {
  return themeId === FREE_THEME_ID;
}

export function productIdForTheme(themeId) {
  return THEME_PRODUCT_IDS[themeId] ?? null;
}

export function themeIdForProduct(productId) {
  return (
    Object.keys(THEME_PRODUCT_IDS).find((themeId) => THEME_PRODUCT_IDS[themeId] === productId) ??
    null
  );
}

export function grantIdsForProduct(productId) {
  if (productId === ALL_THEMES_PRODUCT_ID) {
    return [...PAID_THEME_IDS, ALL_THEMES_UNLOCK_ID];
  }
  const themeId = themeIdForProduct(productId);
  return themeId ? [themeId] : [];
}
