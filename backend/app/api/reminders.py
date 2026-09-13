from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.security.auth import get_current_user
from app.database import get_db
from app.database.models import Reminder, Task
from app.schemas.models import ReminderCreate, ReminderResponse

router = APIRouter()
cal_router = APIRouter()


@router.post("", response_model=ReminderResponse)
async def create_reminder(
    reminder: ReminderCreate,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new reminder for a task."""
    data = reminder.model_dump(exclude_unset=True)
    
    new_reminder = Reminder(**data, user_id=user["id"])
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    
    return new_reminder


@router.delete("/{reminder_id}")
async def delete_reminder(
    reminder_id: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == user["id"]).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    db.delete(reminder)
    db.commit()
    return {"status": "success"}


# --- Calendar API ---

@cal_router.post("/google/connect")
async def connect_google_calendar(user: dict = Depends(get_current_user)):
    """Generate OAuth URL for Google Calendar."""
    # In a full implementation, this uses google-auth-oauthlib to generate the URL.
    return {"oauth_url": "https://accounts.google.com/o/oauth2/auth?... (Mock)"}


@cal_router.post("/google/create-event")
async def create_calendar_event(
    task_id: str,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a Google Calendar event from a task."""
    # In a full implementation, this uses google-api-python-client with stored user tokens.
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user["id"]).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Mocking event creation
    return {"status": "success", "event_url": "https://calendar.google.com/event?... (Mock)"}
