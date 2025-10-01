from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

if __package__:
    from .app.config import API_CORS_ORIGINS
    from .app.db import close_client
    from .app.indexes import ensure_indexes
    from .habit_logs import router as habit_logs_router
    from .habits import router as habits_router
    from .health import router as health_router
    from .schedule import router as schedule_router
    from .tasks import router as tasks_router
    from .users import router as users_router
else:  # pragma: no cover - handles ``uvicorn main:app`` when cwd==api/
    from app.config import API_CORS_ORIGINS
    from app.db import close_client
    from app.indexes import ensure_indexes
    from habit_logs import router as habit_logs_router
    from habits import router as habits_router
    from health import router as health_router
    from schedule import router as schedule_router
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

    app.include_router(users_router)
    app.include_router(tasks_router)
    app.include_router(habits_router)
    app.include_router(habit_logs_router)
    app.include_router(schedule_router)
    app.include_router(health_router)

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
