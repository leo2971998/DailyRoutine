from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


async def broadcast_event(event_type: str, payload: dict[str, Any] | None = None) -> None:
    """Placeholder broadcast hook for websocket updates."""

    logger.debug("broadcast_event called", extra={"event_type": event_type, "payload": payload})


__all__ = ["broadcast_event"]
