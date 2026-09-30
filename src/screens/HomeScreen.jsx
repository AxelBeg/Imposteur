import { useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import BackButton from "../components/BackButton";
import ResultCard from "../components/ResultCard";
import Screen from "../components/Screen";
import SimilaritySlider from "../components/SimilaritySlider";
import ThemeSelector from "../components/ThemeSelector";
import {
  DEFAULT_THEME_ID,
  generateWordPair,
  MAX_SIMILARITY,
  THEMES,
} from "../services/wordSelector";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

// Ecran de test du generateur de mots, garde le temps de continuer a
// verifier les listes ; a retirer avant la sortie finale de l'application.
export default function HomeScreen({ onBack }) {
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [similarity, setSimilarity] = useState(MAX_SIMILARITY);
  const [result, setResult] = useState(null);
  const { styles, fs } = useStyles(({ wp, hp, fs, shadows, page }) => ({
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
      fontSize: fs(32),
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
    button: {
      backgroundColor: colors.primary,
      paddingVertical: hp(14),
      paddingHorizontal: wp(40),
      borderRadius: fs(30),
      ...shadows.button,
    },
    generateButton: {
      marginTop: "auto",
      marginBottom: hp(24),
    },
    modalButton: {
      alignSelf: "stretch",
      alignItems: "center",
      marginTop: hp(20),
      marginBottom: hp(12),
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: fs(16),
      fontWeight: "700",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(36, 31, 61, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: wp(24),
    },
    modalCard: {
      width: "100%",
      maxHeight: "85%",
      backgroundColor: colors.background,
      borderRadius: fs(24),
      paddingTop: hp(16),
      paddingHorizontal: wp(20),
      paddingBottom: hp(8),
      alignItems: "center",
      ...shadows.card,
    },
    modalScroll: {
      width: "100%",
      flexGrow: 0,
      flexShrink: 1,
    },
    modalScrollContent: {
      paddingBottom: hp(4),
    },
    modalClose: {
      width: fs(40),
      height: fs(40),
      borderRadius: fs(20),
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "flex-end",
      marginBottom: hp(8),
    },
  }));

  const handleGenerate = () => {
    setResult(generateWordPair(themeId, similarity));
  };

  const handleSelectTheme = (nextThemeId) => {
    setThemeId(nextThemeId);
    setResult(null);
  };

  const closeResult = () => setResult(null);

  return (
    <Screen style={styles.safeArea}>
      <View style={styles.container}>
        {onBack ? <BackButton onPress={onBack} /> : null}

        <Text style={styles.title}>Imposteur Infini</Text>
        <Text style={styles.subtitle}>
          Génère un mot citoyen et un mot imposteur selon la similarité
          souhaitée
        </Text>

        <ThemeSelector
          themes={THEMES}
          selectedThemeId={themeId}
          onSelect={handleSelectTheme}
        />

        <SimilaritySlider value={similarity} onChange={setSimilarity} themeId={themeId} />

        <TouchableOpacity style={[styles.button, styles.generateButton]} onPress={handleGenerate}>
          <Text style={styles.buttonText}>Générer</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={result != null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeResult}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeResult} activeOpacity={1} />
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={closeResult}
              hitSlop={fs(8)}
            >
              <Ionicons name="close" size={fs(20)} color={colors.primary} />
            </TouchableOpacity>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              <ResultCard result={result} />
            </ScrollView>
            <TouchableOpacity style={[styles.button, styles.modalButton]} onPress={handleGenerate}>
              <Text style={styles.buttonText}>Générer encore</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
