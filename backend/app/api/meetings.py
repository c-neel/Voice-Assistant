from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.security.auth import get_current_user
from app.database import get_db
from app.database.models import Meeting, Transcript, MeetingSummary, Decision, Task
from app.schemas.models import MeetingCreate, MeetingResponse, MeetingListResponse, MeetingDetailResponse

router = APIRouter()

@router.post("", response_model=MeetingResponse)
async def create_meeting(
    meeting: MeetingCreate,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new meeting record."""
    data = meeting.model_dump(exclude_unset=True)
    new_meeting = Meeting(**data, user_id=user["id"])
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    
    return new_meeting

@router.get("", response_model=MeetingListResponse)
async def get_meetings(
    user: dict = Depends(get_current_user),
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all meetings for the current user."""
    total = db.query(Meeting).filter(Meeting.user_id == user["id"]).count()
    
    meetings = db.query(Meeting)\
        .filter(Meeting.user_id == user["id"])\
        .order_by(Meeting.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()
        
    return {"meetings": meetings, "total": total}

@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
async def get_meeting_detail(
    meeting_id: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a detailed view of a meeting including tasks and summaries."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == user["id"]).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    transcript = db.query(Transcript).filter(Transcript.meeting_id == meeting_id).first()
    summary = db.query(MeetingSummary).filter(MeetingSummary.meeting_id == meeting_id).first()
    decisions = db.query(Decision).filter(Decision.meeting_id == meeting_id).all()
    tasks = db.query(Task).filter(Task.meeting_id == meeting_id).all()
    
    summary_dict = None
    if summary:
        summary_dict = {
            "id": summary.id,
            "executive_summary": summary.executive_summary,
            "detailed_summary": summary.detailed_summary,
            "discussion_points": summary.discussion_points
        }
        
    transcript_dict = None
    if transcript:
        transcript_dict = {
            "id": transcript.id,
            "full_text": transcript.full_text,
            "word_count": transcript.word_count,
            "confidence_score": transcript.confidence_score
        }
        
    decisions_list = []
    for d in decisions:
        decisions_list.append({
            "id": d.id,
            "title": d.title,
            "description": d.description,
            "decision_maker": d.decision_maker
        })
        
    tasks_list = []
    for t in tasks:
        tasks_list.append({
            "id": t.id,
            "title": t.title,
            "assignee": t.assignee,
            "status": t.status,
            "due_date": t.due_date.isoformat() if hasattr(t.due_date, 'isoformat') else str(t.due_date) if t.due_date else None,
            "priority": t.priority
        })
        
    from app.database.models import AIInsight, MeetingParticipant
    insights = db.query(AIInsight).filter(AIInsight.meeting_id == meeting_id).all()
    insights_list = []
    for inc in insights:
        insights_list.append({
            "id": inc.id,
            "insight_type": inc.insight_type,
            "title": inc.title,
            "description": inc.description,
            "severity": inc.severity
        })
        
    participants = db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting_id).all()
    participants_list = []
    for p in participants:
        participants_list.append({
            "id": p.id,
            "name": p.name,
            "role": p.role
        })
    
    meeting_data = {
        "id": meeting.id,
        "title": meeting.title,
        "description": meeting.description,
        "meeting_date": meeting.meeting_date,
        "duration_seconds": meeting.duration_seconds,
        "source": meeting.source,
        "status": meeting.status,
        "language": meeting.language,
        "tags": meeting.tags,
        "quality_score": meeting.quality_score,
        "quality_explanation": meeting.quality_explanation,
        "metadata": meeting.metadata_json,
        "user_id": meeting.user_id,
        "created_at": meeting.created_at,
        "updated_at": meeting.updated_at,
        "transcript": transcript_dict,
        "summary": summary_dict,
        "decisions": decisions_list,
        "tasks": tasks_list,
        "insights": insights_list,
        "participants": participants_list
    }
    
    return meeting_data

@router.delete("/{meeting_id}")
async def delete_meeting(
    meeting_id: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a meeting. Cascades to tasks, transcripts, etc."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id, Meeting.user_id == user["id"]).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    db.delete(meeting)
    db.commit()
    
    return {"status": "success"}
