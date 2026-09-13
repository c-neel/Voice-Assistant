"""
GLS NEXUS — AI Service Interface

Abstract base class for AI services to allow future swapping of providers.
"""

from abc import ABC, abstractmethod
from typing import Optional
from app.schemas.analysis import MeetingAnalysisResult


class AIService(ABC):
    """Abstract interface for AI analysis services."""
    
    @abstractmethod
    async def analyze_transcript(
        self, 
        transcript: str, 
        title: Optional[str] = None, 
        date: Optional[str] = None, 
        participants: Optional[list[str]] = None
    ) -> MeetingAnalysisResult:
        """
        Analyze a transcript and return structured results.
        Must handle chunking internally if the transcript is too long.
        """
        pass
        
    @abstractmethod
    async def generate_chat_response(
        self,
        query: str,
        context: str,
        chat_history: list[dict]
    ) -> str:
        """
        Generate a conversational response grounded in provided context (RAG).
        """
        pass
