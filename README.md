# Imposteur Infini

Jeu type "Undercover" : les citoyens reçoivent un mot, l'imposteur reçoit un
mot différent mais sémantiquement proche. Ce dépôt contient la première
feature : choisir un **thème** et une **similarité** (1 = aléatoire / facile
à démasquer, 3 = très proche / difficile à démasquer), puis générer une paire
`{ citoyen, imposteur }` de mots.

## Stack

- **App** : Expo (React Native), testable directement dans un navigateur via
  `expo start --web`. Pas de backend au runtime : toute la logique de
  sélection tourne côté client, à partir de données statiques.
- **Données**, organisées par thème sous `assets/data/themes/<themeId>/` :
  - `assets/data/themes.json` : métadonnées des thèmes disponibles
    (`{ id, label }`), dans l'ordre d'affichage.
  - `assets/data/themes/<themeId>/words.json` : liste des mots du thème
    (dédupliquée).
  - `assets/data/themes/<themeId>/similarity_data.json` : pour chaque mot du
    thème, la liste de mots candidats (avec leur score de similarité cosinus
    en %) répartis en 3 niveaux de similarité sémantique
    (1 = aléatoire, 2 = proches, 3 = très proches). Généré hors-ligne
    (voir ci-dessous), jamais recalculé sur l'appareil.
  - Thèmes actuels : `general` (tout le vocabulaire), `animaux`, `sport`,
    `films`, `nourriture` et `metiers`. `general`, `animaux` et
    `sport` utilisent le pipeline FastText générique décrit ci-dessous
    (`generate_similarity_data.py`) ; `films` utilise un pipeline dédié basé
    sur l'API TMDB (`generate_movie_similarity_data.py`).

## Démarrer l'app

```bash
npm install
npm run web      # ou: npx expo start --web
```

## Comment fonctionne la génération de paires

`src/services/wordSelector.js` expose `generateWordPair(themeId, similarityLevel)` :

1. Résout le thème demandé (`THEMES` liste les thèmes disponibles, importés
   statiquement — Metro ne supporte pas les `require()` à chemin dynamique).
2. Tire un mot au hasard dans `words.json` du thème pour le citoyen.
3. Va chercher, dans `similarity_data.json` du thème, la liste de mots
   candidats (`{ word, score }`) du niveau demandé pour ce mot.
   - Comme les données sont statiques, la liste des mots éligibles comme
     citoyen pour chaque `(thème, niveau)` est **précalculée une seule fois**
     au chargement du module (`eligibleWordsByThemeAndLevel`). Le tirage se
     fait donc directement dans cette liste filtrée, sans boucle de retirage
     ni filtrage répété à chaque appel — ça évite les rares mots "isolés"
     sémantiquement (aucun candidat dans leur tranche de score) sans coût
     supplémentaire au runtime.
4. Tire un candidat au hasard dans cette liste pour l'imposteur.
5. Retourne `{ citoyen, imposteur, similarityLevel, similarityScore }`, où
   `similarityScore` est le score de similarité cosinus (en %) entre les deux
   mots, tel que calculé par le script hors-ligne.

Le front (`src/screens/HomeScreen.jsx`) affiche un sélecteur de thème
(`src/components/ThemeSelector.jsx`) au-dessus du slider de similarité.

## Régénérer `similarity_data.json` d'un thème

Ce fichier est précalculé une seule fois (hors-ligne) via un modèle FastText
français, puis committé comme asset statique de l'app — aucun calcul ML ne
tourne dans l'app elle-même.

Le script réutilise par défaut le modèle FastText déjà téléchargé pour le
projet [LexiFight](../LexiFight) (`backend/models/cc.fr.300.bin`, ~7 Go).

```bash
cd scripts
pip install -r requirements.txt   # fasttext, numpy (déjà présents dans le venv de LexiFight)
python generate_similarity_data.py --theme general
python generate_similarity_data.py --theme animaux
python generate_similarity_data.py --theme sport
# ou en précisant un autre modèle :
python generate_similarity_data.py --theme animaux --model chemin/vers/cc.fr.300.bin
```

Le script :

- charge `assets/data/themes/<theme>/words.json`,
- calcule un vecteur FastText par mot puis la matrice de similarité cosinus
  entre tous les mots du thème (score en %). Cette matrice brute est mise en
  **cache** dans `scripts/.cache/<theme>/` (invalidé automatiquement si les
  mots du thème ou le modèle changent) : si tu ne modifies que les seuils ou
  le nombre de candidats par niveau, le modèle (7 Go) n'est pas rechargé et
  la régénération prend quelques secondes au lieu d'1-2 minutes. Pour forcer
  un recalcul complet : `--force-recompute`.
- répartit les mots candidats de chaque mot en 3 niveaux selon des **tranches
  de score absolues et fixes, définies par thème** (`THEME_LEVEL_SCORE_RANGES`
  dans `generate_similarity_data.py`), pas des quantiles relatifs — la
  similarité n'est pas linéaire, et un même score n'a pas la même
  signification "relative" pour tous les mots, ni pour tous les thèmes (un
  thème homogène comme "animaux" a une distribution de score globalement
  plus haute qu'un thème hétérogène comme "general").

  Seuils actuels (à ajuster via `scripts/analyze_distribution.py` — voir
  ci-dessous — si tu changes la liste de mots d'un thème) :

  | Niveau | `general` | `animaux` | `sport` |
  |---|---|---|---|
  | 1 (aléatoire) | ≤ 40 | ≤ 38 | ≤ 35 |
  | 2 (proches) | 40 – 50 | 38 – 55 | 35 – 48 |
  | 3 (très proches) | > 50 | > 55 | > 48 |

- échantillonne jusqu'à 20 candidats par niveau et écrit le résultat dans
  `assets/data/themes/<theme>/similarity_data.json`.

Si tu modifies `words.json` d'un thème (ajout/suppression de mots), il faut
relancer le script pour ce thème pour que ses données restent cohérentes.

## Ajouter un nouveau thème

1. Crée `scripts/raw_words_<theme>.json` avec la liste brute des mots (sans
   toucher aux fichiers des autres thèmes).
2. Déduplique-la vers `assets/data/themes/<theme>/words.json` :

   ```bash
   node scripts/dedupe_words.js <theme> raw_words_<theme>.json
   ```

3. Ajoute une entrée `THEME_LEVEL_SCORE_RANGES["<theme>"]` dans
   `generate_similarity_data.py` (copie celles d'un thème existant pour
   commencer), puis ajoute `"<theme>"` aux `choices` de l'argument `--theme`.
4. Génère les données puis, si besoin, analyse la distribution réelle des
   scores pour affiner les seuils (le script initial de génération affiche le
   nombre de couples mot/niveau sans candidat, un bon indicateur) :

   ```bash
   python generate_similarity_data.py --theme <theme>
   ```

5. Importe le nouveau thème dans `src/services/wordSelector.js` (ajoute-le à
   `THEME_DATA`) et ajoute-le à `assets/data/themes.json`.

## Mettre à jour la liste de mots d'un thème existant

- `scripts/raw_words.json` (thème `general`), `scripts/raw_words_animaux.json`
  (thème `animaux`) et `scripts/raw_words_sport.json` (thème `sport`)
  contiennent les listes sources brutes.
- `scripts/dedupe_words.js <theme> <fichierSource.json>` déduplique et
  régénère `assets/data/themes/<theme>/words.json` :

```bash
node scripts/dedupe_words.js general raw_words.json
node scripts/dedupe_words.js animaux raw_words_animaux.json
node scripts/dedupe_words.js sport raw_words_sport.json
```

Puis relancer `generate_similarity_data.py --theme <theme>` pour
resynchroniser les données de similarité de ce thème.
