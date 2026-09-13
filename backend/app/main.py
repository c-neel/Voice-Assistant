"""
GLS NEXUS — FastAPI Application Entry Point

Registers all API routes, configures CORS, and initializes services on startup.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("gls_nexus")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("GLS NEXUS backend starting...")
    logger.info(f"AI Model: {settings.ai_model}")
    logger.info(f"Whisper Model: {settings.whisper_model} ({settings.whisper_device})")

    # Initialize SQLAlchemy database
    from app.database import init_db
    init_db()

    yield

    logger.info("GLS NEXUS backend shutting down...")


app = FastAPI(
    title="GLS NEXUS API",
    description="Backend API for GLS NEXUS meeting intelligence platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
from app.api import meetings, analysis, transcription, tasks, reminders, assistant, calendar_api, auth

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(meetings.router, prefix="/api/meetings", tags=["Meetings"])
app.include_router(analysis.router, prefix="/api/analyze", tags=["Analysis"])
app.include_router(transcription.router, prefix="/api", tags=["Transcription"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(reminders.router, prefix="/api/reminders", tags=["Reminders"])
app.include_router(assistant.router, prefix="/api/assistant", tags=["AI Assistant"])
app.include_router(calendar_api.router, prefix="/api/calendar", tags=["Calendar"])


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "GLS NEXUS API",
        "ai_model": settings.ai_model,
    }
