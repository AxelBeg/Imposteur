import { generateWordPair, rememberSessionWords } from "./wordSelector";
import { ROLES } from "./roles";

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Transforme { imposteur: 1, citoyen: 3, fantome: 0 } en
// ["imposteur", "citoyen", "citoyen", "citoyen"].
export function buildRoleDeck(roleCounts) {
  const deck = [];
  ROLES.forEach((role) => {
    const count = roleCounts[role.id] || 0;
    for (let i = 0; i < count; i += 1) {
      deck.push(role.id);
    }
  });
  return deck;
}

// Un fantome ne doit pas ouvrir le tout premier tour : il n'a pas de mot
// et se trahirait tout de suite. Apres une elimination, n'importe qui
// (y compris un fantome) peut parler en premier.
function ensureFirstIsNotGhost(players) {
  if (players.length <= 1) return players;
  const start = players.findIndex((player) => player.roleId !== "fantome");
  if (start <= 0) return players;
  return [...players.slice(start), ...players.slice(0, start)];
}

export function createSpeakOrder(players) {
  return ensureFirstIsNotGhost(shuffle(players));
}

export function nextSpeakOrderAfterElimination(speakOrder, eliminatedId) {
  const index = speakOrder.findIndex((player) => player.id === eliminatedId);
  if (index < 0) return speakOrder;
  return [...speakOrder.slice(index + 1), ...speakOrder.slice(0, index)];
}

/**
 * Cree une nouvelle partie : tire un mot citoyen/imposteur selon le theme et
 * la similarite demandes, puis distribue aleatoirement un role a chaque
 * joueur. `playerNames` est la liste des noms saisis au menu (dans l'ordre) ;
 * un nom vide retombe sur "Joueur N".
 */
export function createGame({ playerNames, roleCounts, themeId, similarity }) {
  const shuffledRoles = shuffle(buildRoleDeck(roleCounts));
  const wordPair = generateWordPair(themeId, similarity);
  // Mots exclus des prochaines parties tant que l'app reste ouverte.
  rememberSessionWords(wordPair.citoyen, wordPair.imposteur);

  const players = playerNames.map((rawName, index) => {
    const roleId = shuffledRoles[index];
    let word = null;
    if (roleId === "imposteur") word = wordPair.imposteur;
    else if (roleId === "citoyen") word = wordPair.citoyen;

    const name = rawName.trim() || `Joueur ${index + 1}`;

    return {
      id: index,
      name,
      roleId,
      word,
    };
  });

  return { players, wordPair, themeId, similarity };
}
