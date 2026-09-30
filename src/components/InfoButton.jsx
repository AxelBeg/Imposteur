import { TouchableOpacity } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function InfoButton({ onPress }) {
  const { styles, fs } = useStyles(({ wp, hp, fs }) => ({
    button: {
      position: "absolute",
      right: wp(20),
      top: hp(10),
      width: fs(40),
      height: fs(40),
      borderRadius: fs(20),
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1,
    },
  }));

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      hitSlop={fs(8)}
      accessibilityLabel="Plus d'informations"
    >
      <Ionicons name="information-circle-outline" size={fs(22)} color={colors.primary} />
    </TouchableOpacity>
  );
}
