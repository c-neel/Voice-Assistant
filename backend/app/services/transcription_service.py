"""
GLS NEXUS — Faster-Whisper Transcription Service

Handles audio transcription. Loads the model at startup to optimize request times.
Offloads CPU/GPU intensive work to a thread pool.
"""

import os
import io
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import BinaryIO
import tempfile
from faster_whisper import WhisperModel

from app.config import settings

logger = logging.getLogger("gls_nexus.transcription_service")

# Global variables for model and thread pool
_model: WhisperModel | None = None
_thread_pool: ThreadPoolExecutor | None = None


def init_transcription_service():
    """
    Initialize the Faster-Whisper model and thread pool.
    Called on application startup.
    """
    global _model, _thread_pool
    
    if _model is not None:
        return

    try:
        logger.info(f"Loading Faster-Whisper model '{settings.whisper_model}' on {settings.whisper_device}...")
        # faster-whisper will download the model automatically if it doesn't exist
        _model = WhisperModel(
            model_size_or_path=settings.whisper_model,
            device=settings.whisper_device,
            compute_type=settings.whisper_compute_type,
            # Adjust these for local dev to avoid downloading to system cache if preferred
            # download_root="./whisper_models" 
        )
        # Use a small thread pool for blocking transcription tasks
        _thread_pool = ThreadPoolExecutor(max_workers=2)
        logger.info("Faster-Whisper model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Faster-Whisper: {e}")
        _model = None


def get_transcription_service():
    """Ensure the service is initialized before use."""
    if _model is None:
        init_transcription_service()
    return TranscriptionService()


class TranscriptionService:
    """Service for handling audio transcription."""

    async def transcribe_audio(self, audio_data: bytes, language: str = "en") -> dict:
        """
        Transcribe audio bytes to text asynchronously.
        Offloads the blocking model inference to a thread pool.
        """
        if _model is None or _thread_pool is None:
            raise RuntimeError("Transcription service is not initialized")

        # Create a temporary file because faster-whisper prefers file paths or file-like objects
        # We use a real temp file because some ffmpeg backends used by faster-whisper 
        # work better with actual paths.
        
        fd, temp_path = tempfile.mkstemp(suffix=".wav")
        try:
            with os.fdopen(fd, 'wb') as f:
                f.write(audio_data)
                
            logger.info(f"Starting transcription of {len(audio_data)} bytes...")
            
            # Run the blocking transcription in the thread pool
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                _thread_pool, 
                self._run_inference, 
                temp_path, 
                language
            )
            
            return result
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            raise RuntimeError(f"Transcription failed: {str(e)}")
        finally:
            # Clean up the temp file
            try:
                os.remove(temp_path)
            except OSError:
                pass
                
    def _run_inference(self, file_path: str, language: str) -> dict:
        """
        Blocking inference call. Runs in a thread pool.
        """
        # We don't enforce language if it's 'auto', but defaults to english for MVP
        lang = language if language != "auto" else None
        
        segments, info = _model.transcribe(
            file_path, 
            beam_size=5,
            language=lang,
            vad_filter=True, # Voice Activity Detection helps skip silence
            vad_parameters=dict(min_silence_duration_ms=1000)
        )
        
        full_text = []
        segment_data = []
        
        for idx, segment in enumerate(segments):
            text = segment.text.strip()
            if text:
                full_text.append(text)
                segment_data.append({
                    "index": idx,
                    "start": segment.start,
                    "end": segment.end,
                    "text": text,
                    "confidence": getattr(segment, 'avg_logprob', 0.0) # approximate
                })
                
        joined_text = " ".join(full_text)
        
        return {
            "text": joined_text,
            "segments": segment_data,
            "language": info.language,
            "language_probability": info.language_probability,
            "duration": info.duration
        }
