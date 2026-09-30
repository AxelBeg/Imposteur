"""
Script one-shot : recupere depuis TMDb les films FRANCAIS ayant realise le
plus d'entrees (admissions) au box-office francais de tous les temps (liste
curee manuellement a partir du classement JP Box-Office / CNC, cf.
CANDIDATE_TITLES ci-dessous), les regroupe par licence comme
fetch_movies_tmdb.py (ex: les Astérix, les Taxi, les Le Gendarme...), et
FUSIONNE le resultat avec scripts/raw_movies_tmdb.json existant (qui
contient les films internationaux les plus populaires).

TMDb n'expose pas la statistique "entrees salles France" (specifique au
marche francais, suivie par le CNC) : on part donc d'un classement externe
verifie (nombre d'entrees reelles), puis on recherche chaque titre sur TMDb
pour recuperer ses metadonnees (genres, mots-cles, realisateur, casting,
collection).

Usage:
    python fetch_french_movies_tmdb.py [--count 50] [--target films/similarity_data.json's raw_movies_tmdb.json]
"""

import argparse
import json
import os

from movie_licences import canonicalize_licence, dedupe_by_title, merge_licence
from tmdb_client import get_movie_details, search_movie

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_RAW_PATH = os.path.join(SCRIPT_DIR, "raw_movies_tmdb.json")
WORDS_OUTPUT = os.path.join(SCRIPT_DIR, "..", "assets", "data", "themes", "films", "words.json")

DEFAULT_COUNT = 50

# Films francais classes par nombre d'entrees en France (source : JP
# Box-Office / classement CNC, reprises incluses), du plus grand nombre
# d'entrees au plus petit. Liste volontairement plus longue que
# DEFAULT_COUNT : plusieurs de ces films appartiennent a la meme licence
# (Astérix, Taxi, Le Gendarme, Don Camillo...) et fusionnent en une seule
# entree, donc il faut plus de 50 titres bruts pour obtenir 50 licences
# distinctes.
CANDIDATE_TITLES = [
    ("Bienvenue chez les Ch'tis", 2008),
    ("Intouchables", 2011),
    ("La Grande Vadrouille", 1966),
    ("Astérix et Obélix : Mission Cléopâtre", 2002),
    ("Les Visiteurs", 1993),
    ("Le Petit Monde de Don Camillo", 1952),
    ("Qu'est-ce qu'on a fait au Bon Dieu ?", 2014),
    ("Le Corniaud", 1965),
    ("Un p'tit truc en plus", 2024),
    ("Les Bronzés 3 : Amis pour la vie", 2006),
    ("Taxi 2", 2000),
    ("Trois hommes et un couffin", 1985),
    ("Les Misérables", 1958),
    ("La Guerre des boutons", 1962),
    ("Le Comte de Monte-Cristo", 2024),
    ("Le Dîner de cons", 1998),
    ("Le Grand Bleu", 1988),
    ("L'Ours", 1988),
    ("Astérix et Obélix contre César", 1999),
    ("Emmanuelle", 1974),
    ("La Vache et le Prisonnier", 1959),
    ("Bataillon du ciel", 1947),
    ("Le Fabuleux Destin d'Amélie Poulain", 2001),
    ("Les Choristes", 2004),
    ("Rien à déclarer", 2010),
    ("Violettes impériales", 1952),
    ("Les Couloirs du temps : Les Visiteurs II", 1998),
    ("Un Indien dans la ville", 1994),
    ("La Vérité si je mens ! 2", 2001),
    ("Le Gendarme de Saint-Tropez", 1964),
    ("Le Comte de Monte-Cristo", 1954),
    ("Le Cinquième Élément", 1997),
    ("Les Bidasses en folie", 1971),
    ("La Famille Bélier", 2014),
    ("Le Retour de Don Camillo", 1953),
    ("Les Aventures de Rabbi Jacob", 1973),
    ("Jean de Florette", 1986),
    ("La Chèvre", 1981),
    ("Monsieur Vincent", 1947),
    ("Les Grandes Vacances", 1967),
    ("Si Versailles m'était conté", 1953),
    ("Le Salaire de la peur", 1953),
    ("Les Trois Frères", 1995),
    ("Michel Strogoff", 1956),
    ("Le Gendarme se marie", 1968),
    ("Astérix aux Jeux olympiques", 2008),
    ("Jour de fête", 1949),
    ("Fanfan la Tulipe", 1952),
    ("Qu'est-ce qu'on a encore fait au Bon Dieu ?", 2019),
    ("Manon des sources", 1986),
    ("Taxi", 1998),
    ("Arthur et les Minimoys", 2006),
    ("La Cuisine au beurre", 1963),
    ("La Gloire de mon père", 1990),
    ("Le Gendarme et les extra-terrestres", 1979),
    ("Marche à l'ombre", 1984),
    ("Germinal", 1993),
    ("Taxi 3", 2003),
    ("Les Ripoux", 1984),
    ("L'Aile ou la Cuisse", 1976),
    ("Le Bossu", 1959),
    ("Les Anges gardiens", 1995),
    ("Les Valseuses", 1974),
    ("La Vérité", 1960),
    ("Notre-Dame de Paris", 1956),
    ("Les Tuche 3", 2018),
    ("La Ch'tite famille", 2018),
    ("La Folie des grandeurs", 1971),
    ("Le Cerveau", 1969),
    ("Quai des Orfèvres", 1947),
    ("Le Petit Nicolas", 2009),
    ("Le Gendarme à New York", 1965),
    ("Camping", 2006),
    ("Les Petits Mouchoirs", 2010),
    ("L'As des as", 1982),
    ("La Cage aux folles", 1978),
    ("Napoléon", 1955),
]


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--count",
        type=int,
        default=DEFAULT_COUNT,
        help="Nombre de licences francaises distinctes a ajouter",
    )
    parser.add_argument(
        "--raw-path",
        default=DEFAULT_RAW_PATH,
        help="Fichier raw_movies_tmdb.json existant a completer",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    print(f"Recherche de {args.count} licences de films francais (classees par entrees)...")
    movies_by_licence = {}
    not_found = []

    for title, year in CANDIDATE_TITLES:
        if len(movies_by_licence) >= args.count:
            break
        movie_id = search_movie(title, year)
        if movie_id is None:
            not_found.append(f"{title} ({year})")
            continue
        details = get_movie_details(movie_id)
        details["licence_key"], details["licence_name"] = canonicalize_licence(
            details["licence_key"], details["licence_name"]
        )
        movies_by_licence.setdefault(details["licence_key"], []).append(details)
        print(f"  {title} ({year}) -> licence '{details['licence_name']}'")

    if not_found:
        print(f"Introuvables sur TMDb ({len(not_found)}) : {', '.join(not_found)}")

    new_licences = [merge_licence(movies) for movies in movies_by_licence.values()]
    new_licences = new_licences[: args.count]
    multi_episode_count = sum(1 for l in new_licences if l["movie_count"] > 1)
    print(
        f"{len(new_licences)} licences francaises retenues, dont {multi_episode_count} "
        f"regroupent plusieurs episodes."
    )

    with open(args.raw_path, "r", encoding="utf-8") as f:
        existing_licences = json.load(f)
    print(f"{len(existing_licences)} licences existantes chargees depuis {args.raw_path}")

    combined = dedupe_by_title(existing_licences + new_licences)
    removed = len(existing_licences) + len(new_licences) - len(combined)
    if removed:
        print(f"{removed} licence(s) retiree(s) pour cause de nom en doublon (existant vs francais).")

    with open(args.raw_path, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)
    print(f"{len(combined)} licences au total ecrites dans {os.path.abspath(args.raw_path)}")

    titles = [licence["title"] for licence in combined]
    os.makedirs(os.path.dirname(WORDS_OUTPUT), exist_ok=True)
    with open(WORDS_OUTPUT, "w", encoding="utf-8") as f:
        json.dump(titles, f, ensure_ascii=False, indent=2)
    print(f"{len(titles)} titres ecrits dans {os.path.abspath(WORDS_OUTPUT)}")


if __name__ == "__main__":
    main()
