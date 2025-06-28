"""
Database configuration and models for website crawler.
"""

import os
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum as PyEnum

from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, JSON, Enum, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

# Load environment variables from .env file
load_dotenv()

# Database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL"
)

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()


class TaskStatusEnum(PyEnum):
    """Enum for task statuses."""
    RUNNING = "running" 
    COMPLETED = "completed"
    FAILED = "failed"


class TaskTypeEnum(PyEnum):
    """Enum for task types."""
    SINGLE_SITE = "single_site"
    BATCH_PARSE = "batch_parse"


class Task(Base):
    """Model for tracking parsing tasks."""
    __tablename__ = "tasks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_type = Column(Enum(TaskTypeEnum), nullable=False)
    status = Column(Enum(TaskStatusEnum), default=TaskStatusEnum.RUNNING, nullable=False)
    
    # Task parameters
    parameters = Column(JSON, nullable=False)  # Store request parameters as JSON
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    
    # Error information
    error_message = Column(Text, nullable=True)
    
    # Relationships
    sites = relationship("ParsedSite", back_populates="task", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Task(id={self.id}, type={self.task_type}, status={self.status})>"


class ParsedSite(Base):
    """Model for storing parsed site information."""
    __tablename__ = "parsed_sites"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=False)
    
    # Site information
    domain = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    title = Column(Text, nullable=True)
    snippet = Column(Text, nullable=True)
    
    # Parsing results
    status = Column(String(50), nullable=False)  # success, failed
    emails = Column(JSON, nullable=True)  # List of found emails
    contact_forms = Column(JSON, nullable=True)  # List of contact form URLs
    
    # Additional metadata
    parsed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    error_message = Column(Text, nullable=True)
    processing_time = Column(Integer, nullable=True)  # Processing time in seconds
    
    # Relationship
    task = relationship("Task", back_populates="sites")
    
    def __repr__(self):
        return f"<ParsedSite(domain={self.domain}, status={self.status})>"


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    create_tables() 