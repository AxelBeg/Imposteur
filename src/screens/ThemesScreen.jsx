import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import BackButton from "../components/BackButton";
import HelpModal from "../components/HelpModal";
import InfoButton from "../components/InfoButton";
import Screen from "../components/Screen";
import ThemeSelector from "../components/ThemeSelector";
import { useThemeAccess } from "../services/ThemeAccessContext";
import { THEMES } from "../services/wordSelector";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function ThemesScreen({ themeId, onSelectTheme, onNext, onBack }) {
  const [showHelp, setShowHelp] = useState(false);
  const { isUnlocked, freeThemeId } = useThemeAccess();

  useEffect(() => {
    if (!isUnlocked(themeId)) onSelectTheme(freeThemeId);
  }, [themeId, isUnlocked, freeThemeId, onSelectTheme]);

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
    buttonDisabled: {
      backgroundColor: colors.disabled,
      shadowOpacity: 0,
      elevation: 0,
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

        <Text style={styles.title}>Le thème</Text>
        <Text style={styles.subtitle}>
          Choisissez le thème des mots
        </Text>

        <ThemeSelector
          themes={THEMES}
          selectedThemeId={themeId}
          onSelect={onSelectTheme}
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, !isUnlocked(themeId) && styles.buttonDisabled]}
            onPress={onNext}
            disabled={!isUnlocked(themeId)}
          >
            <Text style={styles.buttonText}>Suivant</Text>
          </TouchableOpacity>
        </View>

        <HelpModal
          visible={showHelp}
          title="Le thème"
          lead="Tous les mots de la partie sont tirés dans le thème choisi."
          sections={[
            {
              title: "Citoyens",
              color: colors.roles.citoyen.accent,
              text: "Ils reçoivent le même mot, tiré dans ce thème.",
            },
            {
              title: "Imposteur",
              color: colors.roles.imposteur.accent,
              text: "Il reçoit un autre mot du même thème. Un thème plus large rend les associations plus floues.",
            },
          ]}
          onClose={() => setShowHelp(false)}
        />
      </View>
    </Screen>
  );
}
