#!/usr/bin/env python3
"""
Example integration showing how Claude would use URL validator with AskBill
"""

import asyncio
import json
from url_validator_mcp import clean_text_urls

async def simulate_askbill_response(query: str) -> str:
    """Simulate AskBill response with potentially invalid URLs"""
    
    # This simulates what AskBill might return
    responses = {
        "plaid auth": """
        For Plaid Authentication, you can find detailed information at:
        
        1. Authentication Overview: https://plaid.com/docs/api/auth
        2. Auth API Reference: https://plaid.com/docs/api/products/auth/
        3. Identity Verification: https://plaid.com/docs/identity  
        4. Account Information: https://plaid.com/docs/api/accounts
        5. Error Handling: https://plaid.com/docs/api/errors
        6. Webhook Setup: https://invalid-domain.com/webhooks
        
        The Auth product allows you to retrieve account and routing numbers 
        for checking and savings accounts. For more details, visit:
        https://plaid.com/docs/auth
        """,
        
        "plaid transactions": """
        Plaid Transactions API documentation:
        
        1. Transactions Overview: https://plaid.com/docs/transactions
        2. API Reference: https://plaid.com/docs/api/products/transactions/
        3. Categories: https://plaid.com/docs/api/categories
        4. Enrichment: https://broken-link.com/enrichment
        5. Real-time updates: https://plaid.com/docs/api/webhooks
        
        For integration examples, see: https://plaid.com/docs/transactions/examples
        """
    }
    
    return responses.get(query.lower(), "No information found for your query.")

async def claude_workflow_with_url_validation(user_query: str) -> str:
    """
    Simulate Claude's workflow:
    1. Query AskBill
    2. Validate and clean URLs
    3. Return cleaned response to user
    """
    
    print(f"🤖 Claude: Processing query: '{user_query}'")
    print("-" * 50)
    
    # Step 1: Query AskBill (simulated)
    print("📞 Querying AskBill...")
    askbill_response = await simulate_askbill_response(user_query)
    
    print("📄 AskBill Response (raw):")
    print(askbill_response)
    print("\n" + "="*50)
    
    # Step 2: Validate and clean URLs
    print("🧹 Validating and cleaning URLs...")
    cleaned_response, url_summary = await clean_text_urls(askbill_response)
    
    # Step 3: Present cleaned response with summary
    print("✨ Cleaned Response:")
    print(cleaned_response)
    
    print("\n📊 URL Processing Summary:")
    print(f"• URLs found: {url_summary['total_urls']}")
    print(f"• Valid URLs: {url_summary['valid_urls']}")
    print(f"• Corrected URLs (marked with *): {url_summary['corrected_urls']}")
    print(f"• Invalid URLs removed: {url_summary['removed_urls']}")
    
    if url_summary['corrections_made']:
        print("\n🔧 URL Corrections:")
        for original, corrected in url_summary['corrections_made'].items():
            print(f"  • {original} → {corrected}")
    
    # Step 4: Add Claude's explanatory note
    note = ""
    if url_summary['corrected_urls'] > 0 or url_summary['removed_urls'] > 0:
        note += f"\n\n---\n**Note**: I've processed the URLs in this response:\n"
        if url_summary['corrected_urls'] > 0:
            note += f"- {url_summary['corrected_urls']} URLs were corrected (marked with *)\n"
        if url_summary['removed_urls'] > 0:
            note += f"- {url_summary['removed_urls']} invalid URLs were removed\n"
        note += "All remaining URLs have been validated as accessible."
    
    final_response = cleaned_response + note
    
    print("\n🎯 Final Response to User:")
    print(final_response)
    
    return final_response

async def demo_multiple_queries():
    """Demo with multiple user queries"""
    
    test_queries = [
        "plaid auth",
        "plaid transactions"
    ]
    
    print("🚀 Claude + AskBill + URL Validator Demo")
    print("="*60)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n🧪 Test {i}/{len(test_queries)}")
        await claude_workflow_with_url_validation(query)
        print("\n" + "="*60)

async def main():
    """Run the demo"""
    await demo_multiple_queries()

if __name__ == "__main__":
    asyncio.run(main())