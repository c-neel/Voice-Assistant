from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging

from app.security.auth import get_current_user
from app.services.rag_service import get_rag_service
from app.services.gemini_service import get_ai_service
from app.schemas.models import ChatRequest, ChatResponse
from app.database import get_db
from app.database.models import ChatSession, ChatMessage, Meeting

logger = logging.getLogger("gls_nexus.api.assistant")
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Ask a question about past meetings.
    Uses RAG: Retrieves relevant snippets from pgvector, then generates an answer.
    """
    rag_service = get_rag_service()
    ai_service = get_ai_service()
    
    # 1. Manage Chat Session
    session_id = request.session_id
    if not session_id:
        title = request.message[:50] + "..." if len(request.message) > 50 else request.message
        new_session = ChatSession(user_id=user["id"], title=title)
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        session_id = new_session.id
        
    # Save user message
    user_msg = ChatMessage(session_id=session_id, role="user", content=request.message)
    db.add(user_msg)
    db.commit()
    
    # 2. Retrieve Context via RAG
    try:
        context_items = await rag_service.retrieve_context(
            user_id=user["id"], 
            query=request.message, 
            db=db, 
            limit=5,
            meeting_id=request.meeting_id
        )
    except Exception as e:
        logger.error(f"RAG retrieval failed: {e}")
        context_items = []
        
    # Format context for AI
    context_text = ""
    sources = []
    
    if context_items:
        for idx, item in enumerate(context_items):
            # Fetch meeting title if we have meeting_id
            meeting_title = "Unknown Meeting"
            if item.get("meeting_id"):
                meeting = db.query(Meeting).filter(Meeting.id == item["meeting_id"]).first()
                if meeting:
                    meeting_title = meeting.title
            
            context_text += f"\n--- Source {idx+1}: {meeting_title} ({item.get('content_type')}) ---\n"
            context_text += item.get("content", "") + "\n"
            
            sources.append({
                "meeting_id": item.get("meeting_id"),
                "title": meeting_title,
                "type": item.get("content_type")
            })
    else:
        context_text = "No relevant context found in previous meetings."
        
    # 3. Generate Answer
    try:
        # Fetch simple chat history (last 5 messages)
        history = db.query(ChatMessage)\
            .filter(ChatMessage.session_id == session_id)\
            .order_by(ChatMessage.created_at.desc())\
            .limit(5)\
            .all()
            
        history = list(reversed(history)) if history else []
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in history]
        
        answer = await ai_service.generate_chat_response(
            query=request.message,
            context=context_text,
            chat_history=history_dicts
        )
        
        # Save AI response
        ai_msg = ChatMessage(
            session_id=session_id,
            role="assistant",
            content=answer,
            sources=sources
        )
        db.add(ai_msg)
        db.commit()
        
        return ChatResponse(
            message=answer,
            sources=sources,
            session_id=session_id
        )
        
    except Exception as e:
        logger.error(f"Chat generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI response.")
