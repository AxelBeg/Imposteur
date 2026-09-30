/**
 * Script one-shot : fusionne les mots presents en double sous leur forme
 * masculine ET feminine, pour eviter qu'un couple citoyen/imposteur tombe sur
 * deux variantes du meme mot ("infirmier" contre "infirmiere").
 *
 * Chaque paire donne une seule entree, dont la forme finale depend du theme :
 * ecriture inclusive pour les metiers ("infirmier·ere"), forme masculine
 * seule ailleurs.
 *
 * Met a jour words.json, similarity_data.json et la liste source relue par
 * dedupe_words.js : la forme feminine disparait partout (cles et listes de
 * candidats), la forme masculine prend la forme finale. Les scores de
 * similarite ne sont pas recalcules (ils restent ceux de la forme masculine,
 * deja generes par generate_similarity_data.py). Le script est idempotent :
 * une paire deja fusionnee est simplement ignoree.
 *
 * Usage:
 *   node merge_gendered_words.js [theme]
 *   node merge_gendered_words.js          # tous les themes configures
 */
const fs = require("fs");
const path = require("path");

// Par theme : [forme masculine, forme feminine, forme finale]
const THEME_PAIRS = {
  metiers: [
    ["infirmier", "infirmière", "infirmier·ère"],
    ["instituteur", "institutrice", "instituteur·rice"],
    ["directeur", "directrice", "directeur·rice"],
    ["vendeur", "vendeuse", "vendeur·euse"],
    ["caissier", "caissière", "caissier·ère"],
    ["boulanger", "boulangère", "boulanger·ère"],
    ["serveur", "serveuse", "serveur·euse"],
    ["acteur", "actrice", "acteur·rice"],
    ["chanteur", "chanteuse", "chanteur·euse"],
    ["danseur", "danseuse", "danseur·euse"],
    ["coiffeur", "coiffeuse", "coiffeur·euse"],
  ],
  general: [
    ["directeur", "directrice", "directeur"],
    ["infirmier", "infirmière", "infirmier"],
  ],
};

// Liste source de chaque theme (celle que relit dedupe_words.js).
const RAW_WORDS_FILES = {
  metiers: "raw_words_metiers.json",
  general: "raw_words.json",
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function mergeTheme(themeId) {
  const pairs = THEME_PAIRS[themeId];
  const themeDir = path.join(__dirname, "..", "assets", "data", "themes", themeId);
  const wordsPath = path.join(themeDir, "words.json");
  const similarityPath = path.join(themeDir, "similarity_data.json");
  const rawWordsPath = path.join(__dirname, RAW_WORDS_FILES[themeId]);

  const renames = new Map(pairs.map(([masculin, , final]) => [masculin, final]));
  const removed = new Set(pairs.map(([, feminin]) => feminin));
  const rename = (word) => renames.get(word) ?? word;

  const words = readJson(wordsPath)
    .filter((word) => !removed.has(word))
    .map(rename);

  const similarity = readJson(similarityPath);
  const nextSimilarity = {};
  for (const [word, levels] of Object.entries(similarity)) {
    if (removed.has(word)) continue;

    const nextLevels = {};
    for (const [level, candidates] of Object.entries(levels)) {
      nextLevels[level] = candidates
        .filter((candidate) => !removed.has(candidate.word))
        .map((candidate) => ({ ...candidate, word: rename(candidate.word) }));
    }
    nextSimilarity[rename(word)] = nextLevels;
  }

  const rawWords = readJson(rawWordsPath)
    .filter((word) => !removed.has(word))
    .map(rename);

  fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2), "utf-8");
  fs.writeFileSync(similarityPath, JSON.stringify(nextSimilarity, null, 0), "utf-8");
  fs.writeFileSync(rawWordsPath, JSON.stringify(rawWords, null, 2), "utf-8");

  console.log(`Theme '${themeId}': ${pairs.length} paires traitees, ${words.length} mots`);
}

const [, , themeArg] = process.argv;
const themes = themeArg ? [themeArg] : Object.keys(THEME_PAIRS);

for (const themeId of themes) {
  if (!THEME_PAIRS[themeId]) {
    console.error(`Theme inconnu: ${themeId}`);
    process.exit(1);
  }
  mergeTheme(themeId);
}
