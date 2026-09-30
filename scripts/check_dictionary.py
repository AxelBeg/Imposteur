"""
Verifie que chaque mot des listes de themes existe dans un dictionnaire
francais (Hunspell Dicollecte + liste Gutenberg).

Les titres de films sont ignores : ce ne sont pas des entrees de dictionnaire.
Les expressions multi-mots sont acceptees si chaque mot porteur existe
(ex: "saut en hauteur"). Les formes inclusives "infirmier·ere" sont
validees sur le radical masculin.

Usage:
    python check_dictionary.py
"""

from __future__ import annotations

import json
import os
import re
import unicodedata
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
CACHE = SCRIPT_DIR / ".cache" / "dict"
THEMES_DIR = ROOT / "assets" / "data" / "themes"

SKIP_THEMES = {"films"}
STOPWORDS = {
    "de",
    "du",
    "des",
    "d",
    "la",
    "le",
    "les",
    "l",
    "un",
    "une",
    "et",
    "ou",
    "sur",
    "en",
    "au",
    "aux",
    "a",
    "à",
    "d'",
    "l'",
}


def nfc(text: str) -> str:
    return unicodedata.normalize("NFC", text).strip().lower()


def load_hunspell(path: Path) -> set[str]:
    words: set[str] = set()
    with path.open(encoding="utf-8", errors="replace") as handle:
        next(handle, None)
        for line in handle:
            token = line.strip()
            if not token:
                continue
            stem = token.split("/")[0]
            stem = nfc(stem)
            if stem and not stem.startswith(("1", "2", "3", "4", "5", "6", "7", "8", "9")):
                words.add(stem)
    return words


def load_wordlist(path: Path) -> set[str]:
    words: set[str] = set()
    with path.open(encoding="utf-8", errors="replace") as handle:
        for line in handle:
            word = nfc(line)
            if word:
                words.add(word)
    return words


def load_dictionary() -> set[str]:
    words: set[str] = set()
    hunspell = CACHE / "dictionary-fr.dic"
    gut = CACHE / "frgut.txt"
    if hunspell.exists():
        words |= load_hunspell(hunspell)
    if gut.exists():
        words |= load_wordlist(gut)
    return words


def dictionary_keys(word: str) -> list[str]:
    """Formes a chercher pour une entree de jeu."""
    word = nfc(word.replace("’", "'"))
    if "·" in word:
        masculine = word.split("·", 1)[0]
        return [masculine] if masculine else []
    return [word]


def content_tokens(phrase: str) -> list[str]:
    parts = re.split(r"[\s\-'’]+", nfc(phrase.replace("’", "'")))
    tokens = []
    for part in parts:
        part = part.strip("'")
        if not part or part in STOPWORDS:
            continue
        if part.isdigit():
            continue
        tokens.append(part)
    return tokens


def lookup(entry: str, dictionary: set[str]) -> tuple[bool, str]:
    keys = dictionary_keys(entry)
    if keys and all(key in dictionary for key in keys):
        return True, "exact"

    tokens = content_tokens(entry)
    if len(tokens) > 1 and all(token in dictionary for token in tokens):
        return True, "phrase"
    if len(tokens) == 1 and tokens[0] in dictionary:
        return True, "token"

    return False, "missing"


def load_theme_words() -> dict[str, list[str]]:
    by_theme: dict[str, list[str]] = {}
    for words_path in sorted(THEMES_DIR.glob("*/words.json")):
        theme_id = words_path.parent.name
        if theme_id in SKIP_THEMES:
            continue
        by_theme[theme_id] = json.loads(words_path.read_text(encoding="utf-8"))
    return by_theme


def main() -> None:
    dictionary = load_dictionary()
    themes = load_theme_words()
    report = {
        "dictionary_size": len(dictionary),
        "skipped_themes": sorted(SKIP_THEMES),
        "themes": {},
        "missing": [],
    }

    for theme_id, words in themes.items():
        missing = []
        phrase_ok = 0
        for word in words:
            found, how = lookup(word, dictionary)
            if found:
                if how == "phrase":
                    phrase_ok += 1
                continue
            missing.append(word)

        report["themes"][theme_id] = {
            "total": len(words),
            "missing_count": len(missing),
            "phrase_accepted": phrase_ok,
            "missing": missing,
        }
        for word in missing:
            report["missing"].append({"theme": theme_id, "word": word})

    out_path = CACHE / "dictionary_check.json"
    out_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
