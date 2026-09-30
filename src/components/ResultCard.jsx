import { Text, View } from "react-native";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";
import { capitalizeWord, SIMILARITY_LABELS } from "../services/wordSelector";

export default function ResultCard({ result }) {
  const { styles } = useStyles(({ wp, hp, fs, shadows }) => ({
    container: {
      width: "100%",
      gap: hp(16),
    },
    levelBadge: {
      alignSelf: "stretch",
      backgroundColor: colors.surface,
      borderRadius: fs(20),
      paddingVertical: hp(8),
      paddingHorizontal: wp(16),
    },
    levelBadgeText: {
      fontSize: fs(13),
      fontWeight: "700",
      color: colors.textSecondary,
      textAlign: "center",
    },
    wordCard: {
      borderRadius: fs(20),
      paddingVertical: hp(18),
      paddingHorizontal: wp(20),
      alignItems: "center",
      borderWidth: wp(1.5),
      ...shadows.card,
    },
    citoyenCard: {
      backgroundColor: colors.roles.citoyen.background,
      borderColor: colors.roles.citoyen.border,
    },
    imposteurCard: {
      backgroundColor: colors.roles.imposteur.background,
      borderColor: colors.roles.imposteur.border,
    },
    role: {
      fontSize: fs(13),
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: wp(1),
      color: colors.textSecondary,
      marginBottom: hp(8),
    },
    word: {
      fontSize: fs(24),
      fontWeight: "800",
      color: colors.textPrimary,
      textAlign: "center",
    },
  }));

  if (!result) return null;

  return (
    <View style={styles.container}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelBadgeText}>
          Niveau {result.similarityLevel}/3 · {SIMILARITY_LABELS[result.similarityLevel]}
          {result.similarityScore != null
            ? `\nScore de similarité : ${result.similarityScore.toFixed(2)}`
            : ""}
        </Text>
      </View>

      <View style={[styles.wordCard, styles.citoyenCard]}>
        <Text style={styles.role}>Citoyen</Text>
        <Text style={styles.word}>{capitalizeWord(result.citoyen)}</Text>
      </View>

      <View style={[styles.wordCard, styles.imposteurCard]}>
        <Text style={styles.role}>Imposteur</Text>
        <Text style={styles.word}>{capitalizeWord(result.imposteur)}</Text>
      </View>
    </View>
  );
}
