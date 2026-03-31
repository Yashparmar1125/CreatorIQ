from fastapi import APIRouter

from app.api.v1.endpoints.channel import router as channel_router


api_router = APIRouter()
api_router.include_router(channel_router, tags=["channel"])
