from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import API_CORS_ORIGINS
from app.db import get_client, close_client
from app.indexes import ensure_indexes

from app.routers import health, users, tasks, habits, habit_logs, schedule


@asynccontextmanager
async def lifespan(app: FastAPI):
    # connect + ensure indexes on startup
    get_client()
    await ensure_indexes()
    yield
    # close client on shutdown
    close_client()


app = FastAPI(title="Daily Routine API", version="0.1.0", lifespan=lifespan)

# CORS for local frontends
if API_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=API_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Routers
app.include_router(health.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(habits.router)
app.include_router(habit_logs.router)
app.include_router(schedule.router)
