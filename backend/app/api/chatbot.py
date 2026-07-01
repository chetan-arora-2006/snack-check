from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.core.database import scans_col
from app.services.gemini import chat_with_health_coach
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/chatbot", tags=["AI Health Coach"])

class ChatMessage(BaseModel):
    sender: str  # "user" or "coach"
    text: str

class ChatPayload(BaseModel):
    chat_history: List[ChatMessage]
    message: str

@router.post("/message")
async def send_message_to_coach(payload: ChatPayload, current_user: dict = Depends(get_current_user)):
    """Interact with the AI Health Coach, sending history and latest message."""
    # Build user profile context
    user_profile = {
        "name": current_user.get("name", "User"),
        "allergies": current_user.get("allergies", []),
        "medical_conditions": current_user.get("medical_conditions", []),
        "health_goals": current_user.get("health_goals", []),
        "biometrics": current_user.get("biometrics")
    }

    # Fetch top 5 recent scans for additional context
    cursor = scans_col.find({"user_id": current_user["id"]}).sort("created_at", -1)
    recent_scans = await cursor.to_list(length=5)

    # Format history list and append the user's latest query
    history_list = [{"sender": msg.sender, "text": msg.text} for msg in payload.chat_history]
    history_list.append({"sender": "user", "text": payload.message})

    # Call Gemini chat service
    reply_text = await chat_with_health_coach(history_list, user_profile, recent_scans)
    
    return {"reply": reply_text}
