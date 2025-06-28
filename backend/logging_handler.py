"""
Logging handler for tasks with unified interface.
"""

import logging
import uuid
from typing import Optional


class TaskLogger:
    """Unified logger for task operations with console output."""
    
    def __init__(self, task_id: uuid.UUID, logger_name: str = "task_logger"):
        self.task_id = task_id
        self.logger = logging.getLogger(f"{logger_name}_{task_id}")
        self.logger.setLevel(logging.INFO)
        
        # Remove existing handlers to avoid duplicates
        for handler in self.logger.handlers[:]:
            self.logger.removeHandler(handler)
        
        # Add console handler with formatting
        console_handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
    
    def info(self, message: str):
        """Log info message."""
        self.logger.info(message)
    
    def warning(self, message: str):
        """Log warning message."""
        self.logger.warning(message)
    
    def error(self, message: str):
        """Log error message."""
        self.logger.error(message)


def get_console_logger(task_id: uuid.UUID, logger_name: str = "task_logger") -> TaskLogger:
    """Create a TaskLogger instance for the given task."""
    return TaskLogger(task_id, logger_name)


def log_message(logger, level: str, message: str, fallback_prefix: str = ""):
    """
    Universal logging function that handles both logger and print fallback.
    
    Args:
        logger: Logger instance or None
        level: Log level ('info', 'warning', 'error')
        message: Message to log
        fallback_prefix: Prefix for print statements when no logger
    """
    if logger:
        getattr(logger, level)(message)
    else:
        level_prefixes = {
            "info": "INFO",
            "warning": "⚠️  WARNING",
            "error": "❌ ERROR"
        }
        prefix = level_prefixes.get(level, "INFO")
        full_message = f"{fallback_prefix}{prefix}: {message}" if fallback_prefix else f"{prefix}: {message}"
        print(full_message) 