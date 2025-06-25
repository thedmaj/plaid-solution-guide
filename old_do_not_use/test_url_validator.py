#!/usr/bin/env python3
"""
Test script for URL validator
Demonstrates URL validation, correction, and text cleaning
"""

import asyncio
import json
from url_validator_mcp import URLValidatorCorrector, clean_text_urls

async def test_url_validation():
    """Test URL validation and correction functionality"""
    
    validator = URLValidatorCorrector()
    
    print("🧪 Testing URL Validation and Correction\n")
    
    # Test URLs (mix of valid, invalid, and correctable)
    test_urls = [
        "https://plaid.com/docs/api/products/auth/",  # Valid
        "https://plaid.com/docs/api/auth",            # Invalid but correctable  
        "https://plaid.com/docs/api/auth/",           # Invalid but correctable
        "https://plaid.com/docs/transactions",        # Invalid but correctable
        "https://invalid-domain-12345.com/docs",      # Invalid, not correctable
        "https://google.com",                         # Valid
        "not-a-url",                                  # Invalid format
    ]
    
    print("Individual URL Testing:")
    print("-" * 50)
    
    for url in test_urls:
        result = await validator.validate_and_correct_url(url)
        status_emoji = {
            "valid": "✅",
            "corrected": "🔧", 
            "invalid": "❌"
        }.get(result["status"], "❓")
        
        print(f"{status_emoji} {result['status'].upper()}: {url}")
        if result["status"] == "corrected":
            print(f"   → Corrected to: {result['final_url']}")
        elif result["status"] == "invalid" and "attempted_corrections" in result:
            print(f"   → Tried: {', '.join(result['attempted_corrections'][:2])}")
        print()
    
    await validator.close_session()

async def test_text_cleaning():
    """Test text cleaning functionality"""
    
    print("\n🧹 Testing Text Cleaning\n")
    print("-" * 50)
    
    # Sample text with mixed URLs (like AskBill might generate)
    sample_text = """
    For Plaid authentication, refer to these documentation links:
    
    1. Auth product overview: https://plaid.com/docs/api/auth
    2. Products guide: https://plaid.com/docs/api/products/auth/
    3. Identity verification: https://plaid.com/docs/identity
    4. Invalid link: https://invalid-domain-12345.com/docs
    5. Another valid link: https://google.com
    6. Transactions API: https://plaid.com/docs/transactions
    
    These links provide comprehensive information about integrating Plaid's authentication services.
    """
    
    print("Original text:")
    print(sample_text)
    print("\n" + "="*50)
    
    cleaned_text, summary = await clean_text_urls(sample_text)
    
    print("Cleaned text:")
    print(cleaned_text)
    
    print("\n" + "="*50)
    print("Summary:")
    print(json.dumps(summary, indent=2))
    
    print("\n📊 Results:")
    print(f"• Total URLs found: {summary['total_urls']}")
    print(f"• Valid URLs (unchanged): {summary['valid_urls']}")
    print(f"• Corrected URLs (marked with *): {summary['corrected_urls']}")
    print(f"• Invalid URLs (removed): {summary['removed_urls']}")
    
    if summary['corrections_made']:
        print("\n🔧 Corrections made:")
        for original, corrected in summary['corrections_made'].items():
            print(f"  {original} → {corrected}")

async def test_plaid_specific_corrections():
    """Test Plaid-specific URL correction patterns"""
    
    print("\n🔧 Testing Plaid-Specific Corrections\n")
    print("-" * 50)
    
    validator = URLValidatorCorrector()
    
    plaid_test_cases = [
        "https://plaid.com/docs/api/auth",           # Should add /products/ and trailing /
        "https://plaid.com/docs/api/identity",       # Should add /products/ and trailing /
        "https://plaid.com/docs/api/transactions",   # Should add /products/ and trailing /
        "https://plaid.com/docs/auth",              # Should become /docs/api/products/auth/
        "https://plaid.com/docs/api/products/auth", # Should add trailing /
    ]
    
    for test_url in plaid_test_cases:
        corrections = validator.generate_corrections(test_url)
        print(f"Original: {test_url}")
        print(f"Corrections: {corrections}")
        print()
    
    await validator.close_session()

async def main():
    """Run all tests"""
    await test_url_validation()
    await test_text_cleaning() 
    await test_plaid_specific_corrections()

if __name__ == "__main__":
    asyncio.run(main())