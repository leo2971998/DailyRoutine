# health.py
from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", include_in_schema=False)
async def health_root():
    return {"ok": True}


@router.get("/live")
async def health_live():
    return {"ok": True}
