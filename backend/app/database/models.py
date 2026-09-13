import uuid
import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Integer, Float, Text, JSON, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    avatar_url = Column(String(1024))
    timezone = Column(String(100), default='UTC')
    notification_preferences = Column(JSON, default=dict)
    google_calendar_connected = Column(Boolean, default=False)
    google_calendar_token = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    meetings = relationship("Meeting", back_populates="user", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    meeting_date = Column(DateTime, default=datetime.datetime.utcnow)
    duration_seconds = Column(Integer)
    source = Column(String(50), nullable=False) # 'file_upload', 'voice_recording'
    status = Column(String(50), default='processing') # 'processing', 'completed', 'failed', 'partial'
    language = Column(String(10), default='en')
    tags = Column(JSON, default=list)
    quality_score = Column(Integer)
    quality_explanation = Column(Text)
    metadata_json = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="meetings")
    tasks = relationship("Task", back_populates="meeting", cascade="all, delete-orphan")
    summaries = relationship("MeetingSummary", back_populates="meeting", cascade="all, delete-orphan")
    transcripts = relationship("Transcript", back_populates="meeting", cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="meeting", cascade="all, delete-orphan")
    insights = relationship("AIInsight", back_populates="meeting", cascade="all, delete-orphan")
    participants = relationship("MeetingParticipant", back_populates="meeting", cascade="all, delete-orphan")
    files = relationship("MeetingFile", back_populates="meeting", cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", back_populates="meeting", cascade="all, delete-orphan")

class Transcript(Base):
    __tablename__ = "transcripts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    meeting_id = Column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    full_text = Column(Text(10000000), nullable=False)
    word_count = Column(Integer)
    language = Column(String(10), default='en')
    confidence_score = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    meeting = relationship("Meeting", back_populates="transcripts")
    segments = relationship("TranscriptSegment", back_populates="transcript", cascade="all, delete-orphan")

class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    transcript_id = Column(String(36), ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=False)
    speaker = Column(String(100))
    content = Column(Text, nullable=False)
    start_time = Column(Float)
    end_time = Column(Float)
    confidence = Column(Float)
    segment_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    transcript = relationship("Transcript", back_populates="segments")

class MeetingSummary(Base):
    __tablename__ = "meeting_summaries"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    meeting_id = Column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    executive_summary = Column(Text, nullable=False)
    detailed_summary = Column(Text(10000000), nullable=False)
    discussion_points = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    meeting = relationship("Meeting", back_populates="summaries")

class Decision(Base):
    __tablename__ = "decisions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    meeting_id = Column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    decision_maker = Column(String(255))
    context = Column(Text)
    impact = Column(Text)
    confidence_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    meeting = relationship("Meeting", back_populates="decisions")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meeting_id = Column(String(36), ForeignKey("meetings.id", ondelete="SET NULL"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    assignee = Column(String(255))
    status = Column(String(50), default='pending') # 'pending', 'in_progress', 'completed', 'overdue', 'cancelled'
    priority = Column(String(50), default='medium') # 'low', 'medium', 'high', 'critical'
    due_date = Column(DateTime, nullable=True)
    due_date_confirmed = Column(Boolean, default=False)
    confidence_score = Column(Float, default=1.0)
    ai_recommendation = Column(Text)
    source_text = Column(Text)
    is_ai_generated = Column(Boolean, default=True)
    approved = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="tasks")
    meeting = relationship("Meeting", back_populates="tasks")
    reminders = relationship("Reminder", back_populates="task", cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", back_populates="task", cascade="all, delete-orphan")

class Reminder(Base):
    __tablename__ = "reminders"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    meeting_id = Column(String(36), ForeignKey("meetings.id", ondelete="SET NULL"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    remind_at = Column(DateTime, nullable=False)
    reminder_type = Column(String(50), default='custom')
    is_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    task = relationship("Task", back_populates="reminders")

class Embedding(Base):
    __tablename__ = "embeddings"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    meeting_id = Column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"))
    content_type = Column(String(50), nullable=False) # 'transcript', 'summary', 'decision', 'task', 'insight'
    content = Column(Text, nullable=False)
    embedding = Column(JSON) # Store as JSON array since MySQL doesn't have vector type by default
    metadata_json = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), default='New Conversation')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), nullable=False) # 'user', 'assistant'
    content = Column(Text, nullable=False)
    sources = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    session = relationship("ChatSession", back_populates="messages")

class AIInsight(Base):
    __tablename__ = "ai_insights"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    meeting_id = Column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    insight_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String(50))
    actionable = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    meeting = relationship("Meeting", back_populates="insights")

class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    meeting_id = Column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    role = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    meeting = relationship("Meeting", back_populates="participants")

class MeetingFile(Base):
    __tablename__ = "meeting_files"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    meeting_id = Column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    storage_path = Column(String(1024), nullable=False)
    mime_type = Column(String(100))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    meeting = relationship("Meeting", back_populates="files")

class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="SET NULL"))
    meeting_id = Column(String(36), ForeignKey("meetings.id", ondelete="SET NULL"))
    google_event_id = Column(String(255))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    calendar_link = Column(String(1024))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    meeting = relationship("Meeting", back_populates="calendar_events")
    task = relationship("Task", back_populates="calendar_events")
