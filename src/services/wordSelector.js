import themesMeta from "../../assets/data/themes.json";
import generalWords from "../../assets/data/themes/general/words.json";
import generalSimilarity from "../../assets/data/themes/general/similarity_data.json";
import animauxWords from "../../assets/data/themes/animaux/words.json";
import animauxSimilarity from "../../assets/data/themes/animaux/similarity_data.json";
import filmsWords from "../../assets/data/themes/films/words.json";
import filmsSimilarity from "../../assets/data/themes/films/similarity_data.json";
import nourritureWords from "../../assets/data/themes/nourriture/words.json";
import nourritureSimilarity from "../../assets/data/themes/nourriture/similarity_data.json";
import metiersWords from "../../assets/data/themes/metiers/words.json";
import metiersSimilarity from "../../assets/data/themes/metiers/similarity_data.json";
import sportWords from "../../assets/data/themes/sport/words.json";
import sportSimilarity from "../../assets/data/themes/sport/similarity_data.json";

export const MIN_SIMILARITY = 1;
export const MAX_SIMILARITY = 3;

// Libelles des 3 niveaux de similarite (coherents avec les scripts de
// generation scripts/generate_similarity_data.py et
// scripts/generate_movie_similarity_data.py).
export const SIMILARITY_LABELS = {
  1: "Faible",
  2: "Proche",
  3: "Très proche",
};

// Metadonnees affichables (id + label) des themes disponibles, dans l'ordre
// defini par assets/data/themes.json.
export const THEMES = themesMeta;
export const DEFAULT_THEME_ID = THEMES[0]?.id ?? "general";

// Chaque theme est importe statiquement (Metro ne supporte pas les chemins
// dynamiques dans require/import), puis regroupe ici par id.
const THEME_DATA = {
  general: { words: generalWords, similarityData: generalSimilarity },
  animaux: { words: animauxWords, similarityData: animauxSimilarity },
  films: { words: filmsWords, similarityData: filmsSimilarity },
  nourriture: { words: nourritureWords, similarityData: nourritureSimilarity },
  metiers: { words: metiersWords, similarityData: metiersSimilarity },
  sport: { words: sportWords, similarityData: sportSimilarity },
};

function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// A preferer au style textTransform: "capitalize", qui remet une majuscule
// apres chaque signe de ponctuation : les metiers en ecriture inclusive
// s'afficheraient "Infirmier·Ère" au lieu de "Infirmier·ère".
export function capitalizeWord(word) {
  if (!word) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function getTheme(themeId) {
  return THEME_DATA[themeId] ?? THEME_DATA[DEFAULT_THEME_ID];
}

function getCandidates(theme, word, level) {
  return theme.similarityData[word]?.[String(level)] ?? [];
}

// similarity_data.json est statique par theme (genere hors-ligne, jamais
// modifie a l'execution) : on peut donc precalculer une seule fois, au
// chargement du module, la liste des mots eligibles comme citoyen pour
// chaque theme et chaque niveau (ceux qui ont au moins un candidat imposteur
// dans leur tranche de score). Chaque appel a generateWordPair devient alors
// un simple tirage direct dans cette liste, sans boucle de retirage ni
// filtrage repete.
const eligibleWordsByThemeAndLevel = {};
// Nombre total de couples (citoyen, imposteur) distincts que generateWordPair
// peut produire pour un theme et un niveau donnes ; precalcule ici pour le
// meme motif que eligibleWordsByThemeAndLevel (donnees statiques).
const combinationCountByThemeAndLevel = {};
for (const themeId of Object.keys(THEME_DATA)) {
  const theme = THEME_DATA[themeId];
  eligibleWordsByThemeAndLevel[themeId] = {};
  combinationCountByThemeAndLevel[themeId] = {};
  for (let level = MIN_SIMILARITY; level <= MAX_SIMILARITY; level += 1) {
    eligibleWordsByThemeAndLevel[themeId][level] = theme.words.filter(
      (w) => getCandidates(theme, w, level).length > 0
    );
    combinationCountByThemeAndLevel[themeId][level] = theme.words.reduce(
      (total, w) => total + getCandidates(theme, w, level).length,
      0
    );
  }
}

// Mots deja tires depuis l'ouverture de l'app. Remis a zero uniquement si le
// theme/niveau n'a plus aucune combinaison restante (sinon la partie
// continuerait sans mots).
const sessionUsedWords = new Set();

export function rememberSessionWords(...words) {
  for (const word of words) {
    if (word) sessionUsedWords.add(word);
  }
}

function resolveThemeAndLevel(themeId, similarityLevel) {
  const resolvedThemeId = THEME_DATA[themeId] ? themeId : DEFAULT_THEME_ID;
  const level = Math.min(
    MAX_SIMILARITY,
    Math.max(MIN_SIMILARITY, Math.round(similarityLevel))
  );
  return { resolvedThemeId, level, theme: getTheme(resolvedThemeId) };
}

function countAvailableCombinations(theme, level, excludedWords) {
  return theme.words.reduce((total, word) => {
    if (excludedWords.has(word)) return total;
    const available = getCandidates(theme, word, level).filter(
      (candidate) => !excludedWords.has(candidate.word)
    );
    return total + available.length;
  }, 0);
}

/**
 * Nombre de couples (mot citoyen, mot imposteur) distincts encore disponibles
 * pour un theme et un niveau, en excluant les mots deja tires cette session.
 *
 * @param {string} themeId
 * @param {number} similarityLevel
 * @returns {number}
 */
export function getCombinationCount(themeId, similarityLevel) {
  const { theme, level } = resolveThemeAndLevel(themeId, similarityLevel);
  if (sessionUsedWords.size === 0) {
    const resolvedThemeId = THEME_DATA[themeId] ? themeId : DEFAULT_THEME_ID;
    return combinationCountByThemeAndLevel[resolvedThemeId][level];
  }
  return countAvailableCombinations(theme, level, sessionUsedWords);
}

function pickWordPair(theme, resolvedThemeId, level, excludedWords) {
  const basePool = eligibleWordsByThemeAndLevel[resolvedThemeId][level];
  const citizensWithCandidates = basePool.filter(
    (word) =>
      !excludedWords.has(word) &&
      getCandidates(theme, word, level).some(
        (candidate) => !excludedWords.has(candidate.word)
      )
  );

  if (citizensWithCandidates.length === 0) return null;

  const citoyen = randomItem(citizensWithCandidates);
  const candidates = getCandidates(theme, citoyen, level).filter(
    (candidate) => !excludedWords.has(candidate.word)
  );
  const chosen = randomItem(candidates);

  return {
    citoyen,
    imposteur: chosen.word,
    similarityLevel: level,
    similarityScore: chosen.score,
  };
}

/**
 * Choisit un mot au hasard pour le citoyen (dans le theme demande), puis un
 * mot pour l'imposteur dont la similarite semantique avec le mot du citoyen
 * correspond au niveau demande (1 = aleatoire, 3 = tres proche).
 * Les mots deja tires depuis l'ouverture de l'app sont exclus ; si plus
 * aucune combinaison n'est disponible, l'historique de session est remis a
 * zero pour ce tirage.
 *
 * @param {string} themeId - identifiant du theme (voir THEMES)
 * @param {number} similarityLevel - niveau de similarite souhaite (1 a 3)
 * @returns {{ citoyen: string, imposteur: string, similarityLevel: number, similarityScore: number | null }}
 */
export function generateWordPair(themeId, similarityLevel) {
  const { resolvedThemeId, level, theme } = resolveThemeAndLevel(
    themeId,
    similarityLevel
  );

  let pair = pickWordPair(theme, resolvedThemeId, level, sessionUsedWords);

  if (!pair) {
    sessionUsedWords.clear();
    pair = pickWordPair(theme, resolvedThemeId, level, sessionUsedWords);
  }

  // Filet de securite : ne devrait plus arriver hors donnees corrompues.
  if (!pair) {
    const pool = eligibleWordsByThemeAndLevel[resolvedThemeId][level];
    const citoyen = randomItem(pool.length > 0 ? pool : theme.words);
    const candidates = getCandidates(theme, citoyen, level);
    const chosen =
      candidates.length > 0
        ? randomItem(candidates)
        : {
            word: randomItem(theme.words.filter((w) => w !== citoyen)),
            score: null,
          };
    return {
      citoyen,
      imposteur: chosen.word,
      similarityLevel: level,
      similarityScore: chosen.score,
    };
  }

  return pair;
}
