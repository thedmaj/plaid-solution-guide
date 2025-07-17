"""
Enhanced URL Validator with Plaid API Index Integration

This enhanced validator leverages the comprehensive Plaid API field index to:
1. Intelligently correct malformed URLs using known API endpoints
2. Suggest better URLs based on context and field names
3. Generate missing anchor links for specific fields
4. Provide field-specific documentation URLs
"""

import re
import asyncio
import aiohttp
from urllib.parse import urlparse, urljoin
from typing import Dict, List, Optional, Tuple, Set
from dataclasses import dataclass
import logging
from plaid_field_index import (
    PLAID_API_INDEX, 
    FIELD_ALIASES, 
    KEYWORD_TO_PRODUCT,
    find_endpoint_url,
    find_field_url,
    find_product_from_keywords
)

logger = logging.getLogger(__name__)

@dataclass
class EnhancedURLValidationResult:
    original_url: str
    is_valid: bool
    corrected_url: Optional[str] = None
    suggested_urls: List[str] = None
    error_type: Optional[str] = None
    confidence: float = 1.0
    correction_method: Optional[str] = None
    field_context: Optional[Dict] = None
    api_context: Optional[Dict] = None

class EnhancedPlaidURLValidator:
    """
    Enhanced URL validator that uses the Plaid API index for intelligent corrections
    """
    
    def __init__(self, cache_duration_hours: int = 24):
        self.cache: Dict[str, EnhancedURLValidationResult] = {}
        self.session: Optional[aiohttp.ClientSession] = None
        self._rate_limit_delay = 0.1
        self._last_request_time = 0
        
        # Load field index patterns for faster lookups
        self._endpoint_patterns = self._build_endpoint_patterns()
        self._field_patterns = self._build_field_patterns()
        
    def _build_endpoint_patterns(self) -> Dict[str, Dict]:
        """Build regex patterns for all known endpoints"""
        patterns = {}
        for product, config in PLAID_API_INDEX.items():
            for endpoint, details in config.get("endpoints", {}).items():
                # Create flexible pattern that matches various URL formats
                pattern = endpoint.replace("/", r"\/")
                patterns[pattern] = {
                    "product": product,
                    "endpoint": endpoint,
                    "url": f"{config['base_url']}{details['anchor']}",
                    "description": details["description"]
                }
        return patterns
    
    def _build_field_patterns(self) -> Dict[str, List[Dict]]:
        """Build patterns for field lookups"""
        field_map = {}
        for product, config in PLAID_API_INDEX.items():
            # Process request fields
            for field, anchor in config.get("request_fields", {}).items():
                if field not in field_map:
                    field_map[field] = []
                field_map[field].append({
                    "product": product,
                    "field_type": "request",
                    "url": f"{config['base_url']}{anchor}",
                    "anchor": anchor
                })
            
            # Process response fields  
            for field, anchor in config.get("response_fields", {}).items():
                if field not in field_map:
                    field_map[field] = []
                field_map[field].append({
                    "product": product,
                    "field_type": "response", 
                    "url": f"{config['base_url']}{anchor}",
                    "anchor": anchor
                })
        
        return field_map
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=5),
            headers={'User-Agent': 'Plaid-Enhanced-URLValidator/1.0'}
        )
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _extract_context_from_text(self, text: str, target_url: str) -> Dict:
        """Extract API context from surrounding text"""
        context = {
            "endpoints": [],
            "fields": [],
            "products": [],
            "keywords": []
        }
        
        text_lower = text.lower()
        
        # Find mentioned endpoints
        for pattern, details in self._endpoint_patterns.items():
            if re.search(pattern, text_lower):
                context["endpoints"].append(details)
        
        # Find mentioned fields
        for field in self._field_patterns.keys():
            if field in text_lower:
                context["fields"].extend(self._field_patterns[field])
        
        # Find product keywords
        context["products"] = find_product_from_keywords(text)
        
        # Extract keywords around the URL
        url_index = text_lower.find(target_url.lower())
        if url_index != -1:
            # Get 100 chars before and after URL
            start = max(0, url_index - 100)
            end = min(len(text), url_index + len(target_url) + 100)
            surrounding = text[start:end].lower()
            
            # Look for field names, endpoints, product names
            for keyword in ["auth", "transactions", "identity", "assets", "liabilities", 
                          "link", "transfer", "signal", "cra", "base report", "routing", 
                          "account", "balance", "investment", "income"]:
                if keyword in surrounding:
                    context["keywords"].append(keyword)
        
        return context
    
    def _get_exact_field_match_url(self, url: str, context: Dict) -> Optional[str]:
        """Get exact field match URL from index, prioritizing over AI suggestions"""
        parsed = urlparse(url)
        
        # Extract field name from URL anchor
        field_name = None
        if "#" in url:
            anchor = url.split("#")[-1]
            # Try to extract field name from anchor patterns
            # Common patterns: #field-name, #transactionlocation-field, #auth-get-response-field
            if "-" in anchor:
                parts = anchor.split("-")
                # Look for field-like patterns
                for part in parts:
                    if part in self._field_patterns:
                        field_name = part
                        break
                # Also try the last part (often the field name)
                if not field_name and parts:
                    last_part = parts[-1]
                    if last_part in self._field_patterns:
                        field_name = last_part
        
        # Also check context for field mentions
        if not field_name and context.get("surrounding_text"):
            surrounding_text = context["surrounding_text"].lower()
            # Look for field mentions in surrounding text
            for field in self._field_patterns.keys():
                if field in surrounding_text:
                    field_name = field
                    break
        
        # If we found a field name, get the exact URL from index
        if field_name and field_name in self._field_patterns:
            field_infos = self._field_patterns[field_name]
            
            # If we have product context, prioritize that product's field URL
            if context.get("products"):
                for product in context["products"]:
                    for field_info in field_infos:
                        if field_info["product"] == product:
                            return field_info["url"]
            
            # Otherwise, return the first match (most relevant)
            if field_infos:
                return field_infos[0]["url"]
        
        return None
    
    def _get_exact_endpoint_match_url(self, url: str, context: Dict) -> Optional[str]:
        """Get exact endpoint match URL from index, prioritizing over AI suggestions"""
        parsed = urlparse(url)
        
        # Extract endpoint from URL path
        endpoint = None
        path_segments = [seg for seg in parsed.path.split('/') if seg]
        
        # Look for API endpoint patterns in the path
        if len(path_segments) >= 2:
            # Try different endpoint patterns
            potential_endpoints = [
                f"/{'/'.join(path_segments[-2:])}",  # /auth/get, /transactions/sync
                f"/{'/'.join(path_segments[-3:])}",  # /bank_transfer/event/list
                f"/{'/'.join(path_segments[-4:])}",  # /processor/transactions/sync
            ]
            
            for potential_endpoint in potential_endpoints:
                # Check if this endpoint exists in our index
                for product, config in PLAID_API_INDEX.items():
                    if potential_endpoint in config.get("endpoints", {}):
                        endpoint = potential_endpoint
                        break
                if endpoint:
                    break
        
        # Also check context for endpoint mentions
        if not endpoint and context.get("surrounding_text"):
            surrounding_text = context["surrounding_text"].lower()
            # Look for endpoint mentions in surrounding text
            for product, config in PLAID_API_INDEX.items():
                for ep in config.get("endpoints", {}).keys():
                    if ep in surrounding_text:
                        endpoint = ep
                        break
                if endpoint:
                    break
        
        # If we found an endpoint, get the exact URL from index
        if endpoint:
            for product, config in PLAID_API_INDEX.items():
                if endpoint in config.get("endpoints", {}):
                    endpoint_info = config["endpoints"][endpoint]
                    return f"{config['base_url']}{endpoint_info['anchor']}"
        
        return None
    
    def _intelligent_url_correction(self, url: str, context: Dict) -> List[str]:
        """Generate intelligent URL corrections based on context with index priority"""
        suggestions = []
        parsed = urlparse(url)
        
        # If it's a Plaid domain, try to fix the path
        if any(domain in parsed.netloc.lower() for domain in ["plaid.com", "docs.plaid.com"]):
            
            # PRIORITY 1: Exact field name or API endpoint match from index
            # Extract field name from URL anchor or context
            field_match_url = self._get_exact_field_match_url(url, context)
            if field_match_url:
                suggestions.append(field_match_url)
                logger.info(f"🎯 Applied exact field match from index: {url} -> {field_match_url}")
            
            # Extract API endpoint from URL and get exact match
            endpoint_match_url = self._get_exact_endpoint_match_url(url, context)
            if endpoint_match_url:
                suggestions.append(endpoint_match_url)
                logger.info(f"🎯 Applied exact endpoint match from index: {url} -> {endpoint_match_url}")
            
            # PRIORITY 2: Special case corrections (only if no exact match found)
            if not suggestions:
                special_corrections = {
                    # CRA mistake: /cra/ should be /check/
                    "/docs/api/products/cra/": "https://plaid.com/docs/api/products/check/",
                    "/docs/api/products/cra": "https://plaid.com/docs/api/products/check/",
                    "/docs/api/cra/": "https://plaid.com/docs/api/products/check/",
                    "/docs/api/cra": "https://plaid.com/docs/api/products/check/",
                    "/docs/cra/": "https://plaid.com/docs/check/",
                    "/docs/cra": "https://plaid.com/docs/check/",
                    # Common auth path mistakes
                    "/docs/api/auth/": "https://plaid.com/docs/api/products/auth/",
                    "/docs/api/auth": "https://plaid.com/docs/api/products/auth/",
                    # Common transactions path mistakes
                    "/docs/api/transactions/": "https://plaid.com/docs/api/products/transactions/",
                    "/docs/api/transactions": "https://plaid.com/docs/api/products/transactions/",
                    # Common identity path mistakes
                    "/docs/api/identity/": "https://plaid.com/docs/api/products/identity/",
                    "/docs/api/identity": "https://plaid.com/docs/api/products/identity/",
                }
                
                # Check for special corrections
                for wrong_path, correct_url in special_corrections.items():
                    if parsed.path == wrong_path or parsed.path.rstrip('/') == wrong_path.rstrip('/'):
                        suggestions.append(correct_url)
                        logger.info(f"🔧 Applied special correction: {url} -> {correct_url}")
            
            # PRIORITY 3: Context-based suggestions (fallback for existing logic)
            if not suggestions:
                # Case 1: Missing or wrong anchor for field-specific URL
                if context.get("fields"):
                    for field_info in context["fields"]:
                        if parsed.path in field_info["url"]:
                            suggestions.append(field_info["url"])
                
                # Case 2: Wrong endpoint path
                path_segments = [seg for seg in parsed.path.split('/') if seg]
                if len(path_segments) >= 2:
                    potential_endpoint = f"/{'/'.join(path_segments[-2:])}"
                    
                    # Try to find this endpoint in our index
                    endpoint_url = find_endpoint_url(potential_endpoint)
                    if endpoint_url != "https://plaid.com/docs/api/":
                        suggestions.append(endpoint_url)
                
                # Case 3: Product-based corrections
                for product in context.get("products", []):
                    if product in PLAID_API_INDEX:
                        base_url = PLAID_API_INDEX[product]["base_url"]
                        suggestions.append(base_url)
                        
                        # If we have endpoint context, add specific endpoint
                        for endpoint_info in context.get("endpoints", []):
                            if endpoint_info["product"] == product:
                                suggestions.append(endpoint_info["url"])
                
                # Case 4: Keyword-based corrections
                for keyword in context.get("keywords", []):
                    if keyword in KEYWORD_TO_PRODUCT:
                        for product in KEYWORD_TO_PRODUCT[keyword]:
                            if product in PLAID_API_INDEX:
                                suggestions.append(PLAID_API_INDEX[product]["base_url"])
                                
                # Case 5: Text-based product detection for CRA/Check
                url_lower = url.lower()
                text_lower = context.get("surrounding_text", "").lower() if context.get("surrounding_text") else ""
                
                if any(term in url_lower or term in text_lower for term in ["cra", "consumer report", "base report", "check report", "plaid check"]):
                    # Add both API docs and general product docs
                    suggestions.append("https://plaid.com/docs/api/products/check/")
                    suggestions.append("https://plaid.com/docs/check/")
        
        # Remove duplicates while preserving order
        seen = set()
        unique_suggestions = []
        for suggestion in suggestions:
            if suggestion not in seen:
                seen.add(suggestion)
                unique_suggestions.append(suggestion)
        
        return unique_suggestions
    
    def _pattern_validate_and_enhance(self, url: str, context: Dict = None) -> EnhancedURLValidationResult:
        """Enhanced pattern validation with API index integration"""
        try:
            parsed = urlparse(url)
            
            # Basic validation
            if not parsed.scheme or not parsed.netloc:
                return EnhancedURLValidationResult(
                    original_url=url,
                    is_valid=False,
                    error_type="malformed_url",
                    confidence=0.95
                )
            
            # Check if it's a Plaid domain
            is_plaid_domain = any(domain in parsed.netloc.lower() 
                                for domain in ["plaid.com", "docs.plaid.com", "api.plaid.com"])
            
            if not is_plaid_domain:
                return EnhancedURLValidationResult(
                    original_url=url,
                    is_valid=False,
                    error_type="invalid_domain",
                    confidence=0.9
                )
            
            # Enhanced validation for Plaid URLs
            suggestions = []
            api_context = None
            field_context = None
            
            if context:
                suggestions = self._intelligent_url_correction(url, context)
                
                # Extract API context
                if context.get("endpoints") or context.get("fields"):
                    api_context = {
                        "mentioned_endpoints": context.get("endpoints", []),
                        "mentioned_fields": context.get("fields", []),
                        "inferred_products": context.get("products", [])
                    }
                
                # Check if URL references a specific field
                if "#" in url:
                    anchor = url.split("#")[-1]
                    for field, field_infos in self._field_patterns.items():
                        for field_info in field_infos:
                            if anchor in field_info.get("anchor", ""):
                                field_context = {
                                    "field_name": field,
                                    "product": field_info["product"],
                                    "field_type": field_info["field_type"]
                                }
                                break
            
            # If we have suggestions, mark as correctable
            if suggestions:
                return EnhancedURLValidationResult(
                    original_url=url,
                    is_valid=True,  # Valid but improvable
                    suggested_urls=suggestions[:3],  # Top 3 suggestions
                    confidence=0.8,
                    correction_method="api_index_enhancement",
                    field_context=field_context,
                    api_context=api_context
                )
            
            return EnhancedURLValidationResult(
                original_url=url,
                is_valid=True,
                confidence=0.8,
                field_context=field_context,
                api_context=api_context
            )
            
        except Exception as e:
            logger.error(f"Pattern validation error: {e}")
            return EnhancedURLValidationResult(
                original_url=url,
                is_valid=False,
                error_type="parse_error",
                confidence=1.0
            )
    
    async def validate_url_with_context(self, url: str, surrounding_text: str = "") -> EnhancedURLValidationResult:
        """Validate URL with contextual intelligence from API index - prioritizes exact matches"""
        
        # Extract context from surrounding text
        context = self._extract_context_from_text(surrounding_text, url)
        # Add surrounding text to context for intelligent corrections
        context["surrounding_text"] = surrounding_text
        
        # Check cache first
        cache_key = f"{url}:{hash(surrounding_text)}"
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # PRIORITY 1: Check for exact field or endpoint matches from index
        # This overrides AI suggestions and ensures database accuracy
        exact_field_url = self._get_exact_field_match_url(url, context)
        exact_endpoint_url = self._get_exact_endpoint_match_url(url, context)
        
        if exact_field_url or exact_endpoint_url:
            # We have an exact match from index - use it as the authoritative source
            corrected_url = exact_field_url or exact_endpoint_url
            
            # Check if this is actually a correction (different from original)
            if corrected_url != url:
                result = EnhancedURLValidationResult(
                    original_url=url,
                    is_valid=True,
                    corrected_url=corrected_url,
                    suggested_urls=[corrected_url],
                    confidence=1.0,  # High confidence for exact matches
                    correction_method="exact_index_match",
                    field_context={"exact_match": True}
                )
                logger.info(f"🎯 Exact index match override: {url} -> {corrected_url}")
                self.cache[cache_key] = result
                return result
        
        # PRIORITY 2: Enhanced pattern validation (existing logic)
        result = self._pattern_validate_and_enhance(url, context)
        
        # If pattern validation suggests improvements, don't need live validation
        if result.suggested_urls:
            self.cache[cache_key] = result
            return result
        
        # PRIORITY 3: Live validation for Plaid URLs (always check these)
        if result.is_valid and self.session and any(domain in url.lower() for domain in ["plaid.com", "docs.plaid.com"]):
            try:
                # Rate limiting
                current_time = asyncio.get_event_loop().time()
                time_since_last = current_time - self._last_request_time
                if time_since_last < self._rate_limit_delay:
                    await asyncio.sleep(self._rate_limit_delay - time_since_last)
                
                async with self.session.head(url, allow_redirects=True) as response:
                    self._last_request_time = asyncio.get_event_loop().time()
                    
                    # Check for 404s or other errors
                    if response.status == 404:
                        logger.warning(f"🚨 404 detected for Plaid URL: {url}")
                        result.is_valid = False
                        result.error_type = "not_found_404"
                        result.confidence = 0.95
                        
                        # For 404s, prioritize exact matches over intelligent suggestions
                        suggestions = []
                        if exact_field_url:
                            suggestions.append(exact_field_url)
                        if exact_endpoint_url:
                            suggestions.append(exact_endpoint_url)
                        
                        # Add intelligent suggestions as fallback
                        if not suggestions:
                            suggestions = self._intelligent_url_correction(url, context or {})
                        
                        if suggestions:
                            result.suggested_urls = suggestions
                            result.correction_method = "404_recovery_with_index_priority"
                            logger.info(f"🔧 Generated {len(suggestions)} suggestions for 404: {suggestions}")
                    
                    elif response.status >= 400:
                        result.is_valid = False
                        result.error_type = f"http_error_{response.status}"
                        result.confidence = 0.9
                        
                        # Generate suggestions based on context (with index priority)
                        if context:
                            result.suggested_urls = self._intelligent_url_correction(url, context)
                            
            except Exception as e:
                logger.debug(f"Live validation failed for {url}: {e}")
                # Don't mark as invalid for network errors - the URL might be valid
                result.error_type = "network_error"
                result.confidence = max(0.5, result.confidence - 0.2)
        
        self.cache[cache_key] = result
        return result
    
    async def validate_and_enhance_text(self, text: str) -> Tuple[str, List[EnhancedURLValidationResult]]:
        """Validate URLs in text and provide intelligent enhancements"""
        
        # Find all URLs
        url_pattern = r'https?://[^\s<>"\'`\])\}]+'
        urls = re.findall(url_pattern, text)
        
        if not urls:
            return text, []
        
        # Validate all URLs with context
        validation_tasks = [self.validate_url_with_context(url, text) for url in urls]
        results = await asyncio.gather(*validation_tasks)
        
        enhanced_text = text
        
        # Apply corrections and enhancements
        for result in results:
            if result.suggested_urls:
                # Replace with best suggestion
                best_suggestion = result.suggested_urls[0]
                enhanced_text = enhanced_text.replace(result.original_url, best_suggestion)
                result.corrected_url = best_suggestion
                result.correction_method = "api_index_suggestion"
        
        return enhanced_text, results


def generate_field_specific_url(field_name: str, context_text: str) -> Optional[str]:
    """Generate a specific documentation URL for a field mentioned in text"""
    
    # Determine product context from surrounding text
    products = find_product_from_keywords(context_text)
    
    if products:
        # Try the most likely product first
        for product in products:
            url = find_field_url(field_name, product)
            if url != "https://plaid.com/docs/api/":
                return url
    
    # Fall back to general field lookup
    url = find_field_url(field_name)
    return url if url != "https://plaid.com/docs/api/" else None


def generate_endpoint_specific_url(endpoint: str, context_text: str) -> Optional[str]:
    """Generate a specific documentation URL for an endpoint mentioned in text"""
    
    # Determine product context
    products = find_product_from_keywords(context_text)
    
    if products:
        # Try the most likely product first
        for product in products:
            url = find_endpoint_url(endpoint, product)
            if url != "https://plaid.com/docs/api/":
                return url
    
    # Fall back to general endpoint lookup
    url = find_endpoint_url(endpoint)
    return url if url != "https://plaid.com/docs/api/" else None


async def enhance_askbill_response_with_api_index(askbill_response: str) -> Tuple[str, Dict]:
    """
    Enhanced AskBill response processing with API index intelligence
    """
    
    async with EnhancedPlaidURLValidator() as validator:
        enhanced_text, results = await validator.validate_and_enhance_text(askbill_response)
        
        # Additional enhancements: Add missing field/endpoint URLs
        enhanced_text = _add_missing_field_urls(enhanced_text)
        enhanced_text = _add_missing_endpoint_urls(enhanced_text)
        
        # Compile comprehensive statistics
        stats = {
            'total_urls': len(results),
            'enhanced_urls': sum(1 for r in results if r.suggested_urls),
            'field_specific_urls': sum(1 for r in results if r.field_context),
            'api_context_detected': sum(1 for r in results if r.api_context),
            'validation_results': [
                {
                    'original': r.original_url,
                    'valid': r.is_valid,
                    'corrected': r.corrected_url,
                    'suggestions': r.suggested_urls,
                    'field_context': r.field_context,
                    'api_context': r.api_context,
                    'confidence': r.confidence,
                    'method': r.correction_method
                }
                for r in results
            ]
        }
        
        return enhanced_text, stats


def _add_missing_field_urls(text: str) -> str:
    """Add documentation URLs for field names mentioned without links"""
    
    enhanced_text = text
    
    # Find field names that aren't already linked
    for field in FIELD_ALIASES.keys():
        if field in text.lower() and f"[{field}]" not in text.lower():
            # Check if this field has documentation
            field_url = find_field_url(field)
            if field_url != "https://plaid.com/docs/api/":
                # Add markdown link
                pattern = rf'\b{re.escape(field)}\b'
                replacement = f'[{field}]({field_url})'
                enhanced_text = re.sub(pattern, replacement, enhanced_text, count=1, flags=re.IGNORECASE)
    
    return enhanced_text


def _add_missing_endpoint_urls(text: str) -> str:
    """Add documentation URLs for API endpoints mentioned without links"""
    
    enhanced_text = text
    
    # Find API endpoint patterns
    endpoint_pattern = r'(/[a-zA-Z_/]+/[a-zA-Z_]+)'
    endpoints = re.findall(endpoint_pattern, text)
    
    for endpoint in endpoints:
        if f"[{endpoint}]" not in text:  # Not already linked
            endpoint_url = find_endpoint_url(endpoint)
            if endpoint_url != "https://plaid.com/docs/api/":
                # Add markdown link
                enhanced_text = enhanced_text.replace(endpoint, f'[{endpoint}]({endpoint_url})', 1)
    
    return enhanced_text


# Usage example
async def main():
    """Example usage of enhanced URL validator"""
    
    # Mock AskBill response with various URL issues and field references
    mock_response = """
    To implement Plaid Auth, you'll need to:
    
    1. Create a Link token at https://plaid.com/docs/api/link/
    2. Call the /auth/get endpoint (see https://pliad.com/docs/api/auth/)
    3. Process the routing and account fields from the response
    4. The balances field contains current account information
    
    For transaction data, use /transactions/sync at docs.plaid.com/docs/api/transactions/
    
    Invalid link: https://broken-site.com/docs
    """
    
    enhanced_response, stats = await enhance_askbill_response_with_api_index(mock_response)
    
    print("Original Response:")
    print(mock_response)
    print("\n" + "="*80)
    print("Enhanced Response:")
    print(enhanced_response)
    print("\n" + "="*80)
    print("Enhancement Stats:")
    import json
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    asyncio.run(main())