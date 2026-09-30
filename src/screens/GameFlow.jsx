import { useEffect, useState } from "react";
import { trackGameStarted, trackScreen } from "../services/analytics";
import { createGame } from "../services/gameSetup";
import { defaultRoleCounts } from "../services/roles";
import { useThemeAccess } from "../services/ThemeAccessContext";
import { DEFAULT_THEME_ID, MAX_SIMILARITY } from "../services/wordSelector";
import HomeScreen from "./HomeScreen";
import MenuScreen from "./MenuScreen";
import ReadyScreen from "./ReadyScreen";
import RevealScreen from "./RevealScreen";
import RolesScreen from "./RolesScreen";
import SettingsScreen from "./SettingsScreen";
import ThemesScreen from "./ThemesScreen";

const MAX_PLAYERS = 20;

// Orchestre le flow de jeu (un seul telephone qui passe de joueur en joueur)
// via une simple machine a etats locale : menu -> roles -> themes -> settings
// -> reveal -> ready (eliminations jusqu'a un camp vainqueur).
export default function GameFlow() {
  const { needsReplayAd, unlockWithAd, isPurchased, clearAdUnlocks, freeThemeId } =
    useThemeAccess();
  const [screen, setScreen] = useState("menu");

  // Noms deja confirmes depuis le champ d'ajout du menu (le plus recent en tete).
  const [players, setPlayers] = useState([]);
  const [roleCounts, setRoleCounts] = useState(() => defaultRoleCounts(0));
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [similarity, setSimilarity] = useState(MAX_SIMILARITY);
  // Quand c'est desactive, chaque joueur voit seulement son mot : impossible
  // de savoir si on est imposteur ou citoyen.
  const [showRoles, setShowRoles] = useState(true);

  const [game, setGame] = useState(null);
  const [revealIndex, setRevealIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    trackScreen(screen);
  }, [screen]);

  const addPlayer = (name) => {
    const trimmed = name.trim();
    if (!trimmed || players.length >= MAX_PLAYERS) return;
    const next = [trimmed, ...players];
    setPlayers(next);
    setRoleCounts(defaultRoleCounts(next.length));
  };

  const removePlayer = (index) => {
    const next = players.filter((_, i) => i !== index);
    setPlayers(next);
    setRoleCounts(defaultRoleCounts(next.length));
  };

  const incrementRole = (roleId) => {
    setRoleCounts((current) => ({ ...current, [roleId]: (current[roleId] || 0) + 1 }));
  };

  const decrementRole = (roleId) => {
    setRoleCounts((current) => ({
      ...current,
      [roleId]: Math.max(0, (current[roleId] || 0) - 1),
    }));
  };

  const resetLockedTheme = () => {
    setThemeId((current) => (isPurchased(current) || current === freeThemeId ? current : freeThemeId));
  };

  const leaveToMenu = () => {
    clearAdUnlocks();
    resetLockedTheme();
    setGame(null);
    setRevealIndex(0);
    setRevealed(false);
    setScreen("menu");
  };

  const launchGame = (isReplay = false) => {
    const newGame = createGame({ playerNames: players, roleCounts, themeId, similarity });
    const session = {
      ...newGame,
      startedAt: Date.now(),
      isReplay: Boolean(isReplay),
      showRoles,
    };
    trackGameStarted({
      themeId,
      playerCount: players.length,
      roleCounts,
      similarity,
      showRoles,
      isReplay,
      purchased: isPurchased(themeId),
    });
    setGame(session);
    setRevealIndex(0);
    setRevealed(false);
    setScreen("reveal");
  };

  const replayGame = async () => {
    if (!needsReplayAd(themeId)) {
      launchGame(true);
      return;
    }
    const unlocked = await unlockWithAd(themeId, "replay");
    if (unlocked) launchGame(true);
  };

  const goToNextPlayer = () => {
    if (revealIndex + 1 < game.players.length) {
      setRevealIndex((i) => i + 1);
      setRevealed(false);
    } else {
      setScreen("ready");
    }
  };

  switch (screen) {
    case "menu":
      return (
        <MenuScreen
          players={players}
          maxPlayers={MAX_PLAYERS}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onNext={() => {
            setRoleCounts(defaultRoleCounts(players.length));
            setScreen("roles");
          }}
          onOpenTest={__DEV__ ? () => setScreen("test") : undefined}
        />
      );

    case "roles":
      return (
        <RolesScreen
          playerCount={players.length}
          roleCounts={roleCounts}
          onIncrementRole={incrementRole}
          onDecrementRole={decrementRole}
          onNext={() => setScreen("themes")}
          onBack={() => setScreen("menu")}
        />
      );

    case "themes":
      return (
        <ThemesScreen
          themeId={themeId}
          onSelectTheme={setThemeId}
          onNext={() => setScreen("settings")}
          onBack={() => setScreen("roles")}
        />
      );

    case "settings":
      return (
        <SettingsScreen
          themeId={themeId}
          similarity={similarity}
          onChangeSimilarity={setSimilarity}
          showRoles={showRoles}
          onChangeShowRoles={setShowRoles}
          onStart={() => launchGame()}
          onBack={() => setScreen("themes")}
        />
      );

    case "reveal":
      return (
        <RevealScreen
          game={game}
          playerIndex={revealIndex}
          showRoles={showRoles}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onNext={goToNextPlayer}
          onLeave={leaveToMenu}
        />
      );

    case "ready":
      return (
        <ReadyScreen
          game={game}
          onReplay={replayGame}
          onEditSettings={leaveToMenu}
          onLeave={leaveToMenu}
        />
      );

    case "test":
      if (!__DEV__) return null;
      return <HomeScreen onBack={() => setScreen("menu")} />;

    default:
      return null;
  }
}
