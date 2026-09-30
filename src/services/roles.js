import { colors } from "../theme/theme";

// Definition des roles disponibles dans une partie.
// "fantome" n'a jamais de mot : le joueur doit deviner le theme en ecoutant
// les autres, sans jamais trahir qu'il ne connait pas le mot secret.
export const ROLES = [
  {
    id: "imposteur",
    label: "Imposteur",
    hasWord: true,
    colors: colors.roles.imposteur,
  },
  {
    id: "citoyen",
    label: "Citoyen",
    hasWord: true,
    colors: colors.roles.citoyen,
  },
  {
    id: "fantome",
    label: "Fantôme",
    hasWord: false,
    colors: colors.roles.fantome,
  },
];

export const MIN_PLAYERS = 2;

// Roles qui doivent obligatoirement etre presents au moins une fois pour
// qu'une partie ait un sens.
export const REQUIRED_ROLE_IDS = ["imposteur", "citoyen"];

export function getRole(roleId) {
  return ROLES.find((role) => role.id === roleId);
}

// Composition equilibree : ~25-35 % de roles adverses (imposteurs + fantomes).
// Les fantomes arrivent a partir de 6 joueurs, un 2e imposteur a partir de 9.
export function defaultRoleCounts(playerCount) {
  if (playerCount <= 0) {
    return { imposteur: 0, citoyen: 0, fantome: 0 };
  }

  let imposteur = 1;
  if (playerCount >= 9) imposteur = 2;
  if (playerCount >= 13) imposteur = 3;
  if (playerCount >= 18) imposteur = 4;

  let fantome = 0;
  if (playerCount >= 6) fantome = 1;
  if (playerCount >= 12) fantome = 2;

  let citoyen = playerCount - imposteur - fantome;
  if (citoyen < 1) {
    fantome = Math.max(0, fantome - (1 - citoyen));
    citoyen = playerCount - imposteur - fantome;
  }

  return { imposteur, citoyen, fantome };
}

export function totalRoleCount(roleCounts) {
  return ROLES.reduce((sum, role) => sum + (roleCounts[role.id] || 0), 0);
}

export function isRoleCompositionValid(roleCounts, playerCount) {
  const total = totalRoleCount(roleCounts);
  if (total !== playerCount) return false;
  return REQUIRED_ROLE_IDS.every((roleId) => (roleCounts[roleId] || 0) >= 1);
}

const ROLE_PLURALS = {
  imposteur: "imposteurs",
  citoyen: "citoyens",
  fantome: "fantômes",
};

export function countAliveByRole(players, eliminatedIds) {
  const eliminated = new Set(eliminatedIds);
  const counts = Object.fromEntries(ROLES.map((role) => [role.id, 0]));
  for (const player of players) {
    if (eliminated.has(player.id)) continue;
    counts[player.roleId] += 1;
  }
  return counts;
}

// Les citoyens gagnent quand plus aucun imposteur ni fantome n'est en jeu.
// Ils perdent quand plus aucun citoyen n'est en vie.
export function getGameWinner(aliveCounts) {
  if (aliveCounts.citoyen === 0) return "citizens_lost";
  if ((aliveCounts.imposteur || 0) === 0 && (aliveCounts.fantome || 0) === 0) {
    return "citizens_won";
  }
  return null;
}

export function formatRoleCount(roleId, count) {
  const role = getRole(roleId);
  if (!role || count <= 0) return null;
  const label = count > 1 ? ROLE_PLURALS[roleId] : role.label.toLowerCase();
  return `${count} ${label}`;
}

export function formatRemainingRoles(aliveCounts) {
  return ROLES.map((role) => formatRoleCount(role.id, aliveCounts[role.id] || 0)).filter(
    Boolean
  );
}
