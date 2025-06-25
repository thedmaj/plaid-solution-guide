#!/usr/bin/env python3
"""
Test cases for Admin Template Distribution Feature
Tests both frontend and backend functionality
"""

import requests
import json
import sys
from typing import Dict, List

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

class TemplateDistributionTester:
    def __init__(self):
        self.admin_token = None
        self.test_users = []
        self.test_template_id = None
        self.results = []
    
    def log_test(self, test_name: str, success: bool, message: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.results.append({"test": test_name, "success": success, "message": message})
        print(f"{status}: {test_name}")
        if message:
            print(f"    {message}")
        print()
    
    def admin_login(self) -> bool:
        """Test 1: Admin login"""
        try:
            response = requests.post(f"{BASE_URL}/token", data={
                "username": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get("access_token")
                self.log_test("Admin Login", True, f"Admin authenticated successfully")
                return True
            else:
                self.log_test("Admin Login", False, f"Login failed: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Admin Login", False, f"Login error: {str(e)}")
            return False
    
    def create_test_users(self) -> bool:
        """Test 2: Create test users for distribution"""
        try:
            test_users_data = [
                {"email": "user1@test.com", "name": "Test User 1", "password": "test123", "role": "user"},
                {"email": "user2@test.com", "name": "Test User 2", "password": "test123", "role": "user"},
                {"email": "user3@test.com", "name": "Test User 3", "password": "test123", "role": "user"}
            ]
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            created_count = 0
            
            for user_data in test_users_data:
                response = requests.post(
                    f"{BASE_URL}/api/admin/users",
                    json=user_data,
                    headers=headers
                )
                
                if response.status_code == 200:
                    user = response.json()
                    self.test_users.append(user)
                    created_count += 1
                elif response.status_code == 400 and "already registered" in response.text:
                    # User already exists, that's fine for testing
                    self.test_users.append({"email": user_data["email"], "id": "existing"})
                    created_count += 1
            
            if created_count == len(test_users_data):
                self.log_test("Create Test Users", True, f"Created/verified {created_count} test users")
                return True
            else:
                self.log_test("Create Test Users", False, f"Only created {created_count}/{len(test_users_data)} users")
                return False
                
        except Exception as e:
            self.log_test("Create Test Users", False, f"Error creating users: {str(e)}")
            return False
    
    def create_admin_template(self) -> bool:
        """Test 3: Create admin template for distribution"""
        try:
            template_data = {
                "name": "Admin Distribution Test Template",
                "description": "Template created by admin for distribution testing",
                "content": """# Test Template for Distribution
                
## Overview
{{ provide an overview of the solution }}

## Prerequisites  
{{ list any requirements }}

## Implementation Steps
{{ describe step-by-step implementation }}

## Testing
{{ explain how to test }}""",
                "template_type": "format",
                "tags": ["admin", "test", "distribution"]
            }
            
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(
                f"{BASE_URL}/api/templates/",
                json=template_data,
                headers=headers
            )
            
            if response.status_code == 200:
                template = response.json()
                self.test_template_id = template.get("id")
                self.log_test("Create Admin Template", True, f"Created template with ID: {self.test_template_id}")
                return True
            else:
                self.log_test("Create Admin Template", False, f"Failed to create template: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Create Admin Template", False, f"Error creating template: {str(e)}")
            return False
    
    def test_admin_distribution_endpoint(self) -> bool:
        """Test 4: Test the admin distribution endpoint"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(
                f"{BASE_URL}/api/templates/{self.test_template_id}/distribute",
                headers=headers
            )
            
            if response.status_code == 200:
                result = response.json()
                copied_users = result.get("copied_to_users", 0)
                total_users = result.get("total_users", 0)
                
                self.log_test("Admin Distribution Endpoint", True, 
                             f"Distributed to {copied_users}/{total_users} users")
                return copied_users > 0
            else:
                self.log_test("Admin Distribution Endpoint", False, 
                             f"Distribution failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Admin Distribution Endpoint", False, f"Error distributing: {str(e)}")
            return False
    
    def verify_user_received_templates(self) -> bool:
        """Test 5: Verify users received template copies"""
        try:
            verified_count = 0
            
            # Login as each test user and check if they have the template
            for user_data in self.test_users[:2]:  # Test first 2 users
                if user_data.get("id") == "existing":
                    continue
                    
                # Login as test user
                login_response = requests.post(f"{BASE_URL}/token", data={
                    "username": user_data["email"],
                    "password": "test123"
                })
                
                if login_response.status_code != 200:
                    continue
                
                user_token = login_response.json().get("access_token")
                user_headers = {"Authorization": f"Bearer {user_token}"}
                
                # Get user's templates
                templates_response = requests.get(
                    f"{BASE_URL}/api/templates/",
                    headers=user_headers
                )
                
                if templates_response.status_code == 200:
                    templates = templates_response.json().get("templates", [])
                    
                    # Look for the distributed template
                    found_template = False
                    for template in templates:
                        if "(Admin Copy)" in template.get("name", ""):
                            found_template = True
                            verified_count += 1
                            break
                    
                    if not found_template:
                        self.log_test("Verify User Templates", False, 
                                     f"User {user_data['email']} did not receive template copy")
                        return False
            
            if verified_count > 0:
                self.log_test("Verify User Templates", True, 
                             f"Verified {verified_count} users received template copies")
                return True
            else:
                self.log_test("Verify User Templates", False, "No users verified to have received templates")
                return False
                
        except Exception as e:
            self.log_test("Verify User Templates", False, f"Error verifying: {str(e)}")
            return False
    
    def test_non_admin_access_denied(self) -> bool:
        """Test 6: Verify non-admin users cannot access distribution endpoint"""
        try:
            if not self.test_users:
                self.log_test("Non-Admin Access Denied", False, "No test users available")
                return False
            
            # Login as a regular user
            user_data = self.test_users[0]
            if user_data.get("id") == "existing":
                user_data = {"email": "user1@test.com", "password": "test123"}
            
            login_response = requests.post(f"{BASE_URL}/token", data={
                "username": user_data["email"],
                "password": "test123"
            })
            
            if login_response.status_code != 200:
                self.log_test("Non-Admin Access Denied", False, "Could not login as test user")
                return False
            
            user_token = login_response.json().get("access_token")
            user_headers = {"Authorization": f"Bearer {user_token}"}
            
            # Try to access distribution endpoint
            response = requests.post(
                f"{BASE_URL}/api/templates/{self.test_template_id}/distribute",
                headers=user_headers
            )
            
            # Should get 403 Forbidden
            if response.status_code == 403:
                self.log_test("Non-Admin Access Denied", True, 
                             "Regular user correctly denied access to distribution endpoint")
                return True
            else:
                self.log_test("Non-Admin Access Denied", False, 
                             f"Regular user got unexpected response: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Non-Admin Access Denied", False, f"Error testing access: {str(e)}")
            return False
    
    def test_template_independence(self) -> bool:
        """Test 7: Verify template copies are independent (not references)"""
        try:
            # Login as a test user
            user_data = self.test_users[0] if self.test_users else {"email": "user1@test.com", "password": "test123"}
            
            login_response = requests.post(f"{BASE_URL}/token", data={
                "username": user_data["email"],
                "password": "test123"
            })
            
            if login_response.status_code != 200:
                self.log_test("Template Independence", False, "Could not login as test user")
                return False
            
            user_token = login_response.json().get("access_token")
            user_headers = {"Authorization": f"Bearer {user_token}"}
            
            # Get the distributed template
            templates_response = requests.get(f"{BASE_URL}/api/templates/", headers=user_headers)
            if templates_response.status_code != 200:
                self.log_test("Template Independence", False, "Could not get user templates")
                return False
            
            templates = templates_response.json().get("templates", [])
            user_template = None
            for template in templates:
                if "(Admin Copy)" in template.get("name", ""):
                    user_template = template
                    break
            
            if not user_template:
                self.log_test("Template Independence", False, "User does not have distributed template")
                return False
            
            # Modify the user's copy
            original_content = user_template["content"]
            modified_content = original_content + "\n\n## User Modified Section\nThis was added by the user"
            
            update_response = requests.put(
                f"{BASE_URL}/api/templates/{user_template['id']}",
                json={"content": modified_content},
                headers=user_headers
            )
            
            if update_response.status_code != 200:
                self.log_test("Template Independence", False, "Could not modify user template")
                return False
            
            # Verify admin's original template is unchanged
            admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
            admin_template_response = requests.get(
                f"{BASE_URL}/api/templates/{self.test_template_id}",
                headers=admin_headers
            )
            
            if admin_template_response.status_code == 200:
                admin_template = admin_template_response.json()
                if admin_template["content"] != original_content:
                    self.log_test("Template Independence", False, 
                                 "Admin template was affected by user modification")
                    return False
                else:
                    self.log_test("Template Independence", True, 
                                 "User modifications did not affect admin template - copies are independent")
                    return True
            else:
                self.log_test("Template Independence", False, "Could not verify admin template")
                return False
                
        except Exception as e:
            self.log_test("Template Independence", False, f"Error testing independence: {str(e)}")
            return False
    
    def cleanup_test_data(self) -> bool:
        """Test 8: Cleanup test data"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            cleanup_count = 0
            
            # Delete test template
            if self.test_template_id:
                delete_response = requests.delete(
                    f"{BASE_URL}/api/templates/{self.test_template_id}",
                    headers=headers
                )
                if delete_response.status_code == 200:
                    cleanup_count += 1
            
            # Note: We don't delete test users as they might be used for other tests
            # In a real scenario, you might want to clean them up too
            
            self.log_test("Cleanup Test Data", True, f"Cleaned up {cleanup_count} test items")
            return True
            
        except Exception as e:
            self.log_test("Cleanup Test Data", False, f"Error during cleanup: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all test cases"""
        print("🧪 Starting Admin Template Distribution Tests\n")
        print("=" * 60)
        
        tests = [
            self.admin_login,
            self.create_test_users,
            self.create_admin_template,
            self.test_admin_distribution_endpoint,
            self.verify_user_received_templates,
            self.test_non_admin_access_denied,
            self.test_template_independence,
            self.cleanup_test_data
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            else:
                # If a critical test fails, we might want to stop
                if test == self.admin_login:
                    print("❌ Critical test failed - stopping tests")
                    break
        
        print("=" * 60)
        print(f"\n📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Admin template distribution is working correctly.")
            return True
        else:
            print("⚠️  Some tests failed. Please check the implementation.")
            return False

def main():
    """Main test runner"""
    print("Admin Template Distribution Test Suite")
    print("Make sure the backend server is running on http://localhost:8000")
    print()
    
    tester = TemplateDistributionTester()
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()