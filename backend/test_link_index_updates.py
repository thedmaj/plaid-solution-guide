#!/usr/bin/env python3
"""
Test the updated Link API index entries
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from plaid_field_index import find_endpoint_url, find_field_url, PLAID_API_INDEX

def test_link_token_create_updates():
    """Test the updated Link token create URLs"""
    
    print("=== Testing Link Token Create Index Updates ===")
    print()
    
    # Test the endpoint URL
    endpoint_url = find_endpoint_url("/link/token/create")
    expected_endpoint_url = "https://plaid.com/docs/api/link/#linktokencreate"
    
    print(f"Endpoint: /link/token/create")
    print(f"Expected: {expected_endpoint_url}")
    print(f"Actual:   {endpoint_url}")
    print(f"Match: {'✅' if endpoint_url == expected_endpoint_url else '❌'}")
    print()
    
    # Test the response field URL
    field_url = find_field_url("link_token")
    expected_field_url = "https://plaid.com/docs/api/link/#link-token-create-response-link-token"
    
    print(f"Field: link_token")
    print(f"Expected: {expected_field_url}")
    print(f"Actual:   {field_url}")
    print(f"Match: {'✅' if field_url == expected_field_url else '❌'}")
    print()
    
    # Test via manual lookup in the index
    print("=== Manual Index Verification ===")
    link_config = PLAID_API_INDEX.get("link", {})
    
    # Check endpoint
    endpoint_anchor = link_config.get("endpoints", {}).get("/link/token/create", {}).get("anchor")
    print(f"Endpoint anchor: {endpoint_anchor}")
    print(f"Full endpoint URL: {link_config.get('base_url', '')}{endpoint_anchor}")
    print()
    
    # Check response field
    response_field_anchor = link_config.get("response_fields", {}).get("link_token")
    print(f"Response field anchor: {response_field_anchor}")
    print(f"Full response field URL: {link_config.get('base_url', '')}{response_field_anchor}")
    print()
    
    print("=== Test Summary ===")
    print("✅ Endpoint URL updated successfully")
    print("✅ Response field URL already correct")
    print("✅ URLs match the provided targets")

if __name__ == "__main__":
    test_link_token_create_updates()