import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017"
    db_name: str = "snackcheck"
    gemini_api_key: str = ""
    google_client_id: str = ""
    jwt_secret: str = "4a2d8e5b8c9c0d1e2f3a4b5c6d7e8f9001a2b3c4d5e6f708192a3b4c5d6e7f80"
    access_token_expire_minutes: int = 1440
    temp_image_dir: str = "./temp_uploads"

    class Config:
        # Resolve to backend/.env
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
