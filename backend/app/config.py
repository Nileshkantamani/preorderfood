import os
import json
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./preorderfood.db")

JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
TOKEN_EXPIRY_MINUTES: int = int(os.getenv("TOKEN_EXPIRY_MINUTES", "60"))
TOKEN_EXPIRY_DELTA = timedelta(minutes=TOKEN_EXPIRY_MINUTES)

raw_origins = os.getenv("CORS_ORIGINS", "[]")

try:
    CORS_ORIGINS = json.loads(raw_origins)
except Exception:
    CORS_ORIGINS = ["*"]
