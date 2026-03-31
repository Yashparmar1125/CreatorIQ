from fastapi import FastAPI

from app.api.v1.router import api_router


app = FastAPI(title="CreatorIQ ML Service", version="v1")
app.include_router(api_router)
