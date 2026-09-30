// Palette de couleurs centralisee de l'application : fond clair, accent
// violet ludique, et une couleur dediee par role pour reperer les cartes en
// un coup d'oeil. Toute couleur utilisee dans les ecrans/composants doit
// venir d'ici pour garder une identite visuelle coherente.
export const colors = {
  background: "#FAFAFF",
  surface: "#F2F1FA",
  surfaceAlt: "#EAE7F8",
  border: "#E1DEF5",

  textPrimary: "#241F3D",
  textSecondary: "#8683A3",
  textMuted: "#B6B3CE",
  onPrimary: "#FFFFFF",

  primary: "#7C5CFC",
  primaryPressed: "#6A46F5",
  primarySoft: "#EFE9FF",
  disabled: "#DAD7EC",

  success: "#12B886",
  secondary: "#FF5C5C",
  secondaryPressed: "#F03E3E",
  secondarySoft: "#FFE3E3",

  roles: {
    imposteur: { background: "#FFE3E3", border: "#FFAFAF", accent: "#FF5C5C" },
    citoyen: { background: "#EDE9FE", border: "#C4B5FD", accent: "#7C5CFC" },
    fantome: { background: "#E4F8F6", border: "#9FDDD6", accent: "#1A9B94" },
  },
};

// Luckiest Guy n'a qu'un graisse : ne pas combiner avec fontWeight
// (Android substitue alors une police systeme).
export const fonts = {
  display: "LuckiestGuy",
};

// Les ombres scalées selon l'ecran sont construites dans layout.js (useLayout).
