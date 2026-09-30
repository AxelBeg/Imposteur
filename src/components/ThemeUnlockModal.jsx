import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function ThemeUnlockModal({
  visible,
  themeLabel,
  priceLabel,
  allThemesPriceLabel,
  showAllThemesOffer,
  busyAd,
  busyPurchase,
  onWatchAd,
  onPurchase,
  onPurchaseAll,
  onCancel,
}) {
  const busy = busyAd || busyPurchase;
  const { styles, fs } = useStyles(({ wp, hp, fs, shadows, page }) => ({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(36, 31, 61, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: page.paddingHorizontal,
    },
    sheet: {
      width: "100%",
      backgroundColor: colors.background,
      borderRadius: fs(24),
      paddingVertical: hp(24),
      paddingHorizontal: wp(20),
      alignItems: "center",
      ...shadows.card,
    },
    title: {
      fontSize: fs(20),
      fontWeight: "800",
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: hp(10),
    },
    lead: {
      fontSize: fs(14),
      fontWeight: "600",
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: hp(20),
      marginBottom: hp(24),
    },
    actions: {
      width: "100%",
      alignItems: "center",
      gap: hp(8),
    },
    button: {
      width: "100%",
      backgroundColor: colors.primary,
      paddingVertical: hp(16),
      paddingHorizontal: wp(16),
      borderRadius: fs(30),
      alignItems: "center",
      ...shadows.button,
    },
    buttonDisabled: {
      backgroundColor: colors.disabled,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: fs(16),
      fontWeight: "700",
      textAlign: "center",
    },
    secondaryButton: {
      width: "100%",
      paddingVertical: hp(16),
      borderRadius: fs(30),
      borderColor: colors.primary,
      borderWidth: wp(1.5),
      alignItems: "center",
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: fs(15),
      fontWeight: "700",
      textAlign: "center",
    },
    packWrap: {
      width: "100%",
      paddingTop: hp(10),
    },
    packBadge: {
      position: "absolute",
      top: 0,
      alignSelf: "center",
      zIndex: 1,
      backgroundColor: colors.primary,
      paddingHorizontal: wp(10),
      paddingVertical: hp(3),
      borderRadius: fs(12),
    },
    packBadgeText: {
      color: colors.onPrimary,
      fontSize: fs(11),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: wp(0.4),
    },
    packButton: {
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
    packCopy: {
      flex: 1,
    },
    packTitle: {
      fontSize: fs(15),
      fontWeight: "800",
      color: colors.onPrimary,
    },
    packHint: {
      fontSize: fs(12),
      fontWeight: "600",
      color: colors.onPrimary,
      opacity: 0.7,
      marginTop: hp(2),
    },
    packPricePill: {
      backgroundColor: colors.primary,
      paddingVertical: hp(8),
      paddingHorizontal: wp(12),
      borderRadius: fs(16),
    },
    packPrice: {
      fontSize: fs(13),
      fontWeight: "800",
      color: colors.onPrimary,
    },
    cancelButton: {
      paddingVertical: hp(12),
      paddingHorizontal: wp(16),
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: fs(15),
      fontWeight: "700",
    },
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={busy ? undefined : onCancel}
          activeOpacity={1}
        />
        <View style={styles.sheet}>
          <Text style={styles.title}>Débloquer {themeLabel}</Text>
          <Text style={styles.lead}>
            Achetez ce thème pour le débloquer définitivement, ou regardez une pub pour tester une
            partie.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, busy && styles.buttonDisabled]}
              onPress={onPurchase}
              disabled={busy}
            >
              {busyPurchase ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={styles.buttonText}>Acheter {priceLabel}</Text>
              )}
            </TouchableOpacity>
            {showAllThemesOffer ? (
              <View style={styles.packWrap}>
                <View style={styles.packBadge}>
                  <Text style={styles.packBadgeText}>Meilleure offre</Text>
                </View>
                <TouchableOpacity
                  style={[styles.packButton, busy && { opacity: 0.7 }]}
                  onPress={onPurchaseAll}
                  disabled={busy}
                >
                  {busyPurchase ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <>
                      <Ionicons name="gift" size={fs(22)} color={colors.onPrimary} />
                      <View style={styles.packCopy}>
                        <Text style={styles.packTitle}>Tous les thèmes</Text>
                        <Text style={styles.packHint}>Sans pubs, définitif</Text>
                      </View>
                      <View style={styles.packPricePill}>
                        <Text style={styles.packPrice}>{allThemesPriceLabel}</Text>
                      </View>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onWatchAd}
              disabled={busy}
            >
              {busyAd ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.secondaryButtonText}>Regarder une pub</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={busy}>
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
