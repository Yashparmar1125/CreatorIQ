from fastapi import APIRouter

from app.api.v1.endpoints.analytics import router as analytics_router


api_router = APIRouter()
api_router.include_router(analytics_router, tags=["analytics"])
