"""
Calcul de similarite entre films a partir de leurs metadonnees TMDb (voir
fetch_movies_tmdb.py), pour le futur theme "films" du jeu.

Contrairement au theme des mots (similarite lexicale via FastText, voir
generate_similarity_data.py), il n'existe pas de vecteur semantique tout
fait pour un titre de film : "Tenet" et "Inception" n'ont rien de commun
lexicalement. La proximite qu'on veut capturer ici est structurelle : meme
realisateur, genres et themes proches, casting partage. On calcule donc un
score de similarite (0-100) comme une moyenne ponderee de scores de Jaccard
sur chacun de ces attributs.

Le calcul est tres rapide (pas de modele a charger), donc pas besoin de
cache disque comme pour le theme des mots : la matrice est recalculee a
chaque execution.
"""

import numpy as np

# Poids relatifs de chaque type de metadonnee dans le score final (doivent
# sommer a 1). Le realisateur et les mots-cles pesent le plus lourd car ce
# sont les signaux les plus discriminants d'une proximite "thematique" (ex:
# meme univers, meme style de recit) ; le casting pese moins car un acteur
# peut jouer dans des films tres differents.
FEATURE_WEIGHTS = {
    "genres": 0.30,
    "keywords": 0.35,
    "directors": 0.25,
    "cast": 0.10,
}


def jaccard(set_a, set_b):
    union = set_a | set_b
    if not union:
        return 0.0
    return len(set_a & set_b) / len(union)


def prune_rare_keywords(movies, min_document_frequency=2):
    """Retourne une copie de movies dont le champ "keywords" ne garde que les
    mots-cles partages par au moins min_document_frequency films du corpus.

    Un mot-cle qui n'apparait que sur un seul film du corpus ne peut de toute
    facon jamais faire partie d'une intersection avec un autre film : le
    garder ne fait qu'alourdir l'union (denominateur du Jaccard), diluant
    artificiellement le score de similarite sans jamais pouvoir le faire
    remonter. Ce phenomene est surtout sensible pour les licences qui
    fusionnent plusieurs episodes (voir movie_licences.py) : leur vocabulaire
    de mots-cles (union de tous les episodes) est bien plus large que celui
    d'un film seul, donc statistiquement plus touche par cette dilution -
    typiquement deux licences de super-heros tres proches thematiquement
    (ex: Captain America et Batman, toutes deux "superhero"/"based on
    comic") peuvent se retrouver avec un score tres bas juste parce que leurs
    mots-cles annexes/tres specifiques a l'intrigue (ex: "world war ii",
    "nazi" vs "scarecrow", "cat burglar") ne se recoupent jamais et gonflent
    l'union."""
    document_frequency = {}
    for movie in movies:
        for keyword in set(movie["keywords"]):
            document_frequency[keyword] = document_frequency.get(keyword, 0) + 1

    pruned = []
    for movie in movies:
        kept_keywords = [
            kw for kw in movie["keywords"] if document_frequency[kw] >= min_document_frequency
        ]
        pruned.append({**movie, "keywords": kept_keywords})
    return pruned


def build_keyword_weights(movies):
    """Poids d'un mot-cle = son nombre de films porteurs dans le corpus
    (frequence documentaire).

    Sert a calculer un Jaccard pondere sur les mots-cles (voir
    weighted_jaccard) : un mot-cle partage par beaucoup de films du corpus
    (ex: "superhero", "based on comic", present sur une quinzaine de films
    de super-heros) represente une vraie parente de genre/theme et doit
    peser lourd dans la similarite ; un mot-cle rare, propre a l'intrigue
    d'un seul film (ex: "scarecrow", "nazi") n'est qu'un detail de scenario
    et ne doit pas noyer le signal quand on compare deux films dont le
    vocabulaire de mots-cles est volumineux (cas frequent pour les licences
    fusionnant plusieurs episodes, voir movie_licences.py)."""
    weights = {}
    for movie in movies:
        for keyword in set(movie["keywords"]):
            weights[keyword] = weights.get(keyword, 0) + 1
    return weights


def weighted_jaccard(set_a, set_b, weights):
    """Variante du Jaccard ou chaque element de l'union/intersection compte
    pour son poids (voir build_keyword_weights) plutot que pour 1."""
    union = set_a | set_b
    if not union:
        return 0.0
    union_weight = sum(weights.get(x, 1) for x in union)
    if union_weight == 0:
        return 0.0
    intersection_weight = sum(weights.get(x, 1) for x in (set_a & set_b))
    return intersection_weight / union_weight


def movie_pair_score(movie_a, movie_b, keyword_weights=None):
    """Score de similarite (0-100) entre deux films (dicts au format retourne
    par tmdb_client.get_movie_details).

    keyword_weights (optionnel) : poids par mot-cle (voir
    build_keyword_weights), calcule sur l'ensemble du corpus compare. Si
    fourni, la similarite des mots-cles utilise un Jaccard pondere plutot
    qu'un Jaccard simple."""
    genre_sim = jaccard(set(movie_a["genres"]), set(movie_b["genres"]))
    keywords_a, keywords_b = set(movie_a["keywords"]), set(movie_b["keywords"])
    if keyword_weights:
        keyword_sim = weighted_jaccard(keywords_a, keywords_b, keyword_weights)
    else:
        keyword_sim = jaccard(keywords_a, keywords_b)
    director_sim = jaccard(set(movie_a["directors"]), set(movie_b["directors"]))
    cast_sim = jaccard(set(movie_a["cast"]), set(movie_b["cast"]))

    score = (
        FEATURE_WEIGHTS["genres"] * genre_sim
        + FEATURE_WEIGHTS["keywords"] * keyword_sim
        + FEATURE_WEIGHTS["directors"] * director_sim
        + FEATURE_WEIGHTS["cast"] * cast_sim
    )
    return score * 100


def build_similarity_matrix(movies):
    """Matrice NxN des scores de similarite (0-100), diagonale a 0."""
    movies = prune_rare_keywords(movies)
    keyword_weights = build_keyword_weights(movies)
    n = len(movies)
    matrix = np.zeros((n, n), dtype=np.float32)
    for i in range(n):
        for j in range(i + 1, n):
            score = movie_pair_score(movies[i], movies[j], keyword_weights)
            matrix[i, j] = score
            matrix[j, i] = score
    return matrix
