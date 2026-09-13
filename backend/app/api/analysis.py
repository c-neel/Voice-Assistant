from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
import logging
from typing import Optional
from sqlalchemy.orm import Session

from app.security.auth import get_current_user
from app.security.file_validation import validate_file_upload
from app.database import get_db, SessionLocal
from app.database.models import Meeting, Transcript, MeetingSummary, Decision, Task
from app.services.document_service import extract_text_from_file
from app.services.gemini_service import get_ai_service
from app.services.rag_service import get_rag_service
from app.schemas.analysis import MeetingAnalysisResult, AnalyzeTranscriptRequest

logger = logging.getLogger("gls_nexus.api.analysis")
router = APIRouter()


async def process_analysis(
    user_id: str,
    meeting_id: str,
    transcript_text: str,
    title: str,
    participants: list[str]
):
    """Background task to run AI analysis and save to DB."""
    db = SessionLocal()
    ai_service = get_ai_service()
    rag_service = get_rag_service()
    
    try:
        # Update meeting status to processing
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            return
            
        meeting.status = "processing"
        db.commit()
        
        # 1. Run AI Analysis
        analysis_result: MeetingAnalysisResult = await ai_service.analyze_transcript(
            transcript=transcript_text,
            title=title,
            participants=participants
        )
        
        # 2. Save Transcript
        transcript = Transcript(
            meeting_id=meeting_id,
            full_text=transcript_text,
            word_count=len(transcript_text.split())
        )
        db.add(transcript)
        
        # 3. Save Summary
        summary = MeetingSummary(
            meeting_id=meeting_id,
            executive_summary=analysis_result.executive_summary,
            detailed_summary=analysis_result.detailed_summary,
            discussion_points=[dp.model_dump() for dp in analysis_result.discussion_points]
        )
        db.add(summary)
        
        # 4. Save Decisions
        for dec in analysis_result.decisions:
            db.add(Decision(**dec.model_dump(), meeting_id=meeting_id))
            
        # 5. Save Tasks (Pending Approval)
        for task in analysis_result.tasks:
            task_data = task.model_dump()
            db.add(Task(
                **task_data,
                meeting_id=meeting_id,
                user_id=user_id,
                is_ai_generated=True,
                approved=False
            ))
            
        # 6. Save Insights
        for insight in analysis_result.insights:
            pass # Insights are skipped for now
            
        # 7. Update Meeting Status and Quality
        meeting.status = "completed"
        meeting.quality_score = analysis_result.meeting_quality_score
        meeting.quality_explanation = analysis_result.quality_explanation
        
        db.commit()
        
        # 8. Ingest into RAG (Vector DB)
        # Note: We pass db to ingest_meeting_data since RAG now uses MySQL via SQLAlchemy
        await rag_service.ingest_meeting_data(user_id, meeting_id, analysis_result.model_dump(), db)
        
        logger.info(f"Analysis completed successfully for meeting {meeting_id}")
        
    except Exception as e:
        logger.error(f"Analysis failed for meeting {meeting_id}: {e}")
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if meeting:
            meeting.status = "failed"
            db.commit()
    finally:
        db.close()


@router.post("/file")
async def analyze_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    participants: Optional[str] = Form(None), # Comma separated
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a file (PDF/DOCX/TXT), extract text, and start background analysis."""
    
    # 1. Validate file
    safe_filename = validate_file_upload(file)
    
    # 2. Extract text
    try:
        transcript_text = await extract_text_from_file(file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    if len(transcript_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="File contains too little text for analysis.")
        
    # 3. Create meeting placeholder
    meeting_title = title or safe_filename
    part_list = [p.strip() for p in participants.split(",")] if participants else []
    
    new_meeting = Meeting(
        user_id=user["id"],
        title=meeting_title,
        source="file_upload",
        status="processing"
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    
    meeting_id = new_meeting.id
    
    # 4. Start background processing
    background_tasks.add_task(
        process_analysis,
        user_id=user["id"],
        meeting_id=meeting_id,
        transcript_text=transcript_text,
        title=meeting_title,
        participants=part_list
    )
    
    return {"message": "Analysis started", "meeting_id": meeting_id}


@router.post("/transcript")
async def analyze_transcript(
    request: AnalyzeTranscriptRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a raw transcript text for analysis (e.g. from Voice Meeting)."""
    
    meeting_title = request.meeting_title or "Voice Meeting Transcript"
    
    new_meeting = Meeting(
        user_id=user["id"],
        title=meeting_title,
        source="voice_recording",
        status="processing"
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    
    meeting_id = new_meeting.id
    
    background_tasks.add_task(
        process_analysis,
        user_id=user["id"],
        meeting_id=meeting_id,
        transcript_text=request.transcript,
        title=meeting_title,
        participants=request.participants
    )
    
    return {"message": "Analysis started", "meeting_id": meeting_id}
