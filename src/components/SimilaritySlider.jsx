import { Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";
import {
  getCombinationCount,
  SIMILARITY_LABELS,
} from "../services/wordSelector";

const LEVELS = [
  { value: 1, hint: "Mots éloignés" },
  { value: 2, hint: "Mots proches" },
  { value: 3, hint: "Mots très proches" },
];

function ProximityDots({ overlap, active, styles }) {
  const color = active ? colors.onPrimary : colors.primary;

  return (
    <View style={styles.dots}>
      <View
        style={[
          styles.dot,
          { backgroundColor: color, marginRight: overlap },
        ]}
      />
      <View
        style={[
          styles.dot,
          {
            backgroundColor: color,
            opacity: 0.55,
          },
        ]}
      />
    </View>
  );
}

export default function SimilaritySlider({ value, onChange, themeId }) {
  const combinationCount = themeId ? getCombinationCount(themeId, value) : null;
  const { styles, fs } = useStyles(({ wp, hp, fs, shadows }) => ({
    card: {
      width: "100%",
      marginBottom: hp(16),
      paddingVertical: hp(16),
      paddingHorizontal: wp(16),
      backgroundColor: colors.surface,
      borderRadius: fs(18),
    },
    header: {
      marginBottom: hp(14),
    },
    title: {
      fontSize: fs(16),
      fontWeight: "700",
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: fs(13),
      color: colors.textSecondary,
      marginTop: hp(4),
      lineHeight: hp(18),
    },
    options: {
      flexDirection: "row",
      gap: wp(8),
    },
    option: {
      flex: 1,
      alignItems: "center",
      paddingVertical: hp(14),
      paddingHorizontal: wp(6),
      borderRadius: fs(14),
      backgroundColor: colors.background,
      borderWidth: wp(1.5),
      borderColor: "transparent",
    },
    optionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      ...shadows.button,
    },
    dots: {
      flexDirection: "row",
      alignItems: "center",
      height: fs(14),
      marginBottom: hp(8),
    },
    dot: {
      width: fs(12),
      height: fs(12),
      borderRadius: fs(6),
    },
    optionLabel: {
      fontSize: fs(12),
      fontWeight: "800",
      color: colors.textSecondary,
      textAlign: "center",
    },
    optionLabelSelected: {
      color: colors.onPrimary,
    },
    optionHint: {
      fontSize: fs(10),
      fontWeight: "600",
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: hp(3),
    },
    optionHintSelected: {
      color: colors.onPrimary,
      opacity: 0.8,
    },
    combinationCount: {
      fontSize: fs(12),
      fontWeight: "600",
      color: colors.textMuted,
      textAlign: "center",
      marginTop: hp(12),
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Similarité</Text>
        <Text style={styles.subtitle}>
          Choississez à quel point les mots seront proches
        </Text>
      </View>

      <View style={styles.options}>
        {LEVELS.map((level) => {
          const selected = level.value === value;
          return (
            <TouchableOpacity
              key={level.value}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => onChange(level.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${SIMILARITY_LABELS[level.value]}, ${level.hint}`}
            >
              <ProximityDots
                overlap={
                  level.value === 1 ? fs(8) : level.value === 2 ? fs(2) : fs(-6)
                }
                active={selected}
                styles={styles}
              />
              <Text
                style={[
                  styles.optionHint,
                  selected && styles.optionHintSelected,
                ]}
              >
                {level.hint}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {combinationCount !== null ? (
        <Text style={styles.combinationCount}>
          {combinationCount.toLocaleString("fr-FR")} combinaison
          {combinationCount > 1 ? "s possibles" : "possibles"}
        </Text>
      ) : null}
    </View>
  );
}
