"""
GLS NEXUS — Transcription API

Handles audio file uploads for voice meetings and returns transcription.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
import logging
import asyncio

from app.security.auth import get_current_user
from app.security.file_validation import validate_audio_upload
from app.services.transcription_service import get_transcription_service

logger = logging.getLogger("gls_nexus.api.transcription")
router = APIRouter()


@router.post("/voice/upload")
async def upload_voice_meeting(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """
    Upload an audio recording, transcribe it, and return the transcript.
    The client can then review it and send it to /api/analyze/transcript.
    """
    try:
        # Validate audio file (type and size)
        validate_audio_upload(file)
        
        audio_data = await file.read()
        
        # Get transcription service and transcribe
        transcriber = get_transcription_service()
        result = await transcriber.transcribe_audio(audio_data)
        
        return {
            "transcript": result["text"],
            "segments": result["segments"],
            "duration": result["duration"],
            "language": result["language"]
        }
        
    except Exception as e:
        logger.error(f"Voice upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
