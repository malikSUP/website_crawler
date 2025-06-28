import uuid
import csv
import io
from typing import List
from datetime import datetime
from urllib.parse import urlparse
from contextlib import asynccontextmanager

from fastapi import FastAPI, BackgroundTasks, Depends, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from config import OPENAI_API_KEY, GOOGLE_API_KEY, GOOGLE_CX, SERVER_HOST, SERVER_PORT, DEBUG_MODE
from schemas import (
    SingleSiteParseRequest, SingleSiteParseResponse, 
    BatchParseRequest, BatchParseResponse,
    DatabaseTaskResponse, ParsedSiteResponse
)
from parser import AdvancedParser
from batch_parser import BatchParser
from database import get_db, TaskTypeEnum, TaskStatusEnum, create_tables
from task_service import TaskService
from logging_handler import get_console_logger

import logging

# Setup basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application lifespan events."""
    # Startup
    logger.info("Website Contact Parser API started")
    create_tables()
    logger.info("Database tables created/verified")
    
    yield
    
    # Shutdown - cleanup
    logger.info("Application shutting down")


# Initialize FastAPI app
app = FastAPI(
    title="Website Contact Parser API",
    description="Extract contact information from websites",
    version="2.0.0",
    lifespan=lifespan
)

# Setup CORS middleware directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==== BACKGROUND TASK FUNCTIONS ====

def run_single_site_parsing_db(task_uuid: uuid.UUID, url: str, skip_sitemap: bool, use_ai_validation: bool = True) -> None:
    """Run single site parsing with database integration."""
    from database import SessionLocal
    db = SessionLocal()
    task_service = TaskService(db)
    task_logger = get_console_logger(task_uuid)
    
    try:
        task_logger.info(f"Starting single site parsing for: {url}")
        
        parser = AdvancedParser(
            base_url=url, 
            openai_api_key=OPENAI_API_KEY if use_ai_validation else None,
            skip_sitemap=skip_sitemap,
            logger=task_logger
        )
        
        start_time = datetime.now()
        results = parser.parse()
        processing_time = (datetime.now() - start_time).seconds
        
        if results:
            # Store results in database
            domain = urlparse(url).netloc
            task_service.add_parsed_site(
                task_id=task_uuid,
                domain=domain,
                url=url,
                status="success",
                emails=results.get("emails", []),
                contact_forms=results.get("contact_form_pages", []),
                processing_time=processing_time
            )
            
            task_service.complete_task(task_uuid)
            task_logger.info(f"✅ Successfully completed parsing {url}")
        else:
            # Store failed result
            domain = urlparse(url).netloc
            task_service.add_parsed_site(
                task_id=task_uuid,
                domain=domain,
                url=url,
                status="failed",
                error_message="Parsing failed - no results found",
                processing_time=processing_time
            )
            
            task_service.fail_task(task_uuid, "Parsing failed - no results found")
            task_logger.error("❌ Parsing failed - no results found")
            
    except Exception as e:
        error_msg = f"Error during parsing: {str(e)}"
        task_service.fail_task(task_uuid, error_msg)
        task_logger.error(f"❌ {error_msg}")
    finally:
        db.close()


def run_batch_parsing_db(task_uuid: uuid.UUID, query: str, num_results: int, skip_sitemap: bool = False, use_ai_validation: bool = True) -> None:
    """Run batch parsing with database integration."""
    from database import SessionLocal
    db = SessionLocal()
    task_service = TaskService(db)
    task_logger = get_console_logger(task_uuid)
    
    try:
        task_logger.info(f"Starting batch parsing for query: {query}")
        
        if not GOOGLE_API_KEY or not GOOGLE_CX:
            raise ValueError("Google API keys not configured")
        
        batch_parser = BatchParser(
            google_api_key=GOOGLE_API_KEY,
            google_cx=GOOGLE_CX,
            openai_api_key=OPENAI_API_KEY if use_ai_validation else None,
            skip_sitemap=skip_sitemap,
            logger=task_logger
        )
        
        start_time = datetime.now()
        batch_parser.parse_from_search(query, num_results)
        results = batch_parser.get_results()
        processing_time = (datetime.now() - start_time).seconds
        
        if results:
            # Store batch results
            for site_result in results.get("sites", []):
                task_service.add_parsed_site(
                    task_id=task_uuid,
                    domain=site_result.get("domain", ""),
                    url=site_result.get("original_url", ""),
                    title=site_result.get("title", ""),
                    snippet=site_result.get("snippet", ""),
                    status=site_result.get("status", "failed"),
                    emails=site_result.get("result", {}).get("emails", []) if site_result.get("result") else [],
                    contact_forms=site_result.get("result", {}).get("contact_form_pages", []) if site_result.get("result") else [],
                    error_message=site_result.get("error"),
                    processing_time=processing_time // len(results.get("sites", []))  # Distribute time
                )
            
            task_service.complete_task(task_uuid)
            task_logger.info(f"✅ Successfully completed batch parsing")
        else:
            task_service.fail_task(task_uuid, "Batch parsing failed - no results found")
            task_logger.error("❌ Batch parsing failed - no results found")
            
    except Exception as e:
        error_msg = f"Error during batch parsing: {str(e)}"
        task_service.fail_task(task_uuid, error_msg)
        task_logger.error(f"❌ {error_msg}")
    finally:
        db.close()


# ==== API ENDPOINTS ====

@app.get("/")
async def root():
    """Root endpoint with basic information."""
    return {
        "message": "Website Contact Parser API",
        "version": "2.0.0",
        "status": "running"
    }


# PARSING ENDPOINTS

@app.post("/api/parse/single", response_model=SingleSiteParseResponse)
async def parse_single_site(
    request: SingleSiteParseRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Parse a single website for contact information."""
    task_service = TaskService(db)
    
    # Create database task
    task = task_service.create_task(
        task_type=TaskTypeEnum.SINGLE_SITE,
        parameters={
            "url": str(request.url), 
            "skip_sitemap": request.skip_sitemap,
            "use_ai_validation": request.use_ai_validation
        }
    )
    
    def task_wrapper():
        run_single_site_parsing_db(task.id, str(request.url), request.skip_sitemap, request.use_ai_validation)
    
    background_tasks.add_task(task_wrapper)
    
    return SingleSiteParseResponse(
        success=True,
        url=str(request.url),
        task_id=str(task.id),
        message="Parsing started, check task status for progress"
    )


@app.post("/api/parse/batch", response_model=BatchParseResponse)
async def parse_batch_sites(
    request: BatchParseRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Parse multiple websites from search results."""
    task_service = TaskService(db)
    
    # Create database task
    task = task_service.create_task(
        task_type=TaskTypeEnum.BATCH_PARSE,
        parameters={
            "query": request.query, 
            "num_results": request.num_results,
            "skip_sitemap": request.skip_sitemap,
            "use_ai_validation": request.use_ai_validation
        }
    )
    
    def task_wrapper():
        run_batch_parsing_db(task.id, request.query, request.num_results, request.skip_sitemap, request.use_ai_validation)
    
    background_tasks.add_task(task_wrapper)
    
    return BatchParseResponse(
        success=True,
        query=request.query,
        task_id=str(task.id),
        message="Batch parsing started, check task status for progress",
        total_domains=0,
        successful_domains=0,
        total_emails=0,
        total_forms=0,
        sites=[]
    )


# TASK MANAGEMENT ENDPOINTS

@app.get("/api/task/{task_id}/status", response_model=DatabaseTaskResponse)
async def get_task_status(task_id: str, db: Session = Depends(get_db)):
    """Get current status of a parsing task from database."""
    task_service = TaskService(db)
    
    try:
        task_uuid = uuid.UUID(task_id)
        task = task_service.get_task(task_uuid)
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return DatabaseTaskResponse(
            id=str(task.id),
            task_type=task.task_type.value,
            status=task.status.value,
            parameters=task.parameters,
            created_at=task.created_at,
            completed_at=task.completed_at,
            error_message=task.error_message
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")


@app.get("/api/task/{task_id}/sites", response_model=List[ParsedSiteResponse])
async def get_task_sites(task_id: str, db: Session = Depends(get_db)):
    """Get parsed sites for a specific task."""
    task_service = TaskService(db)
    
    try:
        task_uuid = uuid.UUID(task_id)
        sites = task_service.get_task_sites(task_uuid)
        
        return [
            ParsedSiteResponse(
                id=site.id,
                task_id=str(site.task_id),
                domain=site.domain,
                url=site.url,
                title=site.title,
                snippet=site.snippet,
                status=site.status,
                emails=site.emails,
                contact_forms=site.contact_forms,
                parsed_at=site.parsed_at,
                error_message=site.error_message,
                processing_time=site.processing_time
            )
            for site in sites
        ]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")


@app.get("/api/task/{task_id}/export/csv")
async def export_task_csv(task_id: str, db: Session = Depends(get_db)):
    """Export task results to CSV format: date, domain, page, emails, form_found_page"""
    task_service = TaskService(db)
    
    try:
        task_uuid = uuid.UUID(task_id)
        task = task_service.get_task(task_uuid)
        sites = task_service.get_task_sites(task_uuid)
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Generate CSV content
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)
        
        # Write headers
        writer.writerow(['date', 'domain', 'page', 'emails', 'form_found_page'])
        
        # Write data rows
        for site in sites:
            parsed_date = site.parsed_at.strftime('%Y-%m-%d %H:%M') if site.parsed_at else ''
            
            # Prepare contact form URLs
            contact_form_urls = []
            if site.contact_forms:
                for form_url in site.contact_forms:
                    # Convert relative URLs to absolute
                    if form_url.startswith('http'):
                        contact_form_urls.append(form_url)
                    else:
                        # Create absolute URL from relative path
                        from urllib.parse import urljoin
                        full_url = urljoin(site.url, form_url)
                        contact_form_urls.append(full_url)
            
            rows_created = False
            
            # 1. Create rows for emails on main site (assuming all emails found on main page)
            if site.emails and len(site.emails) > 0:
                main_url_has_form = site.url in contact_form_urls
                for email in site.emails:
                    writer.writerow([
                        parsed_date,
                        site.domain,
                        site.url,
                        email,
                        'True' if main_url_has_form else ''
                    ])
                    rows_created = True
            
            # 2. Create rows for contact form pages (excluding main URL to avoid duplication)
            for form_url in contact_form_urls:
                if form_url != site.url:  # Don't duplicate main URL
                    writer.writerow([
                        parsed_date,
                        site.domain,
                        form_url,
                        '',  # Empty email for form-only pages
                        'True'
                    ])
                    rows_created = True
            
            # 3. If no emails and no contact forms, create one empty row
            if not rows_created:
                writer.writerow([
                    parsed_date,
                    site.domain,
                    site.url,
                    '',
                    ''
                ])
        
        csv_content = output.getvalue()
        output.close()
        
        # Generate filename
        filename = f"{task.task_type.value}_results_{task_id[:8]}.csv"
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")


@app.delete("/api/task/{task_id}")
async def delete_task(task_id: str, db: Session = Depends(get_db)):
    """Delete a task and all related data."""
    task_service = TaskService(db)
    
    try:
        task_uuid = uuid.UUID(task_id)
        
        # Check if task exists and get its status
        task = task_service.get_task(task_uuid)
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Only allow deletion of finished tasks
        if task.status == TaskStatusEnum.RUNNING:
            raise HTTPException(
                status_code=400, 
                detail="Cannot delete running task. Please wait for it to complete or fail."
            )
        
        success = task_service.delete_task(task_uuid)
        
        if not success:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {"message": "Task deleted successfully"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")


@app.get("/api/tasks", response_model=List[DatabaseTaskResponse])
async def list_tasks(
    limit: int = 50, 
    offset: int = 0, 
    db: Session = Depends(get_db)
):
    """List tasks from database."""
    task_service = TaskService(db)
    
    tasks = task_service.get_tasks(limit=limit, offset=offset)
    
    return [
        DatabaseTaskResponse(
            id=str(task.id),
            task_type=task.task_type.value,
            status=task.status.value,
            parameters=task.parameters,
            created_at=task.created_at,
            completed_at=task.completed_at,
            error_message=task.error_message
        )
        for task in tasks
    ]


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app:app",
        host=SERVER_HOST,
        port=SERVER_PORT,
        reload=DEBUG_MODE
    ) 