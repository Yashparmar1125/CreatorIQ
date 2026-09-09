from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

from app.api.v1.router import api_router


app = FastAPI(title="CreatorIQ Auth Service", version="v1")
frontend_origins = [url.strip().rstrip("/") for url in settings.frontend_url.split(",") if url.strip()]
for dev_url in ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]:
    if dev_url not in frontend_origins:
        frontend_origins.append(dev_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)
