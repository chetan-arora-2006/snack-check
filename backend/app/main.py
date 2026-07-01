from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.scan import router as scan_router
from app.api.doctor import router as doctor_router
from app.api.user import router as user_router
from app.api.consumption import router as consumption_router
from app.api.chatbot import router as chatbot_router
from app.core.database import seed_doctors
import uvicorn

app = FastAPI(
    title="SnackCheck API",
    description="Backend API for SnackCheck - AI food label scanner, health ratings, and dietitian consultations.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production to frontend domain only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes under /api
app.include_router(auth_router, prefix="/api")
app.include_router(scan_router, prefix="/api")
app.include_router(doctor_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(consumption_router, prefix="/api")
app.include_router(chatbot_router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Run startup seeding script to pre-populate nutritionist/doctor records."""
    await seed_doctors()

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "SnackCheck API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
