import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function ConfirmModal({
  visible,
  title,
  confirmLabel = "Oui",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
}) {
  const { styles } = useStyles(({ wp, hp, fs, shadows, page }) => ({
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
      borderRadius: fs(30),
      alignItems: "center",
      ...shadows.button,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: fs(16),
      fontWeight: "700",
    },
    secondaryButton: {
      width: "100%",
      paddingVertical: hp(16),
      borderRadius: fs(30),
      borderColor: colors.primary,
      borderWidth: wp(1),
      alignItems: "center"
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: fs(15),
      fontWeight: "700",
    },
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onCancel} activeOpacity={1} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={onCancel}>
              <Text style={styles.buttonText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onConfirm}>
              <Text style={styles.secondaryButtonText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
