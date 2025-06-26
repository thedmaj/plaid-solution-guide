import logging
import os
from typing import List, Dict, Any, AsyncGenerator
import json
import random
import re
from datetime import datetime
import openai
from openai import OpenAI

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def query_openai(messages: List[Dict[str, Any]], system_prompt: str = None):
    """
    Query OpenAI's API with a list of messages
    
    Args:
        messages: List of message dictionaries with 'role' and 'content'
        system_prompt: Optional system prompt to prepend
        
    Returns:
        Dict with completion content
    """
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Format messages for OpenAI API
        openai_messages = []
        
        # Add system prompt if provided
        if system_prompt:
            openai_messages.append({"role": "system", "content": system_prompt})
        
        # Convert messages to OpenAI format
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            
            # Map message roles to OpenAI roles
            if role == "assistant":
                openai_role = "assistant"
            else:
                openai_role = "user"
                
            openai_messages.append({"role": openai_role, "content": content})
        
        model_name = os.getenv("OPENAI_MODEL", "gpt-4")
        max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "4000"))
        temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.3"))
        
        logger.info(f"Sending request to OpenAI with model: {model_name}")
        
        response = client.chat.completions.create(
            model=model_name,
            messages=openai_messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        completion_content = response.choices[0].message.content
        
        logger.info(f"Received response from OpenAI: {len(completion_content)} characters")
        
        return {"completion": completion_content}
        
    except openai.AuthenticationError as e:
        logger.error(f"OpenAI authentication error: {e}")
        return {"error": f"Authentication error: {str(e)}"}
    except openai.RateLimitError as e:
        logger.error(f"OpenAI rate limit error: {e}")
        return {"error": f"Rate limit exceeded: {str(e)}"}
    except openai.APIError as e:
        logger.error(f"OpenAI API error: {e}")
        return {"error": f"API error: {str(e)}"}
    except Exception as e:
        logger.error(f"Unexpected error querying OpenAI: {e}")
        return {"error": f"Unexpected error: {str(e)}"}

def generate_mock_response(messages: List[Dict[str, Any]]) -> Dict[str, str]:
    """
    Generate mock responses for development/testing without hitting OpenAI API
    """
    if not messages:
        return {"completion": "I'm ready to help you with Plaid integration!"}
    
    last_message = messages[-1].get("content", "").lower()
    
    # Link integration responses
    if any(keyword in last_message for keyword in ["link", "frontend", "integration", "button"]):
        return {"completion": """# Plaid Link Integration Guide

## Overview
Plaid Link is a drop-in module that provides a secure, elegant authentication flow for each institution that Plaid supports.

## Frontend Integration

### 1. Install Plaid Link
```bash
npm install react-plaid-link
```

### 2. Basic Implementation
```javascript
import { PlaidLink } from 'react-plaid-link';

const LinkButton = () => {
  const onSuccess = (public_token, metadata) => {
    // Send public_token to your server
    console.log('Public token:', public_token);
    console.log('Metadata:', metadata);
  };

  return (
    <PlaidLink
      clientName="Your App Name"
      env="sandbox" // Use 'production' for live
      product={['auth', 'transactions']}
      publicKey="your_public_key"
      onSuccess={onSuccess}
    >
      Connect a bank account
    </PlaidLink>
  );
};
```

### 3. Exchange Public Token
On your backend, exchange the public token for an access token:

```javascript
const plaid = require('plaid');
const client = new plaid.PlaidApi(configuration);

const exchangeRequest = {
  public_token: public_token,
};

const response = await client.itemPublicTokenExchange(exchangeRequest);
const access_token = response.data.access_token;
```

## Next Steps
- Store the access_token securely
- Use it to make API calls to retrieve account data
- Implement webhook endpoints for real-time updates"""}
    
    # Webhook responses
    if any(keyword in last_message for keyword in ["webhook", "notification", "update", "real-time"]):
        return {"completion": """# Plaid Webhook Implementation Guide

## Overview
Webhooks allow Plaid to send real-time notifications to your application when data changes.

## Webhook Endpoint Setup

### 1. Create Webhook Endpoint
```javascript
app.post('/plaid/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const webhook = req.body;
  
  switch (webhook.webhook_type) {
    case 'TRANSACTIONS':
      handleTransactionWebhook(webhook);
      break;
    case 'ITEM':
      handleItemWebhook(webhook);
      break;
    case 'AUTH':
      handleAuthWebhook(webhook);
      break;
    default:
      console.log('Unknown webhook type:', webhook.webhook_type);
  }
  
  res.json({acknowledged: true});
});
```

### 2. Transaction Updates
```javascript
const handleTransactionWebhook = (webhook) => {
  const { item_id, new_transactions, removed_transactions } = webhook;
  
  if (webhook.webhook_code === 'DEFAULT_UPDATE') {
    console.log(`${new_transactions} new transactions for item ${item_id}`);
    // Fetch new transactions using /transactions/get
  }
  
  if (webhook.webhook_code === 'TRANSACTIONS_REMOVED') {
    console.log(`${removed_transactions.length} transactions removed`);
    // Remove transactions from your database
  }
};
```

### 3. Configure Webhook URL
```javascript
const request = {
  access_token: access_token,
  webhook: 'https://yourdomain.com/plaid/webhook'
};

const response = await client.itemWebhookUpdate(request);
```

## Security
- Verify webhook signatures in production
- Use HTTPS for webhook URLs
- Implement idempotency for webhook processing"""}
    
    # Auth/Identity responses
    if any(keyword in last_message for keyword in ["auth", "identity", "verification", "kyc"]):
        return {"completion": """# Auth + Identity Integration Guide

## Overview
Combine Plaid's Auth and Identity products for comprehensive account verification and KYC compliance.

## Implementation Steps

### 1. Link Configuration
```javascript
const config = {
  clientName: 'Your App',
  env: 'sandbox',
  product: ['auth', 'identity'], // Both products
  countryCodes: ['US'],
  onSuccess: handleLinkSuccess
};
```

### 2. Retrieve Auth Data
```javascript
const getAuthData = async (access_token) => {
  const request = { access_token };
  
  const authResponse = await client.authGet(request);
  const accounts = authResponse.data.accounts;
  const numbers = authResponse.data.numbers;
  
  return {
    accounts: accounts.map(account => ({
      account_id: account.account_id,
      name: account.name,
      type: account.type,
      subtype: account.subtype,
      mask: account.mask
    })),
    routing_numbers: numbers.ach,
    account_numbers: numbers.ach
  };
};
```

### 3. Retrieve Identity Data
```javascript
const getIdentityData = async (access_token) => {
  const request = { access_token };
  
  const identityResponse = await client.identityGet(request);
  const identity = identityResponse.data.accounts[0].owners[0];
  
  return {
    name: identity.names[0],
    address: identity.addresses[0],
    phone: identity.phone_numbers[0],
    email: identity.emails[0]
  };
};
```

### 4. Verification Workflow
```javascript
const performKYC = async (access_token) => {
  try {
    const [authData, identityData] = await Promise.all([
      getAuthData(access_token),
      getIdentityData(access_token)
    ]);
    
    // Verify account ownership
    const accountVerified = verifyAccountOwnership(authData, identityData);
    
    // Perform additional KYC checks
    const kycResult = await performKYCChecks(identityData);
    
    return {
      verified: accountVerified && kycResult.passed,
      authData,
      identityData,
      kycResult
    };
  } catch (error) {
    console.error('KYC verification failed:', error);
    throw error;
  }
};
```

## Best Practices
- Always verify account ownership before proceeding
- Store PII securely and comply with data protection regulations
- Implement proper error handling for failed verifications
- Use webhooks to monitor account changes"""}

    # Transaction responses
    if any(keyword in last_message for keyword in ["transaction", "history", "categorization"]):
        return {"completion": """# Transaction Data Integration Guide

## Overview
Access and categorize transaction data from user accounts with Plaid's Transactions API.

## Implementation

### 1. Fetch Transactions
```javascript
const getTransactions = async (access_token, start_date, end_date) => {
  const request = {
    access_token,
    start_date, // 'YYYY-MM-DD'
    end_date,   // 'YYYY-MM-DD'
    count: 500,
    offset: 0
  };
  
  const response = await client.transactionsGet(request);
  return response.data;
};
```

### 2. Process Transactions
```javascript
const processTransactions = (transactionData) => {
  const { transactions, accounts } = transactionData;
  
  return transactions.map(txn => ({
    id: txn.transaction_id,
    account_id: txn.account_id,
    amount: txn.amount,
    date: txn.date,
    name: txn.name,
    merchant: txn.merchant_name,
    category: txn.category,
    subcategory: txn.category[txn.category.length - 1],
    type: txn.amount > 0 ? 'debit' : 'credit'
  }));
};
```

### 3. Categorization
```javascript
const categorizeBudget = (transactions) => {
  const budget = {};
  
  transactions.forEach(txn => {
    const category = txn.category[0]; // Primary category
    if (!budget[category]) {
      budget[category] = { spent: 0, count: 0 };
    }
    
    if (txn.amount > 0) { // Positive amount = outgoing
      budget[category].spent += txn.amount;
      budget[category].count += 1;
    }
  });
  
  return budget;
};
```

### 4. Real-time Updates
```javascript
// Webhook handler for transaction updates
const handleTransactionWebhook = async (webhook) => {
  const { item_id, new_transactions } = webhook;
  
  if (new_transactions > 0) {
    // Fetch new transactions
    const latest = await getTransactions(
      access_token,
      getLastSyncDate(item_id),
      new Date().toISOString().split('T')[0]
    );
    
    // Update your database
    await updateTransactionDatabase(latest.transactions);
    
    // Notify user of new transactions
    await notifyUser(item_id, new_transactions);
  }
};
```

## Advanced Features
- Custom categorization rules
- Duplicate detection
- Spending insights and analytics
- Transaction search and filtering"""}

    # Default response for other queries
    mock_responses = [
        "I can help you with Plaid API integration. What specific aspect would you like to focus on?",
        "For Plaid implementation, I recommend starting with Link integration. Would you like a step-by-step guide?",
        "Plaid offers several products: Auth, Identity, Transactions, Assets, and more. Which one interests you?",
        "I can provide guidance on Plaid webhook setup, API integration, or frontend implementation. What would be most helpful?",
        "Let me know if you need help with Plaid Link, transaction data, account verification, or any other Plaid feature."
    ]
    
    return {"completion": random.choice(mock_responses)}

def simulate_askbill_query(query: str, context: List[str]) -> str:
    """
    Simulate AskBill MCP server responses for development
    """
    query_lower = query.lower()
    
    if "link" in query_lower and "integration" in query_lower:
        return """
# Plaid Link Integration Documentation

## Overview
Plaid Link is a client-side component that your users interact with in order to connect their bank accounts to your app.

## Quick Start
1. Install the Plaid Link SDK for your platform
2. Configure your Link token endpoint
3. Initialize Link with your configuration
4. Handle the onSuccess callback

## Frontend Integration
For web applications, use the react-plaid-link package or vanilla JavaScript Link library.

## Backend Integration
Exchange the public_token received from Link for an access_token using the /item/public_token/exchange endpoint.

## Error Handling
Implement proper error handling for Link exit events and API errors.

For detailed implementation examples, see the Plaid documentation at https://plaid.com/docs/link/
"""
    
    elif "webhook" in query_lower:
        return """
# Plaid Webhooks Documentation

## Overview
Webhooks allow Plaid to send notifications to your application when data changes.

## Webhook Types
- TRANSACTIONS: New transaction data is available
- ITEM: Item-related events (errors, updates)
- AUTH: Authentication verification events

## Implementation
1. Create a webhook endpoint in your application
2. Register the webhook URL with Plaid
3. Verify webhook signatures for security
4. Process webhook events appropriately

## Best Practices
- Implement idempotency
- Use HTTPS for webhook URLs
- Handle webhook retries properly
- Log all webhook events for debugging

For more details, visit https://plaid.com/docs/api/webhooks/
"""
    
    elif "auth" in query_lower or "identity" in query_lower:
        return """
# Plaid Auth and Identity Documentation

## Auth Product
The Auth product provides account and routing numbers for ACH transfers and payments.

## Identity Product
The Identity product returns account holder information including names, addresses, phone numbers, and email addresses.

## Common Use Cases
- Account verification for ACH payments
- KYC (Know Your Customer) compliance
- Identity verification workflows
- Account ownership verification

## API Endpoints
- /auth/get: Retrieve account and routing numbers
- /identity/get: Retrieve account holder identity information

## Integration Notes
- Both products require user consent through Link
- Data availability varies by institution
- Implement proper error handling for incomplete data

For comprehensive guides, see https://plaid.com/docs/auth/ and https://plaid.com/docs/identity/
"""
    
    else:
        return f"""
# Plaid API Documentation Response

Based on your query about "{query}", here are the relevant resources:

## General Information
Plaid provides a unified API to connect with thousands of financial institutions.

## Key Products
- Link: Account connection interface
- Auth: Account and routing numbers
- Identity: Account holder information  
- Transactions: Transaction history and data
- Assets: Asset and income verification
- Liabilities: Loan and liability data

## Getting Started
1. Sign up for a Plaid account
2. Get your API keys (client_id and secret)
3. Choose your products and integration approach
4. Implement Link for account connection
5. Use API endpoints to retrieve data

## Resources
- API Reference: https://plaid.com/docs/api/
- Quickstart Guide: https://plaid.com/docs/quickstart/
- Libraries: Available for multiple programming languages

For specific implementation guidance, please provide more details about your use case.
"""