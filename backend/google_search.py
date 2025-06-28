import requests
import time
import random
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse
from logging_handler import log_message


class GoogleSearchAPI:
    """Google Custom Search API client for finding websites."""
    
    def __init__(self, api_key: str, cx: str, logger=None):
        """
        Initialize Google Search API client.
        
        Args:
            api_key: Google API key
            cx: Custom Search Engine ID
            logger: Optional logger instance
        """
        self.api_key = api_key
        self.cx = cx
        self.base_url = "https://www.googleapis.com/customsearch/v1"
        self.logger = logger

    def search(self, query: str, num_results: int = 10, start: int = 1) -> List[Dict[str, Any]]:
        """
        Perform a single search request.
        
        Args:
            query: Search query
            num_results: Number of results to return (max 10 per request)
            start: Starting index for results (1-based)
            
        Returns:
            List of search results with title, link, snippet, and domain
        """
        log_message(self.logger, "info", f"Searching: '{query}' ({num_results} results)")

        params = {
            'key': self.api_key,
            'cx': self.cx,
            'q': query,
            'num': min(num_results, 10),  # Google API limit
            'start': start
        }

        try:
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

            results = []
            if 'items' in data:
                for item in data['items']:
                    results.append({
                        'title': item.get('title', ''),
                        'link': item.get('link', ''),
                        'snippet': item.get('snippet', ''),
                        'domain': self._extract_domain(item.get('link', ''))
                    })

            log_message(self.logger, "info", f"Found {len(results)} results")
            return results

        except requests.exceptions.RequestException as e:
            log_message(self.logger, "error", f"Search error: {e}")
            return []
        except Exception as e:
            log_message(self.logger, "error", f"Processing error: {e}")
            return []

    def _extract_domain(self, url: str) -> str:
        """
        Extract domain from URL.
        
        Args:
            url: Full URL
            
        Returns:
            Domain with protocol (e.g., 'https://example.com')
        """
        try:
            parsed = urlparse(url)
            return f"{parsed.scheme}://{parsed.netloc}"
        except Exception:
            return url

    def get_multiple_pages(self, query: str, total_results: int = 20) -> List[Dict[str, Any]]:
        """
        Get multiple pages of search results.
        
        Args:
            query: Search query
            total_results: Total number of results to collect
            
        Returns:
            List of all search results
        """
        all_results = []
        start = 1

        while len(all_results) < total_results:
            remaining = total_results - len(all_results)
            num = min(remaining, 10)  # Google API limit per request

            results = self.search(query, num_results=num, start=start)
            if not results:
                break

            all_results.extend(results)
            start += len(results)

            # Add delay between requests to avoid rate limiting
            if len(all_results) < total_results:
                log_message(self.logger, "info", "Pause between requests...")
                time.sleep(random.uniform(1, 2))

        return all_results[:total_results] 