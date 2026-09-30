"""
Logique partagee de regroupement de films par licence/franchise (via le
champ belongs_to_collection de TMDb, voir tmdb_client.get_movie_details),
utilisee par fetch_movies_tmdb.py et fetch_french_movies_tmdb.py.

On regroupe par licence plutot que de garder chaque episode separement car
sinon deux films de la meme saga (ex: Harry Potter 1 et Harry Potter 2) se
retrouvent quasi-identiques niveau metadonnees et finissent systematiquement
matches en "tres proche", ce qui est un match trivial/inintéressant pour le
jeu.
"""

MAX_CAST_SIZE = 15

# Certains personnages ont plusieurs continuites/reboots totalement
# independants au sens de TMDb (chacun a sa propre "collection" : trilogie
# Sam Raimi vs MCU vs "Amazing" vs film d'animation pour Spider-Man, trilogie
# Nolan vs reboot Matt Reeves pour Batman...). Sans ce mapping, ces licences
# resteraient separees et le meme personnage se retrouverait plusieurs fois
# dans la liste de films du jeu : par exemple, avoir 4 licences "Spider-Man"
# distinctes donne 4x plus de chances de tirer "un Spider-Man" au hasard
# qu'un personnage qui n'a qu'une seule licence, ce qui biaise le jeu.
#
# Cle = version en minuscules du nom de licence tel que calcule par
# tmdb_client.get_movie_details (titre du film si episode isole, nom de
# collection nettoye sinon). Valeur = nom canonique du personnage/franchise
# a utiliser a la place, partage par toutes les continuites.
FRANCHISE_ALIASES = {
    "spider-man (mcu)": "Spider-Man",
    "spider-man": "Spider-Man",
    "the amazing spider-man": "Spider-Man",
    "spider-man : new generation": "Spider-Man",
    "spider-man : across the spider-verse": "Spider-Man",
    "the dark knight": "Batman",
    "the batman": "Batman",
    "batman": "Batman",
    "batman begins": "Batman",
    "man of steel": "Superman",
    "superman (dcu)": "Superman",
    "superman": "Superman",
    "godzilla": "Godzilla",
    "godzilla (monsterverse)": "Godzilla",
    "king kong": "King Kong",
    "kong: skull island": "King Kong",
    "la momie": "La Momie",
    "le réveil de la momie": "La Momie",
    "halloween": "Halloween",
    "halloween (reboot)": "Halloween",
    "ghostbusters": "SOS Fantômes",
    "sos fantômes": "SOS Fantômes",
    "star trek": "Star Trek",
    "la planète des singes": "La Planète des singes",
    "les évadés de la planète des singes": "La Planète des singes",
    "terminator": "Terminator",
    "les 4 fantastiques": "Les 4 Fantastiques",
    "les 4 fantastiques : premiers pas": "Les 4 Fantastiques",
    "hulk": "Hulk",
}


def canonicalize_licence(licence_key, licence_name):
    """Si licence_name correspond a un alias connu (voir FRANCHISE_ALIASES),
    retourne une cle/nom communs a toutes les continuites de ce personnage,
    afin qu'elles fusionnent en une seule licence lors du regroupement."""
    canonical = FRANCHISE_ALIASES.get(licence_name.strip().lower())
    if canonical is None:
        return licence_key, licence_name
    return f"character:{canonical.lower()}", canonical


def _single_episode_title(movie):
    """Determine le titre a afficher quand une seule entree a ete recuperee
    pour une licence (voir merge_licence).

    Deux cas problematiques a arbitrer :
    - Le nom de collection TMDb est parfois un nom "technique"/peu
      reconnaissable sans lien evident avec le titre du film (ex: TMDb
      associe "Bienvenue chez les Ch'tis" a une collection nommee
      "Les Ch'tits") : dans ce cas, le titre du film est plus fiable.
    - A l'inverse, quand la licence n'a qu'un episode parce que les autres
      volets n'ont pas ete recuperes (pas assez populaires), le titre du
      film peut lui-meme contenir un sous-titre de suite qui le rend moins
      reconnaissable que le nom de la licence (ex: le film s'appelle
      "Doctor Strange in the Multiverse of Madness" mais la licence/le
      personnage s'appelle simplement "Doctor Strange"). On detecte ce cas
      en verifiant que le titre du film commence bien par le nom de la
      licence : c'est un signe que ce nom est un vrai raccourci du titre
      (donc fiable), pas une reinterpretation TMDb sans rapport."""
    movie_title = movie["title"]
    licence_name = movie.get("licence_name") or movie_title
    if licence_name != movie_title and movie_title.lower().startswith(licence_name.lower()):
        return licence_name
    return movie_title


def merge_licence(movies):
    """Fusionne plusieurs episodes d'une meme licence en une seule entree :
    union des genres/mots-cles/realisateurs, casting le plus recurrent, et
    popularite cumulee (utilisee pour classer/tronquer les licences).

    Si plusieurs episodes ont ete fusionnes, on garde le nom de la licence
    (nom de collection TMDb nettoye, ou nom canonique si un alias de
    FRANCHISE_ALIASES a ete applique) : avec plusieurs episodes confirmes,
    ce nom est fiable. Sinon, voir _single_episode_title."""
    representative = max(movies, key=lambda m: m.get("popularity") or 0)
    title = representative["licence_name"] if len(movies) > 1 else _single_episode_title(representative)

    genres = set()
    keywords = set()
    directors = set()
    cast_stats = {}
    total_popularity = 0.0
    total_vote_count = 0
    for movie in movies:
        genres.update(movie["genres"])
        keywords.update(movie["keywords"])
        directors.update(movie["directors"])
        total_popularity += movie.get("popularity") or 0
        total_vote_count += movie.get("vote_count") or 0
        for order, name in enumerate(movie["cast"]):
            stats = cast_stats.setdefault(name, {"count": 0, "best_order": order})
            stats["count"] += 1
            stats["best_order"] = min(stats["best_order"], order)

    cast = sorted(
        cast_stats.keys(),
        key=lambda name: (-cast_stats[name]["count"], cast_stats[name]["best_order"]),
    )[:MAX_CAST_SIZE]

    return {
        "id": representative["id"],
        "title": title,
        "genres": sorted(genres),
        "keywords": sorted(keywords),
        "directors": sorted(directors),
        "cast": cast,
        "popularity": total_popularity,
        "vote_count": total_vote_count,
        "movie_count": len(movies),
        "episodes": sorted(m["title"] for m in movies),
    }


def dedupe_by_title(licences):
    """Filet de securite si deux licences distinctes partagent le meme nom
    nettoye : on ne garde que la plus connue (vote_count cumule le plus
    eleve)."""
    best_by_title = {}
    for licence in licences:
        key = licence["title"].strip().lower()
        current = best_by_title.get(key)
        if current is None or licence.get("vote_count", 0) > current.get("vote_count", 0):
            best_by_title[key] = licence
    return list(best_by_title.values())
