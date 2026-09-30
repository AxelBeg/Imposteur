import { Platform } from "react-native";
import PostHog from "posthog-react-native";
import { SIMILARITY_LABELS } from "./wordSelector";
import { ALL_THEMES_PRODUCT_ID, isThemeFree, themeIdForProduct } from "./themeProducts";

// Clé publique PostHog (phc_) : prévue pour le client, pas un secret serveur.
export const POSTHOG_API_KEY =
  process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? "phc_A8yR7bizrxU4dkpQkokz9ctwKGiGmb2a3eM2e6n9KAHk";
export const POSTHOG_HOST =
  process.env.EXPO_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export const posthog = new PostHog(POSTHOG_API_KEY, {
  host: POSTHOG_HOST,
  captureAppLifecycleEvents: true,
  enableSessionReplay: false,
  errorTracking: {
    autocapture: { uncaughtExceptions: true, unhandledRejections: true },
  },
});

posthog.register({
  platform: Platform.OS,
  environment: __DEV__ ? "development" : "production",
});

const SCREEN_NAMES = {
  menu: "Menu",
  roles: "Roles",
  themes: "Themes",
  settings: "Settings",
  reveal: "Reveal",
  ready: "Play",
  test: "Test",
};

export function elapsedSeconds(startedAt) {
  if (!startedAt) return undefined;
  return Math.max(0, Math.round((Date.now() - startedAt) / 1000));
}

export function themeAccess(themeId, purchased) {
  if (isThemeFree(themeId)) return "free";
  return purchased ? "purchased" : "ad";
}

export function gameProperties({
  themeId,
  playerCount,
  roleCounts,
  similarity,
  showRoles,
  isReplay,
  purchased,
}) {
  return {
    theme_id: themeId,
    player_count: playerCount,
    imposteur_count: roleCounts?.imposteur || 0,
    citoyen_count: roleCounts?.citoyen || 0,
    fantome_count: roleCounts?.fantome || 0,
    similarity,
    similarity_label: SIMILARITY_LABELS[similarity] ?? String(similarity),
    hidden_roles: !showRoles,
    is_replay: Boolean(isReplay),
    theme_access: themeAccess(themeId, purchased),
  };
}

export function purchaseProperties(productId) {
  const isPack = productId === ALL_THEMES_PRODUCT_ID;
  return {
    product_id: productId,
    is_pack: isPack,
    theme_id: isPack ? "all" : themeIdForProduct(productId),
  };
}

export function trackScreen(screen) {
  posthog.screen(SCREEN_NAMES[screen] ?? screen);
}

export function trackGameStarted(properties) {
  const props = gameProperties(properties);
  posthog.capture("game_started", {
    ...props,
    $set: { last_theme_id: props.theme_id },
  });
}

export function trackGameFinished({ winner, game, eliminatedCount }) {
  posthog.capture("game_finished", {
    winner,
    theme_id: game.themeId,
    player_count: game.players.length,
    similarity: game.similarity,
    similarity_label: SIMILARITY_LABELS[game.similarity] ?? String(game.similarity),
    hidden_roles: !game.showRoles,
    is_replay: Boolean(game.isReplay),
    eliminated_count: eliminatedCount,
    duration_seconds: elapsedSeconds(game.startedAt),
  });
}

export function trackGameAbandoned({ screen, game, extra }) {
  posthog.capture("game_abandoned", {
    screen,
    theme_id: game.themeId,
    player_count: game.players.length,
    similarity: game.similarity,
    is_replay: Boolean(game.isReplay),
    duration_seconds: elapsedSeconds(game.startedAt),
    ...extra,
  });
}

export function trackAdStarted({ themeId, placement }) {
  posthog.capture("ad_started", { theme_id: themeId, placement });
}

export function trackAdWatched({ themeId, placement, result }) {
  posthog.capture("ad_watched", { theme_id: themeId, placement, result });
}

export function trackPaywallShown({ themeId }) {
  posthog.capture("paywall_shown", { theme_id: themeId });
}

export function trackPaywallDismissed({ themeId }) {
  posthog.capture("paywall_dismissed", { theme_id: themeId });
}

export function trackPurchaseStarted(productId) {
  posthog.capture("purchase_started", purchaseProperties(productId));
}

export function trackPurchaseCompleted(productId) {
  posthog.capture("purchase_completed", {
    ...purchaseProperties(productId),
    $set: { has_purchased: true, last_purchase_product: productId },
  });
}

export function trackPurchaseCancelled(productId) {
  posthog.capture("purchase_cancelled", purchaseProperties(productId));
}

export function trackPurchaseFailed(productId, error) {
  posthog.capture("purchase_failed", {
    ...purchaseProperties(productId),
    error_code: error?.code,
    error_message: error?.message,
  });
}

export function trackPurchasesRestored() {
  posthog.capture("purchases_restored");
}
