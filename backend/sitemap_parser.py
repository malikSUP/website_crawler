"""
Simplified sitemap parsing module.
"""

from typing import Set, List, Dict, Optional
from urllib.parse import urljoin, urlparse
import xml.etree.ElementTree as ET
import requests

from config import ALL_PAGE_KEYWORDS
from logging_handler import log_message


class SitemapParser:
    """Simplified sitemap parser."""
    
    def __init__(self, base_url: str, session: requests.Session, logger=None):
        self.base_url = base_url
        self.session = session
        self.logger = logger
        
        # Limits for sanity
        self.MAX_SITEMAP_SIZE_MB = 10
        self.MAX_URLS_PER_SITEMAP = 1000
        self.MAX_SITEMAPS = 5

    def get_links_from_sitemap(self) -> Set[str]:
        """Extract and prioritize links from website sitemap."""
        log_message(self.logger, "info", "Searching for sitemap...", "   - ")
        
        sitemap_urls = self._find_sitemap_urls()
        if not sitemap_urls:
            log_message(self.logger, "info", "No sitemaps found", "   - ")
            return set()

        log_message(self.logger, "info", f"Found {len(sitemap_urls)} sitemap(s)", "   - ")
        
        all_links = set()
        processed = 0
        
        for sitemap_url in list(sitemap_urls)[:self.MAX_SITEMAPS]:
            links = self._parse_sitemap(sitemap_url)
            all_links.update(links)
            processed += 1
            
            if len(all_links) >= self.MAX_URLS_PER_SITEMAP:
                break
        
        # Prioritize contact-related URLs
        prioritized_links = self._prioritize_urls(all_links)
        
        log_message(self.logger, "info", f"Processed {processed} sitemaps, found {len(prioritized_links)} priority URLs", "   - ")
        return prioritized_links

    def _find_sitemap_urls(self) -> Set[str]:
        """Find sitemap URLs for the website."""
        potential_sitemaps = {
            urljoin(self.base_url, '/sitemap.xml'),
            urljoin(self.base_url, '/sitemap_index.xml'),
            urljoin(self.base_url, '/sitemaps.xml'),
            urljoin(self.base_url, '/sitemap/sitemap.xml'),
        }
        
        valid_sitemaps = set()
        
        for sitemap_url in potential_sitemaps:
            try:
                response = self.session.get(sitemap_url, timeout=10)
                if response.status_code == 200:
                    valid_sitemaps.add(sitemap_url)
            except requests.RequestException:
                pass
        
        return valid_sitemaps

    def _parse_sitemap(self, sitemap_url: str) -> Set[str]:
        """Parse a single sitemap."""
        try:
            response = self.session.get(sitemap_url, timeout=15)
            if response.status_code != 200:
                return set()
            
            # Check size - skip if too large
            content_length = len(response.content)
            size_mb = content_length / (1024 * 1024)
            if size_mb > self.MAX_SITEMAP_SIZE_MB:
                log_message(self.logger, "warning", f"Sitemap too large ({size_mb:.1f}MB), skipping", "   ⚠️  ")
                return set()
            
            return self._extract_urls_from_xml(response.content)
            
        except requests.RequestException as e:
            log_message(self.logger, "error", f"Failed to load sitemap {sitemap_url}: {e}", "   ❌ ")
            return set()
        except Exception as e:
            log_message(self.logger, "error", f"Error parsing sitemap {sitemap_url}: {e}", "   ❌ ")
            return set()

    def _extract_urls_from_xml(self, xml_content: bytes) -> Set[str]:
        """Extract URLs from XML sitemap content."""
        urls = set()
        
        try:
            root = ET.fromstring(xml_content)
            
            # Handle namespace
            namespaces = {'': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
            if root.tag.startswith('{'):
                namespace = root.tag.split('}')[0] + '}'
                namespaces[''] = namespace[1:-1]
            
            # Look for URL elements
            for url_elem in root.findall('.//url', namespaces) or root.findall('.//url'):
                loc_elem = url_elem.find('loc', namespaces) or url_elem.find('loc')
                if loc_elem is not None and loc_elem.text:
                    clean_url = self._normalize_url(loc_elem.text.strip())
                    if self._is_same_domain(clean_url):
                        urls.add(clean_url)
                        
            # Handle sitemap index files
            for sitemap_elem in root.findall('.//sitemap', namespaces) or root.findall('.//sitemap'):
                loc_elem = sitemap_elem.find('loc', namespaces) or sitemap_elem.find('loc')
                if loc_elem is not None and loc_elem.text:
                    # Recursively parse nested sitemaps
                    nested_urls = self._parse_sitemap(loc_elem.text.strip())
                    urls.update(nested_urls)
                    
                    if len(urls) >= self.MAX_URLS_PER_SITEMAP:
                        break
                        
        except ET.ParseError:
            # Try to extract URLs with simple regex if XML parsing fails
            import re
            url_pattern = r'<loc[^>]*>(.*?)</loc>'
            matches = re.findall(url_pattern, xml_content.decode('utf-8', errors='ignore'))
            for match in matches:
                clean_url = self._normalize_url(match.strip())
                if self._is_same_domain(clean_url):
                    urls.add(clean_url)
                    
        return urls

    def _is_same_domain(self, url: str) -> bool:
        """Check if URL belongs to the same domain."""
        try:
            parsed_base = urlparse(self.base_url)
            parsed_url = urlparse(url)
            return parsed_url.netloc == parsed_base.netloc
        except Exception:
            return False

    def _prioritize_urls(self, urls: Set[str]) -> Set[str]:
        """Prioritize URLs that likely contain contact information."""
        if not urls:
            return set()
            
        prioritized = set()
        
        # First priority: URLs with contact keywords
        for url in urls:
            url_lower = url.lower()
            if any(keyword in url_lower for keyword in ALL_PAGE_KEYWORDS):
                prioritized.add(url)
        
        # If we have enough prioritized URLs, return them
        if len(prioritized) >= 20:
            return prioritized
        
        # Add more URLs if needed, prioritizing shorter paths (likely more important pages)
        remaining_urls = urls - prioritized
        sorted_remaining = sorted(remaining_urls, key=lambda x: len(urlparse(x).path))
        
        # Add up to 50 total URLs
        for url in sorted_remaining:
            prioritized.add(url)
            if len(prioritized) >= 50:
                break
                
        return prioritized

    def _normalize_url(self, url: str) -> str:
        """Normalize URL by removing trailing slash."""
        parsed = urlparse(url)
        path = parsed.path.rstrip('/')
        if not path:
            path = '/'
        
        from urllib.parse import urlunparse
        return urlunparse((parsed.scheme, parsed.netloc, path, '', '', '')) 