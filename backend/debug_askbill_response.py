#!/usr/bin/env python3
"""
Debug AskBill response parsing issue
"""

import json
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_response_parsing():
    """Test the response parsing logic from the logs"""
    
    # Sample messages from the logs
    test_messages = [
        '{"type":"answer","ans":"?\\n\\n","qID":"c2718433"}',
        '{"type":"answer","ans":"Pla","qID":"c2718433"}',
        '{"type":"answer","ans":"id","qID":"c2718433"}',
        '{"type":"answer","ans":" Protect","qID":"c2718433"}',
        '{"type":"answer","ans":" is","qID":"c2718433"}',
        '{"type":"answer","ans":" a","qID":"c2718433"}',
        '{"type":"answer","ans":" fraud","qID":"c2718433"}',
        '{"type":"answer","ans":" prevention","qID":"c2718433"}',
        '{"type":"answer","ans":" platform","qID":"c2718433"}',
        '{"type":"answer","ans":" that","qID":"c2718433"}',
    ]
    
    full_answer = []
    
    print("=== Testing AskBill Response Parsing ===")
    print()
    
    for i, message in enumerate(test_messages):
        print(f"Message {i+1}: {message}")
        
        try:
            response = json.loads(message)
            msg_type = response.get("type", "unknown")
            
            print(f"  - Type: {msg_type}")
            
            if response.get("type") == "answer":
                # This is the same logic as in bill_client.py line 280-281
                answer_chunk = response.get("answer", "")
                print(f"  - Key used: 'answer' -> '{answer_chunk}' (length: {len(answer_chunk)})")
                
                # Try the correct key
                answer_chunk_correct = response.get("ans", "")
                print(f"  - Correct key: 'ans' -> '{answer_chunk_correct}' (length: {len(answer_chunk_correct)})")
                
                full_answer.append(answer_chunk_correct)
                
        except json.JSONDecodeError as e:
            print(f"  - JSON ERROR: {e}")
            
        print()
    
    print("=== RESULTS ===")
    print(f"Full answer: '{' '.join(full_answer)}'")
    print(f"Total length: {len(''.join(full_answer))}")
    
    print("\n=== ISSUE IDENTIFIED ===")
    print("The code is using response.get('answer', '') but the JSON has 'ans' key!")
    print("This is why all answer chunks show 0 chars - wrong key name!")

if __name__ == "__main__":
    test_response_parsing()