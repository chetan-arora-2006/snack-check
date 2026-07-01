from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ConsumptionCreate(BaseModel):
    product_name: str
    calories: float = Field(..., ge=0)
    sugars: float = Field(..., ge=0)
    sodium: float = Field(..., ge=0)
    member_id: Optional[str] = Field(None, description="Optional family member UUID")

class ConsumptionResponse(BaseModel):
    id: str
    user_id: str
    member_id: Optional[str] = None
    product_name: str
    calories: float
    sugars: float
    sodium: float
    consumed_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class NutrientStatus(BaseModel):
    limit: float
    consumed: float
    percentage: float

class DailyBudgetReport(BaseModel):
    calories: NutrientStatus
    sugars: NutrientStatus
    sodium: NutrientStatus
