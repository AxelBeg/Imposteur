import { useMemo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { colors } from "./theme";

// Maquette de reference : telephone portrait typique (iPhone 14).
// wp/hp convertissent les pixels de cette maquette en tailles proportionnelles
// a l'ecran reel, pour que l'UI s'adapte aux petits et grands telephones.
export const BASE_WIDTH = 390;
export const BASE_HEIGHT = 844;

function createLayout(width, height) {
  const wp = (value) => (width / BASE_WIDTH) * value;
  const hp = (value) => (height / BASE_HEIGHT) * value;
  // Polices, icones et elements carres : on prend le ratio le plus petit
  // pour rester lisible sur un ecran large et bas, ou etroit et haut.
  const fs = (value) => Math.min(wp(value), hp(value));

  const shadows = {
    button: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: hp(6) },
      shadowOpacity: 0.25,
      shadowRadius: hp(10),
      elevation: 4,
    },
    card: {
      shadowColor: "#3A2E82",
      shadowOffset: { width: 0, height: hp(4) },
      shadowOpacity: 0.08,
      shadowRadius: hp(12),
      elevation: 2,
    },
  };

  // Espacement commun des ecrans a titre + sous-titre, pour que le bloc
  // descende sous le bouton retour et laisse de l'air avant le contenu.
  const page = {
    paddingTop: hp(56),
    paddingHorizontal: wp(24),
    subtitleMarginTop: hp(4),
    sectionGap: hp(40),
  };

  return { width, height, wp, hp, fs, shadows, page };
}

export function useLayout() {
  const { width, height } = useWindowDimensions();
  return useMemo(() => createLayout(width, height), [width, height]);
}

export function useStyles(factory) {
  const layout = useLayout();
  const styles = useMemo(() => StyleSheet.create(factory(layout)), [layout]);
  return { styles, ...layout };
}
