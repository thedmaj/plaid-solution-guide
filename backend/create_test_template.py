#!/usr/bin/env python3
"""
Create a test Knowledge Template for testing the bypass functionality
"""

import asyncio
import json
import uuid
from datetime import datetime
import sqlite3

def create_test_knowledge_template():
    """Create a test Knowledge Template in the database"""
    
    # Sample Knowledge Template content
    template_content = """# Plaid Consumer Report (CRA Check) Integration Guide

## Overview
Plaid Check enables you to generate Consumer Reports for Credit Reporting Agency (CRA) use cases. This product allows you to access account data, transaction history, and generate comprehensive financial reports.

## Prerequisites
- {{List specific prerequisites for CRA Check}}
- Valid Plaid API credentials with CRA Check enabled
- User consent and legal compliance for consumer reporting

## Implementation Flow

### Step 1: Create Link Token for CRA Check
{{Generate Link token creation code with CRA Check configuration}}

### Step 2: Exchange Public Token
After Link completion:

```javascript
const response = await plaidClient.itemPublicTokenExchange({
  public_token: publicToken,
});
const accessToken = response.data.access_token;
```

### Step 3: Generate Consumer Report
{{Show how to call /cra/check_report/create endpoint}}

### Step 4: Retrieve Base Report
```javascript
const baseReport = await plaidClient.craCheckBaseReportGet({
  user_token: userToken,
});
```

## Key Features
- **Account Analysis**: {{Describe account analysis capabilities}}
- **Transaction History**: Comprehensive transaction data for specified period
- **Partner Insights**: Enhanced data through Prism partnership (optional)
- **PDF Generation**: Generate PDF reports for CRA submission

## Compliance Notes
- Ensure FCRA compliance for all consumer reporting use cases
- Obtain proper user consent before generating reports
- Follow data retention policies as per regulatory requirements

## Error Handling
{{Add comprehensive error handling guidance}}

## Next Steps
{{Provide guidance on next implementation steps}}"""

    template_data = {
        'id': str(uuid.uuid4()),
        'name': 'CRA Check Knowledge Template',
        'description': 'Expert knowledge template for implementing Plaid Consumer Report (CRA Check) with bypass functionality',
        'content': template_content,
        'template_type': 'knowledge',
        'tags': '["cra", "consumer report", "knowledge", "test"]',
        'user_id': 1,  # Assuming user ID 1 exists
        'created_at': datetime.utcnow().isoformat(),
        'last_modified': datetime.utcnow().isoformat()
    }
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect('plaid_guide.db')
        cursor = conn.cursor()
        
        # Insert the template
        cursor.execute("""
            INSERT INTO templates (id, name, description, content, template_type, tags, user_id, created_at, last_modified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            template_data['id'],
            template_data['name'],
            template_data['description'],
            template_data['content'],
            template_data['template_type'],
            template_data['tags'],
            template_data['user_id'],
            template_data['created_at'],
            template_data['last_modified']
        ))
        
        conn.commit()
        conn.close()
        
        print("✅ Test Knowledge Template created successfully!")
        print(f"Template ID: {template_data['id']}")
        print(f"Template Name: {template_data['name']}")
        print(f"Template Type: {template_data['template_type']}")
        
        return template_data['id']
        
    except Exception as e:
        print(f"❌ Error creating template: {e}")
        return None

def create_test_format_template():
    """Create a regular Format Template for comparison"""
    
    template_content = """# {{Product Name}} Integration Guide

## Overview
{{Brief description of the product and its use cases}}

## Prerequisites
- {{List required prerequisites}}
- Valid Plaid API credentials
- {{Additional setup requirements}}

## Implementation Steps

### Step 1: Setup
{{Detailed setup instructions}}

### Step 2: Integration
{{Core integration steps}}

### Step 3: Testing
{{Testing and verification steps}}

## Best Practices
{{Implementation best practices and tips}}

## Troubleshooting
{{Common issues and solutions}}"""

    template_data = {
        'id': str(uuid.uuid4()),
        'name': 'Generic Format Template',
        'description': 'Standard format template for comparison testing',
        'content': template_content,
        'template_type': 'format',
        'tags': '["format", "generic", "test"]',
        'user_id': 1,
        'created_at': datetime.utcnow().isoformat(),
        'last_modified': datetime.utcnow().isoformat()
    }
    
    try:
        conn = sqlite3.connect('plaid_guide.db')
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO templates (id, name, description, content, template_type, tags, user_id, created_at, last_modified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            template_data['id'],
            template_data['name'],
            template_data['description'],
            template_data['content'],
            template_data['template_type'],
            template_data['tags'],
            template_data['user_id'],
            template_data['created_at'],
            template_data['last_modified']
        ))
        
        conn.commit()
        conn.close()
        
        print("✅ Test Format Template created successfully!")
        print(f"Template ID: {template_data['id']}")
        print(f"Template Name: {template_data['name']}")
        print(f"Template Type: {template_data['template_type']}")
        
        return template_data['id']
        
    except Exception as e:
        print(f"❌ Error creating format template: {e}")
        return None

def main():
    print("Creating Test Templates for Knowledge Template Testing")
    print("=" * 60)
    
    knowledge_template_id = create_test_knowledge_template()
    print()
    format_template_id = create_test_format_template()
    
    print(f"\n📝 Templates Created:")
    print(f"Knowledge Template ID: {knowledge_template_id}")
    print(f"Format Template ID: {format_template_id}")
    
    print(f"\n🧪 Test Instructions:")
    print(f"1. Start the backend server")
    print(f"2. Open the frontend chat interface")
    print(f"3. Select the 'CRA Check Knowledge Template' from the dropdown")
    print(f"4. Send a message like 'How do I implement Consumer Report?'")
    print(f"5. Verify in logs that AskBill is bypassed (knowledge_template_used: true)")
    print(f"6. Compare with using the 'Generic Format Template' (should use AskBill)")

if __name__ == "__main__":
    main()