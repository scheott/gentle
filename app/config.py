# api/app/config.py
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    ALLOW_ORIGINS: str = "http://localhost:5173"
    DATABASE_URL: Optional[str] = None

    # Supabase
    SUPABASE_URL: str
    SUPABASE_JWT_AUD: str = "authenticated"  # default Supabase audience

    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_PRICE_ID: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None

    class Config:
        env_file = "api/.env"
        extra = "ignore"

settings = Settings()
