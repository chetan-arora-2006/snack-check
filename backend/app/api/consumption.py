from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.security import get_current_user
from app.core.database import db
from app.schemas.consumption import ConsumptionCreate, ConsumptionResponse, DailyBudgetReport, NutrientStatus
from bson import ObjectId
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/consumption", tags=["Consumption Tracker"])

consumptions_col = db["consumptions"]

@router.post("/log", response_model=ConsumptionResponse, status_code=status.HTTP_201_CREATED)
async def log_consumption(payload: ConsumptionCreate, current_user: dict = Depends(get_current_user)):
    """Log a snack consumed by the user or their family members."""
    doc = {
        "user_id": current_user["id"],
        "member_id": payload.member_id,
        "product_name": payload.product_name,
        "calories": payload.calories,
        "sugars": payload.sugars,
        "sodium": payload.sodium,
        "consumed_at": datetime.utcnow()
    }
    
    res = await consumptions_col.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    return doc

def format_consumption(doc: dict) -> ConsumptionResponse:
    return ConsumptionResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        member_id=doc.get("member_id"),
        product_name=doc["product_name"],
        calories=doc.get("calories", 0.0),
        sugars=doc.get("sugars", 0.0),
        sodium=doc.get("sodium", 0.0),
        consumed_at=doc["consumed_at"]
    )

@router.get("/today", response_model=List[ConsumptionResponse])
async def get_today_consumptions(
    member_id: Optional[str] = Query(None, description="Optional family member ID to query"),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve today's consumed snack entries, newest first."""
    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day)

    if member_id:
        if member_id in current_user.get("linked_family_members", []):
            query = {
                "$or": [
                    {"user_id": current_user["id"], "member_id": member_id},
                    {"user_id": member_id, "member_id": None},
                    {"user_id": member_id, "member_id": member_id}
                ],
                "consumed_at": {"$gte": start_of_today}
            }
        else:
            query = {
                "user_id": current_user["id"],
                "member_id": member_id,
                "consumed_at": {"$gte": start_of_today}
            }
    else:
        query = {
            "user_id": current_user["id"],
            "member_id": None,
            "consumed_at": {"$gte": start_of_today}
        }

    cursor = consumptions_col.find(query).sort("consumed_at", -1)
    logs = await cursor.to_list(length=100)
    return [format_consumption(log) for log in logs]

@router.get("/daily", response_model=DailyBudgetReport)
async def get_daily_status(
    member_id: Optional[str] = Query(None, description="Optional family member ID to query"),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve today's calories, sugar, and sodium totals compared against daily limit caps."""
    now = datetime.utcnow()
    # 00:00:00 UTC start of today
    start_of_today = datetime(now.year, now.month, now.day)
    
    if member_id:
        if member_id in current_user.get("linked_family_members", []):
            query = {
                "$or": [
                    {"user_id": current_user["id"], "member_id": member_id},
                    {"user_id": member_id, "member_id": None},
                    {"user_id": member_id, "member_id": member_id}
                ],
                "consumed_at": {"$gte": start_of_today}
            }
        else:
            query = {
                "user_id": current_user["id"],
                "member_id": member_id,
                "consumed_at": {"$gte": start_of_today}
            }
    else:
        query = {
            "user_id": current_user["id"],
            "member_id": None,
            "consumed_at": {"$gte": start_of_today}
        }
    
    cursor = consumptions_col.find(query)
    logs = await cursor.to_list(length=100)
    
    tot_calories = sum(log.get("calories", 0.0) for log in logs)
    tot_sugars = sum(log.get("sugars", 0.0) for log in logs)
    tot_sodium = sum(log.get("sodium", 0.0) for log in logs)

    # Load thresholds from user settings
    limits = current_user.get("daily_limits") or {}
    limit_calories = limits.get("calories", 2000.0)
    limit_sugars = limits.get("sugar_g", 36.0)
    limit_sodium = limits.get("sodium_mg", 2300.0)
    
    # If looking up a local child profile, apply specialized generic guidelines.
    # If looking up an accepted linked user, use that user's own saved limits.
    if member_id:
        members = current_user.get("family_members", [])
        member = next((m for m in members if m["id"] == member_id), None)
        if member:
            # Default pediatric guidelines for sub-profiles
            limit_calories = 1600.0
            limit_sugars = 25.0
            limit_sodium = 1800.0
        elif member_id in current_user.get("linked_family_members", []):
            try:
                linked_user = await db["users"].find_one({"_id": ObjectId(member_id)})
                linked_limits = (linked_user or {}).get("daily_limits") or {}
                limit_calories = linked_limits.get("calories", limit_calories)
                limit_sugars = linked_limits.get("sugar_g", limit_sugars)
                limit_sodium = linked_limits.get("sodium_mg", limit_sodium)
            except Exception:
                pass
            
    pct_calories = (tot_calories / limit_calories * 100) if limit_calories > 0 else 0
    pct_sugars = (tot_sugars / limit_sugars * 100) if limit_sugars > 0 else 0
    pct_sodium = (tot_sodium / limit_sodium * 100) if limit_sodium > 0 else 0

    return DailyBudgetReport(
        calories=NutrientStatus(limit=limit_calories, consumed=tot_calories, percentage=round(pct_calories, 1)),
        sugars=NutrientStatus(limit=limit_sugars, consumed=tot_sugars, percentage=round(pct_sugars, 1)),
        sodium=NutrientStatus(limit=limit_sodium, consumed=tot_sodium, percentage=round(pct_sodium, 1))
    )

@router.delete("/{consumption_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_consumption(consumption_id: str, current_user: dict = Depends(get_current_user)):
    """Delete one logged consumption entry owned by the current user."""
    try:
        obj_id = ObjectId(consumption_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid consumption ID format."
        )

    result = await consumptions_col.delete_one({
        "_id": obj_id,
        "user_id": current_user["id"]
    })

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consumption entry not found."
        )
