import logging
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database.models import Task, Meeting
from app.schemas.models import TaskCreate, TaskUpdate

logger = logging.getLogger("gls_nexus.task_service")


class TaskService:
    def __init__(self, db: Session):
        self.db = db

    def get_tasks_for_user(self, user_id: str, meeting_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve tasks for a user, optionally filtered by meeting."""
        query = self.db.query(Task, Meeting.title.label('meeting_title'))\
            .outerjoin(Meeting, Task.meeting_id == Meeting.id)\
            .filter(Task.user_id == user_id)
            
        if meeting_id:
            query = query.filter(Task.meeting_id == meeting_id)
            
        # Sort by creation date descending
        query = query.order_by(Task.created_at.desc())
        
        results = query.all()
        
        tasks = []
        for task_obj, meeting_title in results:
            task_dict = {
                "id": task_obj.id,
                "user_id": task_obj.user_id,
                "meeting_id": task_obj.meeting_id,
                "title": task_obj.title,
                "description": task_obj.description,
                "assignee": task_obj.assignee,
                "status": task_obj.status,
                "priority": task_obj.priority,
                "due_date": task_obj.due_date,
                "due_date_confirmed": task_obj.due_date_confirmed,
                "confidence_score": task_obj.confidence_score,
                "ai_recommendation": task_obj.ai_recommendation,
                "source_text": task_obj.source_text,
                "is_ai_generated": task_obj.is_ai_generated,
                "approved": task_obj.approved,
                "completed_at": task_obj.completed_at,
                "created_at": task_obj.created_at,
                "updated_at": task_obj.updated_at,
                "meeting_title": meeting_title
            }
            tasks.append(task_dict)
            
        return tasks

    def create_task(self, user_id: str, task: TaskCreate, is_ai_generated: bool = False, approved: bool = True) -> Task:
        """Create a single task."""
        task_data = task.model_dump(exclude_unset=True)
        task_data["user_id"] = user_id
        task_data["is_ai_generated"] = is_ai_generated
        task_data["approved"] = approved
        
        new_task = Task(**task_data)
        self.db.add(new_task)
        self.db.commit()
        self.db.refresh(new_task)
            
        return new_task

    def update_task(self, user_id: str, task_id: str, updates: TaskUpdate) -> Task:
        """Update a task, ensuring the user owns it."""
        update_data = updates.model_dump(exclude_unset=True)
        
        task = self._get_single_task(user_id, task_id)
        if not update_data:
            return task
            
        # Add completed_at timestamp if status changes to completed
        if update_data.get("status") == "completed":
            update_data["completed_at"] = datetime.utcnow()
            
        is_newly_approved = False
        if update_data.get("approved") is True and not task.approved:
            is_newly_approved = True
            
        for key, value in update_data.items():
            setattr(task, key, value)
            
        self.db.commit()
        self.db.refresh(task)
        
        if is_newly_approved and task.due_date:
            from app.database.models import Reminder
            reminder_time = task.due_date - timedelta(days=1)
            new_reminder = Reminder(
                user_id=task.user_id,
                task_id=task.id,
                meeting_id=task.meeting_id,
                title=f"Reminder: {task.title}",
                description=task.description,
                remind_at=reminder_time
            )
            self.db.add(new_reminder)
            self.db.commit()
            
        return task

    def delete_task(self, user_id: str, task_id: str) -> bool:
        """Delete a task, ensuring the user owns it."""
        task = self._get_single_task(user_id, task_id)
        self.db.delete(task)
        self.db.commit()
        return True

    def batch_approve_tasks(self, user_id: str, task_ids: List[str]) -> int:
        """Approve multiple AI-generated tasks at once."""
        if not task_ids:
            return 0
            
        from app.database.models import Reminder
        tasks = self.db.query(Task).filter(Task.id.in_(task_ids), Task.user_id == user_id).all()
        for task in tasks:
            if not task.approved:
                task.approved = True
                if task.due_date:
                    reminder_time = task.due_date - timedelta(days=1)
                    new_reminder = Reminder(
                        user_id=task.user_id,
                        task_id=task.id,
                        meeting_id=task.meeting_id,
                        title=f"Reminder: {task.title}",
                        description=task.description,
                        remind_at=reminder_time
                    )
                    self.db.add(new_reminder)
            
        self.db.commit()
            
        return len(tasks)

    def batch_reject_tasks(self, user_id: str, task_ids: List[str]) -> int:
        """Delete rejected AI-generated tasks."""
        if not task_ids:
            return 0
            
        tasks = self.db.query(Task).filter(Task.id.in_(task_ids), Task.user_id == user_id).all()
        count = len(tasks)
        for task in tasks:
            self.db.delete(task)
            
        self.db.commit()
            
        return count

    def _get_single_task(self, user_id: str, task_id: str) -> Task:
        task = self.db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
        if not task:
            raise ValueError("Task not found or not authorized")
        return task
