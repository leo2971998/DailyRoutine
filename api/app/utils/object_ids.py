from __future__ import annotations

from typing import Dict

from bson import ObjectId

from ..config import DEMO_USER_ALIASES


class InvalidObjectId(ValueError):
    """Raised when a value cannot be resolved to a valid ObjectId."""


def _normalize_aliases(mapping: Dict[str, str]) -> Dict[str, str]:
    normalized: Dict[str, str] = {}
    for alias, target in mapping.items():
        alias_key = alias.strip()
        target_value = target.strip()
        if not alias_key or not target_value:
            continue
        normalized[alias_key] = target_value
        normalized.setdefault(target_value, target_value)
    return normalized


_ALIAS_MAP = _normalize_aliases(DEMO_USER_ALIASES)


def resolve_object_id(value: str, field: str) -> ObjectId:
    """Resolve a potentially aliased identifier into an ObjectId."""

    candidate = value.strip()
    if not candidate:
        raise InvalidObjectId(f"Missing {field}")

    mapped = _ALIAS_MAP.get(candidate, candidate)
    if ObjectId.is_valid(mapped):
        return ObjectId(mapped)

    raise InvalidObjectId(f"Invalid {field}")


__all__ = ["InvalidObjectId", "resolve_object_id"]
