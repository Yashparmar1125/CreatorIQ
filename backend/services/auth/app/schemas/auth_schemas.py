from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenRefresh(BaseModel):
    refresh_token: str

class OnboardingUpdate(BaseModel):
    niche: List[str] = Field(..., max_items=3)
    primary_format: str
    posting_frequency: str
    channel_tone: str
    country: str

class UserResponse(UserBase):
    id: UUID
    plan_tier: str
    avatar_url: Optional[str] = None
    onboarding_completed: bool
    is_google_authenticated: bool

class AuthResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str

class DetailedResponse(BaseModel):
    data: dict
    meta: dict = {"request_id": "local-dev"}
