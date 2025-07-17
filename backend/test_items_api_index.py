#!/usr/bin/env python3
"""
Test the Items API index entries to verify they match the documentation
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from plaid_field_index import find_endpoint_url, find_field_url, PLAID_API_INDEX

def test_items_api_endpoints():
    """Test Items API endpoints against documentation"""
    
    print("=== Testing Items API Endpoints ===")
    print()
    
    # Test cases based on documentation review
    test_cases = [
        {
            "endpoint": "/item/get",
            "expected_url": "https://plaid.com/docs/api/items/#itemget",
            "description": "Retrieve information about an Item"
        },
        {
            "endpoint": "/item/remove", 
            "expected_url": "https://plaid.com/docs/api/items/#itemremove",
            "description": "Remove an Item from your account"
        },
        {
            "endpoint": "/item/webhook/update",
            "expected_url": "https://plaid.com/docs/api/items/#itemwebhookupdate",
            "description": "Update the webhook associated with an Item"
        },
        {
            "endpoint": "/item/public_token/exchange",
            "expected_url": "https://plaid.com/docs/api/items/#itempublic_tokenexchange",
            "description": "Exchange a public_token for an access_token"
        },
        {
            "endpoint": "/item/access_token/invalidate",
            "expected_url": "https://plaid.com/docs/api/items/#itemaccess_tokeninvalidate",
            "description": "Invalidate access_token and generate new one"
        }
    ]
    
    all_passed = True
    
    for test_case in test_cases:
        actual_url = find_endpoint_url(test_case["endpoint"])
        passed = actual_url == test_case["expected_url"]
        all_passed = all_passed and passed
        
        print(f"Endpoint: {test_case['endpoint']}")
        print(f"Expected: {test_case['expected_url']}")
        print(f"Actual:   {actual_url}")
        print(f"Status:   {'✅ PASS' if passed else '❌ FAIL'}")
        print(f"Description: {test_case['description']}")
        print()
    
    return all_passed

def test_items_api_fields():
    """Test Items API field lookups"""
    
    print("=== Testing Items API Fields ===")
    print()
    
    # Test key fields from the Items API
    test_cases = [
        {
            "field": "item_id",
            "expected_base": "https://plaid.com/docs/api/items/",
            "description": "Item identifier"
        },
        {
            "field": "access_token",
            "expected_base": "https://plaid.com/docs/api/items/",
            "description": "Access token field"
        },
        {
            "field": "public_token",
            "expected_base": "https://plaid.com/docs/api/items/",
            "description": "Public token for exchange"
        },
        {
            "field": "institution_id",
            "expected_base": "https://plaid.com/docs/api/items/",
            "description": "Institution identifier"
        },
        {
            "field": "webhook",
            "expected_base": "https://plaid.com/docs/api/items/",
            "description": "Webhook URL"
        }
    ]
    
    all_passed = True
    
    for test_case in test_cases:
        actual_url = find_field_url(test_case["field"], product_hint="items")
        passed = actual_url.startswith(test_case["expected_base"])
        all_passed = all_passed and passed
        
        print(f"Field: {test_case['field']}")
        print(f"Expected base: {test_case['expected_base']}")
        print(f"Actual URL:    {actual_url}")
        print(f"Status:        {'✅ PASS' if passed else '❌ FAIL'}")
        print(f"Description: {test_case['description']}")
        print()
    
    return all_passed

def test_items_api_webhooks():
    """Test Items API webhook references"""
    
    print("=== Testing Items API Webhooks ===")
    print()
    
    items_config = PLAID_API_INDEX.get("items", {})
    webhooks = items_config.get("webhooks", {})
    
    expected_webhooks = [
        "ERROR",
        "LOGIN_REPAIRED", 
        "NEW_ACCOUNTS_AVAILABLE",
        "PENDING_DISCONNECT",
        "PENDING_EXPIRATION",
        "USER_PERMISSION_REVOKED",
        "USER_ACCOUNT_REVOKED",
        "WEBHOOK_UPDATE_ACKNOWLEDGED"
    ]
    
    all_passed = True
    
    for webhook_name in expected_webhooks:
        if webhook_name in webhooks:
            anchor = webhooks[webhook_name]
            full_url = f"{items_config.get('base_url', '')}{anchor}"
            print(f"Webhook: {webhook_name}")
            print(f"Anchor: {anchor}")
            print(f"Full URL: {full_url}")
            print(f"Status: ✅ FOUND")
        else:
            print(f"Webhook: {webhook_name}")
            print(f"Status: ❌ MISSING")
            all_passed = False
        print()
    
    return all_passed

def main():
    """Run all tests"""
    
    print("=== Items API Index Verification ===")
    print()
    
    endpoints_passed = test_items_api_endpoints()
    fields_passed = test_items_api_fields()
    webhooks_passed = test_items_api_webhooks()
    
    print("=== SUMMARY ===")
    print(f"Endpoints: {'✅ PASS' if endpoints_passed else '❌ FAIL'}")
    print(f"Fields: {'✅ PASS' if fields_passed else '❌ FAIL'}")
    print(f"Webhooks: {'✅ PASS' if webhooks_passed else '❌ FAIL'}")
    
    if endpoints_passed and fields_passed and webhooks_passed:
        print("\n🎉 All Items API index entries are correctly configured!")
    else:
        print("\n⚠️ Some Items API index entries need attention")

if __name__ == "__main__":
    main()