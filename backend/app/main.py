"""FastAPI application that powers the Daily Routine dashboard."""
from __future__ import annotations

import asyncio
from datetime import datetime
from typing import Callable

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from .models import (
    DashboardEvent,
    DashboardState,
    HabitProgressUpdate,
    TaskUpdate,
)
from .storage import (
    load_state,
    recompute_progress,
    save_state,
    update_habit_progress,
    update_task,
)
from .websocket_manager import WebsocketManager

DEFAULT_USER_ID = "wendy"


class StateContainer:
    """Holds the mutable dashboard state in memory."""

    def __init__(self) -> None:
        self._state = load_state()
        self._lock = asyncio.Lock()

    async def read(self) -> DashboardState:
        async with self._lock:
            return self._state.copy(deep=True)

    async def mutate(self, mutate_fn: Callable[[DashboardState], None]) -> DashboardState:
        async with self._lock:
            mutate_fn(self._state)
            save_state(self._state)
            return self._state.copy(deep=True)


state_container = StateContainer()
manager = WebsocketManager()

app = FastAPI(
    title="Daily Routine Dashboard API",
    default_response_class=ORJSONResponse,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def get_state() -> DashboardState:
    return await state_container.read()


@app.get("/api/dashboard", response_model=DashboardState)
async def read_dashboard(state: DashboardState = Depends(get_state)) -> DashboardState:
    """Return the entire dashboard payload in a single request."""
    return state


@app.patch("/api/tasks/{task_id}", response_model=DashboardState)
async def toggle_task(task_id: str, update: TaskUpdate) -> DashboardState:
    """Toggle a task and broadcast the change to all connected clients."""

    async def mutator(current_state: DashboardState) -> None:
        try:
            update_task(current_state.checklist, task_id, update.completed)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        recompute_progress(current_state)

    state = await state_container.mutate(mutator)
    await manager.send_json(
        DEFAULT_USER_ID,
        DashboardEvent(
            type="task_updated",
            payload={
                "taskId": task_id,
                "completed": update.completed,
                "progress": state.progress.dict(),
            },
        ).dict(),
    )
    return state


@app.patch("/api/habits/{habit_id}", response_model=DashboardState)
async def update_habit(habit_id: str, update: HabitProgressUpdate) -> DashboardState:
    """Update a habit's progress and propagate the event through websockets."""

    async def mutator(current_state: DashboardState) -> None:
        try:
            update_habit_progress(
                current_state.habits,
                habit_id,
                completed_today=update.completed_today,
                streak=update.streak,
            )
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        recompute_progress(current_state)

    state = await state_container.mutate(mutator)
    await manager.send_json(
        DEFAULT_USER_ID,
        DashboardEvent(
            type="habit_updated",
            payload={
                "habitId": habit_id,
                "completedToday": update.completed_today,
                "streak": update.streak,
                "progress": state.progress.dict(),
            },
        ).dict(),
    )
    return state


@app.websocket("/ws/dashboard")
async def dashboard_socket(websocket: WebSocket) -> None:
    """Bidirectional channel used to push real-time dashboard updates."""
    user_id = websocket.query_params.get("userId", DEFAULT_USER_ID)
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(user_id, websocket)


@app.on_event("startup")
async def refresh_progress_snapshot() -> None:
    """Ensure the persisted file has an up-to-date progress snapshot."""
    await state_container.mutate(recompute_progress)


@app.get("/health", tags=["system"])
async def healthcheck() -> dict:
    """Basic health check used by deployment platforms."""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
