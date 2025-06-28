import requests
import re
import time
import random
from typing import Optional, Set, Dict, Any
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from config import KEYWORD_GROUPS, ALL_PAGE_KEYWORDS, COMMON_PATHS, USER_AGENTS
from form_analyzer import FormAnalyzer
from sitemap_parser import SitemapParser
from logging_handler import log_message


class AdvancedParser:
    """
    Advanced parser for extracting contact information from websites.
    
    Supports:
    - Email extraction from HTML content
    - Contact form detection
    - Sitemap parsing for comprehensive coverage
    - Smart URL prioritization
    """
    
    def __init__(self, base_url: str, openai_api_key: Optional[str] = None, skip_sitemap: bool = False, logger=None):
        self.base_url = self._normalize_url(base_url)
        self.domain_name = urlparse(self.base_url).netloc
        self.skip_sitemap = skip_sitemap
        self.logger = logger
        
        # Results storage
        self.emails: Set[str] = set()
        self.contact_form_pages: Set[str] = set()
        
        # Track successful groups to avoid redundant processing
        self.successful_groups: Set[str] = set()
        
        # Initialize components
        self.session = self._create_session()
        self.form_analyzer = FormAnalyzer(openai_api_key, self.logger)
        self.sitemap_parser = SitemapParser(self.base_url, self.session, self.logger)

    def _create_session(self) -> requests.Session:
        """Create HTTP session with retry strategy."""
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        return session

    def _normalize_url(self, url: str) -> str:
        """Normalize URL by removing trailing slash from path."""
        parsed = urlparse(url)
        path = parsed.path
        if path.endswith('/') and len(path) > 1:
            path = path[:-1]
        
        from urllib.parse import urlunparse
        return urlunparse((parsed.scheme, parsed.netloc, path, parsed.params, parsed.query, parsed.fragment))

    def _get_url_keyword_group(self, url: str) -> Optional[str]:
        """Determine which keyword group a URL belongs to."""
        path_segment = urlparse(url).path.lower().split('/')[-1]
        
        for group_name, keywords in KEYWORD_GROUPS.items():
            if any(keyword == path_segment for keyword in keywords):
                return group_name
        
        # Check for common patterns
        if 'contact-us' in url:
            return 'contact'
        if 'about-us' in url:
            return 'about'
        
        return None

    def _should_skip_group(self, url_group: Optional[str]) -> bool:
        """Check if we should skip processing this URL group."""
        return url_group is not None and url_group in self.successful_groups

    def _mark_group_as_successful(self, url_group: Optional[str]) -> None:
        """Mark a URL group as successfully processed."""
        if url_group:
            self.successful_groups.add(url_group)

    def _make_request(self, url: str, ignore_errors: bool = False, timeout: tuple = (3, 10)) -> Optional[requests.Response]:
        """Make HTTP request with error handling."""
        try:
            headers = {'User-Agent': random.choice(USER_AGENTS)}
            response = self.session.get(url, headers=headers, timeout=timeout)
            
            if not ignore_errors:
                response.raise_for_status()
            
            return response
            
        except requests.exceptions.RequestException as e:
            if not ignore_errors:
                log_message(self.logger, "warning", f"Request error: {e}", "     ")
            return None

    def _is_valid_url(self, url: str) -> bool:
        """Check if URL is valid for processing."""
        parsed_url = urlparse(url)
        
        # Must be from same domain
        if not parsed_url.netloc.endswith(self.domain_name):
            return False
        
        # Must be HTTP/HTTPS
        if parsed_url.scheme not in ['http', 'https']:
            return False
        
        # Skip file downloads
        excluded_extensions = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.doc', '.docx']
        if any(url.lower().endswith(ext) for ext in excluded_extensions):
            return False
        
        return True

    def _find_emails(self, soup: BeautifulSoup) -> bool:
        """
        Extract email addresses from HTML content.
        Returns True if new emails were found.
        """
        emails_before = len(self.emails)
        
        # Find mailto links
        for link in soup.find_all('a', href=True):
            href = link['href']
            if href.startswith('mailto:'):
                email = href.split(':')[1].split('?')[0]  # Remove query parameters
                if email and self._is_valid_email(email):
                    self.emails.add(email.lower())
        
        # Find emails in text content using regex
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        text_content = soup.get_text()
        
        for email in re.findall(email_pattern, text_content):
            if self._is_valid_email(email):
                self.emails.add(email.lower())
        
        return len(self.emails) > emails_before

    def _is_valid_email(self, email: str) -> bool:
        """Check if email address looks valid."""
        # Basic validation
        if '@' not in email or '.' not in email.split('@')[1]:
            return False
        
        # Skip common false positives
        false_positives = [
            '.png', '.jpg', '.jpeg', '.gif', '.css', '.js',
            'example.com', 'test@', '@example', 'noreply@'
        ]
        
        email_lower = email.lower()
        return not any(fp in email_lower for fp in false_positives)

    def _collect_priority_urls(self) -> Set[str]:
        """Collect priority URLs for processing."""
        log_message(self.logger, "info", f"Parsing: {self.base_url}")
        
        # Start with base URL
        priority_urls = {self.base_url}
        
        # Get main page and extract relevant links
        main_page_response = self._make_request(self.base_url)
        if not main_page_response:
            log_message(self.logger, "error", "Cannot load main page")
            return priority_urls
        
        homepage_soup = BeautifulSoup(main_page_response.text, 'html.parser')
        
        # Extract links from homepage
        for link in homepage_soup.find_all('a', href=True):
            absolute_link = urljoin(self.base_url, link['href'])
            
            if not self._is_valid_url(absolute_link):
                continue
            
            # Check if link or text contains relevant keywords
            link_text = link.get_text(strip=True).lower()
            link_url = absolute_link.lower()
            
            if any(keyword in link_url or keyword in link_text for keyword in ALL_PAGE_KEYWORDS):
                priority_urls.add(self._normalize_url(absolute_link))
        
        # Add sitemap URLs if not skipping
        if not self.skip_sitemap:
            sitemap_links = self.sitemap_parser.get_links_from_sitemap()
            priority_urls.update(sitemap_links)
        else:
            log_message(self.logger, "info", "Skipping sitemap (fast mode)")
        
        # Add common paths
        log_message(self.logger, "info", "Adding common contact pages...")
        for path in COMMON_PATHS:
            priority_urls.add(self._normalize_url(urljoin(self.base_url, path)))
        
        return priority_urls

    def _process_url(self, url: str, index: int, total: int) -> bool:
        """
        Process a single URL for contact information.
        Returns True if information was found.
        """
        url_group = self._get_url_keyword_group(url)
        
        # Skip if this group was already successfully processed
        if self._should_skip_group(url_group):
            log_message(self.logger, "info", f"({index}/{total}) Skipping: {url} (group '{url_group}' already processed)", "   ")
            return False
        
        log_message(self.logger, "info", f"({index}/{total}) Checking: {url}", "   ")
        
        # Add delay between requests
        time.sleep(random.uniform(0.5, 1.5))
        
        response = self._make_request(url, ignore_errors=True)
        if not response or response.status_code != 200:
            return False
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Look for emails and forms
        found_emails = self._find_emails(soup)
        found_forms = self.form_analyzer.analyze_contact_forms(soup, url)
        
        if found_forms:
            self.contact_form_pages.add(self._normalize_url(url))
        
        # Mark group as successful if we found something
        if (found_emails or found_forms) and url_group:
            self._mark_group_as_successful(url_group)
            log_message(self.logger, "info", f"✅ Group '{url_group}' marked as successful", "     ")
        
        return found_emails or found_forms

    def parse(self) -> Optional[Dict[str, Any]]:
        """
        Main parsing method.
        Returns dictionary with emails and contact form pages, or None on failure.
        """
        priority_urls = self._collect_priority_urls()
        
        if not priority_urls:
            log_message(self.logger, "error", "No URLs to process")
            return None
        
        log_message(self.logger, "info", f"Found {len(priority_urls)} URLs to check for contact information")
        
        # Process all URLs
        urls_to_check = sorted(list(priority_urls))
        for i, url in enumerate(urls_to_check, 1):
            self._process_url(url, i, len(urls_to_check))
        
        return {
            "emails": sorted(list(self.emails)),
            "contact_form_pages": sorted(list(self.contact_form_pages))
        } 