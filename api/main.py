from __future__ import annotations

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

if __package__:
    from .app.config import API_CORS_ORIGINS
    from .app.db import close_client
    from .app.indexes import ensure_indexes
    from .habit_logs import alias_router as habit_logs_alias_router
    from .habit_logs import router as habit_logs_router
    from .habits import router as habits_router
    from .insights import router as insights_router
    from .health import router as health_router
    from .schedule import alias_router as schedule_alias_router
    from .schedule import router as schedule_router
    from .routes.ai import router as ai_router
    from .routes.ai_feedback import router as ai_feedback_router
    from .routes.scheduler import router as scheduler_router
    from .routes.tasks_split import router as tasks_split_router
    from .summary import router as summary_router
    from .tasks import router as tasks_router
    from .users import router as users_router
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.config import API_CORS_ORIGINS
    from app.db import close_client
    from app.indexes import ensure_indexes
    from habit_logs import alias_router as habit_logs_alias_router
    from habit_logs import router as habit_logs_router
    from habits import router as habits_router
    from insights import router as insights_router
    from health import router as health_router
    from schedule import alias_router as schedule_alias_router
    from schedule import router as schedule_router
    from routes.ai import router as ai_router
    from routes.ai_feedback import router as ai_feedback_router
    from routes.scheduler import router as scheduler_router
    from routes.tasks_split import router as tasks_split_router
    from summary import router as summary_router
    from tasks import router as tasks_router
    from users import router as users_router


def make_app() -> FastAPI:
    app = FastAPI(
        title="DailyRoutine API",
        version="1.0.0",
        docs_url="/v1/docs",
        redoc_url="/v1/redoc",
        openapi_url="/v1/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=API_CORS_ORIGINS or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    routers = [
        users_router,
        tasks_router,
        habits_router,
        habit_logs_router,
        habit_logs_alias_router,
        schedule_router,
        schedule_alias_router,
        summary_router,
        insights_router,
        health_router,
        ai_router,
        ai_feedback_router,
        scheduler_router,
        tasks_split_router,
    ]

    # Legacy routes without versioning for compatibility
    for router in routers:
        app.include_router(router, include_in_schema=False)

    # Versioned API surface mounted at /v1
    v1_router = APIRouter(prefix="/v1")
    for router in routers:
        v1_router.include_router(router)
    app.include_router(v1_router)

    @app.on_event("startup")
    async def _startup() -> None:
        await ensure_indexes()

    @app.on_event("shutdown")
    async def _shutdown() -> None:
        close_client()

    @app.get("/v1/healthcheck")
    async def healthcheck() -> dict[str, bool]:
        return {"ok": True}

    return app


app = make_app()
