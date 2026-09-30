import { useRef, useState } from "react";
import {
  FlatList,
  Image,
  Keyboard,
  Linking,
  TouchableOpacity,
  Text,
  TextInput,
  View,
} from "react-native";
import Screen from "../components/Screen";
import { PRIVACY_POLICY_URL } from "../services/legal";
import { MIN_PLAYERS } from "../services/roles";
import { colors, fonts } from "../theme/theme";
import { useStyles } from "../theme/layout";

export default function MenuScreen({
  players,
  maxPlayers,
  onAddPlayer,
  onRemovePlayer,
  onNext,
  onOpenTest,
}) {
  const canAdd = players.length < maxPlayers;
  const enoughPlayers = players.length >= MIN_PLAYERS;
  const [newPlayer, setNewPlayer] = useState("");
  const [showPlayerCountError, setShowPlayerCountError] = useState(false);
  const playerCountErrorVisible = showPlayerCountError && !enoughPlayers;
  const inputRef = useRef(null);
  const { styles } = useStyles(({ wp, hp, fs, shadows, page }) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      paddingHorizontal: page.paddingHorizontal,
      paddingTop: hp(12),
      alignItems: "center",
    },
    logo: {
      width: fs(100),
      height: fs(100),
      marginBottom: hp(4),
    },
    title: {
      fontFamily: fonts.display,
      fontSize: fs(34),
      color: colors.primary,
      textAlign: "center",
    },
    subtitle: {
      fontSize: fs(14),
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: page.sectionGap,
    },
    playerListTitle: {
      fontSize: fs(15),
      fontWeight: "700",
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: hp(12),
      marginTop: hp(10),
    },
    addPlayerContainer: {
      width: "100%",
      marginBottom: hp(10),
    },
    list: {
      width: "100%",
      flex: 1,
    },
    playersListContent: {
      gap: hp(10),
      paddingBottom: hp(12),
    },
    playerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: wp(10),
    },
    playerInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: fs(16),
      paddingVertical: hp(14),
      paddingHorizontal: wp(18),
      fontSize: fs(16),
      fontWeight: "600",
      color: colors.textPrimary,
      borderWidth: wp(1.5),
      borderColor: "transparent",
    },
    addButton: {
      width: fs(40),
      height: fs(40),
      borderRadius: fs(20),
      backgroundColor: colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: {
      fontSize: fs(22),
      fontWeight: "700",
      color: colors.primary,
      lineHeight: hp(24),
    },
    removeButton: {
      width: fs(40),
      height: fs(40),
      borderRadius: fs(20),
      backgroundColor: colors.secondarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    removeButtonText: {
      fontSize: fs(20),
      fontWeight: "700",
      color: colors.secondary,
      lineHeight: hp(22),
    },
    maxPlayersReached: {
      width: "100%",
      backgroundColor: colors.surface,
      borderRadius: fs(16),
      paddingVertical: hp(14),
      paddingHorizontal: wp(18),
      alignItems: "center",
    },
    maxPlayersText: {
      color: colors.textSecondary,
      fontWeight: "600",
      textAlign: "center",
      fontSize: fs(14),
    },
    footer: {
      width: "100%",
      alignItems: "center",
      paddingTop: hp(16),
      paddingBottom: hp(24),
      gap: hp(12),
    },
    errorText: {
      color: colors.secondary,
      fontSize: fs(14),
      fontWeight: "700",
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
    testButton: {
      paddingVertical: hp(8),
      paddingHorizontal: wp(16),
    },
    testButtonText: {
      color: colors.textMuted,
      fontSize: fs(13),
      fontWeight: "600",
    },
    privacyLink: {
      paddingVertical: hp(4),
    },
    privacyLinkText: {
      color: colors.textMuted,
      fontSize: fs(13),
      fontWeight: "600",
      textDecorationLine: "underline",
    },
  }));

  // Ferme le clavier avant de changer d'ecran : sinon, sur Android, la
  // fenetre (reduite pour laisser la place au clavier) reprend sa pleine
  // hauteur juste apres la navigation, ce qui fait "sauter" le contenu du
  // nouvel ecran.
  const goNext = () => {
    Keyboard.dismiss();
    if (!enoughPlayers) {
      setShowPlayerCountError(true);
      return;
    }
    setShowPlayerCountError(false);
    onNext();
  };

  const goToTest = () => {
    Keyboard.dismiss();
    onOpenTest();
  };

  const dismissKeyboard = () => {
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  const addPlayer = () => {
    if (newPlayer.trim() === "" || !canAdd) return;
    setShowPlayerCountError(false);
    onAddPlayer(newPlayer);
    setNewPlayer("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <Screen style={styles.safeArea}>
      <TouchableOpacity style={styles.container} onPress={dismissKeyboard} activeOpacity={1}>
        <Image
          source={require("../../assets/logo_transparent.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Imposteur Infini"
        />
        <Text style={styles.title}>Imposteur Infini</Text>
        <Text style={styles.subtitle}>
          Une infinité de partie possibles
        </Text>

        <Text style={styles.playerListTitle}>
          Ajoutez les joueurs présents autour de la table
        </Text>

        <View style={styles.addPlayerContainer}>
          {canAdd ? (
            <View style={styles.playerRow}>
              <TextInput
                ref={inputRef}
                style={styles.playerInput}
                placeholder="Ajouter un joueur"
                placeholderTextColor={colors.textMuted}
                value={newPlayer}
                onChangeText={setNewPlayer}
                onSubmitEditing={addPlayer}
                maxLength={12}
                returnKeyType="done"
              />
              <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.maxPlayersReached}>
              <Text style={styles.maxPlayersText}>
                Nombre maximum de joueurs atteint ({maxPlayers})
              </Text>
            </View>
          )}
        </View>

        <FlatList
          style={styles.list}
          data={players}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          keyExtractor={(item, index) => `${item}-${index}`}
          contentContainerStyle={styles.playersListContent}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.playerRow} onPress={dismissKeyboard} activeOpacity={1}>
              <TextInput
                style={styles.playerInput}
                value={item}
                editable={false}
                focusable={false}
                caretHidden
                pointerEvents="none"
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemovePlayer(index)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />

        <View style={styles.footer}>
          {playerCountErrorVisible ? (
            <Text style={styles.errorText}>
              Ajoutez au moins deux joueurs pour commencer
            </Text>
          ) : null}

          <TouchableOpacity style={styles.button} onPress={goNext}>
            <Text style={styles.buttonText}>Suivant</Text>
          </TouchableOpacity>

          {__DEV__ ? (
            <TouchableOpacity style={styles.testButton} onPress={goToTest}>
              <Text style={styles.testButtonText}>Mode test (dev)</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    </Screen>
  );
}
