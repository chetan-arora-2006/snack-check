from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ScanUpload(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded string of the food label image")

class Additive(BaseModel):
    name: str
    hazard: str  # Low, Moderate, High
    description: str

class Nutrients(BaseModel):
    calories: Optional[float] = None
    sugars: Optional[float] = None
    fat: Optional[float] = None
    saturated_fat: Optional[float] = None
    protein: Optional[float] = None
    sodium: Optional[float] = None
    fiber: Optional[float] = None

class Warnings(BaseModel):
    high_sugar: bool = False
    high_sodium: bool = False
    high_saturated_fat: bool = False
    allergens: List[str] = Field(default_factory=list)
    additives: List[Additive] = Field(default_factory=list)

class IngredientsAnalysis(BaseModel):
    beneficial: List[str] = Field(default_factory=list)
    neutral: List[str] = Field(default_factory=list)
    avoid: List[str] = Field(default_factory=list)

class Alternative(BaseModel):
    name: str
    description: str

class ScanReport(BaseModel):
    product_name: str
    health_rating: int
    health_grade: str
    grade_color: str
    summary: str
    nutrients: Nutrients
    warnings: Warnings
    ingredients_analysis: IngredientsAnalysis
    healthier_alternatives: List[Alternative] = Field(default_factory=list)

class ScanDB(BaseModel):
    id: str
    user_id: Optional[str] = None
    member_id: Optional[str] = None
    filename: str
    mime: str
    result: ScanReport
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
