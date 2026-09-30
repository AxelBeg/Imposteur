import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import BackButton from "../components/BackButton";
import ConfirmModal from "../components/ConfirmModal";
import Screen from "../components/Screen";
import { trackGameAbandoned } from "../services/analytics";
import { getRole } from "../services/roles";
import { capitalizeWord } from "../services/wordSelector";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function RevealScreen({
  game,
  playerIndex,
  showRoles = true,
  revealed,
  onReveal,
  onNext,
  onLeave,
}) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const player = game.players[playerIndex];
  const role = getRole(player.roleId);
  const isLastPlayer = playerIndex === game.players.length - 1;
  // Sans les roles, la carte reste neutre : sa couleur trahirait le role.
  const cardColors = showRoles
    ? { backgroundColor: role.colors.background, borderColor: role.colors.border }
    : { backgroundColor: colors.surface, borderColor: colors.border };
  const { styles } = useStyles(({ wp, hp, fs, shadows }) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: wp(24),
      justifyContent: "center",
      alignItems: "center",
    },
    playerLabel: {
      fontSize: fs(32),
      fontWeight: "800",
      color: colors.textPrimary,
      marginBottom: hp(16),
    },
    hint: {
      fontSize: fs(15),
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: hp(32),
    },
    wordCard: {
      width: "100%",
      borderRadius: fs(24),
      borderWidth: wp(1.5),
      paddingVertical: hp(40),
      paddingHorizontal: wp(24),
      alignItems: "center",
      marginBottom: hp(32),
      ...shadows.card,
    },
    role: {
      fontSize: fs(14),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: wp(1),
      marginBottom: hp(12),
    },
    word: {
      fontSize: fs(32),
      fontWeight: "800",
      color: colors.textPrimary,
    },
    noWord: {
      fontSize: fs(18),
      fontWeight: "700",
      color: colors.textSecondary,
      textAlign: "center",
    },
    button: {
      width: "100%",
      backgroundColor: colors.primary,
      paddingVertical: hp(16),
      borderRadius: fs(30),
      alignItems: "center",
      ...shadows.button,
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
        <BackButton onPress={() => setShowLeaveConfirm(true)} />
        <Text style={styles.playerLabel}>{player.name}</Text>

        {!revealed ? (
          <>
            <Text style={styles.hint}>
              Passez le téléphone à {player.name}, puis découvrez votre mot
            </Text>
            <TouchableOpacity style={styles.button} onPress={onReveal}>
              <Text style={styles.buttonText}>Découvrir votre mot</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.wordCard, cardColors]}>
              {showRoles && (
                <Text style={[styles.role, { color: role.colors.accent }]}>{role.label}</Text>
              )}
              {role.hasWord ? (
                <Text style={styles.word}>{capitalizeWord(player.word)}</Text>
              ) : (
                <Text style={styles.noWord}>Vous n'avez aucun mot !</Text>
              )}
            </View>

            <TouchableOpacity style={styles.button} onPress={onNext}>
              <Text style={styles.buttonText}>
                {isLastPlayer ? "Terminer" : "Joueur suivant"}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <ConfirmModal
          visible={showLeaveConfirm}
          title="Voulez-vous retourner au menu principal ?"
          confirmLabel="Ok"
          onConfirm={() => {
            trackGameAbandoned({
              screen: "reveal",
              game,
              extra: { reveal_index: playerIndex, revealed },
            });
            onLeave();
          }}
          onCancel={() => setShowLeaveConfirm(false)}
        />
      </View>
    </Screen>
  );
}
