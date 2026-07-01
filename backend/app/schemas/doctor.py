from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class DoctorProfile(BaseModel):
    id: str
    name: str
    specialty: str
    rating: float
    experience: str
    avatar: str
    bio: str
    availability: List[str]
    price: str

    class Config:
        from_attributes = True

class ConsultationCreate(BaseModel):
    doctor_id: str
    date_time: str = Field(..., description="Selected appointment slot (e.g. Wednesday 2PM - 3PM)")

class ConsultationDB(BaseModel):
    id: str
    user_id: str
    doctor_id: str
    doctor_name: str
    doctor_specialty: str
    doctor_avatar: str
    date_time: str
    status: str = "Scheduled"
    created_at: datetime

    class Config:
        from_attributes = True
