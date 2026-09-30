"""
Outil d'aide au reglage des seuils THEME_LEVEL_SCORE_RANGES d'un theme
(voir generate_similarity_data.py).

Affiche la distribution des scores de similarite cosinus (en %) sur
l'ensemble des paires de mots d'un theme, ainsi que la distribution du
meilleur score par mot, et teste la faisabilite (nombre de mots sans aucun
candidat) pour une liste de seuils candidats.

Reutilise le cache de matrice de similarite s'il existe deja pour ce theme
(genere par generate_similarity_data.py) ; sinon charge le modele FastText
pour le calculer (et le met en cache).

Usage:
    python analyze_distribution.py --theme animaux
    python analyze_distribution.py --theme animaux --thresholds 20 30 40 50
"""

import argparse
import json
import os

import numpy as np

from generate_similarity_data import (
    DEFAULT_MODEL_PATH,
    THEMES_DIR,
    CACHE_ROOT_DIR,
    get_similarity_matrix,
)

DEFAULT_THRESHOLDS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--theme", required=True, help="Theme a analyser")
    parser.add_argument("--model", default=DEFAULT_MODEL_PATH)
    parser.add_argument(
        "--thresholds",
        type=float,
        nargs="+",
        default=DEFAULT_THRESHOLDS,
        help="Seuils a tester (score cosinus en %%)",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    theme_dir = os.path.join(THEMES_DIR, args.theme)
    words_path = os.path.join(theme_dir, "words.json")
    cache_dir = os.path.join(CACHE_ROOT_DIR, args.theme)

    with open(words_path, "r", encoding="utf-8") as f:
        words = json.load(f)

    model_path = os.path.abspath(args.model)
    sim = get_similarity_matrix(cache_dir, words, model_path, force_recompute=False)

    n = len(words)
    mask = ~np.eye(n, dtype=bool)
    flat = sim[mask]

    print(f"\n--- Theme '{args.theme}' : {n} mots ---")
    print("--- Distribution globale des scores (hors diagonale) ---")
    for p in [0, 1, 5, 10, 25, 50, 75, 90, 95, 99, 99.9, 100]:
        print(f"  p{p}: {np.percentile(flat, p):.2f}")
    print(f"  mean: {flat.mean():.2f}  std: {flat.std():.2f}")

    best_per_word = np.array([np.max(sim[i][mask[i]]) for i in range(n)])
    print("\n--- Meilleur score (max) par mot : distribution ---")
    for p in [0, 1, 5, 10, 25, 50, 75, 90, 100]:
        print(f"  p{p}: {np.percentile(best_per_word, p):.2f}")

    print(
        "\n--- Pour chaque seuil, % de paires au-dessus, et nb de mots "
        "sans AUCUN candidat au-dessus ---"
    )
    for threshold in args.thresholds:
        pct_pairs = (flat > threshold).mean() * 100
        words_with_none_above = int(np.sum(best_per_word <= threshold))
        print(
            f"  seuil {threshold:>5}: {pct_pairs:6.2f}% des paires au-dessus | "
            f"{words_with_none_above:>4} mots sur {n} n'ont AUCUN candidat au-dessus"
        )


if __name__ == "__main__":
    main()
