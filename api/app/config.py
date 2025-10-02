from __future__ import annotations

import os
from pathlib import Path
from typing import Dict

from dotenv import load_dotenv


def _load_env() -> None:
    """Load environment variables from common backend .env locations."""

    base_dir = Path(__file__).resolve().parent
    candidates: list[Path] = [
        base_dir.parent / "schemas" / ".env",  # api/schemas/.env
        base_dir / "schemas" / ".env",  # api/app/schemas/.env (fallback)
        base_dir / ".env",  # api/app/.env
        base_dir.parent / ".env",  # api/.env
        Path.cwd() / ".env",  # project root when running from repo root
    ]

    loaded = False
    seen: set[Path] = set()
    for candidate in candidates:
        resolved = candidate.resolve()
        if resolved in seen or not resolved.exists():
            continue
        load_dotenv(resolved, override=False)
        seen.add(resolved)
        loaded = True

    if not loaded:
        load_dotenv()


_load_env()

MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
# Use your real DB name, or keep default if you made one with that name:
DATABASE_NAME: str = os.getenv("DATABASE_NAME", "dailyroutine")

API_CORS_ORIGINS: list[str] = [
    o.strip()
    for o in os.getenv("API_CORS_ORIGINS", "").split(",")
    if o.strip()
]

GEMINI_API_KEY: str | None = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")


def _parse_alias_map(raw: str) -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    for chunk in raw.split(","):
        if ":" not in chunk:
            continue
        alias, target = chunk.split(":", 1)
        alias_key = alias.strip()
        target_value = target.strip()
        if alias_key and target_value:
            mapping[alias_key] = target_value
    return mapping


_alias_map = _parse_alias_map(os.getenv("DEMO_USER_ALIASES", ""))
if not _alias_map:
    default_alias = os.getenv("DEMO_USER_ALIAS", "wendy")
    default_target = os.getenv("DEMO_USER_ID", "68dcaa1e450fee4dd3d6b17b")
    if default_alias and default_target:
        _alias_map[default_alias] = default_target

for alias, target in list(_alias_map.items()):
    _alias_map.setdefault(target, target)

DEMO_USER_ALIASES: Dict[str, str] = _alias_map

