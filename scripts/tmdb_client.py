"""
Petit client pour l'API TMDb (The Movie Database), utilise pour recuperer la
liste des films populaires et leurs metadonnees (genres, realisateur,
acteurs, mots-cles) qui serviront a calculer une similarite entre films
(voir generate_movie_similarity_data.py).

La cle API est lue depuis la variable d'environnement TMDB_API_KEY (ou
tmdb_api_key), chargee automatiquement depuis le fichier .env a la racine du
projet via python-dotenv. Ce fichier ne doit jamais etre commite (voir
.gitignore).

Doc API : https://developer.themoviedb.org/reference/intro/getting-started
"""

import os
import time

import requests
from dotenv import load_dotenv

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.join(SCRIPT_DIR, "..")

load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

API_KEY = os.environ.get("TMDB_API_KEY") or os.environ.get("tmdb_api_key")
BASE_URL = "https://api.themoviedb.org/3"
DEFAULT_LANGUAGE = "fr-FR"

MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2


def _require_api_key():
    if not API_KEY:
        raise RuntimeError(
            "Cle API TMDb introuvable. Ajoute tmdb_api_key=... (ou "
            "TMDB_API_KEY=...) dans un fichier .env a la racine du projet."
        )


def _get(path, params=None):
    _require_api_key()
    url = f"{BASE_URL}{path}"
    query = {"api_key": API_KEY, "language": DEFAULT_LANGUAGE}
    if params:
        query.update(params)

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        response = requests.get(url, params=query, timeout=15)
        if response.status_code == 429:
            retry_after = float(response.headers.get("Retry-After", RETRY_DELAY_SECONDS))
            time.sleep(retry_after)
            last_error = RuntimeError("Rate limited (429)")
            continue
        if response.status_code >= 500:
            time.sleep(RETRY_DELAY_SECONDS * attempt)
            last_error = RuntimeError(f"Erreur serveur TMDb ({response.status_code})")
            continue

        response.raise_for_status()
        return response.json()

    raise last_error or RuntimeError("Echec de la requete TMDb")


def search_movie(title, year=None):
    """Cherche un film par titre (et annee de sortie optionnelle, pour
    desambiguer les remakes/homonymes, ex: 'Le Comte de Monte-Cristo' 1954
    vs 2024). Retourne l'id TMDb du resultat le plus populaire, ou None.

    On ne prend pas simplement le premier resultat : TMDb classe parfois en
    tete une fiche obscure (ex: une reprise en salle mal indexee, avec un
    sous-titre different) juste parce que son titre correspond plus
    litteralement a la requete, alors qu'une fiche bien plus populaire
    (le vrai film) existe aussi dans les resultats. On privilegie donc la
    popularite parmi les resultats retournes."""
    params = {"query": title, "include_adult": "false"}
    if year:
        params["primary_release_year"] = year
    data = _get("/search/movie", params)
    results = data.get("results", [])
    if not results:
        return None
    best = max(results, key=lambda r: r.get("popularity") or 0)
    return best["id"]


def discover_movie_page(page, min_vote_count=1000):
    """Recupere une page de films tries par nombre de votes (via
    /discover/movie), du plus vote au moins vote.

    On trie par vote_count (nombre total de notes accumulees sur toute la
    duree de vie du film) plutot que par le champ "popularity" de TMDb :
    "popularity" est un score de tendance temps reel (base sur les vues/
    recherches recentes, favoris ajoutes ces derniers jours...), qui met
    en avant des sorties tres recentes ou qui font l'actualite meme si
    elles restent confidentielles, au detriment de films realement connus
    du grand public. vote_count, cumule sur la duree, est un bien meilleur
    indicateur de notoriete etablie/durable (proche de l'idee de succes en
    salle). On garde aussi un seuil minimum (min_vote_count) comme filet de
    securite pour les pages profondes.

    Retourne {"ids": [...], "total_pages": int}."""
    data = _get(
        "/discover/movie",
        {
            "page": page,
            "sort_by": "vote_count.desc",
            "vote_count.gte": min_vote_count,
            "include_adult": "false",
        },
    )
    ids = [movie["id"] for movie in data.get("results", [])]
    return {"ids": ids, "total_pages": data.get("total_pages", page)}


# TMDb renvoie des noms de collection differents selon la langue : en
# francais (fr-FR) le suffixe est generalement " - Saga" (ex: "Harry Potter
# - Saga"), en anglais ce serait plutot " Collection".
_COLLECTION_SUFFIXES = (" - saga", " saga", " collection")


def clean_collection_name(name):
    """Nettoie le nom d'une collection TMDb (ex: 'Harry Potter - Saga'
    -> 'Harry Potter') pour l'utiliser comme nom de licence affichable."""
    cleaned = name.strip()
    lowered = cleaned.lower()
    for suffix in _COLLECTION_SUFFIXES:
        if lowered.endswith(suffix):
            cleaned = cleaned[: -len(suffix)].strip()
            break
    return cleaned


def get_movie_details(movie_id):
    """Recupere titre, genres, mots-cles, realisateur, casting principal et
    licence (collection TMDb, ex: 'Harry Potter') d'un film.

    licence_key/licence_name permettent de regrouper tous les episodes d'une
    meme franchise (ex: les 8 films Harry Potter) en une seule entree cote
    jeu, plutot que d'avoir des paires "trop faciles" comme Harry Potter 1
    vs Harry Potter 2."""
    data = _get(f"/movie/{movie_id}", {"append_to_response": "credits,keywords"})

    crew = data.get("credits", {}).get("crew", [])
    directors = [person["name"] for person in crew if person.get("job") == "Director"]

    cast = data.get("credits", {}).get("cast", [])
    top_cast = [person["name"] for person in sorted(cast, key=lambda p: p.get("order", 999))[:8]]

    keywords = [kw["name"] for kw in data.get("keywords", {}).get("keywords", [])]

    title = data.get("title") or data.get("original_title")
    collection = data.get("belongs_to_collection")
    if collection:
        licence_key = f"collection:{collection['id']}"
        licence_name = clean_collection_name(collection["name"])
    else:
        licence_key = f"movie:{data['id']}"
        licence_name = title

    return {
        "id": data["id"],
        "title": title,
        "original_title": data.get("original_title"),
        "release_date": data.get("release_date"),
        "genres": [g["name"] for g in data.get("genres", [])],
        "keywords": keywords,
        "directors": directors,
        "cast": top_cast,
        "popularity": data.get("popularity"),
        "vote_average": data.get("vote_average"),
        "vote_count": data.get("vote_count"),
        "licence_key": licence_key,
        "licence_name": licence_name,
    }
