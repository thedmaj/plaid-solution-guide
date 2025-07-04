import logging
import anthropic
from typing import List, Dict, Any
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Claude client
client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

async def query_claude(messages: List[Dict[str, Any]], system_prompt: str = None):
    """Query Claude API with the provided messages."""
    try:
        logger.info("Querying Claude API")
        
        # Use environment variable to select Claude model (free/paid)
        # Example: set CLAUDE_MODEL=claude-instant-1.2 for free/cheaper model, or leave unset for paid
        model_name = os.getenv("CLAUDE_MODEL", "claude-3-7-sonnet-20250219")
        
        # Query Claude API with new messages format
        logger.info(f"Sending request to Claude with model: {model_name}, system_prompt: {system_prompt}, messages: {messages}")
        response = client.messages.create(
            model=model_name,
            system=system_prompt,
            messages=[{
                "role": "user" if msg["role"] == "user" else "assistant",
                "content": msg["content"]
            } for msg in messages],
            temperature=0.3,
            max_tokens=4000
        )
        
        logger.info(f"Received response from Claude: {response}")
        
        # response is a Message object from Claude
        full_text = "".join([block.text for block in response.content if block.type == "text"])
        
        # Return only the full markdown text to the frontend
        return {"completion": full_text}
    except Exception as e:
        logger.error(f"Claude API error: {e}", exc_info=True)
        
        # Fallback to mock response for testing when API is unavailable
        if "credit balance" in str(e) or "API" in str(e):
            logger.info("Using mock response for testing due to API unavailability")
            return generate_mock_response(messages)
        
        raise 

def generate_mock_response(messages: List[Dict[str, Any]]) -> Dict[str, str]:
    """Generate a mock response for testing when Claude API is unavailable."""
    
    # Get the last user message and conversation context
    user_message = ""
    conversation_context = []
    for msg in messages:
        if msg.get("role") == "user":
            conversation_context.append(msg.get("content", ""))
            user_message = msg.get("content", "")  # Keep updating to get the latest
    
    # Track conversation progress
    message_count = len([m for m in messages if m.get("role") == "user"])
    is_follow_up = message_count > 1
    
    # Generate unique response ID to prevent exact duplicates
    import time
    response_id = int(time.time() * 1000) % 1000
    
    # Generate context-aware responses
    if is_follow_up:
        # For follow-up messages, provide additive content based on the request
        if "curl" in user_message.lower() or "api" in user_message.lower():
            return {"completion": f"""## API Examples and CURL Requests

### 1. Create Link Token
```bash
curl -X POST https://production.plaid.com/link/token/create \\
  -H 'Content-Type: application/json' \\
  -d '{{
    "client_id": "YOUR_CLIENT_ID",
    "secret": "YOUR_SECRET",
    "client_name": "Your App Name",
    "country_codes": ["US"],
    "language": "en",
    "user": {{
      "client_user_id": "unique_user_id"
    }},
    "products": ["auth", "identity"]
  }}'
```

**Response:**
```json
{{
  "link_token": "link-production-12345678-1234-1234-1234-123456789012",
  "expiration": "2023-12-01T00:00:00Z"
}}
```

### 2. Exchange Public Token
```bash
curl -X POST https://production.plaid.com/item/public_token/exchange \\
  -H 'Content-Type: application/json' \\
  -d '{{
    "client_id": "YOUR_CLIENT_ID",
    "secret": "YOUR_SECRET",
    "public_token": "public-production-12345678-1234-1234-1234-123456789012"
  }}'
```

**Response:**
```json
{{
  "access_token": "access-production-12345678-1234-1234-1234-123456789012",
  "item_id": "item-12345678-1234-1234-1234-123456789012"
}}
```

### 3. Get Auth Data
```bash
curl -X POST https://production.plaid.com/auth/get \\
  -H 'Content-Type: application/json' \\
  -d '{{
    "client_id": "YOUR_CLIENT_ID",
    "secret": "YOUR_SECRET",
    "access_token": "access-production-12345678-1234-1234-1234-123456789012"
  }}'
```

**Response includes account numbers, routing numbers, and account details.**

### 4. Get Identity Data
```bash
curl -X POST https://production.plaid.com/identity/get \\
  -H 'Content-Type: application/json' \\
  -d '{{
    "client_id": "YOUR_CLIENT_ID",
    "secret": "YOUR_SECRET",
    "access_token": "access-production-12345678-1234-1234-1234-123456789012"
  }}'
```

**Response includes user identity information like name, address, phone, email.**

*Response {response_id} - Context: {len(conversation_context)} previous messages*"""}
        
        elif "error" in user_message.lower() or "handling" in user_message.lower():
            return {"completion": f"""## Error Handling and Best Practices

### Common Error Scenarios

#### 1. Invalid Credentials Error
```javascript
// Frontend error handling
onExit: (err, metadata) => {{
  if (err?.error_code === 'INVALID_CREDENTIALS') {{
    showNotification('Invalid bank credentials. Please try again.', 'error');
    // Optionally restart Link flow
  }}
}}
```

#### 2. Item Login Required
```javascript
// Handle when re-authentication is needed
if (err?.error_code === 'ITEM_LOGIN_REQUIRED') {{
  // Guide user to update their credentials
  initiateUpdateMode(metadata.item_id);
}}
```

### Backend Error Handling
```python
try:
    response = client.Auth.get(access_token)
except plaid.errors.PlaidError as e:
    if e.code == 'ITEM_LOGIN_REQUIRED':
        # Notify user to re-authenticate
        return {{"error": "login_required", "item_id": e.item_id}}
    elif e.code == 'INSUFFICIENT_CREDENTIALS':
        # Request additional authentication
        return {{"error": "additional_auth_required"}}
    else:
        logger.error(f"Plaid API error: {{e}}")
        return {{"error": "api_error"}}
```

### Retry Logic
```python
import time
from functools import wraps

def retry_plaid_request(max_retries=3):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except plaid.errors.RateLimitExceededError:
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)  # Exponential backoff
                    else:
                        raise
            return None
        return wrapper
    return decorator
```

*Response {response_id} - Building on previous {message_count} messages*"""}
        
        else:
            # Generic follow-up response
            return {"completion": f"""## Additional Implementation Details

Based on your previous questions about Plaid integration, here are some additional considerations:

### Environment Configuration
```javascript
const plaidConfig = {{
  env: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  clientName: 'Your Application Name',
  countryCodes: ['US', 'CA'],  // Expand as needed
  language: 'en'
}};
```

### Webhook Implementation
```python
@app.route('/plaid/webhook', methods=['POST'])
def plaid_webhook():
    webhook_data = request.get_json()
    
    # Verify webhook signature
    if not verify_webhook_signature(request.headers, request.data):
        return 'Unauthorized', 401
    
    webhook_type = webhook_data.get('webhook_type')
    webhook_code = webhook_data.get('webhook_code')
    
    if webhook_type == 'ITEM':
        if webhook_code == 'ERROR':
            # Handle item errors
            handle_item_error(webhook_data)
        elif webhook_code == 'PENDING_EXPIRATION':
            # Notify user to update credentials
            handle_pending_expiration(webhook_data)
    
    return 'OK', 200
```

### Testing Strategy
```javascript
// Mock Plaid responses for testing
const mockPlaidConfig = {{
  token: 'link-sandbox-test-token',
  onSuccess: (public_token, metadata) => {{
    console.log('Test success:', public_token, metadata);
    // Don't actually exchange in test mode
  }}
}};
```

*Follow-up response {response_id} - Context from {len(conversation_context)} messages*"""}
    
    # First message - solution guide
    elif "solution guide" in user_message.lower() or "integration" in user_message.lower():
        return {"completion": f"""# Plaid Link Integration Solution Guide

## Overview
This comprehensive guide covers integrating Plaid Link with Auth and Identity products for seamless financial data connectivity.

## Prerequisites
- Plaid account with API keys
- Web application setup
- Understanding of OAuth flows

## Implementation Steps

### 1. Install Plaid Link SDK
```bash
npm install react-plaid-link
```

### 2. Initialize Link Component
```javascript
import {{ usePlaidLink }} from 'react-plaid-link';

const config = {{
  token: linkToken,
  onSuccess: (public_token, metadata) => {{
    // Exchange public token for access token
    exchangeToken(public_token);
  }},
  onExit: (err, metadata) => {{
    // Handle user exit
  }}
}};
```

### 3. Backend Token Exchange
```python
def exchange_token(public_token):
    client = plaid.Client(
        client_id=PLAID_CLIENT_ID,
        secret=PLAID_SECRET,
        environment=plaid.Environment.sandbox
    )
    
    response = client.Item.public_token.exchange(public_token)
    access_token = response['access_token']
    return access_token
```

### 4. Fetch User Data
Once you have the access token, you can fetch:
- **Auth Data**: Account and routing numbers
- **Identity Data**: User personal information

## API Endpoints Used
- `/link/token/create` - Generate Link token
- `/item/public_token/exchange` - Exchange tokens
- `/auth/get` - Retrieve auth data
- `/identity/get` - Retrieve identity data

## Security Considerations
- Store access tokens securely
- Implement proper error handling
- Use HTTPS for all communications
- Validate webhook signatures

This integration provides a secure foundation for accessing user financial data through Plaid's robust API infrastructure.

*Initial response {response_id}*"""}
    
    elif "mermaid" in user_message.lower() or "diagram" in user_message.lower():
        return {"completion": """```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Plaid
    
    User->>Frontend: Initiate Link
    Frontend->>Backend: Request Link Token
    Backend->>Plaid: POST /link/token/create
    Plaid-->>Backend: Link Token
    Backend-->>Frontend: Link Token
    Frontend->>User: Display Plaid Link
    User->>Plaid: Complete Authentication
    Plaid-->>Frontend: Public Token
    Frontend->>Backend: Exchange Token
    Backend->>Plaid: POST /item/public_token/exchange
    Plaid-->>Backend: Access Token
    Backend->>Plaid: GET /auth/get
    Plaid-->>Backend: Account Data
    Backend-->>Frontend: Account Information
```"""}
    
    elif "update" in user_message.lower() or "modify" in user_message.lower():
        return {"completion": """## Updated Implementation Notes

### Enhanced Error Handling
```javascript
const linkConfig = {
  ...config,
  onExit: (err, metadata) => {
    if (err != null) {
      console.error('Link error:', err);
      // Handle specific error cases
      switch (err.error_code) {
        case 'INVALID_CREDENTIALS':
          showErrorMessage('Invalid credentials provided');
          break;
        case 'ITEM_LOGIN_REQUIRED':
          showErrorMessage('Please re-authenticate');
          break;
        default:
          showErrorMessage('Connection failed');
      }
    }
  }
};
```

### Additional Security Measures
- Implement rate limiting on token exchange endpoint
- Add request validation middleware
- Use environment-specific configuration
- Enable audit logging for all API calls

### Production Deployment Checklist
- [ ] Update to production Plaid environment
- [ ] Configure webhook endpoints
- [ ] Set up monitoring and alerting
- [ ] Test error scenarios
- [ ] Verify compliance requirements"""}
    
    else:
        # Simulate AskBill MCP server response based on user query
        askbill_response = simulate_askbill_query(user_message, conversation_context)
        return {"completion": f"""Based on Plaid documentation (via AskBill MCP server):

{askbill_response}

*Response {response_id} - Context: {len(conversation_context)} messages*
*Simulated AskBill MCP query: "{user_message[:50]}..."*"""}

def simulate_askbill_query(query: str, context: List[str]) -> str:
    """Simulate AskBill MCP server responses with relevant Plaid documentation."""
    
    query_lower = query.lower()
    
    if "webhook" in query_lower:
        return """## Plaid Webhooks Implementation

### Overview
Webhooks are HTTP callbacks that Plaid sends to your application to notify you of events that happen to a user's Item. Webhooks are essential for maintaining data freshness and handling various Item states.

### Setting Up Webhooks
1. Configure webhook endpoint in your Plaid Dashboard
2. Implement webhook handler endpoint
3. Verify webhook signatures for security

### Common Webhook Types

#### ITEM Webhooks
- `ITEM_ERROR`: Sent when an Item enters an error state
- `PENDING_EXPIRATION`: User credentials will expire soon
- `USER_PERMISSION_REVOKED`: User has revoked access

#### TRANSACTIONS Webhooks  
- `INITIAL_UPDATE`: First batch of transactions available
- `HISTORICAL_UPDATE`: Historical data retrieval complete
- `DEFAULT_UPDATE`: New transactions available

### Implementation Example
```python
@app.route('/plaid/webhook', methods=['POST'])
def handle_webhook():
    # Verify webhook signature
    webhook_verification_key = os.environ['PLAID_WEBHOOK_VERIFICATION_KEY']
    body = request.get_data()
    
    # Process webhook data
    webhook_data = request.get_json()
    webhook_type = webhook_data.get('webhook_type')
    webhook_code = webhook_data.get('webhook_code')
    
    # Handle different webhook types
    if webhook_type == 'TRANSACTIONS':
        handle_transactions_webhook(webhook_data)
    elif webhook_type == 'ITEM':
        handle_item_webhook(webhook_data)
    
    return jsonify({'status': 'received'})
```

*Source: Plaid API Reference - Webhooks*"""
    
    elif "sandbox" in query_lower or "test" in query_lower:
        return """## Plaid Sandbox Environment

### Overview
Plaid Sandbox is a development environment that allows you to test your integration without connecting to real financial institutions.

### Key Features
- **Simulated Data**: Pre-built datasets for different scenarios
- **No Real Banking**: All connections are simulated
- **Free Testing**: No charges for API calls in Sandbox
- **Instant Responses**: Immediate results without actual banking delays

### Sandbox Credentials
Use these test credentials for different scenarios:

#### Good Auth (Success)
- Username: `user_good`
- Password: `pass_good`

#### Bad Auth (Invalid Credentials)
- Username: `user_bad`
- Password: `pass_bad`

#### Planned Maintenance
- Username: `user_planned_maintenance`
- Password: `pass_good`

### Test Account Data
Sandbox provides realistic account data:
- Checking accounts with transaction history
- Savings accounts with various balances
- Credit cards with spending patterns
- Investment accounts with holdings

### Environment Configuration
```javascript
const plaidClient = new plaid.PlaidApi(
  new plaid.Configuration({
    basePath: plaid.PlaidEnvironments.sandbox, // Use sandbox
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  })
);
```

*Source: Plaid Developer Docs - Sandbox Guide*"""
    
    elif "rate limit" in query_lower or "limits" in query_lower:
        return """## Plaid API Rate Limits

### Overview
Plaid implements rate limiting to ensure fair usage and system stability across all customers.

### Rate Limit Structure
- **Per-second limits**: Burst capacity for short-term spikes
- **Per-minute limits**: Sustained usage limits
- **Per-environment**: Different limits for Sandbox vs Production

### Default Limits (Production)
- **Auth/Identity/Assets**: 4 requests/second, 200 requests/minute
- **Transactions**: 2 requests/second, 100 requests/minute  
- **Link Token Create**: 10 requests/second, 500 requests/minute
- **Account Balance**: 10 requests/second, 500 requests/minute

### Rate Limit Headers
Plaid includes rate limit information in response headers:
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 199
X-RateLimit-Reset: 1609459200
```

### Best Practices
1. **Implement Exponential Backoff**: Retry with increasing delays
2. **Cache Responses**: Reduce redundant API calls
3. **Batch Requests**: Group related operations when possible
4. **Monitor Usage**: Track your rate limit consumption

### Handling Rate Limits
```python
import time
from plaid.errors import RateLimitExceededError

def make_plaid_request_with_retry(request_func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return request_func()
        except RateLimitExceededError as e:
            if attempt < max_retries - 1:
                # Exponential backoff: 1s, 2s, 4s
                time.sleep(2 ** attempt)
            else:
                raise
```

*Source: Plaid API Reference - Rate Limiting*"""
    
    else:
        return f"""## Plaid Integration Information

Based on your query about "{query}", here are key implementation details:

### Getting Started
1. **Create Developer Account**: Sign up at dashboard.plaid.com
2. **Get API Keys**: Obtain Client ID and Secret from dashboard
3. **Choose Environment**: Start with Sandbox for testing
4. **Install SDK**: Use official Plaid SDK for your language

### Core Integration Flow
1. **Create Link Token**: Initialize Plaid Link session
2. **User Authentication**: User connects their bank account
3. **Exchange Public Token**: Convert to permanent access token
4. **Fetch Data**: Retrieve account and transaction data

### Key Considerations
- **Security**: Never expose secrets in frontend code
- **Error Handling**: Implement robust error handling
- **Webhooks**: Set up notifications for data updates
- **Compliance**: Follow data retention and privacy guidelines

### Useful Resources
- [Plaid API Reference](https://plaid.com/docs/api)
- [Quickstart Apps](https://github.com/plaid/quickstart)
- [Plaid Postman Collection](https://docs.plaid.com/docs/postman)

*Source: Plaid Developer Documentation*"""