import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import BackButton from "../components/BackButton";
import Counter from "../components/Counter";
import HelpModal from "../components/HelpModal";
import InfoButton from "../components/InfoButton";
import Screen from "../components/Screen";
import { isRoleCompositionValid, ROLES, totalRoleCount } from "../services/roles";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function RolesScreen({
  playerCount,
  roleCounts,
  onIncrementRole,
  onDecrementRole,
  onNext,
  onBack,
}) {
  const [showHelp, setShowHelp] = useState(false);
  const total = totalRoleCount(roleCounts);
  const isValid = isRoleCompositionValid(roleCounts, playerCount);
  const { styles } = useStyles(({ wp, hp, fs, shadows, page }) => ({
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
      fontSize: fs(28),
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
    rolesList: {
      width: "100%",
      gap: hp(12),
    },
    total: {
      marginTop: hp(20),
      fontSize: fs(15),
      fontWeight: "800",
    },
    totalValid: {
      color: colors.primary,
    },
    totalInvalid: {
      color: colors.secondary,
    },
    footer: {
      width: "100%",
      alignItems: "center",
      marginTop: "auto",
      paddingBottom: hp(24),
    },
    button: {
      width: "100%",
      backgroundColor: colors.primary,
      paddingVertical: hp(16),
      borderRadius: fs(30),
      alignItems: "center",
      ...shadows.button,
    },
    buttonDisabled: {
      backgroundColor: colors.disabled,
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: fs(16),
      fontWeight: "700",
    },
  }));

  return (
    <Screen style={styles.safeArea}>
      <View style={styles.container}>
        <BackButton onPress={onBack} />
        <InfoButton onPress={() => setShowHelp(true)} />

        <Text style={styles.title}>Les rôles</Text>
        <Text style={styles.subtitle}>
          Répartissez les rôles
        </Text>

        <View style={styles.rolesList}>
          {ROLES.map((role) => (
            <Counter
              key={role.id}
              label={role.label}
              value={roleCounts[role.id] || 0}
              onIncrement={() => onIncrementRole(role.id)}
              onDecrement={() => onDecrementRole(role.id)}
              minValue={0}
              maxValue={playerCount}
              accentColor={colors.primary}
            />
          ))}
        </View>

        <Text style={[styles.total, isValid ? styles.totalValid : styles.totalInvalid]}>
          {total} / {playerCount} joueurs assignés
        </Text>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={onNext}
            disabled={!isValid}
          >
            <Text style={styles.buttonText}>Suivant</Text>
          </TouchableOpacity>
        </View>

        <HelpModal
          visible={showHelp}
          title="Les rôles"
          lead="Choisissez combien de joueurs auront chaque rôle. Le total doit correspondre au nombre de joueurs."
          sections={[
            {
              title: "Citoyen",
              color: colors.roles.citoyen.accent,
              text: "Reçoit le mot secret. Doit se reconnaître entre citoyens, sans donner trop d'indices aux autres.",
            },
            {
              title: "Imposteur",
              color: colors.roles.imposteur.accent,
              text: "Reçoit un mot différent, proche de celui des citoyens. Doit se fondre dans la discussion sans se faire démasquer.",
            },
            {
              title: "Fantôme",
              color: colors.roles.fantome.accent,
              text: "Ne reçoit aucun mot. Doit deviner le thème en écoutant, sans révéler qu'il ne connaît pas le mot secret.",
            },
          ]}
          onClose={() => setShowHelp(false)}
        />
      </View>
    </Screen>
  );
}
