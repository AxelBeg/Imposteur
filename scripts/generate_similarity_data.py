"""
Script one-shot : precalcule, pour chaque mot d'un theme donne
(assets/data/themes/<theme>/words.json), une liste de mots "candidats
imposteur" (avec leur score de similarite cosinus, en %) repartis en 3
niveaux de similarite, a partir d'un modele FastText francais :
    1 = aleatoire (mot tire sans contrainte de proximite)
    2 = proches (semantiquement lies)
    3 = similaires (tres proche, difficile a demasquer)

Les niveaux sont definis par des tranches de SCORE ABSOLUES (et non par des
quantiles relatifs a chaque mot), car la similarite entre deux mots n'est pas
lineaire : un score de 30 peut representer la meilleure correspondance
possible pour un mot generique, mais un score "moyen" pour un mot qui a
beaucoup de synonymes proches. Des tranches fixes garantissent qu'un niveau 3
correspond toujours a une vraie proximite semantique forte, quel que soit le
mot tire au sort.

Ces tranches sont definies PAR THEME (voir THEME_LEVEL_SCORE_RANGES),
car la distribution des scores depend fortement du vocabulaire : une liste de
mots tous semantiquement proches (ex: "animaux") a une distribution de score
globalement plus haute qu'une liste heterogene (ex: "general").

Consequence : pour certains mots, une tranche peut n'avoir AUCUN candidat
(ex: un mot tres "isole" semantiquement n'aura peut-etre aucun autre mot au
dessus du seuil du niveau 3). C'est gere cote app (src/services/wordSelector.js)
en filtrant les mots eligibles comme citoyen pour chaque niveau.

Ce script ne tourne jamais dans l'application : il est execute manuellement une
fois par theme (ou a chaque mise a jour de sa liste de mots), et son resultat
(assets/data/themes/<theme>/similarity_data.json) est un fichier statique
embarque dans l'app.

Le score cosinus brut entre deux mots ne depend que du modele FastText, jamais
des seuils LEVEL_SCORE_RANGES. Le script met donc en cache la matrice de
similarite brute par theme (scripts/.cache/<theme>/) : si tu ne changes QUE
les seuils (ou le nombre de candidats par niveau), le modele n'est pas
recharge et la regeneration prend quelques secondes au lieu d'1-2 minutes. Le
cache est invalide automatiquement si les mots du theme ou le modele utilise
changent. Pour forcer un recalcul complet, utilise --force-recompute.

Usage:
    python generate_similarity_data.py [--theme general|animaux] [--model PATH_VERS_cc.fr.300.bin] [--force-recompute]

Par defaut, le script traite le theme "general" et reutilise le modele
FastText deja telecharge pour le projet LexiFight
(backend/models/cc.fr.300.bin).
"""

import argparse
import hashlib
import json
import os
import random

import numpy as np
import fasttext

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MODEL_PATH = os.path.join(
    SCRIPT_DIR, "..", "..", "LexiFight", "backend", "models", "cc.fr.300.bin"
)
THEMES_DIR = os.path.join(SCRIPT_DIR, "..", "assets", "data", "themes")
CACHE_ROOT_DIR = os.path.join(SCRIPT_DIR, ".cache")

DEFAULT_THEME = "general"
CANDIDATES_PER_LEVEL = 20
SEED = 42

# Libelles des 3 niveaux (utilises dans les logs et l'app).
LEVEL_LABELS = {
    1: "aleatoire",
    2: "proches",
    3: "similaires",
}

# Tranches de score (cosinus * 100) par niveau de similarite, par theme :
# { theme: { niveau: (borne_min_exclue, borne_max_incluse) } }
# None = pas de borne (infini). Definies empiriquement, theme par theme, a
# partir de la distribution reelle des scores de chaque sous-corpus (mean,
# percentiles, nombre de mots sans candidat par tranche). Une liste de mots
# homogene (ex: "animaux") a une distribution de score globalement plus haute
# qu'une liste heterogene (ex: "general"), d'ou des seuils differents.
THEME_LEVEL_SCORE_RANGES = {
    "general": {
        1: (None, 40),
        2: (40, 50),
        3: (50, None),
    },
    "animaux": {
        1: (None, 38),
        2: (38, 55),
        3: (55, None),
    },
    "sport": {
        1: (None, 35),
        2: (35, 48),
        3: (48, None),
    },
    "nourriture": {
        1: (None, 40),
        2: (40, 50),
        3: (50, None),
    },
    "metiers": {
        1: (None, 40),
        2: (40, 50),
        3: (50, None),
    },
}


def clean_word(word: str) -> str:
    """Meme normalisation que LexiFight (utils/helpers.clean_word)."""
    return word.replace(" ", "").lower()


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--theme",
        default=DEFAULT_THEME,
        choices=sorted(THEME_LEVEL_SCORE_RANGES.keys()),
        help="Theme a traiter (dossier dans assets/data/themes/)",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL_PATH,
        help="Chemin vers le modele FastText (.bin)",
    )
    parser.add_argument(
        "--candidates-per-level",
        type=int,
        default=CANDIDATES_PER_LEVEL,
        help="Nombre max de mots candidats stockes par niveau de similarite",
    )
    parser.add_argument(
        "--force-recompute",
        action="store_true",
        help="Ignore le cache et recalcule la matrice de similarite depuis le modele",
    )
    return parser.parse_args()


def _words_hash(words):
    return hashlib.sha256(json.dumps(words, ensure_ascii=False).encode("utf-8")).hexdigest()


def load_cached_similarity_matrix(cache_dir, words, model_path):
    matrix_path = os.path.join(cache_dir, "similarity_matrix.npy")
    meta_path = os.path.join(cache_dir, "similarity_matrix_meta.json")
    if not (os.path.exists(matrix_path) and os.path.exists(meta_path)):
        return None

    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)

    if meta.get("words_hash") != _words_hash(words):
        return None
    if meta.get("model_path") != os.path.abspath(model_path):
        return None
    if meta.get("model_mtime") != os.path.getmtime(model_path):
        return None

    return np.load(matrix_path)


def save_cached_similarity_matrix(cache_dir, similarity_matrix, words, model_path):
    os.makedirs(cache_dir, exist_ok=True)
    np.save(os.path.join(cache_dir, "similarity_matrix.npy"), similarity_matrix)
    with open(
        os.path.join(cache_dir, "similarity_matrix_meta.json"), "w", encoding="utf-8"
    ) as f:
        json.dump(
            {
                "words_hash": _words_hash(words),
                "model_path": os.path.abspath(model_path),
                "model_mtime": os.path.getmtime(model_path),
            },
            f,
        )


def build_similarity_matrix(model, words):
    print(f"Calcul des vecteurs pour {len(words)} mots...")
    vectors = np.array(
        [model.get_word_vector(clean_word(w)) for w in words], dtype=np.float32
    )
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1e-8
    normalized = vectors / norms

    print("Calcul de la matrice de similarite cosinus...")
    return (normalized @ normalized.T) * 100  # (N, N), en % (valeurs dans [-100, 100])


def get_similarity_matrix(cache_dir, words, model_path, force_recompute):
    if not force_recompute:
        cached = load_cached_similarity_matrix(cache_dir, words, model_path)
        if cached is not None:
            print("Matrice de similarite recuperee depuis le cache (modele non recharge).")
            return cached

    print(f"Chargement du modele FastText depuis {model_path} ...")
    model = fasttext.load_model(model_path)
    print("Modele charge.")

    similarity_matrix = build_similarity_matrix(model, words)
    save_cached_similarity_matrix(cache_dir, similarity_matrix, words, model_path)
    return similarity_matrix


def build_levels_for_word(word_index, similarity_row, words, candidates_per_level, level_ranges):
    levels = {}
    for level, (lo, hi) in level_ranges.items():
        matching_indices = [
            idx
            for idx in range(len(words))
            if idx != word_index
            and (lo is None or similarity_row[idx] > lo)
            and (hi is None or similarity_row[idx] <= hi)
        ]

        sample_size = min(candidates_per_level, len(matching_indices))
        sampled = random.sample(matching_indices, sample_size) if sample_size else []
        levels[str(level)] = [
            {"word": words[idx], "score": round(float(similarity_row[idx]), 2)}
            for idx in sampled
        ]

    return levels


def main():
    args = parse_args()
    random.seed(SEED)

    model_path = os.path.abspath(args.model)
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Modele FastText introuvable: {model_path}\n"
            "Precise son emplacement avec --model."
        )

    theme_dir = os.path.join(THEMES_DIR, args.theme)
    words_path = os.path.join(theme_dir, "words.json")
    output_path = os.path.join(theme_dir, "similarity_data.json")
    cache_dir = os.path.join(CACHE_ROOT_DIR, args.theme)
    level_ranges = THEME_LEVEL_SCORE_RANGES[args.theme]

    with open(words_path, "r", encoding="utf-8") as f:
        words = json.load(f)
    print(f"Theme '{args.theme}': {len(words)} mots charges depuis {words_path}")

    similarity_matrix = get_similarity_matrix(cache_dir, words, model_path, args.force_recompute)

    print("Repartition des candidats par tranche de score (niveaux 1 a 3)...")
    result = {}
    empty_levels_count = 0
    for i, word in enumerate(words):
        levels = build_levels_for_word(
            i, similarity_matrix[i], words, args.candidates_per_level, level_ranges
        )
        result[word] = levels
        empty_levels_count += sum(1 for c in levels.values() if len(c) == 0)
        if (i + 1) % 100 == 0 or (i + 1) == len(words):
            print(f"  {i + 1}/{len(words)} mots traites")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    print(
        f"Termine. {empty_levels_count} couples (mot, niveau) sans aucun candidat "
        f"(geres par retirage cote app). Donnees ecrites dans {os.path.abspath(output_path)}"
    )


if __name__ == "__main__":
    main()
