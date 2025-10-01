from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers from the flat api package (NOT from api.app.*)
from .users import router as users_router
from .tasks import router as tasks_router
from .habits import router as habits_router
from .habit_logs import router as habit_logs_router
from .schedule import router as schedule_router
from .health import router as health_router


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
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount routers
    app.include_router(users_router)
    app.include_router(tasks_router)
    app.include_router(habits_router)
    app.include_router(habit_logs_router)
    app.include_router(schedule_router)
    app.include_router(health_router)

    @app.get("/v1/healthcheck")
    def healthcheck():
        return {"ok": True}

    return app


app = make_app()
