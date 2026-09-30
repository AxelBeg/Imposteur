"""
Script one-shot : a partir des metadonnees TMDb recuperees par
fetch_movies_tmdb.py (scripts/raw_movies_tmdb.json), calcule pour chaque
film une liste de "films imposteurs" candidats (score de similarite en %),
repartis en 3 niveaux de similarite (1 = aleatoire, 2 = proches, 3 =
similaires), et ecrit assets/data/themes/films/similarity_data.json (meme
format que generate_similarity_data.py pour les themes de mots).

Le score de similarite est calcule par movie_similarity.py a partir des
metadonnees structurees (genres, realisateur, casting, mots-cles), pas
d'un modele lexical : voir ce fichier pour le detail.

Les tranches de score MOVIE_LEVEL_SCORE_RANGES ont ete calibrees
empiriquement sur un echantillon de 100 films (voir
scripts/analyze_movie_distribution.py) ; elles sont a reajuster si la
taille de la liste de films change significativement.

Usage:
    python generate_movie_similarity_data.py [--input raw_movies_tmdb.json] [--candidates-per-level 20]
"""

import argparse
import json
import os
import random

from generate_similarity_data import CANDIDATES_PER_LEVEL, SEED, build_levels_for_word
from movie_similarity import build_similarity_matrix

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_INPUT = os.path.join(SCRIPT_DIR, "raw_movies_tmdb.json")
THEME_DIR = os.path.join(SCRIPT_DIR, "..", "assets", "data", "themes", "films")

# Libelles des 3 niveaux (coherents avec generate_similarity_data.LEVEL_LABELS).
LEVEL_LABELS = {
    1: "aleatoire",
    2: "proches",
    3: "similaires",
}

# Tranches de score (0-100) par niveau de similarite. Calibrees a partir de
# la distribution reelle des scores sur l'echantillon actuel de licences
# (119 films internationaux + francais, voir analyze_movie_distribution.py),
# avec le Jaccard pondere sur les mots-cles (voir movie_similarity.py) : la
# plupart des paires sont sous 10 (aucun point commun structurel ou
# presque), et seule une poignee de paires (meme realisateur + genres/
# mots-cles proches) depasse 18.
MOVIE_LEVEL_SCORE_RANGES = {
    1: (None, 10),
    2: (10, 18),
    3: (18, None),
}


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", default=DEFAULT_INPUT, help="Dump JSON de metadonnees TMDb")
    parser.add_argument(
        "--candidates-per-level",
        type=int,
        default=CANDIDATES_PER_LEVEL,
        help="Nombre max de films candidats stockes par niveau de similarite",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    random.seed(SEED)

    with open(args.input, "r", encoding="utf-8") as f:
        movies = json.load(f)
    print(f"{len(movies)} films charges depuis {args.input}")

    titles = [movie["title"] for movie in movies]
    similarity_matrix = build_similarity_matrix(movies)

    print("Repartition des candidats par tranche de score (niveaux 1 a 3)...")
    result = {}
    empty_levels_count = 0
    for i, title in enumerate(titles):
        levels = build_levels_for_word(
            i, similarity_matrix[i], titles, args.candidates_per_level, MOVIE_LEVEL_SCORE_RANGES
        )
        result[title] = levels
        empty_levels_count += sum(1 for c in levels.values() if len(c) == 0)

    output_path = os.path.join(THEME_DIR, "similarity_data.json")
    os.makedirs(THEME_DIR, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    print(
        f"Termine. {empty_levels_count} couples (film, niveau) sans aucun candidat "
        f"(geres par retirage cote app). Donnees ecrites dans {os.path.abspath(output_path)}"
    )


if __name__ == "__main__":
    main()
