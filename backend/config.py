import os
from dataclasses import dataclass
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

# API Keys from environment variables
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
GOOGLE_CX = os.getenv('GOOGLE_CX')

# Database configuration
DATABASE_URL = os.getenv(
    'DATABASE_URL'
)

# Server configuration
SERVER_HOST = os.getenv('SERVER_HOST', '0.0.0.0')
SERVER_PORT = int(os.getenv('SERVER_PORT', 8000))
DEBUG_MODE = os.getenv('DEBUG_MODE', 'true').lower() == 'true'

@dataclass
class ParserConfig:
    """Configuration for the parser."""
    max_sitemaps: int = 5
    max_urls_per_sitemap: int = 1000
    max_sitemap_size_mb: int = 10
    form_score_threshold: int = 5
    timeout: tuple = (3, 10)
    max_urls_to_process: int = 50
    CONTACT_FORM_THRESHOLD: int = 5  # Same as form_score_threshold for backwards compatibility
    ENABLE_AI_VERIFICATION: bool = True  # Enable AI verification for forms

# Search configuration
KEYWORD_GROUPS = {
    'contact': ['contact', 'contacts', 'kontakt', 'kontakty', 'связаться', 'контакты', 'feedback'],
    'about': ['about', 'o-nas', 'о-нас'],
    'support': ['support', 'help', 'podderzhka', 'поддержка'],
    'mail': ['mail', 'email', 'pochta', 'почта'],
    'ads': ['ads', 'advertisements', 'advertise', 'advertising', 'реклама', 'рекламодателям', 'partner', 'partners', 'partnership', 'partnerstvo', 'партнерство', 'collaborate', 'cooperation']
}
ALL_PAGE_KEYWORDS = [keyword for group in KEYWORD_GROUPS.values() for keyword in group]

COMMON_PATHS = ['/contact', '/contacts', '/about', '/feedback', '/support', '/help', '/ads', '/advertisements', '/advertise', '/advertising', '/partners', '/partnership', '/collaborate']

FORM_KEYWORDS = {
    'form_attributes': ['contact', 'feedback', 'message', 'msg', 'mail', 'form', 'partner', 'advertise', 'collaboration'],
    'input_fields': {
        'name': ['name', 'имя', 'fname', 'lname', 'company', 'компания', 'organization'],
        'email': ['email', 'e-mail', 'mail', 'почта'],
        'message': ['message', 'msg', 'сообщение', 'text', 'body', 'comment', 'proposal', 'предложение', 'description', 'описание']
    },
    'surrounding_text': ['contact us', 'send a message', 'get in touch', 'свяжитесь с нами', 'advertise with us', 'become a partner', 'partnership inquiry', 'collaboration', 'сотрудничество', 'стать партнером', 'рекламодателям']
}

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
]

# LLM scoring map for form analysis
LLM_SCORE_MAP = {-2: -5, -1: -2, 0: 0, 1: 2, 2: 5} 