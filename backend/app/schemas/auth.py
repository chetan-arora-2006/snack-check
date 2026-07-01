from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class Biometrics(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    target_weight_kg: Optional[float] = None

class DailyLimits(BaseModel):
    calories: float = 2000.0
    sugar_g: float = 36.0
    sodium_mg: float = 2300.0

class FamilyMember(BaseModel):
    id: str
    name: str
    allergies: List[str] = Field(default_factory=list)
    medical_conditions: List[str] = Field(default_factory=list)

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleLogin(BaseModel):
    credential: str = Field(..., description="Google ID Token credential from the client library")

class UserProfile(BaseModel):
    id: str
    name: str
    email: EmailStr
    picture: Optional[str] = None
    allergies: List[str] = Field(default_factory=list)
    health_goals: List[str] = Field(default_factory=list)
    theme: str = "dark"
    biometrics: Optional[Biometrics] = None
    medical_conditions: List[str] = Field(default_factory=list)
    daily_limits: Optional[DailyLimits] = None
    family_members: List[FamilyMember] = Field(default_factory=list)
    nametag: Optional[str] = None
    linked_family_members: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    picture: Optional[str] = None
    allergies: Optional[List[str]] = None
    health_goals: Optional[List[str]] = None
    theme: Optional[str] = None
    biometrics: Optional[Biometrics] = None
    medical_conditions: Optional[List[str]] = None
    daily_limits: Optional[DailyLimits] = None
    family_members: Optional[List[FamilyMember]] = None
    nametag: Optional[str] = None
    linked_family_members: Optional[List[str]] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
