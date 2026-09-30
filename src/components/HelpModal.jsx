import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function HelpModal({ visible, title, lead, sections, onClose }) {
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
      ...shadows.card,
    },
    title: {
      fontSize: fs(22),
      fontWeight: "800",
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: hp(16),
    },
    lead: {
      fontSize: fs(15),
      fontWeight: "600",
      color: colors.textPrimary,
      lineHeight: hp(22),
      textAlign: "center",
      marginBottom: hp(18),
    },
    section: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: fs(16),
      paddingVertical: hp(14),
      paddingHorizontal: wp(16),
      marginBottom: hp(10),
    },
    sectionTitle: {
      fontSize: fs(14),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: wp(0.6),
      marginBottom: hp(6),
    },
    sectionText: {
      fontSize: fs(14),
      fontWeight: "600",
      color: colors.textSecondary,
      lineHeight: hp(20),
    },
    actions: {
      marginTop: hp(8),
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
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {lead ? <Text style={styles.lead}>{lead}</Text> : null}

          {sections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: section.color }]}>
                {section.title}
              </Text>
              <Text style={styles.sectionText}>{section.text}</Text>
            </View>
          ))}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Ok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
