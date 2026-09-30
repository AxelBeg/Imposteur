/**
 * Deduplique un fichier de mots source et ecrit le resultat dans
 * assets/data/themes/<theme>/words.json.
 *
 * Usage:
 *   node dedupe_words.js <themeId> <cheminFichierSource.json>
 *   node dedupe_words.js general raw_words.json
 *   node dedupe_words.js animaux raw_words_animaux.json
 */
const fs = require("fs");
const path = require("path");

const [, , themeId, sourceFileArg] = process.argv;

if (!themeId || !sourceFileArg) {
  console.error(
    "Usage: node dedupe_words.js <themeId> <cheminFichierSource.json>"
  );
  process.exit(1);
}

const rawPath = path.isAbsolute(sourceFileArg)
  ? sourceFileArg
  : path.join(__dirname, sourceFileArg);
const outPath = path.join(
  __dirname,
  "..",
  "assets",
  "data",
  "themes",
  themeId,
  "words.json"
);

const raw = JSON.parse(fs.readFileSync(rawPath, "utf-8"));

const seen = new Set();
const deduped = [];
for (const word of raw) {
  const key = word.trim().toLowerCase();
  if (!seen.has(key)) {
    seen.add(key);
    deduped.push(word.trim());
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(deduped, null, 2), "utf-8");

console.log(`Theme: ${themeId}`);
console.log(`Mots bruts: ${raw.length}`);
console.log(`Mots uniques: ${deduped.length}`);
console.log(`Doublons retires: ${raw.length - deduped.length}`);
console.log(`Ecrit dans: ${outPath}`);
