import { useState } from "react";
import { Switch, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function Toggle({ label, info, value, onValueChange }) {
  const [infoVisible, setInfoVisible] = useState(false);
  const { styles, fs } = useStyles(({ wp, hp, fs }) => ({
    card: {
      width: "100%",
      paddingVertical: hp(14),
      paddingHorizontal: wp(18),
      backgroundColor: colors.surface,
      borderRadius: fs(18),
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: wp(16),
    },
    labelGroup: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: wp(8),
    },
    label: {
      fontSize: fs(16),
      fontWeight: "700",
      color: colors.textPrimary,
    },
    infoButton: {
      alignItems: "center",
      justifyContent: "center",
    },
    info: {
      fontSize: fs(13),
      lineHeight: hp(18),
      color: colors.textSecondary,
      marginTop: hp(10),
    },
  }));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <Text style={styles.label}>{label}</Text>

          {info ? (
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setInfoVisible((visible) => !visible)}
              hitSlop={fs(8)}
            >
              <Ionicons
                name={infoVisible ? "information-circle" : "information-circle-outline"}
                size={fs(20)}
                color={colors.primary}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.disabled, true: colors.primary }}
          thumbColor={colors.onPrimary}
          ios_backgroundColor={colors.disabled}
        />
      </View>

      {info && infoVisible ? <Text style={styles.info}>{info}</Text> : null}
    </View>
  );
}
