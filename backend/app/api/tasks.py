from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.security.auth import get_current_user
from app.database import get_db
from app.services.task_service import TaskService
from app.schemas.models import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse, TaskApprovalRequest

router = APIRouter()

def get_task_service(db: Session = Depends(get_db)):
    return TaskService(db)

@router.get("", response_model=TaskListResponse)
async def get_tasks(
    meeting_id: Optional[str] = None,
    status: Optional[str] = None,
    user: dict = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Get tasks for the current user."""
    tasks = task_service.get_tasks_for_user(user["id"], meeting_id)
    
    # Filter by status if provided
    if status:
        tasks = [t for t in tasks if getattr(t, "status", t.get("status") if isinstance(t, dict) else None) == status]
        
    # Calculate simple stats
    def get_status(t):
        return getattr(t, "status", t.get("status") if isinstance(t, dict) else None)
        
    stats = {
        "pending": sum(1 for t in tasks if get_status(t) == "pending"),
        "in_progress": sum(1 for t in tasks if get_status(t) == "in_progress"),
        "completed": sum(1 for t in tasks if get_status(t) == "completed"),
        "overdue": sum(1 for t in tasks if get_status(t) == "overdue")
    }
    
    return {"tasks": tasks, "total": len(tasks), "stats": stats}


@router.post("", response_model=TaskResponse)
async def create_task(
    task: TaskCreate,
    user: dict = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Create a new manual task."""
    try:
        new_task = task_service.create_task(
            user_id=user["id"], 
            task=task,
            is_ai_generated=False,
            approved=True
        )
        return new_task
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    updates: TaskUpdate,
    user: dict = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Update a task (status, assignee, priority, etc.)."""
    try:
        updated_task = task_service.update_task(user["id"], task_id, updates)
        return updated_task
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    user: dict = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Delete a task."""
    try:
        task_service.delete_task(user["id"], task_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/batch/review")
async def review_ai_tasks(
    request: TaskApprovalRequest,
    user: dict = Depends(get_current_user),
    task_service: TaskService = Depends(get_task_service)
):
    """Approve or reject a batch of AI-generated tasks."""
    if request.action == "approve":
        count = task_service.batch_approve_tasks(user["id"], request.task_ids)
        return {"status": "success", "approved_count": count}
    elif request.action == "reject":
        count = task_service.batch_reject_tasks(user["id"], request.task_ids)
        return {"status": "success", "rejected_count": count}
