from fastapi import APIRouter, HTTPException, Depends, status, Query
from app.schemas.scan import ScanUpload, ScanDB
from app.services.gemini import analyze_label_image
from app.core.database import scans_col, users_col
from app.core.security import get_current_user, oauth2_scheme
from app.core.config import settings
import httpx
from jose import jwt
from datetime import datetime
from bson import ObjectId
import base64
import io
from PIL import Image
from typing import List, Optional
import re

router = APIRouter(prefix="/scan", tags=["Scanner"])

async def get_current_user_optional(token: str = Depends(oauth2_scheme)) -> Optional[dict]:
    """Optional dependency to identify the logged-in user if token is present."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        user_id: Optional[str] = payload.get("sub")
        if user_id:
            user = await users_col.find_one({"_id": ObjectId(user_id)})
            if user:
                user["id"] = str(user["_id"])
                return user
    except Exception:
        pass
    return None

def parse_base64_image(base64_str: str):
    """Decodes base64 string, validates format with Pillow, and extracts MIME type."""
    mime = "image/jpeg"
    data = base64_str
    if base64_str.startswith("data:"):
        parts = base64_str.split(",", 1)
        mime = parts[0].split(";")[0].replace("data:", "")
        data = parts[1]
    
    try:
        binary_data = base64.b64decode(data)
        image = Image.open(io.BytesIO(binary_data))
        # Quick validation of image contents
        image.verify()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image format or corrupted data: {str(e)}"
        )
    return data, mime

def format_scan_db(doc: dict) -> ScanDB:
    """Helper to convert MongoDB scan document to Pydantic ScanDB model."""
    return ScanDB(
        id=str(doc["_id"]),
        user_id=doc.get("user_id"),
        member_id=doc.get("member_id"),
        filename=doc.get("filename", "scan.jpg"),
        mime=doc.get("mime", "image/jpeg"),
        result=doc["result"],
        created_at=doc["created_at"]
    )

async def get_member_profile_data(current_user: Optional[dict], member_id: Optional[str]) -> Optional[dict]:
    """Extract scan personalization data for the primary user, local child profile, or linked family user."""
    if not current_user:
        return None

    if member_id:
        members = current_user.get("family_members", [])
        member = next((m for m in members if m["id"] == member_id), None)
        if member:
            return {
                "name": member["name"],
                "allergies": member.get("allergies", []),
                "medical_conditions": member.get("medical_conditions", []),
                "health_goals": [],
                "biometrics": None
            }

        if member_id in current_user.get("linked_family_members", []):
            try:
                linked_user = await users_col.find_one({"_id": ObjectId(member_id)})
                if linked_user:
                    return {
                        "name": linked_user.get("name", ""),
                        "email": linked_user.get("email"),
                        "allergies": linked_user.get("allergies", []),
                        "health_goals": linked_user.get("health_goals", []),
                        "biometrics": linked_user.get("biometrics"),
                        "medical_conditions": linked_user.get("medical_conditions", [])
                    }
            except Exception:
                return None

        return None

    return {
        "name": current_user["name"],
        "email": current_user.get("email"),
        "allergies": current_user.get("allergies", []),
        "health_goals": current_user.get("health_goals", []),
        "biometrics": current_user.get("biometrics"),
        "medical_conditions": current_user.get("medical_conditions", [])
    }

@router.post("/upload", response_model=ScanDB)
async def upload_scan(
    payload: ScanUpload, 
    member_id: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    # Parse and validate base64
    clean_b64, mime = parse_base64_image(payload.image_base64)
    
    # Generate filename
    ext = mime.split("/")[-1] if "/" in mime else "jpg"
    filename = f"scan_{int(datetime.utcnow().timestamp())}.{ext}"

    profile_data = await get_member_profile_data(current_user, member_id)

    # Call Gemini image analysis service with profile context
    analysis_result = await analyze_label_image(clean_b64, mime, profile_data)

    # Save report to DB
    scan_doc = {
        "user_id": current_user["id"] if current_user else None,
        "member_id": member_id,
        "filename": filename,
        "mime": mime,
        "result": analysis_result,
        "created_at": datetime.utcnow()
    }
    
    res = await scans_col.insert_one(scan_doc)
    scan_doc["_id"] = res.inserted_id

    return format_scan_db(scan_doc)

def evaluate_product_rule_based(product_payload: dict, profile_data: Optional[dict] = None) -> dict:
    """
    Evaluates product details fetched from the barcode API without calling any LLMs.
    Performs deterministic, rule-based ingredient checks, allergen comparisons,
    and budget calculations.
    """
    product_name = product_payload.get("product_name") or "Unknown Product"
    ingredients = product_payload.get("ingredients") or ""
    nutrients = product_payload.get("nutrients", {})

    # Extract nutrient values
    calories = nutrients.get("calories")
    sugars = nutrients.get("sugars")
    fat = nutrients.get("fat")
    sat_fat = nutrients.get("saturated_fat")
    protein = nutrients.get("protein")
    sodium = nutrients.get("sodium")
    fiber = nutrients.get("fiber")

    # Float conversion
    def to_float(val):
        try:
            return float(val) if val is not None else 0.0
        except ValueError:
            return 0.0

    sugars_val = to_float(sugars)
    sat_fat_val = to_float(sat_fat)
    protein_val = to_float(protein)
    sodium_val = to_float(sodium)
    fiber_val = to_float(fiber)

    # 1. Warnings calculation
    high_sugar = sugars_val > 15.0
    high_saturated_fat = sat_fat_val > 5.0
    high_sodium = sodium_val > 500.0

    # 2. Rule-based allergen check
    allergens_detected = []
    user_allergies = []
    user_conditions = []
    
    if profile_data:
        user_allergies = profile_data.get("allergies", [])
        user_conditions = profile_data.get("medical_conditions", [])

    ingredients_lower = ingredients.lower()
    
    # Keyword map for common allergies
    allergy_keywords = {
        "Dairy": ["milk", "lactose", "cheese", "whey", "butter", "yogurt", "cream", "casein"],
        "Gluten": ["wheat", "barley", "rye", "gluten", "malt", "flour"],
        "Peanuts": ["peanut", "groundnut"],
        "Soy": ["soy", "soya", "lecithin"],
        "Tree Nuts": ["almond", "walnut", "cashew", "pecan", "pistachio", "macadamia", "hazelnut"],
        "Eggs": ["egg", "albumen", "yolk"],
        "Fish": ["fish", "salmon", "tuna", "cod", "anchovy"],
        "Shellfish": ["shrimp", "crab", "lobster", "prawn", "oyster", "clam", "mussel"],
        "Sesame": ["sesame", "tahini"]
    }

    for allergy in user_allergies:
        keywords = allergy_keywords.get(allergy, [allergy.lower()])
        for kw in keywords:
            if kw in ingredients_lower:
                allergens_detected.append(allergy)
                break

    # 3. Additive hazard auditing
    additives_list = []
    # Parse E-numbers from ingredients
    e_numbers = re.findall(r'\b[eE]\s?\d{3,4}\b', ingredients)
    
    ADDITIVES_DB = {
        "e621": ("MSG (Monosodium Glutamate)", "High", "Flavor enhancer linked to metabolic sensitivity."),
        "e102": ("Tartrazine (Yellow 5)", "High", "Artificial dye linked to hyperactivity in kids."),
        "e110": ("Sunset Yellow (Yellow 6)", "High", "Artificial dye restricted in Europe."),
        "e129": ("Allura Red (Red 40)", "High", "Synthetic food dye with potential hazard warnings."),
        "e211": ("Sodium Benzoate", "Moderate", "Common preservative that can form benzene in acidic environments."),
        "e202": ("Potassium Sorbate", "Low", "Standard preservative widely used to inhibit mold."),
        "e322": ("Lecithins", "Low", "Natural fat emulsifier derived from soy or sunflower."),
        "e330": ("Citric Acid", "Low", "Natural organic acid used as preservative and acidulant."),
        "e500": ("Sodium Carbonates", "Low", "Leavening agent (baking soda). Safe.")
    }

    unique_e = set(e.strip().lower().replace(" ", "") for e in e_numbers)
    for e_code in unique_e:
        if e_code in ADDITIVES_DB:
            name, hazard, desc = ADDITIVES_DB[e_code]
            additives_list.append({
                "name": f"{e_code.upper()} ({name})",
                "hazard": hazard,
                "description": desc
            })

    # Also parse common chemical names
    chemical_names = [
        ("high fructose corn syrup", "High Fructose Corn Syrup", "High", "Highly processed sweetener linked to fatty liver."),
        ("palm oil", "Palm Oil", "Moderate", "Saturated fat associated with environmental and cardiovascular concerns."),
        ("aspartame", "Aspartame", "High", "Artificial sweetener under research for metabolic issues."),
        ("sucralose", "Sucralose", "Moderate", "Artificial sweetener that may impact gut health."),
        ("sodium nitrite", "Sodium Nitrite", "High", "Preservative used in cured meats; potential carcinogen."),
        ("carrageenan", "Carrageenan", "Moderate", "Thickener linked to digestive inflammation.")
    ]

    for kw_check, chem_name, haz, desc in chemical_names:
        if kw_check in ingredients_lower:
            # Check if already added
            if not any(a["name"] == chem_name for a in additives_list):
                additives_list.append({
                    "name": chem_name,
                    "hazard": haz,
                    "description": desc
                })

    # 4. Score calculation (Starts at 100)
    score = 100
    
    # Sugar deductions
    if high_sugar:
        score -= 20
    elif sugars_val > 5.0:
        score -= 8
        
    # Sodium deductions
    if high_sodium:
        score -= 20
    elif sodium_val > 200.0:
        score -= 8

    # Saturated fat deductions
    if high_saturated_fat:
        score -= 15
    elif sat_fat_val > 2.0:
        score -= 6

    # Medical conditions adjustments
    if "Type 2 Diabetes" in user_conditions and sugars_val > 8.0:
        score -= 15
    if "Hypertension" in user_conditions and sodium_val > 300.0:
        score -= 15

    # Allergen deductions (Critical safety warning!)
    if len(allergens_detected) > 0:
        score -= 30

    # Additives deductions
    for add in additives_list:
        if add["hazard"] == "High":
            score -= 10
        elif add["hazard"] == "Moderate":
            score -= 5
        else:
            score -= 2

    # Beneficial nutrient additions
    if fiber_val > 3.0:
        score += 8
    if protein_val > 8.0:
        score += 8

    # Clamp score
    score = max(0, min(100, score))

    # Grade allocation
    if score >= 90:
        grade = "A"
        color = "#22c55e"
    elif score >= 75:
        grade = "B"
        color = "#22c55e"
    elif score >= 60:
        grade = "C"
        color = "#eab308"
    elif score >= 45:
        grade = "D"
        color = "#eab308"
    else:
        grade = "F"
        color = "#ef4444"

    # 5. Ingredient category audit
    ingredients_list = [i.strip() for i in ingredients.split(",") if i.strip()]
    beneficial_ing = []
    avoid_ing = []
    neutral_ing = []

    beneficial_keywords = ["oats", "almond", "chia", "flax", "seed", "organic", "fruit", "berries", "coconut", "quinoa", "honey"]
    avoid_keywords = ["sugar", "syrup", "hydrogenated", "msg", "artificial", "color", "preservative", "nitrate", "nitrite", "aspartame", "sucralose"]

    for ing in ingredients_list:
        ing_lower = ing.lower()
        if any(kw in ing_lower for kw in avoid_keywords):
            avoid_ing.append(ing)
        elif any(kw in ing_lower for kw in beneficial_keywords):
            beneficial_ing.append(ing)
        else:
            neutral_ing.append(ing)

    # 6. Generate summary explanation
    warnings_list = []
    if high_sugar: warnings_list.append("high sugar")
    if high_sodium: warnings_list.append("excessive sodium")
    if high_saturated_fat: warnings_list.append("high saturated fats")
    if len(allergens_detected) > 0: warnings_list.append(f"allergens ({', '.join(allergens_detected)})")

    if score >= 80:
        summary = f"This product is an excellent healthy choice. It features low sugar and clean ingredients, making it a great snack to log in your budget."
    elif score >= 60:
        summary = f"This product is a moderate snack choice. It is generally safe, but should be consumed in moderation due to {', '.join(warnings_list) if warnings_list else 'minor nutritional values'}."
    else:
        summary = f"This product is not recommended. It has low nutritional value and contains {', '.join(warnings_list) if warnings_list else 'highly processed ingredients'}."

    # 7. Alternatives mapping
    alternatives = [
        {"name": "Organic Almonds & Walnuts Mix", "description": "Provides natural proteins, clean dietary fibers, and heart-healthy unsaturated fats."},
        {"name": "Whole Wheat crackers with Hummus", "description": "Excellent high-fiber alternative that sustains energy without glycemic spikes."}
    ]

    return {
        "product_name": product_name,
        "health_rating": score,
        "health_grade": grade,
        "grade_color": color,
        "summary": summary,
        "nutrients": {
            "calories": calories,
            "sugars": sugars,
            "fat": fat,
            "saturated_fat": sat_fat,
            "protein": protein,
            "sodium": sodium,
            "fiber": fiber
        },
        "warnings": {
            "high_sugar": high_sugar,
            "high_sodium": high_sodium,
            "high_saturated_fat": high_saturated_fat,
            "allergens": allergens_detected,
            "additives": additives_list
        },
        "ingredients_analysis": {
            "beneficial": beneficial_ing,
            "neutral": neutral_ing,
            "avoid": avoid_ing
        },
        "healthier_alternatives": alternatives
    }

@router.get("/barcode/{code}", response_model=ScanDB)
async def scan_barcode(
    code: str,
    member_id: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Looks up a product barcode in Open Food Facts, maps it to ingredients/nutrients, 
    and evaluates it using a local rule-based system (completely offline, bypassing AI).
    """
    url = f"https://world.openfoodfacts.org/api/v0/product/{code}.json"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error querying barcode database: {str(e)}"
        )

    if data.get("status") != 1 or "product" not in data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product barcode not found in database. Try taking a photo of the label instead!"
        )

    product = data["product"]
    product_name = product.get("product_name") or product.get("product_name_en") or "Unknown Product"
    ingredients = product.get("ingredients_text") or product.get("ingredients_text_en") or ""
    nutriments = product.get("nutriments", {})

    # Extract nutrients in per 100g format, mapping standard properties
    sugars = nutriments.get("sugars_100g")
    sodium = nutriments.get("sodium_100g")
    if sodium is not None:
        sodium = float(sodium) * 1000.0 # Convert g to mg

    product_payload = {
        "product_name": product_name,
        "ingredients": ingredients,
        "nutrients": {
            "calories": nutriments.get("energy-kcal_100g"),
            "sugars": sugars,
            "fat": nutriments.get("fat_100g"),
            "saturated_fat": nutriments.get("saturated-fat_100g"),
            "protein": nutriments.get("proteins_100g"),
            "sodium": sodium,
            "fiber": nutriments.get("fiber_100g")
        }
    }

    profile_data = await get_member_profile_data(current_user, member_id)

    # Analyze raw database values via local rule-based engine (bypassing AI/Gemini)
    analysis_result = evaluate_product_rule_based(product_payload, profile_data)

    # Save to history database
    scan_doc = {
        "user_id": current_user["id"] if current_user else None,
        "member_id": member_id,
        "filename": f"barcode_{code}.txt",
        "mime": "text/plain",
        "result": analysis_result,
        "created_at": datetime.utcnow()
    }

    res = await scans_col.insert_one(scan_doc)
    scan_doc["_id"] = res.inserted_id

    return format_scan_db(scan_doc)

@router.get("/search")
async def search_products(
    query: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    country: Optional[str] = Query(None, description="Optional country filter, e.g. india"),
    member_id: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Queries Open Food Facts for products matching `query` by name or barcode.
    - If query looks like a barcode (all digits, 8-14 chars), uses the direct product API.
    - Otherwise uses the v2 search API.
    Returns empty list gracefully on upstream errors instead of propagating them.
    """
    from urllib.parse import quote

    headers = {
        "User-Agent": "SnackCheck/1.0 (health tracking app)",
        "Accept": "application/json"
    }

    profile_data = await get_member_profile_data(current_user, member_id)
    products_raw = []

    query_stripped = query.strip()
    is_barcode = query_stripped.isdigit() and 8 <= len(query_stripped) <= 14

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            if is_barcode:
                # Direct barcode lookup — much more reliable than search
                url = f"https://world.openfoodfacts.org/api/v2/product/{query_stripped}.json?fields=code,product_name,product_name_en,brands,image_front_small_url,image_front_url,ingredients_text,ingredients_text_en,nutriments,nutriscore_grade,allergens_tags,additives_tags,quantity,countries_tags"
                r = await client.get(url, headers=headers)
                if r.status_code == 200:
                    data = r.json()
                    if data.get("status") == 1 and "product" in data:
                        products_raw = [data["product"]]
            else:
                # v1 search API (properly handles free text search)
                encoded = quote(query_stripped)
                url = (
                    f"https://world.openfoodfacts.org/cgi/search.pl"
                    f"?search_terms={encoded}"
                    f"&search_simple=1&action=process&json=1"
                    f"&page_size=16&page={page}"
                    f"&fields=code,product_name,product_name_en,brands,"
                    f"image_front_small_url,image_front_url,ingredients_text,"
                    f"ingredients_text_en,nutriments,nutriscore_grade,"
                    f"allergens_tags,additives_tags,quantity,countries_tags"
                )
                if country:
                    url += f"&countries_tags_en={quote(country.strip().lower())}"
                r = await client.get(url, headers=headers)
                if r.status_code == 200:
                    data = r.json()
                    products_raw = data.get("products", [])
                # On any non-200 (503, 429, etc.) we just return empty — no crash
    except Exception:
        # Network timeout or connection error — return empty gracefully
        products_raw = []

    results = []
    for p in products_raw:
        if country:
            country_tags = [str(tag).lower() for tag in p.get("countries_tags", [])]
            country_text = " ".join(country_tags)
            if country.strip().lower() not in country_text:
                continue

        product_name = (
            p.get("product_name")
            or p.get("product_name_en")
            or ""
        )
        if not product_name and not p.get("code"):
            continue

        product_name = product_name or "Unknown Product"
        ingredients = p.get("ingredients_text") or p.get("ingredients_text_en") or ""
        nutriments = p.get("nutriments", {})
        sodium = nutriments.get("sodium_100g")
        if sodium is not None:
            sodium = float(sodium) * 1000.0

        payload = {
            "product_name": product_name,
            "ingredients": ingredients,
            "nutrients": {
                "calories": nutriments.get("energy-kcal_100g"),
                "sugars": nutriments.get("sugars_100g"),
                "fat": nutriments.get("fat_100g"),
                "saturated_fat": nutriments.get("saturated-fat_100g"),
                "protein": nutriments.get("proteins_100g"),
                "sodium": sodium,
                "fiber": nutriments.get("fiber_100g")
            }
        }

        analysis = evaluate_product_rule_based(payload, profile_data)
        analysis["image_url"] = p.get("image_front_small_url") or p.get("image_front_url")
        analysis["barcode"] = p.get("code", "")
        analysis["brand"] = p.get("brands", "")
        analysis["quantity"] = p.get("quantity", "")
        results.append(analysis)

    return {
        "count": len(results),
        "page": page,
        "query": query,
        "products": results
    }


@router.get("/history", response_model=List[ScanDB])
async def get_scan_history(
    member_id: Optional[str] = Query(None, description="Optional family member ID to query"),
    current_user: dict = Depends(get_current_user)
):
    """Retrieves all scans associated with the logged-in user or a specific family member, newest first."""
    if member_id:
        if member_id in current_user.get("linked_family_members", []):
            query = {
                "$or": [
                    {"user_id": current_user["id"], "member_id": member_id},
                    {"user_id": member_id, "member_id": None},
                    {"user_id": member_id, "member_id": member_id}
                ]
            }
        else:
            query = {
                "user_id": current_user["id"],
                "member_id": member_id
            }
    else:
        query = {
            "user_id": current_user["id"],
            "member_id": None
        }

    cursor = scans_col.find(query).sort("created_at", -1)
    scans = await cursor.to_list(length=100)
    return [format_scan_db(s) for s in scans]

@router.get("/{scan_id}", response_model=ScanDB)
async def get_scan_by_id(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieves a specific scan document, ensuring user ownership."""
    try:
        obj_id = ObjectId(scan_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid scan ID format."
        )

    scan = await scans_col.find_one({"_id": obj_id})
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan record not found."
        )

    # Ensure current user owns it
    if scan.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this scan."
        )

    return format_scan_db(scan)

@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    """Deletes a scan document from user history."""
    try:
        obj_id = ObjectId(scan_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid scan ID format."
        )

    scan = await scans_col.find_one({"_id": obj_id})
    if not scan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scan record not found."
        )

    # Ensure ownership
    if scan.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this scan."
        )

    await scans_col.delete_one({"_id": obj_id})
    return
