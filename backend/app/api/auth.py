from fastapi import APIRouter, HTTPException, status, Depends
from app.core.database import users_col
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.auth import (
    UserRegister, UserLogin, GoogleLogin, Token, UserProfile, 
    Biometrics, DailyLimits, FamilyMember
)
from app.services.google_auth import verify_google_token
from bson import ObjectId

router = APIRouter(prefix="/auth", tags=["Authentication"])

def format_user_profile(user_doc: dict) -> UserProfile:
    """Helper to convert MongoDB user document to Pydantic UserProfile model."""
    biometrics_data = user_doc.get("biometrics")
    biometrics = Biometrics(**biometrics_data) if biometrics_data else None

    limits_data = user_doc.get("daily_limits")
    limits = DailyLimits(**limits_data) if limits_data else DailyLimits()

    family_data = user_doc.get("family_members", [])
    family_members = [FamilyMember(**fm) for fm in family_data]

    return UserProfile(
        id=str(user_doc["_id"]),
        name=user_doc.get("name", ""),
        email=user_doc.get("email", ""),
        picture=user_doc.get("picture"),
        allergies=user_doc.get("allergies", []),
        health_goals=user_doc.get("health_goals", []),
        theme=user_doc.get("theme", "dark"),
        biometrics=biometrics,
        medical_conditions=user_doc.get("medical_conditions", []),
        daily_limits=limits,
        family_members=family_members,
        nametag=user_doc.get("nametag"),
        linked_family_members=user_doc.get("linked_family_members", [])
    )

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserRegister):
    # Check if email exists
    existing = await users_col.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Hash password and insert user
    hashed = get_password_hash(payload.password)
    user_doc = {
        "name": payload.name,
        "email": payload.email.lower(),
        "password_hash": hashed,
        "google_id": None,
        "picture": None,
        "allergies": [],
        "health_goals": [],
        "theme": "dark",
        "biometrics": None,
        "medical_conditions": [],
        "daily_limits": None,
        "family_members": []
    }
    
    res = await users_col.insert_one(user_doc)
    user_doc["_id"] = res.inserted_id

    # Create token
    access_token = create_access_token(data={"sub": str(user_doc["_id"])})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=format_user_profile(user_doc)
    )

@router.post("/login", response_model=Token)
async def login(payload: UserLogin):
    user_doc = await users_col.find_one({"email": payload.email.lower()})
    if not user_doc or not user_doc.get("password_hash"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password."
        )

    # Verify password
    if not verify_password(payload.password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email or password."
        )

    # Create token
    access_token = create_access_token(data={"sub": str(user_doc["_id"])})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=format_user_profile(user_doc)
    )

@router.post("/google", response_model=Token)
async def google_login(payload: GoogleLogin):
    # Verify token
    google_user = verify_google_token(payload.credential)
    email = google_user["email"].lower()
    
    # Check if user already exists
    user_doc = await users_col.find_one({"email": email})
    
    if user_doc:
        # Link Google ID if not already linked
        update_data = {}
        if not user_doc.get("google_id"):
            update_data["google_id"] = google_user["sub"]
        if not user_doc.get("picture") and google_user.get("picture"):
            update_data["picture"] = google_user["picture"]
        if not user_doc.get("name") and google_user.get("name"):
            update_data["name"] = google_user["name"]
            
        if update_data:
            await users_col.update_one({"_id": user_doc["_id"]}, {"$set": update_data})
            user_doc.update(update_data)
    else:
        # Register new Google User
        user_doc = {
            "name": google_user["name"],
            "email": email,
            "password_hash": None,
            "google_id": google_user["sub"],
            "picture": google_user.get("picture"),
            "allergies": [],
            "health_goals": [],
            "theme": "dark",
            "biometrics": None,
            "medical_conditions": [],
            "daily_limits": None,
            "family_members": []
        }
        res = await users_col.insert_one(user_doc)
        user_doc["_id"] = res.inserted_id

    # Create token
    access_token = create_access_token(data={"sub": str(user_doc["_id"])})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=format_user_profile(user_doc)
    )
