#!/usr/bin/env python3
"""
Test the improved timeout handling for AskBill responses
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from bill_client import AskBillClient

async def test_timeout_handling():
    """Test the improved timeout handling"""
    
    print("=== Testing AskBill Timeout Handling Improvements ===")
    print()
    
    client = AskBillClient()
    
    # Test questions that might trigger different timeout scenarios
    test_cases = [
        {
            "question": "What is Plaid?",
            "timeout": 30.0,
            "description": "Simple question with 30s timeout"
        },
        {
            "question": "Provide a comprehensive overview of all Plaid products, APIs, and implementation details",
            "timeout": 20.0,
            "description": "Complex question with shorter timeout (might get partial response)"
        }
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"Test {i}: {test_case['description']}")
        print(f"Question: {test_case['question']}")
        print(f"Timeout: {test_case['timeout']}s")
        print()
        
        try:
            response = await client.ask_question(test_case["question"], timeout=test_case["timeout"])
            
            print("=== RESPONSE RECEIVED ===")
            print(f"Answer length: {len(response.get('answer', ''))}")
            print(f"Sources count: {len(response.get('sources', []))}")
            print(f"Partial response: {response.get('partial_response', False)}")
            
            if response.get('partial_response'):
                print(f"Timeout reason: {response.get('timeout_reason', 'Not specified')}")
                print("✅ SUCCESS: Partial response handling works!")
            else:
                print("✅ SUCCESS: Complete response received!")
                
            print()
            print("Answer preview:")
            answer = response.get('answer', '')
            print(answer[:300] + "..." if len(answer) > 300 else answer)
            print()
            
        except Exception as e:
            print(f"❌ ERROR: {e}")
            print()
        
        print("-" * 60)
        print()

if __name__ == "__main__":
    asyncio.run(test_timeout_handling())