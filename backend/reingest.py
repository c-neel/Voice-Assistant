import asyncio
import os
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.database.models import Meeting, MeetingSummary, Decision, Task
from app.services.rag_service import get_rag_service
from dotenv import load_dotenv

load_dotenv(".env")

async def main():
    db: Session = SessionLocal()
    rag_service = get_rag_service()
    
    meeting_id = "15f5c62e-df4f-424a-a876-63838a133686"
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    
    if not meeting:
        print("Meeting not found")
        return
        
    summary = db.query(MeetingSummary).filter(MeetingSummary.meeting_id == meeting_id).first()
    decisions = db.query(Decision).filter(Decision.meeting_id == meeting_id).all()
    tasks = db.query(Task).filter(Task.meeting_id == meeting_id).all()
    
    data = {
        "title": meeting.title,
        "executive_summary": summary.executive_summary if summary else "",
        "detailed_summary": summary.detailed_summary if summary else "",
        "decisions": [
            {
                "title": d.title,
                "description": d.description,
                "decision_maker": d.decision_maker
            } for d in decisions
        ],
        "tasks": [
            {
                "title": t.title,
                "description": t.description,
                "assignee": t.assignee
            } for t in tasks
        ]
    }
    
    print("Ingesting meeting data...")
    await rag_service.ingest_meeting_data(meeting.user_id, meeting_id, data, db)
    print("Done")

if __name__ == "__main__":
    asyncio.run(main())
