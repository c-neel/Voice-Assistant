"""
GLS NEXUS — Document Processing Service

Extracts text from various file formats (PDF, DOCX, TXT, CSV, MD).
"""

import os
import io
import csv
import logging
import tempfile
from fastapi import UploadFile
import fitz  # PyMuPDF
import docx

logger = logging.getLogger("gls_nexus.document_service")


async def extract_text_from_file(file: UploadFile) -> str:
    """
    Extract text content from an uploaded file based on its extension.
    Returns the extracted text.
    Raises ValueError if extraction fails or format is unsupported.
    """
    if not file.filename:
        raise ValueError("File has no name")

    _, ext = os.path.splitext(file.filename)
    ext = ext.lower()
    
    # Read file content into memory
    content = await file.read()
    
    try:
        if ext == '.pdf':
            return _extract_from_pdf(content)
        elif ext in ['.doc', '.docx']:
            return _extract_from_docx(content)
        elif ext == '.csv':
            return _extract_from_csv(content)
        elif ext in ['.txt', '.md']:
            return content.decode('utf-8')
        else:
            raise ValueError(f"Unsupported file extension: {ext}")
    except Exception as e:
        logger.error(f"Error extracting text from {file.filename}: {e}")
        raise ValueError(f"Failed to process file: {str(e)}")
    finally:
        # Reset file pointer if it needs to be read again
        await file.seek(0)


def _extract_from_pdf(content: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF."""
    text_parts = []
    try:
        # Load PDF from memory
        pdf_document = fitz.open(stream=content, filetype="pdf")
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text_parts.append(page.get_text())
        pdf_document.close()
        return "\n".join(text_parts)
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        raise


def _extract_from_docx(content: bytes) -> str:
    """Extract text from DOCX bytes using python-docx."""
    try:
        # docx requires a file-like object
        file_stream = io.BytesIO(content)
        doc = docx.Document(file_stream)
        text_parts = [paragraph.text for paragraph in doc.paragraphs]
        return "\n".join(text_parts)
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        raise


def _extract_from_csv(content: bytes) -> str:
    """Extract text from CSV bytes."""
    try:
        text_content = content.decode('utf-8')
        reader = csv.reader(io.StringIO(text_content))
        
        text_parts = []
        for row in reader:
            text_parts.append(" | ".join(row))
            
        return "\n".join(text_parts)
    except Exception as e:
        logger.error(f"CSV extraction error: {e}")
        raise
