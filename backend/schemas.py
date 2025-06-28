from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field
import uuid


class SingleSiteParseRequest(BaseModel):
    """Request model for single site parsing."""
    url: HttpUrl = Field(..., description="Website URL to parse")
    skip_sitemap: bool = Field(False, description="Skip sitemap parsing for faster processing")
    use_ai_validation: bool = Field(True, description="Use AI for form validation")


class BatchParseRequest(BaseModel):
    """Request model for batch parsing from search results."""
    query: str = Field(..., description="Search query", min_length=1)
    num_results: int = Field(10, description="Number of search results to process", ge=1, le=100)
    skip_sitemap: bool = Field(False, description="Skip sitemap parsing for faster processing")
    use_ai_validation: bool = Field(True, description="Use AI for form validation")


class ParseResult(BaseModel):
    """Result model for parsing operations."""
    emails: List[str] = Field(default_factory=list, description="Found email addresses")
    contact_form_pages: List[str] = Field(default_factory=list, description="URLs with contact forms")


class SingleSiteParseResponse(BaseModel):
    """Response model for single site parsing."""
    success: bool = Field(..., description="Whether parsing was successful")
    url: str = Field(..., description="Original URL that was parsed")
    task_id: Optional[str] = Field(None, description="Task ID for tracking progress")
    message: Optional[str] = Field(None, description="Status message")
    result: Optional[ParseResult] = Field(None, description="Parsing results")
    error: Optional[str] = Field(None, description="Error message if parsing failed")


class BatchSiteInfo(BaseModel):
    """Information about a single site in batch results."""
    domain: str = Field(..., description="Domain name")
    title: str = Field(..., description="Page title from search result")
    snippet: str = Field(..., description="Page snippet from search result")
    original_url: str = Field(..., description="Original URL from search result")
    status: str = Field(..., description="Processing status: success, failed, or error")
    result: Optional[ParseResult] = Field(None, description="Parsing results if successful")
    error: Optional[str] = Field(None, description="Error message if processing failed")


class BatchParseResponse(BaseModel):
    """Response model for batch parsing."""
    success: bool = Field(..., description="Whether batch parsing was successful")
    query: str = Field(..., description="Original search query")
    task_id: Optional[str] = Field(None, description="Task ID for tracking progress")
    message: Optional[str] = Field(None, description="Status message")
    total_domains: int = Field(..., description="Total number of domains processed")
    successful_domains: int = Field(..., description="Number of successfully processed domains")
    total_emails: int = Field(..., description="Total number of emails found")
    total_forms: int = Field(..., description="Total number of contact forms found")
    sites: List[BatchSiteInfo] = Field(default_factory=list, description="Detailed results for each site")
    error: Optional[str] = Field(None, description="Error message if batch parsing failed")


class DatabaseTaskResponse(BaseModel):
    """Response model for database-stored tasks."""
    id: str = Field(..., description="Task UUID")
    task_type: str = Field(..., description="Type of task")
    status: str = Field(..., description="Current task status")
    parameters: dict = Field(..., description="Task parameters")
    created_at: datetime = Field(..., description="Task creation timestamp")
    completed_at: Optional[datetime] = Field(None, description="Task completion timestamp")
    error_message: Optional[str] = Field(None, description="Error message if failed")


class ParsedSiteResponse(BaseModel):
    """Response model for parsed site data."""
    id: int = Field(..., description="Site entry ID")
    task_id: str = Field(..., description="Associated task ID")
    domain: str = Field(..., description="Site domain")
    url: str = Field(..., description="Site URL")
    title: Optional[str] = Field(None, description="Site title")
    snippet: Optional[str] = Field(None, description="Site snippet")
    status: str = Field(..., description="Parsing status")
    emails: Optional[List[str]] = Field(None, description="Found emails")
    contact_forms: Optional[List[str]] = Field(None, description="Contact form URLs")
    parsed_at: datetime = Field(..., description="Parsing timestamp")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    processing_time: Optional[int] = Field(None, description="Processing time in seconds") 