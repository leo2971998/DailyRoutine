"""Lightweight connection manager used to fan-out websocket updates."""
from __future__ import annotations

import asyncio
from typing import Dict, Set

from fastapi import WebSocket


class WebsocketManager:
    """Tracks active connections and lets the caller broadcast messages."""

    def __init__(self) -> None:
        self._connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(user_id, set()).add(websocket)

    async def disconnect(self, user_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            sockets = self._connections.get(user_id)
            if not sockets:
                return
            sockets.discard(websocket)
            if not sockets:
                self._connections.pop(user_id, None)

    async def send_json(self, user_id: str, message: dict) -> None:
        async with self._lock:
            sockets = list(self._connections.get(user_id, set()))
        if not sockets:
            return
        to_drop = []
        for ws in sockets:
            try:
                await ws.send_json(message)
            except Exception:
                to_drop.append(ws)
        if to_drop:
            async with self._lock:
                sockets = self._connections.get(user_id)
                if not sockets:
                    return
                for ws in to_drop:
                    sockets.discard(ws)
                if not sockets:
                    self._connections.pop(user_id, None)
