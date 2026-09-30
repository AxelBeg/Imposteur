"""
Outil de test/inspection pour valider la pertinence du score de similarite
entre films (voir movie_similarity.py), avant de calibrer des seuils de
niveaux et de generer un similarity_data.json pour le theme "films".

Usage:
    python inspect_movie_similarity.py "Tenet"
    python inspect_movie_similarity.py "Tenet" --compare "Les Dents de la mer"
    python inspect_movie_similarity.py "Tenet" --top 15
"""

import argparse
import json
import os
import sys

from movie_similarity import (
    build_keyword_weights,
    build_similarity_matrix,
    movie_pair_score,
    prune_rare_keywords,
)

# Evite les UnicodeEncodeError sur un terminal Windows dont l'encodage par
# defaut (cp1252) ne couvre pas tous les caracteres accentues/speciaux des
# titres de films.
sys.stdout.reconfigure(encoding="utf-8")

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_INPUT = os.path.join(SCRIPT_DIR, "raw_movies_tmdb.json")


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("title", help="Titre (ou debut de titre) du film de reference")
    parser.add_argument("--compare", help="Titre d'un second film a comparer directement")
    parser.add_argument("--top", type=int, default=10, help="Nombre de films les plus proches a afficher")
    parser.add_argument("--input", default=DEFAULT_INPUT, help="Chemin du dump JSON de metadonnees TMDb")
    return parser.parse_args()


def find_movie(movies, query):
    query_lower = query.strip().lower()
    exact = [m for m in movies if m["title"].strip().lower() == query_lower]
    if exact:
        return exact[0]
    partial = [m for m in movies if query_lower in m["title"].strip().lower()]
    if len(partial) == 1:
        return partial[0]
    if len(partial) > 1:
        titles = ", ".join(m["title"] for m in partial)
        raise SystemExit(f"Plusieurs films correspondent a '{query}' : {titles}. Precise le titre exact.")
    raise SystemExit(f"Aucun film trouve pour '{query}'.")


def describe(movie):
    directors = ", ".join(movie["directors"]) or "?"
    genres = ", ".join(movie["genres"]) or "?"
    movie_count = movie.get("movie_count", 1)
    suffix = f" [{movie_count} episodes]" if movie_count > 1 else ""
    return f"{movie['title']}{suffix} - realisateur: {directors} - genres: {genres}"


def main():
    args = parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        movies = json.load(f)
    # Applique le meme elagage des mots-cles rares que build_similarity_matrix,
    # pour que le score affiche via --compare (calcul direct movie_pair_score,
    # hors matrice) soit coherent avec le classement top N ci-dessous.
    movies = prune_rare_keywords(movies)

    reference = find_movie(movies, args.title)
    print(f"Film de reference : {describe(reference)}\n")

    if args.compare:
        other = find_movie(movies, args.compare)
        keyword_weights = build_keyword_weights(movies)
        score = movie_pair_score(reference, other, keyword_weights)
        print(f"Comparaison avec : {describe(other)}")
        print(f"Score de similarite : {score:.2f} / 100\n")

    titles = [m["title"] for m in movies]
    ref_index = titles.index(reference["title"])
    matrix = build_similarity_matrix(movies)

    ranked = sorted(
        ((score, i) for i, score in enumerate(matrix[ref_index]) if i != ref_index),
        reverse=True,
    )

    print(f"Top {args.top} des films les plus proches de '{reference['title']}' :")
    for score, i in ranked[: args.top]:
        print(f"  {score:6.2f}  {describe(movies[i])}")


if __name__ == "__main__":
    main()
