#!/usr/bin/env python3
"""
Test script for the enhanced URL validator with index prioritization
"""

import asyncio
import json
from enhanced_url_validator import EnhancedPlaidURLValidator, enhance_askbill_response_with_api_index

async def test_exact_field_matching():
    """Test exact field name matching from index"""
    print("=" * 60)
    print("Testing Exact Field Name Matching")
    print("=" * 60)
    
    # Test cases with field names that should match exactly in the index
    test_cases = [
        {
            "url": "https://plaid.com/docs/api/products/transactions/#wrong-anchor",
            "context": "The location field contains address information",
            "expected_field": "location"
        },
        {
            "url": "https://plaid.com/docs/api/products/auth/#invalid-anchor", 
            "context": "The routing field contains the routing number",
            "expected_field": "routing"
        },
        {
            "url": "https://plaid.com/docs/api/products/transactions/#bad-anchor",
            "context": "The balances field shows account balance",
            "expected_field": "balances"
        }
    ]
    
    async with EnhancedPlaidURLValidator() as validator:
        for test in test_cases:
            print(f"\nTesting: {test['url']}")
            print(f"Context: {test['context']}")
            
            result = await validator.validate_url_with_context(test["url"], test["context"])
            
            print(f"Original: {result.original_url}")
            print(f"Valid: {result.is_valid}")
            print(f"Corrected: {result.corrected_url}")
            print(f"Method: {result.correction_method}")
            print(f"Confidence: {result.confidence}")
            
            if result.correction_method == "exact_index_match":
                print("✅ PASS - Exact index match used")
            else:
                print("❌ FAIL - Should have used exact index match")

async def test_exact_endpoint_matching():
    """Test exact API endpoint matching from index"""
    print("\n" + "=" * 60)
    print("Testing Exact API Endpoint Matching")
    print("=" * 60)
    
    # Test cases with API endpoints that should match exactly in the index
    test_cases = [
        {
            "url": "https://plaid.com/docs/api/products/auth/#wrong-anchor",
            "context": "Use the /auth/get endpoint to retrieve account information",
            "expected_endpoint": "/auth/get"
        },
        {
            "url": "https://plaid.com/docs/api/products/transactions/#bad-anchor",
            "context": "Call /transactions/sync to get transaction updates",
            "expected_endpoint": "/transactions/sync"
        }
    ]
    
    async with EnhancedPlaidURLValidator() as validator:
        for test in test_cases:
            print(f"\nTesting: {test['url']}")
            print(f"Context: {test['context']}")
            
            result = await validator.validate_url_with_context(test["url"], test["context"])
            
            print(f"Original: {result.original_url}")
            print(f"Valid: {result.is_valid}")
            print(f"Corrected: {result.corrected_url}")
            print(f"Method: {result.correction_method}")
            print(f"Confidence: {result.confidence}")
            
            if result.correction_method == "exact_index_match":
                print("✅ PASS - Exact index match used")
            else:
                print("❌ FAIL - Should have used exact index match")

async def test_fallback_to_existing_logic():
    """Test fallback to existing logic for URLs not in database"""
    print("\n" + "=" * 60)
    print("Testing Fallback to Existing Logic")
    print("=" * 60)
    
    # Test cases that should NOT match in index and fall back to existing logic
    test_cases = [
        {
            "url": "https://plaid.com/docs/api/products/cra/",
            "context": "Information about CRA endpoints",
            "expected_fallback": True
        },
        {
            "url": "https://invalid-domain.com/docs/api/",
            "context": "This is not a Plaid domain",
            "expected_fallback": True
        }
    ]
    
    async with EnhancedPlaidURLValidator() as validator:
        for test in test_cases:
            print(f"\nTesting: {test['url']}")
            print(f"Context: {test['context']}")
            
            result = await validator.validate_url_with_context(test["url"], test["context"])
            
            print(f"Original: {result.original_url}")
            print(f"Valid: {result.is_valid}")
            print(f"Corrected: {result.corrected_url}")
            print(f"Method: {result.correction_method}")
            print(f"Confidence: {result.confidence}")
            
            if result.correction_method != "exact_index_match":
                print("✅ PASS - Fell back to existing logic")
            else:
                print("❌ FAIL - Should have fallen back to existing logic")

async def test_transaction_location_urls():
    """Test the specific transaction location URLs that were mentioned"""
    print("\n" + "=" * 60)
    print("Testing Transaction Location URLs")
    print("=" * 60)
    
    # The URLs that were mentioned in the original problem
    test_urls = [
        "https://plaid.com/docs/api/products/transactions/#transaction-location",
        "https://plaid.com/docs/api/products/transactions/#transactionlocation-address",
        "https://plaid.com/docs/api/products/transactions/#transactionlocation-city",
        "https://plaid.com/docs/api/products/transactions/#transactionlocation-region",
        "https://plaid.com/docs/api/products/transactions/#transactionlocation-postal_code",
        "https://plaid.com/docs/api/products/transactions/#transactionlocation-country",
        "https://plaid.com/docs/api/products/transactions/#transactionlocation-lat",
        "https://plaid.com/docs/api/products/transactions/#transactionlocation-lon",
        "https://plaid.com/docs/api/products/transactions/#transactionlocation-store_number"
    ]
    
    context = """
    Field | Type | Description | API Reference |
    |-------|------|-------------|---------------|
    | `location` | object | Physical location where the transaction occurred |
    | `location.address` | string | Street address of the transaction location |
    | `location.city` | string | City where the transaction occurred |
    | `location.region` | string | State or region of the transaction |
    | `location.postal_code` | string | Postal code of the transaction location |
    | `location.country` | string | Country where the transaction occurred |
    | `location.lat` | number | Latitude coordinate of the transaction location |
    | `location.lon` | number | Longitude coordinate of the transaction location |
    | `location.store_number` | string | Store number where the transaction occurred |
    """
    
    async with EnhancedPlaidURLValidator() as validator:
        for url in test_urls:
            print(f"\nTesting: {url}")
            
            result = await validator.validate_url_with_context(url, context)
            
            print(f"Valid: {result.is_valid}")
            print(f"Method: {result.correction_method}")
            print(f"Corrected: {result.corrected_url}")
            
            if result.correction_method == "exact_index_match":
                print("✅ Index match found and applied")
            elif result.is_valid:
                print("✅ URL is valid, no correction needed")
            else:
                print("❌ URL marked as invalid")

async def test_full_text_processing():
    """Test full text processing with the enhanced validator"""
    print("\n" + "=" * 60)
    print("Testing Full Text Processing")
    print("=" * 60)
    
    # Sample text with various URL issues
    sample_text = """
    To work with transaction data, you can use the following fields:
    
    - The `location` field contains address information: https://plaid.com/docs/api/products/transactions/#wrong-location-anchor
    - Use the `routing` field from /auth/get: https://plaid.com/docs/api/products/auth/#bad-routing-anchor
    - Call /transactions/sync endpoint: https://plaid.com/docs/api/products/transactions/#invalid-sync-anchor
    - The `balances` field shows account balance: https://plaid.com/docs/api/products/auth/#wrong-balance-anchor
    """
    
    enhanced_text, stats = await enhance_askbill_response_with_api_index(sample_text)
    
    print("Original text:")
    print(sample_text)
    print("\nEnhanced text:")
    print(enhanced_text)
    print("\nStats:")
    print(json.dumps(stats, indent=2))

async def main():
    """Run all tests"""
    await test_exact_field_matching()
    await test_exact_endpoint_matching()
    await test_fallback_to_existing_logic()
    await test_transaction_location_urls()
    await test_full_text_processing()
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())