from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional, Any

class CheckRequest(BaseModel):
    url: HttpUrl
    user_id: Optional[str] = None  # optional until auth wired

class CheckResponse(BaseModel):
    verdict: str                 # ok | warning | danger
    reasons: List[str]
    summary: str
    meta: dict

class CheckoutRequest(BaseModel):
    user_id: str
    email: Optional[str] = None

class CheckoutResponse(BaseModel):
    url: str

class PortalResponse(BaseModel):
    url: str
