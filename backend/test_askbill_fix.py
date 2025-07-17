#!/usr/bin/env python3
"""
Test the AskBill response parsing fix
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from bill_client import AskBillClient

async def test_askbill_fix():
    """Test the fixed AskBill response parsing"""
    
    print("=== Testing AskBill Response Parsing Fix ===")
    print()
    
    client = AskBillClient()
    
    # Test with a simple question
    question = "What is Plaid?"
    print(f"Testing question: {question}")
    print()
    
    try:
        response = await client.ask_question(question, timeout=30.0)
        
        print("=== RESULTS ===")
        print(f"Answer length: {len(response.get('answer', ''))}")
        print(f"Sources count: {len(response.get('sources', []))}")
        print()
        
        if response.get('answer'):
            print("Answer preview:")
            print(response['answer'][:200] + "..." if len(response['answer']) > 200 else response['answer'])
            print()
            print("✅ SUCCESS: AskBill is now returning proper responses!")
        else:
            print("❌ FAILED: No answer received")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(test_askbill_fix())