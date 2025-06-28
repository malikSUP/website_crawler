"""
Service for managing parsing tasks and results.
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from database import Task, ParsedSite, TaskStatusEnum, TaskTypeEnum


class TaskService:
    """Service for managing parsing tasks."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_task(self, task_type: TaskTypeEnum, parameters: Dict[str, Any]) -> Task:
        """Create a new parsing task."""
        task = Task(
            task_type=task_type,
            parameters=parameters,
            status=TaskStatusEnum.RUNNING
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def get_task(self, task_id: uuid.UUID) -> Optional[Task]:
        """Get task by ID."""
        return self.db.query(Task).filter(Task.id == task_id).first()
    
    def get_tasks(self, limit: int = 50, offset: int = 0) -> List[Task]:
        """Get list of tasks."""
        return (self.db.query(Task)
                .order_by(desc(Task.created_at))
                .offset(offset)
                .limit(limit)
                .all())
    
    def complete_task(self, task_id: uuid.UUID) -> Optional[Task]:
        """Mark task as completed."""
        task = self.get_task(task_id)
        if not task:
            return None
        
        task.status = TaskStatusEnum.COMPLETED
        task.completed_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def fail_task(self, task_id: uuid.UUID, error_message: str) -> Optional[Task]:
        """Mark task as failed."""
        task = self.get_task(task_id)
        if not task:
            return None
        
        task.status = TaskStatusEnum.FAILED
        task.error_message = error_message
        task.completed_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(task)
        return task
    
    def add_parsed_site(self, task_id: uuid.UUID, domain: str, url: str, 
                       status: str, title: Optional[str] = None, 
                       snippet: Optional[str] = None, emails: Optional[List[str]] = None,
                       contact_forms: Optional[List[str]] = None, 
                       error_message: Optional[str] = None,
                       processing_time: Optional[int] = None) -> ParsedSite:
        """Add a parsed site result to a task."""
        site = ParsedSite(
            task_id=task_id,
            domain=domain,
            url=url,
            title=title,
            snippet=snippet,
            status=status,
            emails=emails or [],
            contact_forms=contact_forms or [],
            error_message=error_message,
            processing_time=processing_time
        )
        self.db.add(site)
        self.db.commit()
        self.db.refresh(site)
        return site
    
    def get_task_sites(self, task_id: uuid.UUID) -> List[ParsedSite]:
        """Get all parsed sites for a task."""
        return (self.db.query(ParsedSite)
                .filter(ParsedSite.task_id == task_id)
                .order_by(ParsedSite.parsed_at)
                .all())
    
    def delete_task(self, task_id: uuid.UUID) -> bool:
        """Delete a task and all its related data."""
        task = self.get_task(task_id)
        if not task:
            return False
        
        self.db.delete(task)
        self.db.commit()
        return True 