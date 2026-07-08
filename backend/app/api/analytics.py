from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from app.core.database import db, users_col
from bson import ObjectId
from datetime import datetime, timedelta
import httpx
import os
import json
import logging
from app.core.config import settings

logger = logging.getLogger("snackcheck")
router = APIRouter(prefix="/analytics", tags=["Analytics & Achievements"])

@router.post("/weekly-report")
async def generate_weekly_report(current_user: dict = Depends(get_current_user)):
    """Generate and cache a personalized AI weekly health report based on last 7 days of consumption."""
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    
    # Query last 7 days consumptions
    cursor = db["consumptions"].find({
        "user_id": current_user["id"],
        "member_id": None,
        "consumed_at": {"$gte": seven_days_ago}
    })
    logs = await cursor.to_list(length=500)
    
    tot_cals = sum(log.get("calories", 0.0) for log in logs)
    tot_sugars = sum(log.get("sugars", 0.0) for log in logs)
    tot_sodium = sum(log.get("sodium", 0.0) for log in logs)
    
    # Compile prompt
    prompt = (
        f"You are a friendly, encouraging AI Dietitian for the SnackCheck app.\n"
        f"The user '{current_user.get('name', 'User')}' just requested their weekly analytics report.\n"
        f"In the past 7 days, they logged {len(logs)} snacks/meals, totaling:\n"
        f"- {tot_cals:.1f} kcal\n"
        f"- {tot_sugars:.1f} g of Sugar\n"
        f"- {tot_sodium:.1f} mg of Sodium\n\n"
        f"Their profile context:\n"
        f"- Allergies: {', '.join(current_user.get('allergies', [])) or 'None'}\n"
        f"- Medical Conditions: {', '.join(current_user.get('medical_conditions', [])) or 'None'}\n"
        f"- Goals: {', '.join(current_user.get('health_goals', [])) or 'None'}\n\n"
        f"Write a short, engaging 3-4 sentence paragraph praising them, gently advising them on any excess, "
        f"and giving a score out of 100 for their week. "
        f"Return ONLY valid JSON in this exact format (no markdown): "
        '{"score": 85, "review": "Your review text here."}'
    )
    
    api_key = os.getenv("GEMINI_ANALYTICS_API_KEY", settings.gemini_api_key)
    
    if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE" or api_key == "your_gemini_api_key_here":
        # Mock response if no key
        report = {
            "score": 80,
            "review": f"You've logged {len(logs)} items this week! Keep an eye on your sodium, but you're doing great!"
        }
    else:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"}
        }
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.post(url, json=payload)
                res.raise_for_status()
                text_response = res.json()['candidates'][0]['content']['parts'][0]['text']
                report = json.loads(text_response)
        except Exception as e:
            logger.error(f"Failed to generate weekly report: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate AI report.")
            
    # Cache to database
    report["generated_at"] = now.isoformat()
    await users_col.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$set": {"weekly_report": report}}
    )
    
    return report
