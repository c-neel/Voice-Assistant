"""
GLS NEXUS — File Validation & Security

Validates uploaded files for type, size, and content safety.
Sanitizes filenames and prevents execution of uploaded files.
"""

import os
import uuid
import mimetypes
from fastapi import HTTPException, UploadFile
import logging

from app.config import settings

logger = logging.getLogger("gls_nexus.file_validation")

# Allowed file types and their MIME types
ALLOWED_FILE_TYPES: dict[str, list[str]] = {
    ".pdf": ["application/pdf"],
    ".doc": ["application/msword"],
    ".docx": [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    ".txt": ["text/plain"],
    ".md": ["text/markdown", "text/plain"],
    ".csv": ["text/csv", "text/plain"],
}

ALLOWED_AUDIO_TYPES: dict[str, list[str]] = {
    ".webm": ["audio/webm", "video/webm"],
    ".wav": ["audio/wav", "audio/x-wav"],
    ".mp3": ["audio/mpeg"],
    ".ogg": ["audio/ogg"],
    ".m4a": ["audio/mp4", "audio/x-m4a"],
    ".flac": ["audio/flac"],
}


def sanitize_filename(filename: str) -> str:
    """Generate a safe, randomized filename preserving the extension."""
    _, ext = os.path.splitext(filename)
    ext = ext.lower()
    safe_name = f"{uuid.uuid4().hex}{ext}"
    return safe_name


def validate_file_upload(file: UploadFile, max_size_bytes: int | None = None) -> str:
    """
    Validate an uploaded file for type and size.

    Returns the sanitized filename.
    Raises HTTPException if validation fails.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Check extension
    _, ext = os.path.splitext(file.filename)
    ext = ext.lower()

    if ext not in ALLOWED_FILE_TYPES:
        allowed = ", ".join(ALLOWED_FILE_TYPES.keys())
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' is not supported. Allowed types: {allowed}",
        )

    # Check MIME type
    if file.content_type:
        allowed_mimes = ALLOWED_FILE_TYPES.get(ext, [])
        if file.content_type not in allowed_mimes and file.content_type != "application/octet-stream":
            logger.warning(
                f"MIME type mismatch: expected {allowed_mimes}, got {file.content_type}"
            )

    # Check file size
    if max_size_bytes is None:
        max_size_bytes = settings.max_file_size_bytes

    if file.size and file.size > max_size_bytes:
        max_mb = max_size_bytes / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {max_mb:.0f} MB.",
        )

    return sanitize_filename(file.filename)


def validate_audio_upload(file: UploadFile) -> str:
    """
    Validate an uploaded audio file.

    Returns the sanitized filename.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    _, ext = os.path.splitext(file.filename)
    ext = ext.lower()

    if ext not in ALLOWED_AUDIO_TYPES:
        allowed = ", ".join(ALLOWED_AUDIO_TYPES.keys())
        raise HTTPException(
            status_code=400,
            detail=f"Audio type '{ext}' is not supported. Allowed types: {allowed}",
        )

    if file.size and file.size > settings.max_audio_size_bytes:
        max_mb = settings.max_audio_size_bytes / (1024 * 1024)
        raise HTTPException(
            status_code=400,
            detail=f"Audio file too large. Maximum size is {max_mb:.0f} MB.",
        )

    return sanitize_filename(file.filename)
