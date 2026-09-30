"""
Script one-shot : recupere depuis TMDb les films les plus populaires,
regroupe ceux qui appartiennent a la meme licence/franchise (ex: les 8
films Harry Potter, les Spider-Man, etc. via le champ "belongs_to_collection"
de TMDb) en une seule entree, et ecrit :

  - scripts/raw_movies_tmdb.json : dump complet des metadonnees par licence
    (genres/mots-cles/realisateurs/casting fusionnes sur tous les episodes)
    (source de verite committee, pour pouvoir regenerer la similarite sans
    re-interroger l'API).
  - assets/data/themes/films/words.json : liste plate des noms de licences
    (au meme format que les autres themes), dedupliquee.

On regroupe par licence plutot que de garder chaque episode separement car
sinon deux films de la meme saga (ex: Harry Potter 1 et Harry Potter 2) se
retrouvent quasi-identiques niveau metadonnees (meme realisateur/genres/
casting) et finissent systematiquement matches en "tres proche", ce qui est
un match trivial/inintéressant pour le jeu.

Usage:
    python fetch_movies_tmdb.py [--count 100] [--min-vote-count 1000] [--output raw_movies_tmdb.json]
"""

import argparse
import json
import os

from movie_licences import canonicalize_licence, dedupe_by_title, merge_licence
from tmdb_client import discover_movie_page, get_movie_details

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUTPUT = os.path.join(SCRIPT_DIR, "raw_movies_tmdb.json")
WORDS_OUTPUT = os.path.join(SCRIPT_DIR, "..", "assets", "data", "themes", "films", "words.json")

DEFAULT_COUNT = 100
DEFAULT_MAX_PAGES = 40


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--count",
        type=int,
        default=DEFAULT_COUNT,
        help="Nombre de licences/films distincts a recuperer",
    )
    parser.add_argument(
        "--output",
        default=DEFAULT_OUTPUT,
        help="Chemin du fichier de sortie (dump complet des metadonnees)",
    )
    parser.add_argument(
        "--min-vote-count",
        type=int,
        default=2000,
        help="Nombre minimum de votes TMDb pour qu'un film soit considere comme 'connu'",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=DEFAULT_MAX_PAGES,
        help="Nombre max de pages TMDb (20 films/page) a parcourir pour atteindre --count licences",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    print(f"Recherche de {args.count} licences de films connues depuis TMDb...")
    movies_by_licence = {}
    seen_movie_ids = set()
    page = 1
    while len(movies_by_licence) < args.count and page <= args.max_pages:
        page_data = discover_movie_page(page, min_vote_count=args.min_vote_count)
        ids = page_data["ids"]
        if not ids:
            break

        for movie_id in ids:
            if movie_id in seen_movie_ids:
                continue
            seen_movie_ids.add(movie_id)
            details = get_movie_details(movie_id)
            details["licence_key"], details["licence_name"] = canonicalize_licence(
                details["licence_key"], details["licence_name"]
            )
            movies_by_licence.setdefault(details["licence_key"], []).append(details)

        print(
            f"  page {page}/{page_data['total_pages']} : {len(seen_movie_ids)} films "
            f"traites, {len(movies_by_licence)} licences distinctes"
        )

        if page >= page_data["total_pages"]:
            break
        page += 1

    licences = [merge_licence(movies) for movies in movies_by_licence.values()]
    # Tri par vote_count cumule (notoriete etablie/durable) plutot que par
    # popularity (score de tendance recente, voir discover_movie_page) : on
    # veut les films les plus connus dans la duree, pas les plus "buzz" du
    # moment.
    licences.sort(key=lambda l: l["vote_count"], reverse=True)
    licences = licences[: args.count]

    deduped = dedupe_by_title(licences)
    removed = len(licences) - len(deduped)
    if removed:
        print(f"{removed} licence(s) retiree(s) pour cause de nom en doublon.")

    multi_episode_count = sum(1 for l in deduped if l["movie_count"] > 1)
    print(
        f"{len(deduped)} licences retenues, dont {multi_episode_count} regroupent "
        f"plusieurs episodes."
    )

    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(deduped, f, ensure_ascii=False, indent=2)
    print(f"Metadonnees ecrites dans {os.path.abspath(args.output)}")

    titles = [licence["title"] for licence in deduped]
    os.makedirs(os.path.dirname(WORDS_OUTPUT), exist_ok=True)
    with open(WORDS_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(titles, f, ensure_ascii=False, indent=2)
    print(f"{len(titles)} titres ecrits dans {os.path.abspath(WORDS_OUTPUT)}")


if __name__ == "__main__":
    main()
