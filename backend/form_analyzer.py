"""
Form analysis module for detecting contact forms on web pages.
"""

from typing import Optional, Set
from bs4 import BeautifulSoup
import re

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from config import FORM_KEYWORDS, ParserConfig, LLM_SCORE_MAP
from logging_handler import log_message


class FormAnalyzer:
    """Analyzes HTML forms to identify contact forms."""
    
    def __init__(self, openai_api_key: Optional[str] = None, logger=None):
        self.openai_client = None
        self.logger = logger
        if OpenAI and openai_api_key:
            try:
                self.openai_client = OpenAI(api_key=openai_api_key)
                log_message(self.logger, "info", "OpenAI connected for form analysis")
            except Exception as e:
                log_message(self.logger, "error", f"Error connecting to OpenAI: {e}")
        elif OpenAI:
            log_message(self.logger, "info", "OpenAI API key not provided")

    def analyze_contact_forms(self, soup: BeautifulSoup, url: str) -> bool:
        """
        Analyze page for contact forms.
        Returns True if contact form is found.
        """
        forms = soup.find_all('form')
        if not forms:
            return False

        for form in forms:
            if self._is_contact_form(form):
                return True
        
        return False

    def _is_contact_form(self, form: BeautifulSoup) -> bool:
        """Check if form is a contact form."""
        score = 0
        
        # Get form text and attributes for analysis
        form_text = form.get_text().lower()
        form_action = form.get('action', '').lower()
        form_class = form.get('class', [])
        form_id = form.get('id', '').lower()
        
        if isinstance(form_class, list):
            form_class = ' '.join(form_class).lower()
        else:
            form_class = str(form_class).lower()
        
        form_context = f"{form_text} {form_action} {form_class} {form_id}"
        
        # Check form attributes and surrounding text for contact keywords
        if 'form_attributes' in FORM_KEYWORDS:
            for keyword in FORM_KEYWORDS['form_attributes']:
                if keyword in form_context:
                    score += 2
        
        if 'surrounding_text' in FORM_KEYWORDS:
            for phrase in FORM_KEYWORDS['surrounding_text']:
                if phrase in form_context:
                    score += 3
        
        # Check form fields
        inputs = form.find_all(['input', 'textarea', 'select'])
        has_email_field = False
        has_message_field = False
        has_name_field = False
        
        for input_field in inputs:
            field_name = input_field.get('name', '').lower()
            field_placeholder = input_field.get('placeholder', '').lower()
            field_id = input_field.get('id', '').lower()
            field_type = input_field.get('type', '').lower()
            
            field_text = f"{field_name} {field_placeholder} {field_id}"
            
            # Check against structured input field keywords
            if 'input_fields' in FORM_KEYWORDS:
                # Check email fields
                if 'email' in FORM_KEYWORDS['input_fields']:
                    for email_keyword in FORM_KEYWORDS['input_fields']['email']:
                        if email_keyword in field_text or field_type == 'email':
                            has_email_field = True
                            score += 4
                            break
                
                # Check message fields  
                if 'message' in FORM_KEYWORDS['input_fields']:
                    for msg_keyword in FORM_KEYWORDS['input_fields']['message']:
                        if msg_keyword in field_text or input_field.name == 'textarea':
                            has_message_field = True
                            score += 3
                            break
                
                # Check name fields
                if 'name' in FORM_KEYWORDS['input_fields']:
                    for name_keyword in FORM_KEYWORDS['input_fields']['name']:
                        if name_keyword in field_text:
                            has_name_field = True
                            score += 2
                            break
            
            # Additional hardcoded checks for common patterns
            if any(keyword in field_text for keyword in ['contact', 'phone', 'subject']):
                score += 2
        
        # Bonus points for having typical contact form combination
        if has_email_field and has_message_field:
            score += 3
        if has_email_field and has_name_field:
            score += 2
        
        # Use AI if available and score is uncertain
        if self.openai_client and ParserConfig.ENABLE_AI_VERIFICATION and 2 <= score <= 8:
            surrounding_text = self._get_surrounding_text(form)
            ai_score = self._verify_with_ai(form, surrounding_text)
            score += ai_score
        
        return score >= ParserConfig.CONTACT_FORM_THRESHOLD

    def _get_surrounding_text(self, form: BeautifulSoup) -> str:
        """Get text content around the form for context."""
        parent = form.parent
        if parent:
            return parent.get_text(strip=True)
        return ""

    def _verify_with_ai(self, form: BeautifulSoup, surrounding_text: str) -> int:
        """Use AI to verify if form is a contact form."""
        if not self.openai_client:
            return 0

        form_html = form.prettify(formatter="html")
        if len(form_html) > 2000:
            form_html = form_html[:2000] + "\n... (truncated)"

        system_prompt = (
            "Analyze HTML forms to determine if they are contact forms. "
            "Respond with a single integer: -2 (definitely not), -1 (unlikely), "
            "1 (likely), or 2 (definitely a contact form)."
        )
        
        user_prompt = (
            f"Context: {surrounding_text[:300]}\n\n"
            f"Form HTML: {form_html}"
        )

        try:
            log_message(self.logger, "info", "Verifying with AI...", "     - ")
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0,
                max_tokens=5
            )
            
            content = response.choices[0].message.content.strip()
            ai_decision = int(re.search(r'-?\d+', content).group())
            score = LLM_SCORE_MAP.get(ai_decision, 0)
            
            log_message(self.logger, "info", f"AI result: {ai_decision} (score: {score})", " ")
            return score

        except Exception as e:
            log_message(self.logger, "error", f"AI verification error: {e}", " ")
            return 0 