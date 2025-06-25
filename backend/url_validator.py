"""
URL Validation and Correction Service for AskBill Responses

This service validates and corrects URLs in AskBill responses using multiple layers:
1. Pattern-based validation for known Plaid documentation structure
2. Cached validation results for performance
3. Live URL checking with rate limiting
4. Claude-powered intelligent correction
"""

import re
import asyncio
import aiohttp
from urllib.parse import urlparse, urljoin
from typing import Dict, List, Optional, Tuple, Set
from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger(__name__)

@dataclass
class URLValidationResult:
    original_url: str
    is_valid: bool
    corrected_url: Optional[str] = None
    error_type: Optional[str] = None
    confidence: float = 1.0
    cached: bool = False

class PlaidURLValidator:
    """
    Comprehensive URL validator for Plaid documentation links
    """
    
    # Known valid Plaid domains and patterns
    VALID_DOMAINS = {
        'plaid.com',
        'docs.plaid.com', 
        'dashboard.plaid.com',
        'github.com/plaid',
        'api.plaid.com'
    }
    
    # Common Plaid documentation path patterns
    KNOWN_PATHS = {
        '/docs/api/': 'API Reference',
        '/docs/quickstart/': 'Quick Start Guide',
        '/docs/auth/': 'Auth Product Documentation',
        '/docs/identity/': 'Identity Product Documentation',
        '/docs/transactions/': 'Transactions Product Documentation',
        '/docs/assets/': 'Assets Product Documentation',
        '/docs/liabilities/': 'Liabilities Product Documentation',
        '/docs/investments/': 'Investments Product Documentation',
        '/docs/link/': 'Link Documentation',
        '/docs/payment-initiation/': 'Payment Initiation Documentation',
        '/docs/transfer/': 'Transfer Documentation',
        '/docs/monitor/': 'Monitor Documentation',
        '/docs/beacon/': 'Beacon Documentation',
        '/docs/cra/': 'CRA Documentation',
        '/docs/fdx/': 'FDX Documentation'
    }
    
    # Common URL correction patterns
    CORRECTION_PATTERNS = [
        # Fix common domain typos
        (r'https?://(?:www\.)?pliad\.com', 'https://plaid.com'),
        (r'https?://(?:www\.)?plaid\.co(?:m|$)', 'https://plaid.com'),
        (r'https?://(?:www\.)?docs\.pliad\.com', 'https://docs.plaid.com'),
        
        # Fix missing https
        (r'^plaid\.com/', 'https://plaid.com/'),
        (r'^docs\.plaid\.com/', 'https://docs.plaid.com/'),
        
        # Fix double slashes in paths
        (r'(https?://[^/]+)//+', r'\1/'),
        
        # Fix common path typos
        (r'/docs?/api([/#?]|$)', r'/docs/api\1'),
        (r'/docs?/link([/#?]|$)', r'/docs/link\1'),
        (r'/docs?/auth([/#?]|$)', r'/docs/auth\1'),
    ]
    
    def __init__(self, cache_duration_hours: int = 24):
        self.cache: Dict[str, URLValidationResult] = {}
        self.cache_duration = timedelta(hours=cache_duration_hours)
        self.session: Optional[aiohttp.ClientSession] = None
        self._rate_limit_delay = 0.1  # 100ms between requests
        self._last_request_time = 0
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=5),
            headers={'User-Agent': 'Plaid-Solution-Guide-URLValidator/1.0'}
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _pattern_validate_url(self, url: str) -> URLValidationResult:
        """Fast pattern-based validation"""
        try:
            parsed = urlparse(url)
            
            # Check if domain is valid
            domain = parsed.netloc.lower()
            if not any(valid_domain in domain for valid_domain in self.VALID_DOMAINS):
                return URLValidationResult(
                    original_url=url,
                    is_valid=False,
                    error_type="invalid_domain",
                    confidence=0.9
                )
            
            # Check for obvious malformed URLs
            if not parsed.scheme or not parsed.netloc:
                return URLValidationResult(
                    original_url=url,
                    is_valid=False,
                    error_type="malformed_url",
                    confidence=0.95
                )
            
            return URLValidationResult(
                original_url=url,
                is_valid=True,
                confidence=0.8  # Pattern validation has medium confidence
            )
            
        except Exception as e:
            return URLValidationResult(
                original_url=url,
                is_valid=False,
                error_type="parse_error",
                confidence=1.0
            )
    
    def _apply_corrections(self, url: str) -> str:
        """Apply known correction patterns"""
        corrected = url
        
        for pattern, replacement in self.CORRECTION_PATTERNS:
            corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE)
        
        return corrected
    
    async def _live_validate_url(self, url: str) -> bool:
        """Perform live HTTP validation with rate limiting"""
        if not self.session:
            return False
            
        # Simple rate limiting
        current_time = asyncio.get_event_loop().time()
        time_since_last = current_time - self._last_request_time
        if time_since_last < self._rate_limit_delay:
            await asyncio.sleep(self._rate_limit_delay - time_since_last)
        
        try:
            # Use HEAD request to minimize bandwidth
            async with self.session.head(url, allow_redirects=True) as response:
                self._last_request_time = asyncio.get_event_loop().time()
                return response.status < 400
                
        except Exception as e:
            logger.debug(f"URL validation failed for {url}: {e}")
            self._last_request_time = asyncio.get_event_loop().time()
            return False
    
    def _is_cache_valid(self, result: URLValidationResult) -> bool:
        """Check if cached result is still valid"""
        # For this implementation, we'll assume cache is always valid
        # In production, you'd store timestamps and check expiration
        return True
    
    async def validate_url(self, url: str) -> URLValidationResult:
        """Validate a single URL using all available methods"""
        
        # Check cache first
        if url in self.cache and self._is_cache_valid(self.cache[url]):
            result = self.cache[url]
            result.cached = True
            return result
        
        # Step 1: Pattern-based validation
        pattern_result = self._pattern_validate_url(url)
        if not pattern_result.is_valid:
            # Try to correct the URL
            corrected_url = self._apply_corrections(url)
            if corrected_url != url:
                # Validate the corrected URL
                corrected_result = self._pattern_validate_url(corrected_url)
                if corrected_result.is_valid:
                    result = URLValidationResult(
                        original_url=url,
                        is_valid=True,
                        corrected_url=corrected_url,
                        confidence=0.85
                    )
                    self.cache[url] = result
                    return result
            
            # If correction didn't help, return the original failure
            self.cache[url] = pattern_result
            return pattern_result
        
        # Step 2: Live validation for pattern-valid URLs
        if pattern_result.is_valid:
            is_live_valid = await self._live_validate_url(url)
            result = URLValidationResult(
                original_url=url,
                is_valid=is_live_valid,
                confidence=0.95 if is_live_valid else 0.9,
                error_type=None if is_live_valid else "not_reachable"
            )
            
            # If live validation failed, try corrections
            if not is_live_valid:
                corrected_url = self._apply_corrections(url)
                if corrected_url != url:
                    is_corrected_valid = await self._live_validate_url(corrected_url)
                    if is_corrected_valid:
                        result = URLValidationResult(
                            original_url=url,
                            is_valid=True,
                            corrected_url=corrected_url,
                            confidence=0.9
                        )
            
            self.cache[url] = result
            return result
        
        # Fallback
        self.cache[url] = pattern_result
        return pattern_result
    
    async def validate_urls_in_text(self, text: str) -> Tuple[str, List[URLValidationResult]]:
        """Find and validate all URLs in text, return corrected text and results"""
        
        # Find all URLs in the text
        url_pattern = r'https?://[^\s<>"\'`\])\}]+'
        urls = re.findall(url_pattern, text)
        
        if not urls:
            return text, []
        
        # Validate all URLs concurrently
        validation_tasks = [self.validate_url(url) for url in urls]
        results = await asyncio.gather(*validation_tasks)
        
        # Apply corrections to text
        corrected_text = text
        for result in results:
            if result.corrected_url:
                corrected_text = corrected_text.replace(result.original_url, result.corrected_url)
        
        return corrected_text, results
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics for monitoring"""
        total = len(self.cache)
        valid = sum(1 for r in self.cache.values() if r.is_valid)
        invalid = total - valid
        corrected = sum(1 for r in self.cache.values() if r.corrected_url)
        
        return {
            'total_cached': total,
            'valid_urls': valid,
            'invalid_urls': invalid,
            'corrected_urls': corrected,
            'cache_hit_rate': total / max(total, 1)  # Will need request counter for real rate
        }


class ClaudeURLCorrector:
    """
    Use Claude's knowledge to intelligently correct malformed Plaid documentation URLs
    """
    
    def __init__(self, anthropic_client):
        self.client = anthropic_client
        
    async def suggest_correction(self, broken_url: str, context: str = "") -> Optional[str]:
        """Use Claude to suggest URL corrections based on context"""
        
        prompt = f"""You are helping fix broken Plaid documentation URLs. 

Broken URL: {broken_url}
Context: {context[:200]}...

Based on your knowledge of Plaid's documentation structure, suggest the correct URL. 
Plaid documentation is typically structured as:
- https://plaid.com/docs/ (main docs)
- https://plaid.com/docs/api/ (API reference)
- https://plaid.com/docs/quickstart/ (getting started)
- https://plaid.com/docs/[product]/ (specific products like auth, transactions, etc.)

Only respond with the corrected URL, or "NO_CORRECTION" if you cannot determine the correct URL.
Do not include any explanation, just the URL or "NO_CORRECTION"."""

        try:
            response = self.client.messages.create(
                model="claude-3-haiku-20240307",  # Use faster model for URL correction
                max_tokens=100,
                messages=[{"role": "user", "content": prompt}]
            )
            
            correction = response.content[0].text.strip()
            if correction == "NO_CORRECTION" or not correction.startswith("http"):
                return None
                
            return correction
            
        except Exception as e:
            logger.error(f"Claude URL correction failed: {e}")
            return None


# Usage example for integration
async def process_askbill_response(askbill_response: str, anthropic_client=None) -> Tuple[str, Dict]:
    """
    Process AskBill response to validate and correct URLs
    Returns: (corrected_response, validation_stats)
    """
    
    async with PlaidURLValidator() as validator:
        # Validate and correct URLs in the response
        corrected_text, validation_results = await validator.validate_urls_in_text(askbill_response)
        
        # Use Claude for additional intelligent corrections if available
        if anthropic_client:
            claude_corrector = ClaudeURLCorrector(anthropic_client)
            
            for result in validation_results:
                if not result.is_valid and not result.corrected_url:
                    # Try Claude-based correction
                    claude_suggestion = await claude_corrector.suggest_correction(
                        result.original_url, 
                        askbill_response
                    )
                    if claude_suggestion:
                        corrected_text = corrected_text.replace(result.original_url, claude_suggestion)
                        result.corrected_url = claude_suggestion
                        result.is_valid = True
                        result.confidence = 0.8
        
        # Compile statistics
        stats = {
            'total_urls': len(validation_results),
            'invalid_urls': sum(1 for r in validation_results if not r.is_valid),
            'corrected_urls': sum(1 for r in validation_results if r.corrected_url),
            'validation_results': [
                {
                    'original': r.original_url,
                    'valid': r.is_valid,
                    'corrected': r.corrected_url,
                    'error_type': r.error_type,
                    'confidence': r.confidence
                }
                for r in validation_results
            ]
        }
        
        return corrected_text, stats


if __name__ == "__main__":
    # Example usage
    async def test_validator():
        test_text = """
        Check out the Plaid API documentation at https://pliad.com/docs/api/
        Also see the auth guide at plaid.com/docs/auth/
        And the transactions docs at https://docs.plaid.com//docs/transactions/
        """
        
        corrected, stats = await process_askbill_response(test_text)
        print("Original:", test_text)
        print("Corrected:", corrected)
        print("Stats:", json.dumps(stats, indent=2))
    
    # Run test
    asyncio.run(test_validator())