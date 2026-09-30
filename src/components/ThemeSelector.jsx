import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { trackPaywallDismissed, trackPaywallShown } from "../services/analytics";
import { useThemeAccess } from "../services/ThemeAccessContext";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";
import ThemeUnlockModal from "./ThemeUnlockModal";

const THEME_ICONS = {
  general: "dice",
  animaux: "paw",
  films: "film",
  nourriture: "restaurant",
  metiers: "briefcase",
  sport: "football",
};

export default function ThemeSelector({ themes, selectedThemeId, onSelect }) {
  const {
    isUnlocked,
    hasAllThemes,
    getPriceLabel,
    getAllThemesPriceLabel,
    unlockWithAd,
    purchaseTheme,
    purchaseAllThemes,
    restorePurchases,
    busyAd,
    busyPurchase,
  } = useThemeAccess();
  const [unlockTheme, setUnlockTheme] = useState(null);
  const { styles, fs } = useStyles(({ wp, hp, fs, shadows }) => ({
    wrapper: {
      width: "100%",
      flexShrink: 1,
    },
    container: {
      width: "100%",
    },
    listContent: {
      gap: hp(12),
      paddingBottom: hp(8),
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: hp(12),
    },
    card: {
      width: "48%",
      alignItems: "center",
      paddingVertical: hp(18),
      paddingHorizontal: wp(10),
      backgroundColor: colors.surface,
      borderRadius: fs(18),
      borderWidth: wp(1.5),
      borderColor: "transparent",
    },
    cardSelected: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
      ...shadows.card,
    },
    iconWrap: {
      width: fs(48),
      height: fs(48),
      borderRadius: fs(24),
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: hp(10),
    },
    iconWrapSelected: {
      backgroundColor: colors.primary,
    },
    label: {
      fontSize: fs(14),
      fontWeight: "700",
      color: colors.textPrimary,
      textAlign: "center",
    },
    labelSelected: {
      color: colors.primary,
    },
    badge: {
      position: "absolute",
      top: hp(8),
      right: wp(8),
    },
    restoreButton: {
      width: "100%",
      alignItems: "center",
      paddingVertical: hp(8),
    },
    restoreText: {
      color: colors.textSecondary,
      fontSize: fs(13),
      fontWeight: "700",
    },
    unlockAllWrap: {
      width: "100%",
      paddingTop: hp(10),
    },
    unlockAllBadge: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      zIndex: 1,
      backgroundColor: colors.primary,
      paddingHorizontal: wp(10),
      paddingVertical: hp(3),
      borderRadius: fs(12),
    },
    unlockAllBadgeText: {
      color: colors.onPrimary,
      fontSize: fs(11),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: wp(0.4),
    },
    unlockAllButton: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: wp(12),
      paddingVertical: hp(16),
      paddingHorizontal: wp(16),
      paddingTop: hp(20),
      backgroundColor: colors.textPrimary,
      borderRadius: fs(20),
    },
    unlockAllCopy: {
      flex: 1,
    },
    unlockAllTitle: {
      fontSize: fs(15),
      fontWeight: "800",
      color: colors.onPrimary,
    },
    unlockAllHint: {
      fontSize: fs(12),
      fontWeight: "600",
      color: colors.onPrimary,
      opacity: 0.7,
      marginTop: hp(2),
    },
    unlockAllPricePill: {
      backgroundColor: colors.primary,
      paddingVertical: hp(8),
      paddingHorizontal: wp(12),
      borderRadius: fs(16),
    },
    unlockAllPrice: {
      fontSize: fs(13),
      fontWeight: "800",
      color: colors.onPrimary,
    },
  }));

  useEffect(() => {
    if (unlockTheme && isUnlocked(unlockTheme.id)) {
      onSelect(unlockTheme.id);
      setUnlockTheme(null);
    }
  }, [unlockTheme, isUnlocked, onSelect]);

  const handlePress = (theme) => {
    if (isUnlocked(theme.id)) {
      onSelect(theme.id);
      return;
    }
    setUnlockTheme(theme);
    trackPaywallShown({ themeId: theme.id });
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {themes.map((theme) => {
          const isSelected = theme.id === selectedThemeId;
          const locked = !isUnlocked(theme.id);
          const icon = THEME_ICONS[theme.id] ?? "pricetag";

          return (
            <TouchableOpacity
              key={theme.id}
              style={[styles.card, isSelected && !locked && styles.cardSelected]}
              onPress={() => handlePress(theme)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected, disabled: false }}
              accessibilityLabel={locked ? `${theme.label}, verrouillé` : theme.label}
            >
              <View style={[styles.iconWrap, isSelected && !locked && styles.iconWrapSelected]}>
                <Ionicons
                  name={isSelected && !locked ? icon : `${icon}-outline`}
                  size={fs(22)}
                  color={isSelected && !locked ? colors.onPrimary : colors.primary}
                />
              </View>
              <Text style={[styles.label, isSelected && !locked && styles.labelSelected]}>
                {theme.label}
              </Text>
              {locked ? (
                <View style={styles.badge}>
                  <Ionicons name="lock-closed" size={fs(16)} color={colors.textMuted} />
                </View>
              ) : isSelected ? (
                <View style={styles.badge}>
                  <Ionicons name="checkmark-circle" size={fs(18)} color={colors.primary} />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
        </View>
        {!hasAllThemes ? (
          <View style={styles.unlockAllWrap}>
            <View style={styles.unlockAllBadge}>
              <Text style={styles.unlockAllBadgeText}>Meilleure offre</Text>
            </View>
            <TouchableOpacity
              style={[styles.unlockAllButton, busyPurchase && { opacity: 0.7 }]}
              onPress={purchaseAllThemes}
              disabled={busyPurchase}
              accessibilityRole="button"
              accessibilityLabel={`Débloquer tous les thèmes, ${getAllThemesPriceLabel()}`}
            >
              <Ionicons name="gift" size={fs(22)} color={colors.onPrimary} />
              <View style={styles.unlockAllCopy}>
                <Text style={styles.unlockAllTitle}>Tous les thèmes</Text>
                <Text style={styles.unlockAllHint}>Sans pubs, définitif</Text>
              </View>
              <View style={styles.unlockAllPricePill}>
                <Text style={styles.unlockAllPrice}>{getAllThemesPriceLabel()}</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity style={styles.restoreButton} onPress={restorePurchases}>
          <Text style={styles.restoreText}>Restaurer les achats</Text>
        </TouchableOpacity>
      </ScrollView>

      <ThemeUnlockModal
        visible={Boolean(unlockTheme)}
        themeLabel={unlockTheme?.label ?? ""}
        priceLabel={unlockTheme ? getPriceLabel(unlockTheme.id) : ""}
        allThemesPriceLabel={getAllThemesPriceLabel()}
        showAllThemesOffer={!hasAllThemes}
        busyAd={busyAd}
        busyPurchase={busyPurchase}
        onWatchAd={async () => {
          if (!unlockTheme) return;
          const ok = await unlockWithAd(unlockTheme.id, "theme_unlock");
          if (ok) {
            onSelect(unlockTheme.id);
            setUnlockTheme(null);
          }
        }}
        onPurchase={() => {
          if (!unlockTheme) return;
          purchaseTheme(unlockTheme.id);
        }}
        onPurchaseAll={purchaseAllThemes}
        onCancel={() => {
          if (unlockTheme) trackPaywallDismissed({ themeId: unlockTheme.id });
          setUnlockTheme(null);
        }}
      />
    </View>
  );
}
