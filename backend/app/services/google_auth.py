from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.core.config import settings
from fastapi import HTTPException, status

def verify_google_token(token: str) -> dict:
    """
    Verifies a Google ID token.
    If settings.google_client_id is not set or is placeholder, 
    and the token starts with 'mock_token_', it will return mock data for development.
    """
    # Development Bypass
    is_placeholder = (
        not settings.google_client_id 
        or "YOUR_GOOGLE" in settings.google_client_id 
        or "your_google" in settings.google_client_id
    )
    if is_placeholder and token.startswith("mock_token_"):
        email = token.replace("mock_token_", "")
        if "@" not in email:
            email = f"{email}@gmail.com"
        name = email.split("@")[0].capitalize()
        return {
            "email": email,
            "name": name,
            "picture": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
            "sub": f"google_mock_{email}"
        }

    try:
        # Verify OAuth token
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            settings.google_client_id
        )
        
        # Verify issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        return {
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
            "sub": idinfo.get("sub"), # Google User ID
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid Google ID token verification: {str(e)}"
        )
