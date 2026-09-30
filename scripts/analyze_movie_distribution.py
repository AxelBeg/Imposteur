"""
Outil d'aide au reglage des seuils MOVIE_LEVEL_SCORE_RANGES (voir
generate_movie_similarity_data.py). Meme principe que
analyze_distribution.py, mais applique a la matrice de similarite entre
films (movie_similarity.py) plutot qu'aux vecteurs FastText.

Usage:
    python analyze_movie_distribution.py
    python analyze_movie_distribution.py --thresholds 5 10 15 20 30 40
"""

import argparse
import json
import os

import numpy as np

from movie_similarity import build_similarity_matrix

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_INPUT = os.path.join(SCRIPT_DIR, "raw_movies_tmdb.json")
DEFAULT_THRESHOLDS = [5, 10, 15, 20, 25, 30, 40, 50, 60]


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", default=DEFAULT_INPUT)
    parser.add_argument("--thresholds", type=float, nargs="+", default=DEFAULT_THRESHOLDS)
    return parser.parse_args()


def main():
    args = parse_args()
    with open(args.input, "r", encoding="utf-8") as f:
        movies = json.load(f)

    sim = build_similarity_matrix(movies)
    n = len(movies)
    mask = ~np.eye(n, dtype=bool)
    flat = sim[mask]

    print(f"\n--- {n} films ---")
    print("--- Distribution globale des scores (hors diagonale) ---")
    for p in [0, 1, 5, 10, 25, 50, 75, 90, 95, 99, 99.9, 100]:
        print(f"  p{p}: {np.percentile(flat, p):.2f}")
    print(f"  mean: {flat.mean():.2f}  std: {flat.std():.2f}")

    best_per_movie = np.array([np.max(sim[i][mask[i]]) for i in range(n)])
    print("\n--- Meilleur score (max) par film : distribution ---")
    for p in [0, 1, 5, 10, 25, 50, 75, 90, 100]:
        print(f"  p{p}: {np.percentile(best_per_movie, p):.2f}")

    print(
        "\n--- Pour chaque seuil, % de paires au-dessus, et nb de films "
        "sans AUCUN candidat au-dessus ---"
    )
    for threshold in args.thresholds:
        pct_pairs = (flat > threshold).mean() * 100
        movies_with_none_above = int(np.sum(best_per_movie <= threshold))
        print(
            f"  seuil {threshold:>5}: {pct_pairs:6.2f}% des paires au-dessus | "
            f"{movies_with_none_above:>4} films sur {n} n'ont AUCUN candidat au-dessus"
        )


if __name__ == "__main__":
    main()
