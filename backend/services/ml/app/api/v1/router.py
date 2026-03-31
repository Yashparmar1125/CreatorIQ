from fastapi import APIRouter

from app.api.v1.endpoints.ml import router as ml_router


api_router = APIRouter()
api_router.include_router(ml_router, tags=["ml"])
