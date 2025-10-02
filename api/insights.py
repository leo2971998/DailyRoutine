from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query

if __package__:
    from .app.db import get_db
    from .app.services.gemini_client import (
        GeminiConfigurationError,
        GeminiGenerationError,
        generate_insight,
    )
    from .app.services.insight_facts import build_daily_facts, build_monthly_facts
    from .app.utils.broadcast import broadcast_event
    from .app.utils.object_ids import resolve_object_id
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.db import get_db
    from app.services.gemini_client import (  # type: ignore
        GeminiConfigurationError,
        GeminiGenerationError,
        generate_insight,
    )
    from app.services.insight_facts import build_daily_facts, build_monthly_facts  # type: ignore
    from app.utils.broadcast import broadcast_event  # type: ignore
    from app.utils.object_ids import resolve_object_id  # type: ignore

router = APIRouter(prefix="/insights", tags=["insights"])


def _parse_object_id(value: str, field: str):
    try:
        return resolve_object_id(value, field)
    except ValueError as exc:  # pragma: no cover - defensive guard
        raise HTTPException(status_code=400, detail=f"Invalid {field}") from exc


def _hash_facts(facts: Dict[str, Any]) -> str:
    canonical = json.dumps(facts, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _cache_id(user_id: str, mode: str, key: str) -> str:
    return f"{user_id}:{mode}:{key}"


def _ensure_payload(value: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(value, dict):
        raise HTTPException(status_code=502, detail="Gemini returned an invalid payload")
    return value


@router.get("/daily")
async def daily_insight(
    user_id: str = Query(..., description="User ID"),
    date: str | None = Query(None, description="ISO date for the insight (defaults to today)"),
    force: bool = Query(False, description="Force regeneration even if cached"),
) -> Dict[str, Any]:
    db = get_db()
    user_oid = _parse_object_id(user_id, "user_id")

    if date:
        try:
            reference = datetime.fromisoformat(date)
        except ValueError as exc:  # pragma: no cover - defensive guard
            raise HTTPException(status_code=400, detail="Invalid date format") from exc
    else:
        reference = datetime.utcnow()

    facts = await build_daily_facts(db, user_oid, reference)
    facts_hash = _hash_facts(facts)
    cache_key = facts.get("day") or reference.date().isoformat()
    cache_id = _cache_id(str(user_oid), "daily", cache_key)

    cache = db.insights
    cached = await cache.find_one({"_id": cache_id})
    if cached and not force and cached.get("facts_hash") == facts_hash:
        payload = cached.get("payload")
        if isinstance(payload, dict):
            return payload

    try:
        payload = await generate_insight(facts, "daily")
    except GeminiConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except GeminiGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    payload = _ensure_payload(payload)
    now = datetime.utcnow()

    await cache.update_one(
        {"_id": cache_id},
        {
            "$set": {
                "payload": payload,
                "facts_hash": facts_hash,
                "facts": facts,
                "ts": now,
            }
        },
        upsert=True,
    )

    await broadcast_event(
        "insight_generated",
        {"mode": "daily", "user_id": str(user_oid), "payload": payload, "facts": facts},
    )

    return payload


@router.get("/monthly")
async def monthly_insight(
    user_id: str = Query(..., description="User ID"),
    month: str | None = Query(None, description="Month in YYYY-MM format"),
    force: bool = Query(False, description="Force regeneration even if cached"),
) -> Dict[str, Any]:
    db = get_db()
    user_oid = _parse_object_id(user_id, "user_id")

    if month:
        try:
            reference = datetime.fromisoformat(month + "-01")
        except ValueError as exc:  # pragma: no cover - defensive guard
            raise HTTPException(status_code=400, detail="Invalid month format") from exc
    else:
        reference = datetime.utcnow()

    facts = await build_monthly_facts(db, user_oid, reference)
    facts_hash = _hash_facts(facts)
    cache_key = facts.get("month")
    if not isinstance(cache_key, str):
        cache_key = reference.strftime("%Y-%m")
    cache_id = _cache_id(str(user_oid), "monthly", cache_key)

    cache = db.insights
    cached = await cache.find_one({"_id": cache_id})
    if cached and not force and cached.get("facts_hash") == facts_hash:
        payload = cached.get("payload")
        if isinstance(payload, dict):
            return payload

    try:
        payload = await generate_insight(facts, "monthly")
    except GeminiConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except GeminiGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    payload = _ensure_payload(payload)
    now = datetime.utcnow()

    await cache.update_one(
        {"_id": cache_id},
        {
            "$set": {
                "payload": payload,
                "facts_hash": facts_hash,
                "facts": facts,
                "ts": now,
            }
        },
        upsert=True,
    )

    await broadcast_event(
        "insight_generated",
        {"mode": "monthly", "user_id": str(user_oid), "payload": payload, "facts": facts},
    )

    return payload


__all__ = ["router"]
