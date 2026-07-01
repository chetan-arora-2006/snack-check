from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.auth import UserProfile, UserProfileUpdate
from app.core.security import get_current_user
from app.core.database import users_col
from app.api.auth import format_user_profile
from bson import ObjectId
from typing import List

router = APIRouter(prefix="/user", tags=["User Profile"])

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Retrieve the profile data of the logged-in user."""
    return format_user_profile(current_user)

@router.put("/profile", response_model=UserProfile)
async def update_profile(payload: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Update profile data like name, profile photo, allergies list, or health targets."""
    update_data = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.picture is not None:
        update_data["picture"] = payload.picture
    if payload.allergies is not None:
        update_data["allergies"] = payload.allergies
    if payload.health_goals is not None:
        update_data["health_goals"] = payload.health_goals
    if payload.theme is not None:
        update_data["theme"] = payload.theme
    if payload.biometrics is not None:
        update_data["biometrics"] = payload.biometrics.dict()
    if payload.medical_conditions is not None:
        update_data["medical_conditions"] = payload.medical_conditions
    if payload.daily_limits is not None:
        update_data["daily_limits"] = payload.daily_limits.dict()
    if payload.family_members is not None:
        update_data["family_members"] = [fm.dict() for fm in payload.family_members]
    if payload.nametag is not None:
        update_data["nametag"] = payload.nametag
    if payload.linked_family_members is not None:
        update_data["linked_family_members"] = payload.linked_family_members

    if not update_data:
        # No updates requested, return original profile
        return format_user_profile(current_user)

    # Perform update in database
    await users_col.update_one(
        {"_id": ObjectId(current_user["id"])}, 
        {"$set": update_data}
    )
    
    # Fetch and return the updated user document
    updated_user = await users_col.find_one({"_id": ObjectId(current_user["id"])})
    return format_user_profile(updated_user)

@router.post("/nametag", response_model=UserProfile)
async def update_nametag(payload: dict, current_user: dict = Depends(get_current_user)):
    """Update unique user nametag. Verifies that it isn't already taken."""
    tag = payload.get("nametag", "").strip().lower()
    if not tag:
        raise HTTPException(status_code=400, detail="Nametag cannot be empty")
    
    # Check if another user has this nametag
    existing = await users_col.find_one({
        "nametag": tag, 
        "_id": {"$ne": ObjectId(current_user["id"])}
    })
    if existing:
        raise HTTPException(status_code=400, detail="This nametag is already chosen by another user")
    
    await users_col.update_one(
        {"_id": ObjectId(current_user["id"])}, 
        {"$set": {"nametag": tag}}
    )
    updated_user = await users_col.find_one({"_id": ObjectId(current_user["id"])})
    return format_user_profile(updated_user)

@router.post("/family/link", response_model=UserProfile)
async def link_family_member(payload: dict, current_user: dict = Depends(get_current_user)):
    """Link a family member by looking up their unique nametag."""
    tag = payload.get("nametag", "").strip().lower()
    if not tag:
        raise HTTPException(status_code=400, detail="Please enter a nametag to link")
    
    target_user = await users_col.find_one({"nametag": tag})
    if not target_user:
        raise HTTPException(status_code=404, detail="Nametag not found")
    
    target_id_str = str(target_user["_id"])
    current_id_str = str(current_user["_id"])
    
    if target_id_str == current_id_str:
        raise HTTPException(status_code=400, detail="You cannot link to your own profile")
    
    # Link both users
    await users_col.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$addToSet": {"linked_family_members": target_id_str}}
    )
    await users_col.update_one(
        {"_id": ObjectId(target_user["_id"])},
        {"$addToSet": {"linked_family_members": current_id_str}}
    )
    
    updated_user = await users_col.find_one({"_id": ObjectId(current_user["id"])})
    return format_user_profile(updated_user)

@router.delete("/family/link/{member_id}", response_model=UserProfile)
async def unlink_family_member(member_id: str, current_user: dict = Depends(get_current_user)):
    """Break a profile link with a family member."""
    # Pull member_id from current user
    await users_col.update_one(
        {"_id": ObjectId(current_user["id"])},
        {"$pull": {"linked_family_members": member_id}}
    )
    # Pull current user ID from target member
    try:
        await users_col.update_one(
            {"_id": ObjectId(member_id)},
            {"$pull": {"linked_family_members": str(current_user["_id"])}}
        )
    except Exception:
        pass
        
    updated_user = await users_col.find_one({"_id": ObjectId(current_user["id"])})
    return format_user_profile(updated_user)

@router.get("/family/linked", response_model=List[UserProfile])
async def get_linked_family_members(current_user: dict = Depends(get_current_user)):
    """Retrieve full profile objects of all linked family members."""
    linked_ids = current_user.get("linked_family_members", [])
    members = []
    for lid in linked_ids:
        try:
            u = await users_col.find_one({"_id": ObjectId(lid)})
            if u:
                members.append(format_user_profile(u))
        except Exception:
            pass
    return members
