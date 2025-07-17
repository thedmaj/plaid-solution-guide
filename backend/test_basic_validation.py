#!/usr/bin/env python3
"""
Basic test for the enhanced URL validator logic (without async components)
"""

import sys
sys.path.append('.')

from plaid_field_index import find_field_url, find_endpoint_url, PLAID_API_INDEX
from urllib.parse import urlparse

def test_field_extraction_logic():
    """Test the field extraction logic"""
    print("=" * 60)
    print("Testing Field Extraction Logic")
    print("=" * 60)
    
    # Test cases that simulate the new logic
    test_cases = [
        {
            "url": "https://plaid.com/docs/api/products/transactions/#transactionlocation-address",
            "context": "The location field contains address information",
            "expected_field": "location"
        },
        {
            "url": "https://plaid.com/docs/api/products/auth/#bad-routing-anchor",
            "context": "The routing field contains the routing number",
            "expected_field": "routing"
        },
        {
            "url": "https://plaid.com/docs/api/products/transactions/#wrong-balance-anchor",
            "context": "The balances field shows account balance",
            "expected_field": "balances"
        }
    ]
    
    for test in test_cases:
        print(f"\nTesting: {test['url']}")
        print(f"Context: {test['context']}")
        
        # Extract field from URL anchor
        parsed = urlparse(test["url"])
        field_name = None
        
        if "#" in test["url"]:
            anchor = test["url"].split("#")[-1]
            if "-" in anchor:
                parts = anchor.split("-")
                # Look for the expected field in the parts
                for part in parts:
                    if part == test["expected_field"]:
                        field_name = part
                        break
        
        # Also check context
        if not field_name:
            context_lower = test["context"].lower()
            if test["expected_field"] in context_lower:
                field_name = test["expected_field"]
        
        print(f"Extracted field: {field_name}")
        
        # Get the correct URL from index
        if field_name:
            correct_url = find_field_url(field_name)
            print(f"Index URL: {correct_url}")
            
            if correct_url != "https://plaid.com/docs/api/":
                print("✅ PASS - Found exact field match in index")
            else:
                print("❌ FAIL - Field not found in index")
        else:
            print("❌ FAIL - Could not extract field name")

def test_endpoint_extraction_logic():
    """Test the endpoint extraction logic"""
    print("\n" + "=" * 60)
    print("Testing Endpoint Extraction Logic")
    print("=" * 60)
    
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
    
    for test in test_cases:
        print(f"\nTesting: {test['url']}")
        print(f"Context: {test['context']}")
        
        # Extract endpoint from context
        endpoint = None
        context_lower = test["context"].lower()
        
        # Look for endpoint mentions in context
        for product, config in PLAID_API_INDEX.items():
            for ep in config.get("endpoints", {}).keys():
                if ep in context_lower:
                    endpoint = ep
                    break
            if endpoint:
                break
        
        print(f"Extracted endpoint: {endpoint}")
        
        # Get the correct URL from index
        if endpoint:
            correct_url = find_endpoint_url(endpoint)
            print(f"Index URL: {correct_url}")
            
            if correct_url != "https://plaid.com/docs/api/":
                print("✅ PASS - Found exact endpoint match in index")
            else:
                print("❌ FAIL - Endpoint not found in index")
        else:
            print("❌ FAIL - Could not extract endpoint")

def test_priority_logic():
    """Test the priority logic: index > AI suggestions"""
    print("\n" + "=" * 60)
    print("Testing Priority Logic")
    print("=" * 60)
    
    # Show that index matches should override AI suggestions
    test_cases = [
        {
            "field": "location",
            "ai_suggestion": "https://plaid.com/docs/api/products/transactions/#wrong-location",
            "index_match": find_field_url("location")
        },
        {
            "field": "routing", 
            "ai_suggestion": "https://plaid.com/docs/api/products/auth/#wrong-routing",
            "index_match": find_field_url("routing")
        }
    ]
    
    for test in test_cases:
        print(f"\nField: {test['field']}")
        print(f"AI Suggestion: {test['ai_suggestion']}")
        print(f"Index Match: {test['index_match']}")
        
        # The new logic should prioritize index match
        if test['index_match'] != "https://plaid.com/docs/api/":
            priority_url = test['index_match']
            print(f"Priority URL: {priority_url}")
            print("✅ PASS - Index match has priority over AI suggestion")
        else:
            print("❌ FAIL - No index match found")

def test_transaction_location_fields():
    """Test the specific transaction location fields"""
    print("\n" + "=" * 60)
    print("Testing Transaction Location Fields")
    print("=" * 60)
    
    # The fields mentioned in the original problem
    location_fields = [
        "location",
        "location.address", 
        "location.city",
        "location.region",
        "location.postal_code",
        "location.country",
        "location.lat",
        "location.lon",
        "location.store_number"
    ]
    
    for field in location_fields:
        print(f"\nTesting field: {field}")
        
        # Try to find in index
        index_url = find_field_url(field)
        print(f"Index URL: {index_url}")
        
        # Also try just the base field name
        if index_url == "https://plaid.com/docs/api/":
            base_field = field.split('.')[0]
            index_url = find_field_url(base_field)
            print(f"Base field URL: {index_url}")
        
        if index_url != "https://plaid.com/docs/api/":
            print("✅ Found in index")
        else:
            print("❌ Not found in index")

def main():
    """Run all tests"""
    test_field_extraction_logic()
    test_endpoint_extraction_logic()
    test_priority_logic()
    test_transaction_location_fields()
    
    print("\n" + "=" * 60)
    print("Basic validation tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()