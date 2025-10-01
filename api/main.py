# DailyRoutine/main.py  (run from repo root: uvicorn main:app --reload --port 8000)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def create_app() -> FastAPI:
    app = FastAPI(title="DailyRoutine API", version="0.1.0")

    # CORS for local dev (adjust origins if needed)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "*",  # remove this in prod
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Import and mount routers
    # Expecting: api/app/routers/{users,tasks,habits,habit_logs,schedule,health}.py
    from api.app.routers import users, tasks, habits, habit_logs, schedule, health

    app.include_router(users.router)
    app.include_router(tasks.router)
    app.include_router(habits.router)
    app.include_router(habit_logs.router)
    app.include_router(schedule.router)
    app.include_router(health.router)

    @app.get("/healthz")
    async def healthz():
        return {"status": "ok"}

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
