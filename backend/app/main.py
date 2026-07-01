from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.scan import router as scan_router
from app.api.doctor import router as doctor_router
from app.api.user import router as user_router
from app.api.consumption import router as consumption_router
from app.api.chatbot import router as chatbot_router
from app.core.database import seed_doctors
from app.core.config import settings
import uvicorn

app = FastAPI(
    title="SnackCheck API",
    description="Backend API for SnackCheck - AI food label scanner, health ratings, and dietitian consultations.",
    version="1.0.0"
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://snack-check-nine.vercel.app",
    settings.frontend_url
]

from fastapi.responses import JSONResponse
from fastapi import Request

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import logging
    logging.error(f"Unhandled Exception: {str(exc)}")
    origin = request.headers.get("origin")
    headers = {}
    if origin in origins or "*" in origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
        headers=headers
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

@app.get("/api/health")
async def health_check():
    """Diagnostic endpoint to check DB connection status."""
    import asyncio
    from app.core.database import client
    try:
        # Check connection with a fast timeout (2s)
        await asyncio.wait_for(client.admin.command('ping'), timeout=2.0)
        db_status = "connected"
        error = None
    except Exception as e:
        db_status = "disconnected"
        error = str(e)
    
    # Safely show part of the connection string to verify env vars are loaded
    safe_uri = settings.mongo_uri.split("@")[-1] if "@" in settings.mongo_uri else "localhost or local format"
    return {
        "status": "ok",
        "database": db_status,
        "database_uri_target": safe_uri,
        "error": error
    }

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "SnackCheck API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=(settings.environment == "development"))
