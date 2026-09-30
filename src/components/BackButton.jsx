import { TouchableOpacity } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function BackButton({ onPress }) {
  const { styles, fs } = useStyles(({ wp, hp, fs }) => ({
    button: {
      width: fs(40),
      height: fs(40),
      borderRadius: fs(20),
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "flex-start",
      marginBottom: hp(8),
      position: "absolute",
      left: wp(20),
      top: hp(10),
      zIndex: 1,
    },
  }));

  return (
    <TouchableOpacity style={styles.button} onPress={onPress} hitSlop={fs(8)}>
      <Ionicons name="arrow-back" size={fs(20)} color={colors.primary} />
    </TouchableOpacity>
  );
}
