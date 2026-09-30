import { Text, TouchableOpacity, View } from "react-native";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function Counter({
  label,
  value,
  onIncrement,
  onDecrement,
  minValue = 0,
  maxValue = Infinity,
  accentColor = colors.primary,
}) {
  const canDecrement = value > minValue;
  const canIncrement = value < maxValue;
  const { styles } = useStyles(({ wp, hp, fs }) => ({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      paddingVertical: hp(14),
      paddingHorizontal: wp(18),
      backgroundColor: colors.surface,
      borderRadius: fs(18),
    },
    label: {
      fontSize: fs(16),
      fontWeight: "700",
      color: colors.textPrimary,
    },
    controls: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(16),
    },
    button: {
      width: fs(36),
      height: fs(36),
      borderRadius: fs(18),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonDisabled: {
      backgroundColor: colors.disabled,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: fs(20),
      fontWeight: "700",
      lineHeight: hp(22),
    },
    buttonTextDisabled: {
      color: "#fff",
      opacity: 0.7,
    },
    value: {
      fontSize: fs(20),
      fontWeight: "800",
      minWidth: wp(24),
      textAlign: "center",
    },
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, !canDecrement && styles.buttonDisabled]}
          onPress={onDecrement}
          disabled={!canDecrement}
        >
          <Text style={[styles.buttonText, !canDecrement && styles.buttonTextDisabled]}>
            −
          </Text>
        </TouchableOpacity>

        <Text style={[styles.value, { color: accentColor }]}>{value}</Text>

        <TouchableOpacity
          style={[styles.button, !canIncrement && styles.buttonDisabled]}
          onPress={onIncrement}
          disabled={!canIncrement}
        >
          <Text style={[styles.buttonText, !canIncrement && styles.buttonTextDisabled]}>
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
