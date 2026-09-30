from fastapi import APIRouter

from app.api.v1.endpoints.strategy import router as strategy_router
from app.api.v1.endpoints.trend import router as trend_router

api_router = APIRouter()
api_router.include_router(trend_router, tags=["trend"])
api_router.include_router(strategy_router, tags=["strategy"])

