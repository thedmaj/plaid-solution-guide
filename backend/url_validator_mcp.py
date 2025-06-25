#!/usr/bin/env python3
"""
URL Validator MCP Server
Validates and corrects URLs, removes invalid ones, marks corrected ones with *
"""

import asyncio
import aiohttp
import ssl
import certifi
import re
import json
import difflib
from urllib.parse import urlparse, urljoin
from typing import List, Dict, Optional, Tuple
from mcp.server.models import InitializationOptions
from mcp.server import NotificationOptions, Server
from mcp.types import Resource, Tool, TextContent, ImageContent, EmbeddedResource
from pydantic import AnyUrl
import mcp.types as types

# Initialize the MCP server
server = Server("url-validator")

class URLValidatorCorrector:
    def __init__(self):
        self.session = None
        self.timeout = aiohttp.ClientTimeout(total=10)
        
        # Domain-specific correction patterns
        self.correction_patterns = {
            "plaid.com": {
                "api_patterns": [
                    # Pattern: /docs/api/auth → /docs/api/products/auth/
                    (r"/docs/api/([^/]+)/?$", r"/docs/api/products/\1/"),
                    # Pattern: missing trailing slash
                    (r"/docs/api/products/([^/]+)$", r"/docs/api/products/\1/"),
                    # Pattern: extra path variations
                    (r"/docs/([^/]+)/?$", r"/docs/api/products/\1/"),
                ]
            }
        }
    
    async def setup_session(self):
        """Initialize HTTP session with SSL context"""
        if not self.session:
            ssl_context = ssl.create_default_context(cafile=certifi.where())
            connector = aiohttp.TCPConnector(ssl=ssl_context, limit=20)
            self.session = aiohttp.ClientSession(
                connector=connector, 
                timeout=self.timeout,
                headers={'User-Agent': 'URL-Validator-Bot/1.0'}
            )
    
    async def close_session(self):
        """Close HTTP session"""
        if self.session:
            await self.session.close()
            self.session = None
    
    async def validate_single_url(self, url: str) -> Dict:
        """Validate a single URL"""
        try:
            parsed = urlparse(url)
            if not all([parsed.scheme, parsed.netloc]):
                return {"valid": False, "error": "Invalid URL format"}
            
            if not self.session:
                await self.setup_session()
            
            # Use HEAD request for efficiency
            async with self.session.head(url, allow_redirects=True) as response:
                is_valid = response.status < 400
                return {
                    "valid": is_valid,
                    "status_code": response.status,
                    "final_url": str(response.url) if is_valid else None
                }
                
        except asyncio.TimeoutError:
            return {"valid": False, "error": "Request timeout"}
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    def generate_corrections(self, url: str) -> List[str]:
        """Generate possible URL corrections"""
        parsed = urlparse(url)
        corrections = []
        
        # Domain-specific corrections
        domain = parsed.netloc.lower()
        for pattern_domain, patterns in self.correction_patterns.items():
            if pattern_domain in domain:
                corrections.extend(self._apply_domain_patterns(url, patterns))
        
        # Generic corrections
        corrections.extend(self._apply_generic_corrections(url))
        
        # Remove duplicates and original URL
        corrections = list(set(corrections))
        if url in corrections:
            corrections.remove(url)
            
        return corrections
    
    def _apply_domain_patterns(self, url: str, patterns: Dict) -> List[str]:
        """Apply domain-specific correction patterns"""
        parsed = urlparse(url)
        corrections = []
        
        for pattern_list in patterns.values():
            for pattern, replacement in pattern_list:
                new_path = re.sub(pattern, replacement, parsed.path)
                if new_path != parsed.path:
                    corrected_url = f"{parsed.scheme}://{parsed.netloc}{new_path}"
                    corrections.append(corrected_url)
        
        return corrections
    
    def _apply_generic_corrections(self, url: str) -> List[str]:
        """Apply generic URL corrections"""
        corrections = []
        
        # Trailing slash variations
        if url.endswith('/'):
            corrections.append(url.rstrip('/'))
        else:
            corrections.append(url + '/')
        
        # Common path variations
        parsed = urlparse(url)
        path_variations = [
            parsed.path.replace('/api/', '/api/v1/'),
            parsed.path.replace('/api/', '/api/v2/'),
            parsed.path.replace('/docs/', '/documentation/'),
            parsed.path.replace('/documentation/', '/docs/'),
        ]
        
        for variation in path_variations:
            if variation != parsed.path:
                corrected = f"{parsed.scheme}://{parsed.netloc}{variation}"
                corrections.append(corrected)
        
        return corrections
    
    async def validate_and_correct_url(self, url: str) -> Dict:
        """Validate URL and attempt correction if invalid"""
        # First try original URL
        result = await self.validate_single_url(url)
        
        if result["valid"]:
            return {
                "original_url": url,
                "final_url": url,
                "status": "valid",
                "corrected": False
            }
        
        # Try corrections
        corrections = self.generate_corrections(url)
        
        for corrected_url in corrections:
            correction_result = await self.validate_single_url(corrected_url)
            if correction_result["valid"]:
                return {
                    "original_url": url,
                    "final_url": corrected_url,
                    "status": "corrected",
                    "corrected": True
                }
        
        return {
            "original_url": url,
            "final_url": None,
            "status": "invalid",
            "corrected": False,
            "attempted_corrections": corrections
        }

# Global validator instance
validator = URLValidatorCorrector()

@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    """List available tools"""
    return [
        types.Tool(
            name="validate_and_clean_text",
            description="Validate URLs in text, remove invalid ones, mark corrected ones with *",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "Text containing URLs to validate and clean"
                    }
                },
                "required": ["text"]
            }
        ),
        types.Tool(
            name="validate_url_list",
            description="Validate a list of URLs and return results",
            inputSchema={
                "type": "object",
                "properties": {
                    "urls": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of URLs to validate"
                    }
                },
                "required": ["urls"]
            }
        )
    ]

@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    """Handle tool calls"""
    
    if name == "validate_and_clean_text":
        text = arguments.get("text", "")
        cleaned_text, summary = await clean_text_urls(text)
        
        result = {
            "cleaned_text": cleaned_text,
            "summary": summary
        }
        
        return [types.TextContent(type="text", text=json.dumps(result, indent=2))]
    
    elif name == "validate_url_list":
        urls = arguments.get("urls", [])
        results = await validate_url_list(urls)
        
        return [types.TextContent(type="text", text=json.dumps(results, indent=2))]
    
    else:
        raise ValueError(f"Unknown tool: {name}")

async def extract_urls_from_text(text: str) -> List[Tuple[str, int, int]]:
    """Extract URLs from text with their positions"""
    url_pattern = r'https?://(?:[a-zA-Z0-9]|[-._%~:/?#[\]@!$&\'()*+,;=])*[a-zA-Z0-9/]'
    urls_with_positions = []
    
    for match in re.finditer(url_pattern, text):
        url = match.group()
        start = match.start()
        end = match.end()
        urls_with_positions.append((url, start, end))
    
    return urls_with_positions

async def clean_text_urls(text: str) -> Tuple[str, Dict]:
    """Clean URLs in text: remove invalid, mark corrected with *"""
    
    # Extract URLs with positions
    urls_with_positions = await extract_urls_from_text(text)
    
    if not urls_with_positions:
        return text, {"total_urls": 0, "valid_urls": 0, "corrected_urls": 0, "removed_urls": 0}
    
    # Validate and correct URLs
    url_results = {}
    for url, _, _ in urls_with_positions:
        result = await validator.validate_and_correct_url(url)
        url_results[url] = result
    
    # Process text from end to beginning to maintain positions
    cleaned_text = text
    removed_count = 0
    corrected_count = 0
    valid_count = 0
    
    for url, start, end in reversed(urls_with_positions):
        result = url_results[url]
        
        if result["status"] == "valid":
            # Keep valid URLs unchanged
            valid_count += 1
            
        elif result["status"] == "corrected":
            # Replace with corrected URL + *
            corrected_url = result["final_url"] + "*"
            cleaned_text = cleaned_text[:start] + corrected_url + cleaned_text[end:]
            corrected_count += 1
            
        elif result["status"] == "invalid":
            # Remove invalid URLs completely
            cleaned_text = cleaned_text[:start] + cleaned_text[end:]
            removed_count += 1
    
    summary = {
        "total_urls": len(urls_with_positions),
        "valid_urls": valid_count,
        "corrected_urls": corrected_count,
        "removed_urls": removed_count,
        "corrections_made": {
            url: result["final_url"] 
            for url, result in url_results.items() 
            if result["status"] == "corrected"
        }
    }
    
    return cleaned_text, summary

async def validate_url_list(urls: List[str]) -> Dict:
    """Validate a list of URLs and return detailed results"""
    results = {}
    
    for url in urls:
        result = await validator.validate_and_correct_url(url)
        results[url] = result
    
    return {
        "validation_results": results,
        "summary": {
            "total_urls": len(urls),
            "valid_urls": len([r for r in results.values() if r["status"] == "valid"]),
            "corrected_urls": len([r for r in results.values() if r["status"] == "corrected"]),
            "invalid_urls": len([r for r in results.values() if r["status"] == "invalid"])
        }
    }

async def main():
    """Run the MCP server"""
    from mcp.server.stdio import stdio_server
    
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="url-validator",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

# Cleanup on exit
import atexit

def cleanup():
    if validator.session:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(validator.close_session())
        else:
            loop.run_until_complete(validator.close_session())

atexit.register(cleanup)

if __name__ == "__main__":
    asyncio.run(main())