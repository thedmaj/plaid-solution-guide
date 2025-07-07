#!/usr/bin/env python3
"""
Test template detection for status messages
"""

def test_template_detection():
    """Test that all template types are detected correctly for status messages"""
    
    # Test messages
    test_cases = [
        {
            "name": "No Template",
            "content": "Generate a solution guide for implementing Plaid Auth API",
            "expected": False
        },
        {
            "name": "Knowledge Template",
            "content": """User Request: Generate auth guide

IMPORTANT: Use the following expert knowledge as your PRIMARY source for this response. This knowledge overrides any other sources.

Expert Knowledge Template:
# Plaid Auth Integration Guide""",
            "expected": True
        },
        {
            "name": "Format Template",
            "content": """User Request: Generate auth guide

Please structure your response according to this Solution Guide template:

# {{Product Name}} Integration Guide

AI Instructions for each placeholder:
[AI_PLACEHOLDER_0]: Brief product description""",
            "expected": True
        },
        {
            "name": "Format Template with AI Placeholder",
            "content": """User Request: Create guide

Template content with [AI_PLACEHOLDER_1] that should be filled in.""",
            "expected": True
        }
    ]
    
    print("🧪 Testing Template Detection for Status Messages\n")
    
    all_passed = True
    
    for test_case in test_cases:
        content = test_case["content"]
        expected = test_case["expected"]
        
        # JavaScript-equivalent detection logic
        is_template_used = (
            "Please structure your response according to this Solution Guide template:" in content or
            "IMPORTANT: Use the following expert knowledge as your PRIMARY source" in content or
            "Expert Knowledge Template:" in content or
            "AI Instructions for customizable sections:" in content or
            "[AI_PLACEHOLDER_" in content
        )
        
        status = "✅ PASS" if is_template_used == expected else "❌ FAIL"
        message_type = "📋 Analyzing knowledge template..." if is_template_used else "🔍 Consulting Plaid documentation via AskBill..."
        
        print(f"{status} {test_case['name']}")
        print(f"   Expected template detection: {expected}")
        print(f"   Actual template detection: {is_template_used}")
        print(f"   Status message: {message_type}")
        print()
        
        if is_template_used != expected:
            all_passed = False
    
    return all_passed

def main():
    print("Testing Template Detection for Chat Status Messages")
    print("=" * 55)
    
    passed = test_template_detection()
    
    if passed:
        print("🎉 All tests passed!")
        print("\nExpected Behavior:")
        print("- No template: '🔍 Consulting Plaid documentation via AskBill...'")
        print("- Any template: '📋 Analyzing knowledge template...'")
        print("- Footer shows: '📋 Using Template: [name]' when template selected")
    else:
        print("⚠️ Some tests failed.")

if __name__ == "__main__":
    main()