"""FastAPI routers for AI-powered features."""

from . import ai, ai_feedback, tasks_split  # noqa: F401

__all__ = ["ai", "ai_feedback", "tasks_split"]
