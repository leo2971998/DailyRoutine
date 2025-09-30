"""Flask application that powers the Daily Routine dashboard."""
from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path
from threading import RLock
from typing import Callable

# Make 'app' a package when running directly
if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parent.parent))
    __package__ = "app"

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, join_room, leave_room
from pydantic import ValidationError

from .models import DashboardEvent, DashboardState, HabitProgressUpdate, TaskUpdate
from .storage import (
    load_state,
    recompute_progress,
    save_state,
    update_habit_progress,
    update_task,
)

DEFAULT_USER_ID = "wendy"


class StateContainer:
    """Thread-safe holder for the mutable dashboard state."""

    def __init__(self) -> None:
        self._state = load_state()
        self._lock = RLock()

    def read(self) -> DashboardState:
        with self._lock:
            return self._state.copy(deep=True)

    def mutate(self, mutate_fn: Callable[[DashboardState], None]) -> DashboardState:
        with self._lock:
            mutate_fn(self._state)
            save_state(self._state)
            return self._state.copy(deep=True)


state_container = StateContainer()
app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")


def _serialize_state(state: DashboardState) -> dict:
    """Convert a Pydantic model into a JSON-ready dictionary."""
    return json.loads(state.json())


@app.route("/api/dashboard", methods=["GET"])
def read_dashboard() -> tuple[dict, int]:
    """Return the entire dashboard payload in a single request."""
    state = state_container.read()
    return _serialize_state(state), 200


def _parse_payload(model_cls, payload: dict):
    """Parse and validate JSON payload into the given Pydantic model."""
    try:
        return model_cls.parse_obj(payload)
    except ValidationError as exc:
        response = {"detail": exc.errors()}
        return jsonify(response), 422


@app.route("/api/tasks/<task_id>", methods=["PATCH"])
def toggle_task(task_id: str):
    """Toggle a task and broadcast the change to connected clients."""
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"detail": "Invalid or missing JSON payload."}), 400

    parsed = _parse_payload(TaskUpdate, payload)
    if isinstance(parsed, tuple):
        return parsed
    update: TaskUpdate = parsed

    def mutator(current_state: DashboardState) -> None:
        update_task(current_state.checklist, task_id, update.completed)
        recompute_progress(current_state)

    try:
        state = state_container.mutate(mutator)
    except KeyError as exc:
        return jsonify({"detail": str(exc)}), 404

    event = DashboardEvent(
        type="task_updated",
        payload={
            "taskId": task_id,
            "completed": update.completed,
            "progress": state.progress.dict(),
        },
    )
    socketio.emit("dashboard_event", event.dict(), room=DEFAULT_USER_ID)
    return _serialize_state(state), 200


@app.route("/api/habits/<habit_id>", methods=["PATCH"])
def update_habit(habit_id: str):
    """Update a habit's progress and propagate the change to subscribers."""
    payload = request.get_json(silent=True)
    if payload is None:
        return jsonify({"detail": "Invalid or missing JSON payload."}), 400

    parsed = _parse_payload(HabitProgressUpdate, payload)
    if isinstance(parsed, tuple):
        return parsed
    update: HabitProgressUpdate = parsed

    def mutator(current_state: DashboardState) -> None:
        update_habit_progress(
            current_state.habits,
            habit_id,
            completed_today=update.completed_today,
            streak=update.streak,
        )
        recompute_progress(current_state)

    try:
        state = state_container.mutate(mutator)
    except KeyError as exc:
        return jsonify({"detail": str(exc)}), 404

    event = DashboardEvent(
        type="habit_updated",
        payload={
            "habitId": habit_id,
            "completedToday": update.completed_today,
            "streak": update.streak,
            "progress": state.progress.dict(),
        },
    )
    socketio.emit("dashboard_event", event.dict(), room=DEFAULT_USER_ID)
    return _serialize_state(state), 200


@socketio.on("connect")
def handle_connect():
    user_id = request.args.get("userId", DEFAULT_USER_ID)
    join_room(user_id)
    socketio.emit(
        "dashboard_event",
        DashboardEvent(
            type="connected",
            payload={"timestamp": datetime.utcnow().isoformat()},
        ).dict(),
        room=user_id,
    )


@socketio.on("disconnect")
def handle_disconnect():
    user_id = request.args.get("userId", DEFAULT_USER_ID)
    leave_room(user_id)


def refresh_progress_snapshot() -> None:
    """Ensure the persisted file has an up-to-date progress snapshot."""
    def _mutator(state: DashboardState) -> None:
        recompute_progress(state)
    state_container.mutate(_mutator)


# ---- One-time init that works for both __main__ and WSGI imports ----
_initialized = False

def _initialize_once() -> None:
    global _initialized
    if _initialized:
        return
    with app.app_context():
        refresh_progress_snapshot()
    _initialized = True

# Run at import time so WSGI servers (gunicorn/uwsgi) also initialize
_initialize_once()


@app.route("/health", methods=["GET"])
def healthcheck() -> tuple[dict, int]:
    """Basic health check used by deployment platforms."""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}, 200


if __name__ == "__main__":
    # In case someone runs `python main.py`, this will no-op if already initialized.
    _initialize_once()
    socketio.run(app, host="0.0.0.0", port=8000)
