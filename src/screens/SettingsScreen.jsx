import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import BackButton from "../components/BackButton";
import HelpModal from "../components/HelpModal";
import InfoButton from "../components/InfoButton";
import Screen from "../components/Screen";
import SimilaritySlider from "../components/SimilaritySlider";
import Toggle from "../components/Toggle";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function SettingsScreen({
  themeId,
  similarity,
  onChangeSimilarity,
  showRoles,
  onChangeShowRoles,
  onStart,
  onBack,
}) {
  const [showHelp, setShowHelp] = useState(false);
  const { styles } = useStyles(({ wp, hp, fs, shadows, page }) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: page.paddingHorizontal,
      paddingTop: page.paddingTop,
      alignItems: "center",
    },
    title: {
      fontSize: fs(28),
      fontWeight: "800",
      color: colors.textPrimary,
      textAlign: "center",
    },
    subtitle: {
      fontSize: fs(14),
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: page.subtitleMarginTop,
      marginBottom: page.sectionGap,
    },
    footer: {
      width: "100%",
      alignItems: "center",
      marginTop: "auto",
      paddingBottom: hp(24),
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
    <Screen style={styles.safeArea}>
      <View style={styles.container}>
        <BackButton onPress={onBack} />
        <InfoButton onPress={() => setShowHelp(true)} />

        <Text style={styles.title}>Réglages</Text>
        <Text style={styles.subtitle}>
          Ajustez la difficulté de la partie
        </Text>

        <SimilaritySlider
          value={similarity}
          onChange={onChangeSimilarity}
          themeId={themeId}
        />

        <Toggle
          label="Rôles cachés"
          info="Si actif, les citoyens et les imposteurs ne savent pas qui ils sont : ils voient seulement leur mot."
          value={!showRoles}
          onValueChange={(hideRoles) => onChangeShowRoles(!hideRoles)}
        />

        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} onPress={onStart}>
            <Text style={styles.buttonText}>Go !</Text>
          </TouchableOpacity>
        </View>

        <HelpModal
          visible={showHelp}
          title="Réglages de la partie"
          lead="Ajustez la difficulté avant de lancer la distribution des mots."
          sections={[
            {
              title: "Proximité des mots",
              color: colors.primary,
              text: "Plus les mots sont proches, plus l'imposteur est difficile à démasquer. Plus ils sont éloignés, plus le bluff devient risqué.",
            },
            {
              title: "Rôles cachés",
              color: colors.primary,
              text: "Si actif, les citoyens et les imposteurs voient seulement leur mot : ils ne savent pas s'ils sont du même camp.",
            },
          ]}
          onClose={() => setShowHelp(false)}
        />
      </View>
    </Screen>
  );
}
