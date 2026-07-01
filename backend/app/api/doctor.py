from fastapi import APIRouter, HTTPException, Depends, status
from app.schemas.doctor import DoctorProfile, ConsultationCreate, ConsultationDB
from app.core.database import doctors_col, consultations_col
from app.core.security import get_current_user
from bson import ObjectId
from datetime import datetime
from typing import List

router = APIRouter(prefix="/doctor", tags=["Consultations"])

@router.get("/list", response_model=List[DoctorProfile])
async def list_doctors():
    """Retrieve lists of all seeded health and dietary professionals."""
    cursor = doctors_col.find({})
    doctors = await cursor.to_list(length=50)
    
    profiles = []
    for doc in doctors:
        doc["id"] = str(doc["_id"])
        profiles.append(DoctorProfile(**doc))
    return profiles

@router.post("/book", response_model=ConsultationDB)
async def book_consultation(payload: ConsultationCreate, current_user: dict = Depends(get_current_user)):
    """Book a new consultation appointment with a specific dietitian/doctor."""
    try:
        doc_obj_id = ObjectId(payload.doctor_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid doctor ID format."
        )

    # Verify doctor exists
    doctor = await doctors_col.find_one({"_id": doc_obj_id})
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested doctor was not found."
        )

    # Save consultation
    consultation_doc = {
        "user_id": current_user["id"],
        "doctor_id": str(doctor["_id"]),
        "doctor_name": doctor["name"],
        "doctor_specialty": doctor["specialty"],
        "doctor_avatar": doctor["avatar"],
        "date_time": payload.date_time,
        "status": "Scheduled",
        "created_at": datetime.utcnow()
    }
    
    res = await consultations_col.insert_one(consultation_doc)
    consultation_doc["id"] = str(res.inserted_id)

    return ConsultationDB(**consultation_doc)

@router.get("/consultations", response_model=List[ConsultationDB])
async def get_my_consultations(current_user: dict = Depends(get_current_user)):
    """Retrieve all upcoming/past consultation bookings for the active user."""
    cursor = consultations_col.find({"user_id": current_user["id"]}).sort("created_at", -1)
    bookings = await cursor.to_list(length=50)
    
    res = []
    for b in bookings:
        b["id"] = str(b["_id"])
        res.append(ConsultationDB(**b))
    return res

@router.delete("/consultations/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_consultation(booking_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel a scheduled consultation by its booking ID."""
    try:
        booking_obj_id = ObjectId(booking_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid booking ID format."
        )

    booking = await consultations_col.find_one({"_id": booking_obj_id})
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation booking not found."
        )

    # Verify authorization
    if booking.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to cancel this booking."
        )

    await consultations_col.delete_one({"_id": booking_obj_id})
    return
