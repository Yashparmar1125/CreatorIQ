from fastapi import APIRouter

from app.api.v1.endpoints.gateway import router as gateway_router


api_router = APIRouter()
api_router.include_router(gateway_router, tags=["gateway"])
