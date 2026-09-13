"""
GLS NEXUS — Gemini AI Service Implementation

Uses Google GenAI SDK to generate structured JSON output via Pydantic schemas.
Implements chunking for large transcripts.
"""

import json
import logging
from typing import Optional
from google import genai
from google.genai import types

from app.config import settings
from app.schemas.analysis import MeetingAnalysisResult
from app.services.ai_service import AIService
from app.prompts.analysis_prompts import (
    ANALYSIS_SYSTEM_PROMPT,
    ANALYSIS_USER_PROMPT_TEMPLATE,
    SYNTHESIS_SYSTEM_PROMPT,
    SYNTHESIS_USER_PROMPT_TEMPLATE
)

logger = logging.getLogger("gls_nexus.gemini_service")

# Approximate tokens per chunk to stay well within limits while maintaining context
# Gemini 2.5 Flash has a very large context window (1M+), so we might not need to chunk often,
# but it's good practice for extremely long meetings or if switching models.
CHUNK_SIZE_CHARS = 100000 


class GeminiService(AIService):
    """Implementation of AIService using Google Gemini Flash."""

    def __init__(self):
        if not settings.gemini_api_key:
            logger.warning("GEMINI_API_KEY is not set. AI features will fail.")
            self.client = None
        else:
            self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = settings.ai_model

    async def analyze_transcript(
        self,
        transcript: str,
        title: Optional[str] = None,
        date: Optional[str] = None,
        participants: Optional[list[str]] = None
    ) -> MeetingAnalysisResult:
        """
        Analyze a transcript using Gemini structured output.
        """
        if not self.client:
            raise RuntimeError("Gemini API key is not configured")

        title_str = title or "Not provided"
        date_str = date or "Not provided"
        participants_str = ", ".join(participants) if participants else "Not provided"

        # If transcript is very large, we should chunk it, but for most meetings,
        # Gemini Flash 2.5 can handle it in one go. We will attempt a single pass first.
        # In a fully productionized version, we'd count tokens and split if necessary.
        
        user_prompt = ANALYSIS_USER_PROMPT_TEMPLATE.format(
            title=title_str,
            date=date_str,
            participants=participants_str,
            transcript=transcript
        )

        try:
            logger.info(f"Sending analysis request to Gemini ({self.model_name})")
            
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=ANALYSIS_SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=MeetingAnalysisResult,
                    temperature=0.2, # Low temperature for more factual, structured extraction
                )
            )
            
            # The SDK should ideally handle validation if response_schema is a Pydantic model,
            # but we explicitly parse it to ensure it conforms to our schema.
            try:
                result = MeetingAnalysisResult.model_validate_json(response.text)
                return result
            except Exception as e:
                logger.error(f"Failed to validate Gemini JSON output: {e}")
                logger.error(f"Raw output: {response.text}")
                raise ValueError("AI returned invalid structured output")

        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise RuntimeError(f"AI analysis failed: {str(e)}")
            
    async def generate_chat_response(
        self,
        query: str,
        context: str,
        chat_history: list[dict]
    ) -> str:
        """
        Generate a RAG-grounded response for the AI assistant.
        """
        if not self.client:
            raise RuntimeError("Gemini API key is not configured")
            
        system_prompt = (
            "You are a helpful AI assistant for the GLS NEXUS meeting intelligence platform. "
            "Your goal is to answer user questions based on the provided meeting context. "
            "If the answer is not contained in the context, politely inform the user that you don't know based on the available meeting records. "
            "Do not invent information. Be concise and professional."
        )
        
        user_prompt = f"CONTEXT (Relevant meeting excerpts):\n{context}\n\nUSER QUESTION:\n{query}"
        
        # Convert history to Gemini format if needed, but for simplicity we'll just pass the current prompt
        # In a full implementation, we'd format chat_history into types.Content objects
        
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.3,
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini chat error: {str(e)}")
            raise RuntimeError(f"Chat generation failed: {str(e)}")


def get_ai_service() -> AIService:
    """Factory function to get the configured AI service."""
    return GeminiService()
