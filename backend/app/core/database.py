import motor.motor_asyncio
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("snackcheck")

# Initialize Motor Client
client = motor.motor_asyncio.AsyncIOMotorClient(settings.mongo_uri)
db = client[settings.db_name]

# Collection references
users_col = db["users"]
scans_col = db["scans"]
doctors_col = db["doctors"]
consultations_col = db["consultations"]

async def seed_doctors():
    """Seed default doctor/dietitian profiles if the database collection is empty."""
    try:
        count = await doctors_col.count_documents({})
        if count == 0:
            default_doctors = [
                {
                    "name": "Dr. Sarah Jenkins",
                    "specialty": "Clinical Dietitian & Allergist",
                    "rating": 4.9,
                    "experience": "12 years",
                    "avatar": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80",
                    "bio": "Specializes in food allergies, intolerances, and building sustainable dietary habits.",
                    "availability": ["Monday 9AM - 12PM", "Wednesday 2PM - 5PM", "Friday 10AM - 1PM"],
                    "price": "$75"
                },
                {
                    "name": "Dr. Marcus Vance",
                    "specialty": "Pediatric Nutritionist",
                    "rating": 4.8,
                    "experience": "9 years",
                    "avatar": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80",
                    "bio": "Dedicated to helping parents guide their children's nutrition and tackle picky eating.",
                    "availability": ["Tuesday 10AM - 2PM", "Thursday 1PM - 4PM"],
                    "price": "$80"
                },
                {
                    "name": "Dr. Elena Rostova",
                    "specialty": "Sports Dietitian & Metabolic Specialist",
                    "rating": 4.9,
                    "experience": "15 years",
                    "avatar": "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=300&q=80",
                    "bio": "Works with athletes and individuals aiming to optimize performance, manage weight, and boost metabolism.",
                    "availability": ["Monday 1PM - 4PM", "Wednesday 9AM - 1PM", "Thursday 9AM - 12PM"],
                    "price": "$90"
                }
            ]
            await doctors_col.insert_many(default_doctors)
            logger.info("Successfully seeded database with default doctor profiles.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
