import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME: str = os.getenv("DATABASE_NAME", "daily_routine_dashboard")
API_CORS_ORIGINS: list[str] = [
    o.strip() for o in os.getenv("API_CORS_ORIGINS", "").split(",") if o.strip()
]
