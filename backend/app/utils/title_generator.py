"""
Smart Chat Title Generation
Generates intelligent titles for chat sessions based on conversation content
"""

import re
from typing import List, Dict, Any, Optional

class ChatTitleGenerator:
    """Generate intelligent titles for chat sessions based on conversation content."""
    
    # Keywords that indicate specific Plaid topics
    PLAID_KEYWORDS = {
        'link': 'Plaid Link Integration',
        'auth': 'Authentication & Auth API',
        'identity': 'Identity Verification',
        'transactions': 'Transaction Data',
        'accounts': 'Account Information',
        'webhook': 'Webhook Implementation',
        'assets': 'Asset Verification',
        'liabilities': 'Liability Data',
        'investments': 'Investment Data',
        'payment': 'Payment Initiation',
        'processor': 'Processor Integration',
        'sandbox': 'Sandbox Development',
        'production': 'Production Setup'
    }
    
    # Product combinations that create specific titles
    PRODUCT_COMBINATIONS = {
        ('link', 'auth'): 'Plaid Link + Auth Integration',
        ('link', 'identity'): 'Plaid Link + Identity Setup',
        ('link', 'transactions'): 'Plaid Link + Transactions',
        ('auth', 'identity'): 'Auth + Identity Solution',
        ('auth', 'transactions'): 'Auth + Transaction Data',
        ('identity', 'transactions'): 'Identity + Transaction Guide',
        ('webhook', 'transactions'): 'Transaction Webhooks',
        ('webhook', 'auth'): 'Auth Webhooks Setup',
        ('link', 'webhook'): 'Link + Webhook Integration'
    }
    
    # Technical implementation patterns
    TECH_PATTERNS = {
        'react': 'React Implementation',
        'node': 'Node.js Integration',
        'python': 'Python Implementation',
        'curl': 'API Reference Guide',
        'postman': 'Postman Collection',
        'javascript': 'JavaScript Guide',
        'typescript': 'TypeScript Implementation',
        'android': 'Android Integration',
        'ios': 'iOS Implementation',
        'flutter': 'Flutter Integration',
        'error': 'Error Handling Guide',
        'troubleshoot': 'Troubleshooting Guide'
    }
    
    @classmethod
    def generate_title(cls, messages: List[Dict[str, Any]]) -> str:
        """
        Generate an intelligent title based on conversation messages.
        
        Args:
            messages: List of message objects with 'role' and 'content' fields
            
        Returns:
            Generated title string
        """
        if not messages:
            return "New Conversation"
        
        # Combine all user messages to analyze intent
        user_content = " ".join([
            msg.get('content', '') 
            for msg in messages 
            if msg.get('role') == 'user'
        ]).lower()
        
        # Check for explicit title hints in first message
        first_user_msg = next(
            (msg.get('content', '') for msg in messages if msg.get('role') == 'user'),
            ""
        )
        
        explicit_title = cls._extract_explicit_title(first_user_msg)
        if explicit_title:
            return explicit_title
        
        # Detect Plaid products mentioned
        detected_products = cls._detect_plaid_products(user_content)
        
        # Detect technical implementation details
        tech_stack = cls._detect_tech_stack(user_content)
        
        # Generate title based on detected patterns
        title = cls._generate_from_patterns(detected_products, tech_stack, user_content)
        
        return title or "Solution Guide"
    
    @classmethod
    def _extract_explicit_title(cls, first_message: str) -> Optional[str]:
        """Extract explicit title from phrases like 'create a guide for...'"""
        
        # Common patterns that indicate a specific title
        title_patterns = [
            r'(?:create|generate|build|make)\s+(?:a\s+)?(?:guide|tutorial|documentation)\s+(?:for|on|about)\s+(.+?)(?:\s+integration|\s+implementation|$)',
            r'(?:guide|tutorial|documentation)\s+(?:for|on|about)\s+(.+?)(?:\s+integration|\s+implementation|$)',
            r'how\s+to\s+(?:integrate|implement|setup|configure)\s+(.+?)(?:\s+with|\s+for|\s+in|$)',
            r'(?:integration|implementation)\s+(?:guide|tutorial)\s+(?:for|with)\s+(.+?)(?:\s+and|\s+using|$)',
            r'(?:create|generate|build|make)\s+(?:a\s+)?(.+?)\s+(?:guide|documentation|tutorial)'
        ]
        
        for pattern in title_patterns:
            match = re.search(pattern, first_message.lower())
            if match:
                title_part = match.group(1).strip()
                # Clean up the title
                title_part = re.sub(r'\s+', ' ', title_part)
                title_part = title_part.replace('plaid ', '').strip()
                
                # Capitalize properly
                if title_part:
                    return f"Plaid {title_part.title()} Guide"
        
        return None
    
    @classmethod
    def _detect_plaid_products(cls, content: str) -> List[str]:
        """Detect which Plaid products are mentioned in the content."""
        detected = []
        
        for keyword, _ in cls.PLAID_KEYWORDS.items():
            if keyword in content:
                detected.append(keyword)
        
        return detected
    
    @classmethod
    def _detect_tech_stack(cls, content: str) -> List[str]:
        """Detect technical implementation details mentioned."""
        detected = []
        
        for tech, _ in cls.TECH_PATTERNS.items():
            if tech in content:
                detected.append(tech)
        
        return detected
    
    @classmethod
    def _generate_from_patterns(cls, products: List[str], tech_stack: List[str], content: str) -> str:
        """Generate title from detected patterns."""
        
        # Check for product combinations first
        products_set = set(products)
        for combo, title in cls.PRODUCT_COMBINATIONS.items():
            if all(product in products_set for product in combo):
                # Add tech stack if present
                if tech_stack:
                    tech_suffix = cls.TECH_PATTERNS.get(tech_stack[0], tech_stack[0].title())
                    return f"{title} ({tech_suffix})"
                return title
        
        # Single product with tech stack
        if products and tech_stack:
            product_title = cls.PLAID_KEYWORDS.get(products[0], products[0].title())
            tech_title = cls.TECH_PATTERNS.get(tech_stack[0], tech_stack[0].title())
            return f"{product_title} ({tech_title})"
        
        # Single product
        if products:
            return cls.PLAID_KEYWORDS.get(products[0], f"Plaid {products[0].title()}")
        
        # Tech stack only
        if tech_stack:
            tech_title = cls.TECH_PATTERNS.get(tech_stack[0], tech_stack[0].title())
            return f"Plaid Integration ({tech_title})"
        
        # Fallback based on content analysis
        if 'solution' in content and 'guide' in content:
            return "Solution Guide"
        elif 'integration' in content:
            return "Integration Guide"
        elif 'implementation' in content:
            return "Implementation Guide"
        elif 'setup' in content or 'getting started' in content:
            return "Getting Started Guide"
        elif 'troubleshoot' in content or 'error' in content:
            return "Troubleshooting Guide"
        elif 'example' in content or 'sample' in content:
            return "Code Examples"
        elif 'api' in content and 'reference' in content:
            return "API Reference"
        
        return "Plaid Development"

def generate_session_title(messages: List[Dict[str, Any]]) -> str:
    """
    Convenience function to generate a session title.
    
    Args:
        messages: List of message dictionaries
        
    Returns:
        Generated title string
    """
    return ChatTitleGenerator.generate_title(messages)