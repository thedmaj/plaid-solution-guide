#!/usr/bin/env python3
"""
Test script specifically for CRA URL validation fix
"""

import asyncio
import json
from enhanced_url_validator import enhance_askbill_response_with_api_index

async def test_cra_url_correction():
    """Test that the invalid CRA URL gets corrected"""
    
    print("🧪 Testing CRA URL Correction\n")
    
    # Test the exact problematic URL that was reported
    mock_response = """
    To implement CRA Base Report, you'll need to:
    
    1. Create a user token using /link/token/create
    2. Use CRA Check API documentation at https://plaid.com/docs/api/products/cra/
    3. Call /cra/check_report/create to generate the report
    4. Retrieve the base report with /cra/check_report/base_report/get
    
    For more details on consumer reporting, see the CRA documentation.
    """
    
    print("Original response with invalid CRA URL:")
    print(mock_response)
    print("\n" + "="*80)
    
    try:
        enhanced_response, stats = await enhance_askbill_response_with_api_index(mock_response)
        
        print("Enhanced response:")
        print(enhanced_response)
        print("\n" + "="*80)
        print("Enhancement Stats:")
        print(json.dumps(stats, indent=2))
        
        # Check if the correction was made
        api_docs_corrected = "https://plaid.com/docs/api/products/check/" in enhanced_response
        general_docs_available = "https://plaid.com/docs/check/" in enhanced_response
        
        if api_docs_corrected:
            print("\n✅ SUCCESS: Invalid CRA URL was corrected!")
            print("❌ https://plaid.com/docs/api/products/cra/ (404)")
            print("✅ https://plaid.com/docs/api/products/check/ (API docs)")
            if general_docs_available:
                print("✅ https://plaid.com/docs/check/ (general docs)")
        else:
            print("\n❌ FAILED: CRA URL was not corrected")
            
        return api_docs_corrected
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_individual_url():
    """Test the URL individually"""
    
    print("\n🔍 Testing Individual URL Validation\n")
    
    from enhanced_url_validator import EnhancedPlaidURLValidator
    
    async with EnhancedPlaidURLValidator() as validator:
        result = await validator.validate_url_with_context(
            "https://plaid.com/docs/api/products/cra/",
            "To implement CRA Base Report using consumer reporting API"
        )
        
        print(f"URL: https://plaid.com/docs/api/products/cra/")
        print(f"Valid: {result.is_valid}")
        print(f"Error Type: {result.error_type}")
        print(f"Suggestions: {result.suggested_urls}")
        print(f"Correction Method: {result.correction_method}")
        print(f"Confidence: {result.confidence}")
        
        api_docs_suggested = result.suggested_urls and "https://plaid.com/docs/api/products/check/" in result.suggested_urls
        general_docs_suggested = result.suggested_urls and "https://plaid.com/docs/check/" in result.suggested_urls
        
        if api_docs_suggested:
            print("✅ Individual validation PASSED")
            if general_docs_suggested:
                print("✅ Both API and general docs suggested")
            return True
        else:
            print("❌ Individual validation FAILED")
            return False

async def main():
    """Run all tests"""
    
    print("Testing Enhanced URL Validator CRA Fix")
    print("="*50)
    
    # Test 1: Full text enhancement
    test1_passed = await test_cra_url_correction()
    
    # Test 2: Individual URL validation
    test2_passed = await test_individual_url()
    
    print(f"\n📊 Test Results:")
    print(f"Full text enhancement: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    print(f"Individual URL validation: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    
    if test1_passed and test2_passed:
        print("\n🎉 All tests passed! The CRA URL fix is working correctly.")
    else:
        print("\n⚠️ Some tests failed. The fix may need adjustment.")

if __name__ == "__main__":
    asyncio.run(main())