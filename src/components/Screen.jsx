import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Remplace <SafeAreaView> par une <View> dont le padding est calcule via le
// hook useSafeAreaInsets : la valeur vient directement du contexte
// (deja peuplee de facon synchrone grace a initialMetrics sur le Provider,
// voir App.js) au lieu de dependre d'une mesure native propre a chaque
// instance de SafeAreaView. Ca evite le "flash puis decalage" du contenu a
// chaque montage d'ecran du flow de jeu.
export default function Screen({ style, children }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        style,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      {children}
    </View>
  );
}
