from __future__ import annotations

import os
from pathlib import Path

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
