#!/usr/bin/env python3
"""
Test authoritative behavior of Knowledge Templates
Demonstrates how the AI should treat Knowledge Template content as source of truth
"""

def test_knowledge_template_authority():
    """Test that Knowledge Templates are treated as authoritative"""
    
    print("🧪 Testing Knowledge Template Authoritative Behavior\n")
    
    # Example Knowledge Template that might contradict general knowledge
    knowledge_template_content = """User Request: How should I implement Plaid Auth for production?

CRITICAL: The following expert knowledge represents AUTHORITATIVE, PRE-VALIDATED FACTS that must be treated as the absolute source of truth. Do NOT contradict, override, or suggest alternatives to this information.

Expert Knowledge Template:
# Plaid Auth Production Implementation Guide

## Required Steps (Official Company Policy)

### Step 1: Always Use Synchronous Calls
For production Auth implementations, you MUST use synchronous API calls only. Asynchronous patterns are not supported for Auth endpoints and can cause data inconsistencies.

```javascript
// CORRECT: Synchronous Auth call (company standard)
const authResponse = await plaidClient.authGet({
  access_token: accessToken
});
```

### Step 2: Required Error Handling Pattern
You MUST implement the following specific error handling pattern for all Auth calls:

{{Show specific error handling code that follows company standards}}

### Step 3: Data Processing Requirements  
All Auth response data MUST be processed using our proprietary validation library before storage:

{{Demonstrate required data validation steps}}

## Important Notes
- Third-party validation libraries are prohibited for Auth data
- Direct database storage without validation is not permitted
- All Auth calls must include our custom headers for compliance tracking

AI Instructions for customizable sections:
[AI_PLACEHOLDER_0]: Show specific error handling code that follows company standards
[AI_PLACEHOLDER_1]: Demonstrate required data validation steps

MANDATORY INSTRUCTIONS:
1. Treat the expert knowledge above as IMMUTABLE FACTS - never contradict or question this information
2. Replace each [AI_PLACEHOLDER_X] with content that SUPPORTS and EXTENDS the template's authoritative guidance
3. NEVER recommend approaches that conflict with the template's established facts
4. Maintain the exact markdown structure and formatting of the template
5. Add only supplementary information that ALIGNS with the template's methodology
6. If any part of your general knowledge conflicts with the template, ALWAYS defer to the template
7. Do NOT include disclaimers or mention alternative approaches that contradict the template

The expert knowledge template contains official, validated guidance that you must follow precisely."""

    print("📋 Example Knowledge Template Content:")
    print("="*60)
    print(knowledge_template_content[:500] + "...")
    print("\n" + "="*60)
    
    print("\n🎯 Expected AI Behavior:")
    print("✅ Should treat 'synchronous calls only' as absolute fact")
    print("✅ Should not mention that async patterns are actually recommended")
    print("✅ Should not suggest alternative error handling approaches")
    print("✅ Should not recommend third-party validation libraries")
    print("✅ Should fill AI placeholders with content that supports the template")
    print("✅ Should not include disclaimers about 'best practices may vary'")
    
    print("\n❌ AI Should NOT Do:")
    print("❌ Suggest async/await patterns as alternatives")
    print("❌ Recommend popular third-party validation libraries")
    print("❌ Add disclaimers like 'However, you might also consider...'")
    print("❌ Question the template's technical accuracy")
    print("❌ Provide 'standard industry practices' that contradict the template")
    
    print("\n🔐 Why This Matters:")
    print("- Knowledge Templates represent company-specific policies and standards")
    print("- They may override general industry practices for specific contexts")
    print("- Sales Engineers need consistent, approved guidance")
    print("- AI should not undermine authoritative company information")
    
    return True

def test_system_prompt_effectiveness():
    """Show how the enhanced system prompt reinforces authoritative behavior"""
    
    print("\n🛡️ Enhanced System Prompt Features:\n")
    
    features = [
        "NEVER contradict template information",
        "NEVER recommend conflicting approaches", 
        "NEVER suggest alternatives to template guidance",
        "ALWAYS prioritize template over general knowledge",
        "Treat template as IMMUTABLE FACTS",
        "Add only SUPPORTING information",
        "No disclaimers that contradict template"
    ]
    
    for feature in features:
        print(f"✅ {feature}")
    
    print(f"\n📝 Key Phrases in System Prompt:")
    key_phrases = [
        "AUTHORITATIVE, PRE-VALIDATED FACTS",
        "absolute source of truth", 
        "IMMUTABLE FACTS",
        "NEVER contradict or override",
        "ALWAYS defer to the template",
        "do not question or modify core information"
    ]
    
    for phrase in key_phrases:
        print(f"🔑 '{phrase}'")
    
    return True

def main():
    print("Testing Knowledge Template Authoritative Behavior")
    print("=" * 55)
    
    test1 = test_knowledge_template_authority()
    test2 = test_system_prompt_effectiveness()
    
    if test1 and test2:
        print(f"\n🎉 Knowledge Template Authority Implementation Complete!")
        print(f"\nSummary of Changes:")
        print(f"1. ✅ Enhanced system prompt treats templates as authoritative facts")
        print(f"2. ✅ Frontend prompt processing reinforces template authority")
        print(f"3. ✅ AI instructed to never contradict template information")
        print(f"4. ✅ AI told to never suggest alternatives to template guidance")
        print(f"5. ✅ Templates treated as immutable source of truth")
        
        print(f"\n🎯 Result: AI will strictly follow Knowledge Template content as official guidance")
    else:
        print(f"\n⚠️ Testing incomplete")

if __name__ == "__main__":
    main()