"""Utilities for computing free time windows for scheduling."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import List

from motor.motor_asyncio import AsyncIOMotorDatabase

if __package__:
    from ..utils.object_ids import resolve_object_id
else:  # pragma: no cover
    from app.utils.object_ids import resolve_object_id


def _normalize_datetime(value: datetime) -> datetime:
    """Normalise datetimes to naive UTC for storage comparisons."""

    if value.tzinfo is not None:
        return value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def _round_up(value: datetime, minutes: int) -> datetime:
    """Round ``value`` up to the nearest ``minutes`` boundary."""

    remainder_seconds = (value.minute * 60 + value.second) % (minutes * 60)
    micro_adjust = -value.microsecond
    if remainder_seconds == 0 and micro_adjust == 0:
        return value.replace(microsecond=0)
    delta_seconds = (minutes * 60) - remainder_seconds
    return (value + timedelta(seconds=delta_seconds, microseconds=micro_adjust)).replace(microsecond=0)


def _round_down(value: datetime, minutes: int) -> datetime:
    """Round ``value`` down to the nearest ``minutes`` boundary."""

    micro_adjusted = value - timedelta(microseconds=value.microsecond)
    remainder_seconds = (micro_adjusted.minute * 60 + micro_adjusted.second) % (minutes * 60)
    if remainder_seconds == 0:
        return micro_adjusted
    return micro_adjusted - timedelta(seconds=remainder_seconds)


def _merge_ranges(ranges: List[tuple[datetime, datetime]]) -> List[tuple[datetime, datetime]]:
    if not ranges:
        return []

    merged: List[tuple[datetime, datetime]] = []
    current_start, current_end = ranges[0]
    for start, end in ranges[1:]:
        if start <= current_end:
            if end > current_end:
                current_end = end
            continue
        merged.append((current_start, current_end))
        current_start, current_end = start, end
    merged.append((current_start, current_end))
    return merged


async def get_free_intervals(
    db: AsyncIOMotorDatabase,
    user_id: str,
    start: datetime,
    end: datetime,
    *,
    block_minutes: int = 30,
) -> List[dict[str, datetime]]:
    """Return free intervals within ``[start, end]`` aligned to ``block_minutes``.

    Busy periods are derived from ``schedule_events``. Returned intervals are
    clamped to the input range and rounded to the nearest block boundary so
    callers can allocate fixed-size blocks without overlapping existing events.
    """

    if block_minutes <= 0:
        raise ValueError("block_minutes must be positive")

    window_start = _normalize_datetime(start)
    window_end = _normalize_datetime(end)
    if window_start >= window_end:
        return []

    user_object_id = resolve_object_id(user_id, "user_id")

    cursor = (
        db.schedule_events.find(
            {
                "user_id": user_object_id,
                "start_time": {"$lt": window_end},
                "end_time": {"$gt": window_start},
            },
            {"start_time": 1, "end_time": 1, "_id": 0},
        )
        .sort("start_time", 1)
    )

    busy: List[tuple[datetime, datetime]] = []
    async for doc in cursor:
        start_time = doc.get("start_time")
        end_time = doc.get("end_time")
        if not isinstance(start_time, datetime) or not isinstance(end_time, datetime):
            continue
        normalized_start = _normalize_datetime(start_time)
        normalized_end = _normalize_datetime(end_time)
        if normalized_end <= normalized_start:
            continue
        busy.append((normalized_start, normalized_end))

    busy.sort(key=lambda item: item[0])
    merged_busy = _merge_ranges(busy)

    raw_free: List[tuple[datetime, datetime]] = []
    cursor_time = window_start
    for busy_start, busy_end in merged_busy:
        if busy_start > cursor_time:
            free_end = min(busy_start, window_end)
            if free_end > cursor_time:
                raw_free.append((cursor_time, free_end))
        cursor_time = max(cursor_time, busy_end)
        if cursor_time >= window_end:
            break
    if cursor_time < window_end:
        raw_free.append((cursor_time, window_end))

    aligned: List[dict[str, datetime]] = []
    for free_start, free_end in raw_free:
        slot_start = _round_up(free_start, block_minutes)
        slot_end = _round_down(free_end, block_minutes)
        if slot_start >= slot_end:
            continue
        aligned.append({"start": slot_start, "end": slot_end})

    return aligned
