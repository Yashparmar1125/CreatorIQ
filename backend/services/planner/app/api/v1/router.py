from fastapi import APIRouter

from app.api.v1.endpoints.planner import router as planner_router


api_router = APIRouter()
api_router.include_router(planner_router, tags=["planner"])
