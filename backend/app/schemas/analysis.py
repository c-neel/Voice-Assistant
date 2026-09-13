"""
GLS NEXUS — Pydantic Schemas for AI Analysis Output

Defines the structured JSON output schema that the AI engine produces.
Used for both Gemini structured output and response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class InsightType(str, Enum):
    RISK = "risk"
    SUGGESTION = "suggestion"
    RECOMMENDATION = "recommendation"
    REMARK = "remark"
    FOLLOW_UP = "follow_up"
    BOTTLENECK = "bottleneck"
    PROCESS_IMPROVEMENT = "process_improvement"


# --- AI Output Schemas ---

class DiscussionPoint(BaseModel):
    """A key discussion point from the meeting."""
    topic: str = Field(description="The topic discussed")
    summary: str = Field(description="Brief summary of the discussion")
    participants_involved: list[str] = Field(default_factory=list, description="People involved in discussion")


class Decision(BaseModel):
    """A decision made during the meeting."""
    title: str = Field(description="Short title of the decision")
    description: str = Field(description="Details of the decision")
    decision_maker: Optional[str] = Field(default=None, description="Person who made the decision, or 'Not specified'")
    context: Optional[str] = Field(default=None, description="Context or reasoning")
    impact: Optional[str] = Field(default=None, description="Expected impact")
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0, description="AI confidence 0-1")


class ExtractedTask(BaseModel):
    """A task extracted by AI from the meeting content."""
    title: str = Field(description="Clear, actionable task title")
    description: Optional[str] = Field(default=None, description="Detailed description")
    assignee: Optional[str] = Field(default=None, description="Person assigned, or 'Not specified'")
    due_date: Optional[str] = Field(default=None, description="Deadline in ISO format or natural language")
    due_date_confirmed: bool = Field(default=False, description="Whether the deadline was explicitly stated")
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, description="Task priority")
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0, description="AI confidence 0-1")
    source_text: Optional[str] = Field(default=None, description="Original text that indicated this task")
    ai_recommendation: Optional[str] = Field(default=None, description="AI recommendation about this task")


class Insight(BaseModel):
    """An AI-generated insight, risk, or recommendation."""
    insight_type: InsightType = Field(description="Type of insight")
    title: str = Field(description="Short title")
    description: str = Field(description="Detailed description")
    severity: Optional[str] = Field(default="medium", description="low/medium/high/critical")
    actionable: bool = Field(default=False, description="Whether this is actionable")


class MeetingAnalysisResult(BaseModel):
    """
    Complete structured output from the AI analysis pipeline.
    This is the core data structure that both file and voice inputs produce.
    """
    # Meeting Metadata
    title: str = Field(description="Meeting title (inferred or provided)")
    detected_participants: list[str] = Field(default_factory=list, description="Participants detected from content")
    detected_date: Optional[str] = Field(default=None, description="Meeting date if mentioned")
    detected_duration: Optional[str] = Field(default=None, description="Duration if mentioned")

    # Summaries
    executive_summary: str = Field(description="2-3 sentence executive summary")
    detailed_summary: str = Field(description="Detailed summary organized by topics")

    # Core Content
    discussion_points: list[DiscussionPoint] = Field(default_factory=list)
    decisions: list[Decision] = Field(default_factory=list)
    tasks: list[ExtractedTask] = Field(default_factory=list)

    # AI Insights
    insights: list[Insight] = Field(default_factory=list)
    open_questions: list[str] = Field(default_factory=list, description="Unresolved questions")
    follow_up_items: list[str] = Field(default_factory=list, description="Items requiring follow-up")
    next_meeting_agenda: list[str] = Field(default_factory=list, description="Suggested next meeting topics")

    # Quality
    meeting_quality_score: Optional[int] = Field(default=None, ge=0, le=100)
    quality_explanation: Optional[str] = Field(default=None)

    # Metadata
    contradictions: list[str] = Field(default_factory=list, description="Contradictions or ambiguities detected")
    missing_information: list[str] = Field(default_factory=list, description="Information gaps")


# --- Request/Response Schemas ---

class AnalyzeFileRequest(BaseModel):
    """Request to analyze an uploaded file."""
    meeting_title: Optional[str] = None
    meeting_date: Optional[str] = None
    participants: list[str] = Field(default_factory=list)
    language: str = "en"
    project: Optional[str] = None


class AnalyzeTranscriptRequest(BaseModel):
    """Request to analyze a text transcript directly."""
    transcript: str = Field(min_length=10, description="The transcript text to analyze")
    meeting_title: Optional[str] = None
    meeting_date: Optional[str] = None
    participants: list[str] = Field(default_factory=list)
    language: str = "en"
    project: Optional[str] = None


class AnalysisResponse(BaseModel):
    """API response after analysis is complete."""
    meeting_id: str
    status: str
    analysis: Optional[MeetingAnalysisResult] = None
    error: Optional[str] = None
