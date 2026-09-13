"""
GLS NEXUS — Meeting and Task Pydantic Schemas

Request/response models for API endpoints.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime


# --- Meeting Schemas ---

class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: Optional[str] = None
    meeting_date: Optional[datetime] = None
    source: str = Field(pattern="^(file_upload|voice_recording)$")
    language: str = "en"
    participants: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


class MeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    description: Optional[str]
    meeting_date: Optional[datetime]
    duration_seconds: Optional[int]
    source: str
    status: str
    language: str
    tags: list[str]
    quality_score: Optional[int]
    quality_explanation: Optional[str]
    task_count: int = 0
    created_at: datetime
    updated_at: datetime


class MeetingListResponse(BaseModel):
    meetings: list[MeetingResponse]
    total: int


class MeetingDetailResponse(MeetingResponse):
    summary: Optional[dict] = None
    transcript: Optional[dict] = None
    decisions: list[dict] = Field(default_factory=list)
    tasks: list[dict] = Field(default_factory=list)
    insights: list[dict] = Field(default_factory=list)
    suggestions: list[dict] = Field(default_factory=list)
    participants: list[dict] = Field(default_factory=list)


# --- Task Schemas ---

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: Optional[str] = None
    assignee: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[datetime] = None
    meeting_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    approved: Optional[bool] = None


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    description: Optional[str]
    assignee: Optional[str]
    status: str
    priority: str
    due_date: Optional[datetime]
    due_date_confirmed: bool
    confidence_score: float
    ai_recommendation: Optional[str]
    source_text: Optional[str]
    is_ai_generated: bool
    approved: bool
    meeting_id: Optional[str]
    meeting_title: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int
    stats: dict = Field(default_factory=dict)


class TaskApprovalRequest(BaseModel):
    task_ids: list[str]
    action: str = Field(pattern="^(approve|reject)$")


# --- Reminder Schemas ---

class ReminderCreate(BaseModel):
    task_id: Optional[str] = None
    meeting_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    remind_at: datetime
    reminder_type: str = "custom"


class ReminderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    description: Optional[str]
    remind_at: datetime
    reminder_type: str
    is_sent: bool
    task_id: Optional[str]
    created_at: datetime


# --- Chat Schemas ---

class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    session_id: Optional[str] = None
    meeting_id: Optional[str] = None


class ChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    message: str
    sources: list[dict] = Field(default_factory=list)
    session_id: str


# --- Stats ---

class DashboardStats(BaseModel):
    total_meetings: int = 0
    tasks_generated: int = 0
    pending_tasks: int = 0
    completed_tasks: int = 0
    overdue_tasks: int = 0
    upcoming_deadlines: int = 0
