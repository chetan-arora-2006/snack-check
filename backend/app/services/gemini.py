import httpx
import json
import asyncio
import random
from app.core.config import settings
import logging

logger = logging.getLogger("snackcheck")

async def analyze_label_image(base64_image: str, mime_type: str, user_profile: dict = None) -> dict:
    """
    Sends the base64-encoded image of the food label to Gemini API.
    Injects the active user's profile settings to return custom grades, warning indicators, and allergen alerts.
    """
    has_api_key = (
        settings.gemini_api_key 
        and settings.gemini_api_key != "YOUR_GEMINI_API_KEY_HERE"
        and settings.gemini_api_key != "your_gemini_api_key_here"
    )

    if not has_api_key:
        logger.warning("No valid GEMINI_API_KEY found. Running mock analysis simulation...")
        await asyncio.sleep(2.0)
        return get_mock_analysis(user_profile)

    # API Request configuration for Gemini 2.5 Flash
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
    
    prompt = (
        "Analyze this food label/product image. Perform OCR on the ingredients list, analyze the nutritional facts, "
        "and return a highly structured analysis report in JSON format. Do not wrap in markdown quotes. The JSON must match this structure exactly:\n"
        "{\n"
        '  "product_name": "Name of product (estimated from packaging)",\n'
        '  "health_rating": 85, // Integer score from 0 (worst) to 100 (best)\n'
        '  "health_grade": "A", // One of: A+, A, B, C, D, F\n'
        '  "grade_color": "#22c55e", // Hex code corresponding to grade: Green for A/B (#22c55e), Yellow/Orange for C/D (#eab308), Red for F (#ef4444)\n'
        '  "summary": "A 2-3 sentence overview explaining why this rating was given.",\n'
        '  "nutrients": {\n'
        '    "calories": 350.0, // kcal per 100g/ml (or null if not found)\n'
        '    "sugars": 12.5, // grams per 100g (or null)\n'
        '    "fat": 8.0, // grams per 100g (or null)\n'
        '    "saturated_fat": 1.2, // grams per 100g (or null)\n'
        '    "protein": 10.0, // grams per 100g (or null)\n'
        '    "sodium": 340.0, // mg per 100g (or null)\n'
        '    "fiber": 6.5 // grams per 100g (or null)\n'
        "  },\n"
        '  "warnings": {\n'
        '    "high_sugar": false, // true if sugar is > 15g per 100g\n'
        '    "high_sodium": false, // true if sodium is > 500mg per 100g\n'
        '    "high_saturated_fat": false, // true if saturated fat is > 5g per 100g\n'
        '    "allergens": ["Gluten", "Dairy"], // list of any allergens detected (e.g. Gluten, Dairy, Peanuts, Soy, Tree Nuts, Eggs, Fish)\n'
        '    "additives": [\n'
        "      {\n"
        '        "name": "E621 (Monosodium Glutamate)",\n'
        '        "hazard": "Moderate", // Low, Moderate, High\n'
        '        "description": "Flavor enhancer that may cause sensitivity in some individuals."\n'
        "      }\n"
        "    ]\n"
        "  },\n"
        '  "ingredients_analysis": {\n'
        '    "beneficial": ["Whole Grain Oats", "Chia Seeds"], // ingredients that are healthy\n'
        '    "neutral": ["Water", "Salt", "Corn Starch"],\n'
        '    "avoid": ["High Fructose Corn Syrup", "Palm Oil"] // ingredients linked to health issues\n'
        "  },\n"
        '  "healthier_alternatives": [\n'
        "    {\n"
        '      "name": "Alternative Snack Name",\n'
        '      "description": "Short explanation of why it is healthier."\n'
        "    }\n"
        "  ]\n"
        "}"
    )

    if user_profile:
        prompt += (
            f"\n\nIMPORTANT: Evaluate this product specifically for a user with this health profile:\n"
            f"- Allergies: {', '.join(user_profile.get('allergies', [])) or 'None'}\n"
            f"- Medical Conditions: {', '.join(user_profile.get('medical_conditions', [])) or 'None'}\n"
            f"- Dietary/Health Goals: {', '.join(user_profile.get('health_goals', [])) or 'None'}\n"
        )
        biometrics = user_profile.get("biometrics")
        if biometrics:
            prompt += f"- User Biometrics: Age {biometrics.get('age', 'N/A')}, Gender {biometrics.get('gender', 'N/A')}, Height {biometrics.get('height_cm', 'N/A')}cm, Weight {biometrics.get('weight_kg', 'N/A')}kg\n"
        
        prompt += (
            "\nBased on this profile, adjust the 'health_rating' and 'health_grade' dynamically:\n"
            "1. If an ingredient matches any of the user's allergies, set 'health_grade' to 'F', 'health_rating' to 0, color to '#ef4444', and explicitly list it in the warnings.allergens list.\n"
            "2. If they have Diabetes, penalize added sugars and refined carbohydrates heavily (lower rating/grade by 30+ points).\n"
            "3. If they have Hypertension, penalize sodium and salt heavily.\n"
            "4. Add a tailored message explaining why the grade was adjusted specifically for their profile in the 'summary'."
        )

    headers = {"Content-Type": "application/json"}
    
    img_data = base64_image
    if "," in base64_image:
        img_data = base64_image.split(",")[1]

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {
                        "inlineData": {
                            "mimeType": mime_type,
                            "data": img_data
                        }
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            parsed_json = json.loads(text_response)
            return parsed_json
            
    except Exception as e:
        logger.error(f"Gemini API error: {e}. Falling back to mock data.")
        return get_mock_analysis(user_profile)


async def chat_with_health_coach(chat_history: list, user_profile: dict, recent_scans: list) -> str:
    """
    Sends user profile details, recent scans, and message history to Gemini 
    to obtain a helpful, dietitian-style coaching response.
    """
    has_api_key = (
        settings.gemini_api_key 
        and settings.gemini_api_key != "YOUR_GEMINI_API_KEY_HERE"
        and settings.gemini_api_key != "your_gemini_api_key_here"
    )

    if not has_api_key:
        await asyncio.sleep(1.2)
        return get_mock_chatbot_response(chat_history, user_profile)

    # Compile system context prompt
    scans_summary = []
    for s in recent_scans[:5]:
        res = s.get("result", {})
        scans_summary.append(f"- {res.get('product_name')} (Grade: {res.get('health_grade')}, Score: {res.get('health_rating')}/100)")
    
    scans_txt = "\n".join(scans_summary) if scans_summary else "No scans logged yet."

    system_prompt = (
        "You are 'SnackCheck Health Coach', an empathetic, professional registered dietitian AI assistant. "
        "Your goal is to guide the user in making healthier snack choices based on their biometrics, health conditions, and scan history. "
        "Keep your answers friendly, encouraging, scientifically accurate, and concise (under 4 sentences).\n\n"
        "Here is the user's current health profile:\n"
        f"- Allergies: {', '.join(user_profile.get('allergies', [])) or 'None'}\n"
        f"- Medical Conditions: {', '.join(user_profile.get('medical_conditions', [])) or 'None'}\n"
        f"- Health Goals: {', '.join(user_profile.get('health_goals', [])) or 'None'}\n"
    )
    biometrics = user_profile.get("biometrics")
    if biometrics:
        system_prompt += f"- Biometrics: Age {biometrics.get('age', 'N/A')}, Gender {biometrics.get('gender', 'N/A')}, Height {biometrics.get('height_cm', 'N/A')}cm, Weight {biometrics.get('weight_kg', 'N/A')}kg\n"
    
    system_prompt += f"\nHere are their recent evaluated snacks:\n{scans_txt}\n\n"
    system_prompt += "Respond to the user's latest query, keeping the previous conversation in mind."

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
    
    contents = [
        {
            "role": "user",
            "parts": [{"text": f"SYSTEM INSTRUCTION: {system_prompt}\n\nHello Health Coach!"}]
        },
        {
            "role": "model",
            "parts": [{"text": "Hello! I am your SnackCheck Health Coach. How can I help you optimize your snacks today?"}]
        }
    ]

    for msg in chat_history:
        contents.append({
            "role": "user" if msg.get("sender") == "user" else "model",
            "parts": [{"text": msg.get("text", "")}]
        })

    headers = {"Content-Type": "application/json"}
    payload = {"contents": contents}

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            return result['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        logger.error(f"Chatbot Gemini API error: {e}")
        return "I'm sorry, I encountered an issue connecting to my nutrition knowledge base. Please try asking again in a moment!"


def get_mock_analysis(user_profile: dict = None) -> dict:
    """Returns a randomized mock analysis adjusted to the user's profile settings."""
    scans = [
        # Product 1: Bad Grade
        {
            "product_name": "Crunchy Choco Sandwich Cookies",
            "health_rating": 28,
            "health_grade": "F",
            "grade_color": "#ef4444",
            "summary": "This product receives an F rating due to excessive added sugars, high saturated fat content, and hydrogenated oils. It offers negligible dietary fiber or micronutrients.",
            "nutrients": {
                "calories": 480.0,
                "sugars": 38.0,
                "fat": 22.0,
                "saturated_fat": 11.5,
                "protein": 4.5,
                "sodium": 290.0,
                "fiber": 1.2
            },
            "warnings": {
                "high_sugar": True,
                "high_sodium": False,
                "high_saturated_fat": True,
                "allergens": ["Gluten", "Dairy", "Soy"],
                "additives": [
                    {
                        "name": "Soy Lecithin",
                        "hazard": "Low",
                        "description": "Emulsifier used to keep ingredients bound; generally safe."
                    },
                    {
                        "name": "High Fructose Corn Syrup",
                        "hazard": "High",
                        "description": "Processed sweetener linked to insulin resistance and obesity."
                    }
                ]
            },
            "ingredients_analysis": {
                "beneficial": ["Cocoa Powder (processed with alkali)"],
                "neutral": ["Wheat Flour", "Water", "Salt", "Baking Soda"],
                "avoid": ["Sugar", "Hydrogenated Palm Oil", "High Fructose Corn Syrup", "Artificial Flavoring"]
            },
            "healthier_alternatives": [
                {
                    "name": "Roasted Almonds with Dark Chocolate Drizzle",
                    "description": "Provides natural protein and heart-healthy fats with 80% less sugar."
                },
                {
                    "name": "Organic Oat Cookies sweetened with Dates",
                    "description": "High in fiber and vitamins, avoiding synthetic syrups and processed oils."
                }
            ]
        },
        # Product 2: Good Grade
        {
            "product_name": "Harvest Flaxseed & Chia Oatmeal",
            "health_rating": 92,
            "health_grade": "A",
            "grade_color": "#22c55e",
            "summary": "An excellent healthy option. Rich in complex carbohydrates, heart-healthy Omega-3 fats from chia/flax seeds, and packed with gut-healthy dietary fiber with zero artificial additives.",
            "nutrients": {
                "calories": 320.0,
                "sugars": 2.0,
                "fat": 5.8,
                "saturated_fat": 0.6,
                "protein": 11.0,
                "sodium": 45.0,
                "fiber": 8.5
            },
            "warnings": {
                "high_sugar": False,
                "high_sodium": False,
                "high_saturated_fat": False,
                "allergens": ["Gluten"],
                "additives": []
            },
            "ingredients_analysis": {
                "beneficial": ["Whole Grain Rolled Oats", "Flaxseed Meal", "Chia Seeds", "Pumpkin Seeds"],
                "neutral": ["Salt", "Natural Cinnamon Extract"],
                "avoid": []
            },
            "healthier_alternatives": [
                {
                    "name": "Steel Cut Oats with Fresh Blueberries",
                    "description": "Even higher density of antioxidants and minerals."
                }
            ]
        },
        # Product 3: Moderate Grade
        {
            "product_name": "Baked Tangy Sea Salt Veggie Straws",
            "health_rating": 62,
            "health_grade": "C",
            "grade_color": "#eab308",
            "summary": "A moderate snack option. Although lower in fat than standard fried potato chips, this product is heavily refined and contains high amounts of sodium with very little protein or fiber.",
            "nutrients": {
                "calories": 420.0,
                "sugars": 3.5,
                "fat": 15.0,
                "saturated_fat": 1.8,
                "protein": 2.0,
                "sodium": 780.0,
                "fiber": 1.5
            },
            "warnings": {
                "high_sugar": False,
                "high_sodium": True,
                "high_saturated_fat": False,
                "allergens": [],
                "additives": [
                    {
                        "name": "Citric Acid",
                        "hazard": "Low",
                        "description": "Natural preservative used for tart flavor; safe."
                    }
                ]
            },
            "ingredients_analysis": {
                "beneficial": ["Spinach Powder", "Tomato Paste"],
                "neutral": ["Potato Flour", "Corn Starch", "Sunflower Oil", "Sea Salt"],
                "avoid": ["Maltodextrin"]
            },
            "healthier_alternatives": [
                {
                    "name": "Air-Popped Salted Popcorn",
                    "description": "Whole grain alternative with 90% less processing and higher fiber."
                },
                {
                    "name": "Home-Baked Kale Chips",
                    "description": "Provides raw nutrients, vitamins A & C, and eliminates excess sodium/starches."
                }
            ]
        }
    ]
    
    selected = random.choice(scans)
    
    # Apply personalization adjustments dynamically
    if user_profile:
        allergies = [a.lower() for a in user_profile.get("allergies", [])]
        medical_conditions = [m.lower() for m in user_profile.get("medical_conditions", [])]
        
        # 1. Allergy check
        conflicting_allergies = []
        for allergen in selected["warnings"]["allergens"]:
            if allergen.lower() in allergies:
                conflicting_allergies.append(allergen)
                
        # Inject matching profile allergies even if not originally in mock
        for allergy in user_profile.get("allergies", []):
            if allergy.lower() in selected["product_name"].lower() or any(allergy.lower() in ing.lower() for ing in selected["ingredients_analysis"]["neutral"]):
                if allergy not in conflicting_allergies:
                    conflicting_allergies.append(allergy)
                    selected["warnings"]["allergens"].append(allergy)
        
        if conflicting_allergies:
            selected["health_rating"] = 0
            selected["health_grade"] = "F"
            selected["grade_color"] = "#ef4444"
            selected["summary"] = f"CRITICAL WARNING: This snack contains {', '.join(conflicting_allergies)}, which matches your user allergy profile. Consuming this product poses a direct health hazard."
            return selected

        # 2. Medical Conditions Check
        # Diabetic check
        if "diabetes" in "".join(medical_conditions) or "diabetic" in "".join(medical_conditions):
            if selected["nutrients"]["sugars"] > 10.0:
                selected["health_rating"] = max(10, selected["health_rating"] - 35)
                selected["health_grade"] = "F" if selected["health_rating"] < 35 else "D"
                selected["grade_color"] = "#ef4444"
                selected["summary"] = f"Diabetic Alert: Penalized due to high sugar content ({selected['nutrients']['sugars']}g/100g). Consuming high glycemic index snacks can lead to rapid blood glucose spikes."

        # Hypertension check
        if "hypertension" in "".join(medical_conditions) or "blood pressure" in "".join(medical_conditions):
            if selected["nutrients"]["sodium"] > 400.0:
                selected["health_rating"] = max(10, selected["health_rating"] - 30)
                selected["health_grade"] = "F" if selected["health_rating"] < 35 else "D"
                selected["grade_color"] = "#ef4444"
                selected["summary"] = f"Hypertension Alert: Penalized due to high sodium content ({selected['nutrients']['sodium']}mg/100g). High sodium diets directly contribute to elevated arterial blood pressure."

    return selected


def get_mock_chatbot_response(chat_history: list, user_profile: dict) -> str:
    """Generates an automated dietitian response based on chat input and user profile details."""
    last_msg = chat_history[-1].get("text", "").lower() if chat_history else ""
    
    allergies = user_profile.get("allergies", [])
    conditions = user_profile.get("medical_conditions", [])
    goals = user_profile.get("health_goals", [])

    if "hello" in last_msg or "hi" in last_msg:
        return f"Hello {user_profile.get('name', 'there')}! I'm your SnackCheck AI Health Coach. Based on your profile, I'm monitoring for {', '.join(allergies) or 'no severe allergies'} and aiming to help you with {', '.join(goals) or 'overall nutrition'}. How can I assist you today?"
    
    if "allergy" in last_msg or "allergies" in last_msg:
        if allergies:
            return f"Your profile is configured to flag: {', '.join(allergies)}. If you scan any product containing these, our scanner will immediately mark it with a red F warning grade. Would you like to add more items to this list?"
        else:
            return "You haven't listed any allergies in your profile settings yet. You can navigate to the Settings tab to configure specific allergens like gluten, dairy, or peanuts so I can flag them for you."
            
    if "sugar" in last_msg or "diabetes" in last_msg or "diabetic" in last_msg:
        if "Type 2 Diabetes" in conditions or "Low Sugar" in goals:
            return "Since your profile is set for sugar management, I recommend keeping your daily added sugar intake under 25-30g. Avoid foods with syrups, molasses, or dextrose listed in the top three ingredients."
        else:
            return "Managing sugar is a great way to stabilize energy levels. For healthy snacks, try to choose options with less than 5g of sugar per serving, and favor complex carbs combined with fiber."

    if "sodium" in last_msg or "salt" in last_msg or "hypertension" in last_msg:
        return "To keep blood pressure healthy, try to limit sodium to under 140mg per serving (or 500mg per 100g). Baked snacks and processed grains often contain hidden sodium, so always scan the nutritional table!"

    # Default general response
    responses = [
        "That is a great question! Optimizing your snacks plays a major role in keeping your metabolism stable. Try combining a complex fiber (like oats or seeds) with a healthy fat (like almonds) to stay full longer.",
        "Based on your profile, the best snacking strategy is to look for whole-food ingredients. If the label contains more than 5 chemical names you cannot pronounce, it's generally best to avoid it.",
        "Remember that healthy eating is about consistency! Your recent scans have been logged, and your dashboard budget metrics are tracking your caloric, sugar, and sodium totals for the day."
    ]
    return random.choice(responses)


async def analyze_label_text(product_data: dict, user_profile: dict = None) -> dict:
    """
    Sends raw ingredients and nutrient values fetched from the barcode database 
    to Gemini API and requests a structured JSON health rating report.
    """
    has_api_key = (
        settings.gemini_api_key 
        and settings.gemini_api_key != "YOUR_GEMINI_API_KEY_HERE"
        and settings.gemini_api_key != "your_gemini_api_key_here"
    )

    if not has_api_key:
        logger.warning("No valid GEMINI_API_KEY found. Running mock analysis simulation for barcode...")
        await asyncio.sleep(1.0)
        mock_data = get_mock_analysis(user_profile)
        mock_data["product_name"] = product_data.get("product_name", mock_data["product_name"])
        return mock_data

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={settings.gemini_api_key}"
    
    prompt = (
        f"Analyze this food product. Here are its details:\n"
        f"- Product Name: {product_data.get('product_name')}\n"
        f"- Ingredients Text: {product_data.get('ingredients')}\n"
        f"- Nutrients (per 100g/ml): {json.dumps(product_data.get('nutrients'))}\n\n"
        "Evaluate this product and return a structured JSON report in this format (no markdown formatting):\n"
        "{\n"
        '  "product_name": "Name of product",\n'
        '  "health_rating": 85,\n'
        '  "health_grade": "A",\n'
        '  "grade_color": "#22c55e",\n'
        '  "summary": "2-3 sentences explaining why.",\n'
        '  "nutrients": {\n'
        '    "calories": 350.0,\n'
        '    "sugars": 12.5,\n'
        '    "fat": 8.0,\n'
        '    "saturated_fat": 1.2,\n'
        '    "protein": 10.0,\n'
        '    "sodium": 340.0,\n'
        '    "fiber": 6.5\n'
        "  },\n"
        '  "warnings": {\n'
        '    "high_sugar": false,\n'
        '    "high_sodium": false,\n'
        '    "high_saturated_fat": false,\n'
        '    "allergens": ["Gluten"],\n'
        '    "additives": [{"name": "...", "hazard": "...", "description": "..."}]\n'
        "  },\n"
        '  "ingredients_analysis": {\n'
        '    "beneficial": [], "neutral": [], "avoid": []\n'
        "  },\n"
        '  "healthier_alternatives": [{"name": "...", "description": "..."}]\n'
        "}"
    )

    if user_profile:
        prompt += (
            f"\n\nIMPORTANT: Evaluate this product specifically for a user with this health profile:\n"
            f"- Allergies: {', '.join(user_profile.get('allergies', [])) or 'None'}\n"
            f"- Medical Conditions: {', '.join(user_profile.get('medical_conditions', [])) or 'None'}\n"
            f"- Dietary/Health Goals: {', '.join(user_profile.get('health_goals', [])) or 'None'}\n"
            "Adjust the health rating, grade, and summary accordingly."
        )

    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"}
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            result = response.json()
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            return json.loads(text_response)
    except Exception as e:
        logger.error(f"Gemini text analysis error: {e}")
        mock_data = get_mock_analysis(user_profile)
        mock_data["product_name"] = product_data.get("product_name", mock_data["product_name"])
        return mock_data
