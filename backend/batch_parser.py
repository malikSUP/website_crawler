"""
Batch parser for processing multiple websites from search results.
"""

import time
import random
from typing import Dict, Any, Optional
from google_search import GoogleSearchAPI
from parser import AdvancedParser
from logging_handler import log_message


class BatchParser:
    """Parser for processing multiple websites from Google search results."""
    
    def __init__(self, google_api_key: str, google_cx: str, openai_api_key: Optional[str] = None, skip_sitemap: bool = False, logger=None):
        self.google_search = GoogleSearchAPI(google_api_key, google_cx, logger)
        self.openai_api_key = openai_api_key
        self.skip_sitemap = skip_sitemap
        self.logger = logger
        self.all_results: Dict[str, Dict[str, Any]] = {}

    def parse_from_search(self, query: str, num_results: int = 10) -> Dict[str, Dict[str, Any]]:
        """
        Parse websites from Google search results.
        
        Args:
            query: Search query
            num_results: Number of search results to process
            
        Returns:
            Dictionary with parsing results for each domain
        """
        log_message(self.logger, "info", "=" * 60, "\n")
        log_message(self.logger, "info", f"BATCH PARSING FOR QUERY: '{query}'")
        log_message(self.logger, "info", "=" * 60)

        search_results = self.google_search.get_multiple_pages(query, num_results)
        if not search_results:
            log_message(self.logger, "warning", "No search results")
            return {}

        # Extract unique domains
        unique_domains = self._extract_unique_domains(search_results)
        
        log_message(self.logger, "info", f"Found {len(unique_domains)} unique domains:", "\n")
        for i, (domain, info) in enumerate(unique_domains.items(), 1):
            log_message(self.logger, "info", f"   {i}. {domain}")
            log_message(self.logger, "info", f"      {info['title'][:100]}...")

        # Parse each domain
        self._parse_domains(unique_domains)

        return self.all_results

    def _extract_unique_domains(self, search_results: list) -> Dict[str, Dict[str, str]]:
        """Extract unique domains from search results."""
        unique_domains = {}
        
        for result in search_results:
            domain = result['domain']
            if domain not in unique_domains:
                unique_domains[domain] = {
                    'title': result['title'],
                    'snippet': result['snippet'],
                    'original_url': result['link']
                }
        
        return unique_domains

    def _parse_domains(self, unique_domains: Dict[str, Dict[str, str]]) -> None:
        """Parse each domain for contact information."""
        total_domains = len(unique_domains)
        
        for i, (domain, info) in enumerate(unique_domains.items(), 1):
            log_message(self.logger, "info", "-" * 50, "\n")
            log_message(self.logger, "info", f"[{i}/{total_domains}] Parsing: {domain}")
            log_message(self.logger, "info", f"Original page: {info['original_url']}")
            log_message(self.logger, "info", "-" * 50)

            try:
                # Use fast mode for large sites or if skip_sitemap is enabled
                should_skip_sitemap = self.skip_sitemap or self._should_use_fast_mode(domain)
                if should_skip_sitemap:
                    reason = "enabled by user" if self.skip_sitemap else "large site detected"
                    log_message(self.logger, "info", f"🚀 Using fast mode for {domain} ({reason})", "   ")
                    
                parser = AdvancedParser(domain, self.openai_api_key, skip_sitemap=should_skip_sitemap, logger=self.logger)
                results = parser.parse()

                if results:
                    self.all_results[domain] = {
                        'search_info': info,
                        'parsing_results': results,
                        'status': 'success'
                    }

                    emails_count = len(results['emails'])
                    forms_count = len(results['contact_form_pages'])
                    log_message(self.logger, "info", f"✅ Result: {emails_count} email(s), {forms_count} form(s)")
                else:
                    self.all_results[domain] = {
                        'search_info': info,
                        'parsing_results': None,
                        'status': 'failed'
                    }
                    log_message(self.logger, "error", "❌ Parsing failed")

            except Exception as e:
                log_message(self.logger, "error", f"❌ Error: {e}")
                self.all_results[domain] = {
                    'search_info': info,
                    'parsing_results': None,
                    'status': 'error',
                    'error': str(e)
                }

            # Pause between domains
            if i < total_domains:
                log_message(self.logger, "info", "Pause between domains...")
                time.sleep(random.uniform(2, 4))

    def _should_use_fast_mode(self, domain: str) -> bool:
        """Determine if fast mode should be used for this domain."""
        large_sites = ['netflix', 'youtube', 'amazon', 'wikipedia', 'google', 'facebook', 'twitter']
        return any(site in domain.lower() for site in large_sites)

    def get_results(self) -> Dict[str, Any]:
        """
        Format results for database storage.
        
        Returns:
            Dictionary with formatted results compatible with database storage
        """
        if not self.all_results:
            return {}
        
        # Calculate statistics
        total_domains = len(self.all_results)
        successful_domains = sum(1 for r in self.all_results.values() if r['status'] == 'success')
        total_emails = sum(
            len(r['parsing_results']['emails']) 
            for r in self.all_results.values()
            if r['status'] == 'success' and r['parsing_results']
        )
        total_forms = sum(
            len(r['parsing_results']['contact_form_pages']) 
            for r in self.all_results.values()
            if r['status'] == 'success' and r['parsing_results']
        )
        
        # Format sites for database storage
        sites = []
        for domain, data in self.all_results.items():
            site_info = {
                'domain': domain,
                'title': data['search_info']['title'],
                'snippet': data['search_info']['snippet'],
                'original_url': data['search_info']['original_url'],
                'status': data['status']
            }
            
            if data['status'] == 'success' and data['parsing_results']:
                site_info['result'] = data['parsing_results']
            elif data['status'] == 'error':
                site_info['error'] = data.get('error', 'Unknown error')
            
            sites.append(site_info)
        
        return {
            'total_domains': total_domains,
            'successful_domains': successful_domains,
            'total_emails': total_emails,
            'total_forms': total_forms,
            'sites': sites
        }

    def print_summary(self) -> None:
        """Print summary of batch parsing results."""
        if not self.all_results:
            print("No results")
            return

        print(f"\n{'=' * 60}")
        print("FINAL REPORT")
        print(f"{'=' * 60}")

        # Calculate statistics
        total_domains = len(self.all_results)
        successful_domains = sum(1 for r in self.all_results.values() if r['status'] == 'success')
        total_emails = sum(
            len(r['parsing_results']['emails']) 
            for r in self.all_results.values()
            if r['status'] == 'success' and r['parsing_results']
        )
        total_forms = sum(
            len(r['parsing_results']['contact_form_pages']) 
            for r in self.all_results.values()
            if r['status'] == 'success' and r['parsing_results']
        )

        print(f"Total domains: {total_domains}")
        print(f"Successful: {successful_domains}")
        print(f"Total emails: {total_emails}")
        print(f"Total forms: {total_forms}")

        print(f"\n{'-' * 40}")
        print("DETAILED RESULTS:")
        print(f"{'-' * 40}")

        # Print detailed results
        for domain, data in self.all_results.items():
            print(f"\n🌐 {domain}")
            print(f"   Status: {data['status']}")

            if data['status'] == 'success' and data['parsing_results']:
                results = data['parsing_results']
                
                print(f"   📧 Emails: {len(results['emails'])}")
                for email in results['emails']:
                    print(f"      - {email}")

                print(f"   📝 Forms: {len(results['contact_form_pages'])}")
                for form_page in results['contact_form_pages']:
                    print(f"      - {form_page}")

            elif data['status'] == 'error':
                print(f"   ❌ Error: {data.get('error', 'Unknown error')}")

            elif data['status'] == 'failed':
                print(f"   ❌ Failed") 