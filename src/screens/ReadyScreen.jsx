import { useEffect, useRef, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@react-native-vector-icons/ionicons";
import BackButton from "../components/BackButton";
import ConfirmModal from "../components/ConfirmModal";
import Screen from "../components/Screen";
import { trackGameAbandoned, trackGameFinished } from "../services/analytics";
import { createSpeakOrder, nextSpeakOrderAfterElimination } from "../services/gameSetup";
import { hideHowToPlay, shouldShowHowToPlay } from "../services/howToPlay";
import {
  formatRemainingRoles,
  getGameWinner,
  getRole,
  countAliveByRole,
} from "../services/roles";
import { colors } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function ReadyScreen({ game, onReplay, onEditSettings, onLeave }) {
  const [eliminatedIds, setEliminatedIds] = useState([]);
  const [eliminatedPlayers, setEliminatedPlayers] = useState([]);
  const [speakOrder, setSpeakOrder] = useState(() => createSpeakOrder(game.players));
  const [justEliminatedId, setJustEliminatedId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const aliveCounts = countAliveByRole(game.players, eliminatedIds);
  const winner = getGameWinner(aliveCounts);
  const remaining = formatRemainingRoles(aliveCounts);
  const justEliminated = game.players.find((player) => player.id === justEliminatedId);
  const justEliminatedRole = justEliminated ? getRole(justEliminated.roleId) : null;
  const showWinner = Boolean(winner) && !justEliminated;
  const finishedTracked = useRef(false);

  useEffect(() => {
    if (!winner || finishedTracked.current) return;
    finishedTracked.current = true;
    trackGameFinished({
      winner,
      game,
      eliminatedCount: eliminatedIds.length,
    });
  }, [winner, game, eliminatedIds.length]);

  const { styles, fs } = useStyles(({ wp, hp, fs, shadows, page }) => ({
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
    infoButton: {
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
    title: {
      fontSize: fs(26),
      fontWeight: "800",
      color: colors.textPrimary,
      textAlign: "center",
    },
    titleWon: {
      color: colors.primary,
    },
    titleLost: {
      color: colors.secondary,
    },
    subtitle: {
      fontSize: fs(14),
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: page.subtitleMarginTop,
      marginBottom: page.sectionGap,
    },
    list: {
      flex: 1,
      width: "100%",
    },
    listContent: {
      gap: hp(10),
      paddingBottom: hp(12),
    },
    playerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(10),
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: fs(18),
      paddingVertical: hp(12),
      paddingHorizontal: wp(14),
      borderWidth: wp(1.5),
      borderColor: "transparent",
    },
    playerInfo: {
      flex: 1,
      gap: hp(2),
    },
    playerName: {
      fontSize: fs(16),
      fontWeight: "700",
      color: colors.textPrimary,
    },
    playerNameEliminated: {
      color: colors.textSecondary,
    },
    playerRole: {
      fontSize: fs(12),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: wp(0.6),
    },
    eliminateButton: {
      paddingVertical: hp(8),
      paddingHorizontal: wp(14),
      borderRadius: fs(20),
      backgroundColor: colors.secondarySoft,
    },
    eliminateButtonText: {
      fontSize: fs(13),
      fontWeight: "800",
      color: colors.secondary,
    },
    overlay: {
      flex: 1,
      backgroundColor: "rgba(36, 31, 61, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: page.paddingHorizontal,
    },
    eliminationSheet: {
      width: "100%",
      backgroundColor: colors.background,
      borderRadius: fs(24),
      paddingVertical: hp(24),
      paddingHorizontal: wp(20),
      alignItems: "center",
      ...shadows.card,
    },
    eliminationName: {
      fontSize: fs(22),
      fontWeight: "800",
      color: colors.textPrimary,
      textAlign: "center",
    },
    eliminationRole: {
      fontSize: fs(14),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: wp(0.8),
      marginTop: hp(6),
      marginBottom: hp(18),
    },
    remainingCard: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: fs(18),
      paddingVertical: hp(14),
      paddingHorizontal: wp(18),
      marginBottom: hp(20),
    },
    remainingTitle: {
      fontSize: fs(13),
      fontWeight: "700",
      color: colors.textMuted,
      marginBottom: hp(6),
    },
    remainingLine: {
      fontSize: fs(16),
      fontWeight: "800",
      color: colors.textPrimary,
    },
    remainingEmpty: {
      fontSize: fs(15),
      fontWeight: "700",
      color: colors.textSecondary,
    },
    helpSheet: {
      width: "100%",
      backgroundColor: colors.background,
      borderRadius: fs(24),
      paddingVertical: hp(24),
      paddingHorizontal: wp(20),
      ...shadows.card,
    },
    helpTitle: {
      fontSize: fs(22),
      fontWeight: "800",
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: hp(16),
    },
    helpLead: {
      fontSize: fs(15),
      fontWeight: "600",
      color: colors.textPrimary,
      lineHeight: hp(22),
      textAlign: "center",
      marginBottom: hp(18),
    },
    helpSection: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: fs(16),
      paddingVertical: hp(14),
      paddingHorizontal: wp(16),
      marginBottom: hp(10),
    },
    helpSectionTitle: {
      fontSize: fs(14),
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: wp(0.6),
      marginBottom: hp(6),
    },
    helpSectionText: {
      fontSize: fs(14),
      fontWeight: "600",
      color: colors.textSecondary,
      lineHeight: hp(20),
    },
    helpActions: {
      marginTop: hp(8),
      alignItems: "center",
      gap: hp(4),
    },
    footer: {
      width: "100%",
      alignItems: "center",
      paddingTop: hp(16),
      paddingBottom: hp(24),
      gap: hp(12),
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
    secondaryButton: {
      width: "100%",
      borderColor: colors.primary,
      borderWidth: wp(1),
      paddingVertical: hp(16),
      borderRadius: fs(30),
      alignItems: "center"
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: fs(15),
      fontWeight: "700",
    },
  }));

  const leave = () => {
    if (!winner) {
      trackGameAbandoned({
        screen: "ready",
        game,
        extra: { eliminated_count: eliminatedIds.length },
      });
    }
    onLeave();
  };

  const replay = async () => {
    if (replaying) return;
    setReplaying(true);
    try {
      await onReplay();
    } finally {
      setReplaying(false);
    }
  };

  const eliminate = (playerId) => {
    if (winner || justEliminatedId) return;
    const player = game.players.find((entry) => entry.id === playerId);
    setEliminatedIds((current) =>
      current.includes(playerId) ? current : [...current, playerId]
    );
    if (player) {
      setEliminatedPlayers((current) =>
        current.some((entry) => entry.id === playerId) ? current : [...current, player]
      );
    }
    setSpeakOrder((current) => nextSpeakOrderAfterElimination(current, playerId));
    setJustEliminatedId(playerId);
  };

  const dismissHelp = () => {
    setShowHelp(false);
  };

  const neverShowHelp = () => {
    hideHowToPlay();
    setShowHelp(false);
  };

  const dismissElimination = () => {
    setJustEliminatedId(null);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const show = await shouldShowHowToPlay();
      if (!cancelled && show){
        setShowHelp(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const title =
    showWinner && winner === "citizens_won"
      ? "Les citoyens ont gagné !"
      : showWinner && winner === "citizens_lost"
        ? "Les citoyens ont perdu !"
        : "À vous de jouer !";

  return (
    <Screen style={styles.safeArea}>
      <View style={styles.container}>
        <BackButton onPress={() => setShowLeaveConfirm(true)} />
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setShowHelp(true)}
          hitSlop={fs(8)}
          accessibilityLabel="Comment jouer"
        >
          <Ionicons name="information-circle-outline" size={fs(22)} color={colors.primary} />
        </TouchableOpacity>

        <Text
          style={[
            styles.title,
            showWinner && winner === "citizens_won" && styles.titleWon,
            showWinner && winner === "citizens_lost" && styles.titleLost,
          ]}
        >
          {title}
        </Text>
        <Text style={styles.subtitle}>
          {showWinner
            ? "La partie est terminée"
            : speakOrder[0]
              ? `C'est à ${speakOrder[0].name} de parler en premier`
              : "Décidez qui il faut éliminer"}
        </Text>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {[...speakOrder, ...eliminatedPlayers].map((player) => {
            const eliminated = eliminatedIds.includes(player.id);
            const role = getRole(player.roleId);
            const revealRole = eliminated || showWinner;

            return (
              <View
                key={player.id}
                style={[
                  styles.playerRow,
                  revealRole && {
                    backgroundColor: role.colors.background,
                    borderColor: role.colors.border,
                  },
                ]}
              >
                <View style={styles.playerInfo}>
                  <Text
                    style={[
                      styles.playerName,
                      eliminated && styles.playerNameEliminated,
                    ]}
                  >
                    {player.name}
                  </Text>
                  {revealRole ? (
                    <Text style={[styles.playerRole, { color: role.colors.accent }]}>
                      {role.label}
                    </Text>
                  ) : null}
                </View>

                {!eliminated && !winner && !justEliminatedId ? (
                  <TouchableOpacity
                    style={styles.eliminateButton}
                    onPress={() => eliminate(player.id)}
                  >
                    <Text style={styles.eliminateButtonText}>Éliminer</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        {showWinner ? (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, replaying && { opacity: 0.7 }]}
              onPress={replay}
              disabled={replaying}
            >
              <Text style={styles.buttonText}>
                {replaying ? "Chargement..." : "Relancer une partie"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onEditSettings}>
              <Text style={styles.secondaryButtonText}>Retour au menu principal</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <Modal
          visible={showHelp}
          transparent
          animationType="fade"
          onRequestClose={dismissHelp}
        >
          <View style={styles.overlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} onPress={dismissHelp} activeOpacity={1} />
            <View style={styles.helpSheet}>
              <Text style={styles.helpTitle}>Comment jouer</Text>
              <Text style={styles.helpLead}>
                Chacun son tour, dites un mot en rapport avec le vôtre.
                Au bout de 2 tours, débattez ensembles pour savoir qui éliminer.
              </Text> 

              <View style={styles.helpSection}>
                <Text
                  style={[
                    styles.helpSectionTitle,
                    { color: colors.roles.citoyen.accent },
                  ]}
                >
                  Citoyens
                </Text>
                <Text style={styles.helpSectionText}>
                  Faites comprendre aux autres citoyens que vous êtes ensembles,
                  sans donner trop d'indices aux autres joueurs.
                </Text>
              </View>

              <View style={styles.helpSection}>
                <Text
                  style={[
                    styles.helpSectionTitle,
                    { color: colors.roles.imposteur.accent },
                  ]}
                >
                  Imposteurs et fantômes
                </Text>
                <Text style={styles.helpSectionText}>
                  Mêlez-vous à la discussion et ne vous faites pas démasquer.
                </Text>
              </View>

              <View style={styles.helpActions}>
                <TouchableOpacity style={styles.button} onPress={dismissHelp}>
                  <Text style={styles.buttonText}>Ok</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <ConfirmModal
          visible={showLeaveConfirm}
          title="Voulez-vous retourner au menu principal ?"
          confirmLabel="Ok"
          onConfirm={leave}
          onCancel={() => setShowLeaveConfirm(false)}
        />

        <Modal
          visible={Boolean(justEliminated && justEliminatedRole)}
          transparent
          animationType="fade"
          onRequestClose={dismissElimination}
        >
          <View style={styles.overlay}>
            <View style={styles.eliminationSheet}>
              <Text style={styles.eliminationName}>{justEliminated?.name}</Text>
              <Text
                style={[
                  styles.eliminationRole,
                  { color: justEliminatedRole?.colors.accent },
                ]}
              >
                {justEliminatedRole?.label}
              </Text>

              <View style={styles.remainingCard}>
                <Text style={styles.remainingTitle}>Rôles restants</Text>
                {remaining.length > 0 ? (
                  <Text style={styles.remainingLine}>{remaining.join("  ·  ")}</Text>
                ) : (
                  <Text style={styles.remainingEmpty}>Plus personne en jeu</Text>
                )}
              </View>

              <TouchableOpacity style={styles.button} onPress={dismissElimination}>
                <Text style={styles.buttonText}>Continuer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
