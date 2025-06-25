# URL Validation and Correction System for AskBill Responses

This comprehensive system validates and corrects URLs in AskBill responses using multiple validation layers:
- ✅ **Pattern-based validation** (instant)
- 🔧 **Automatic corrections** for common issues  
- 🌐 **Live URL checking** with caching
- 🤖 **Claude-powered intelligent corrections**
- 📊 **Analytics and monitoring**

## Installation

1. **Install dependencies:**
```bash
pip install -r url_validator_requirements.txt
```

2. **Test the validator:**
```bash
python test_url_validator.py
```

3. **See integration demo:**
```bash
python claude_integration_example.py
```

## Configuration

Add to your Claude MCP configuration:

```json
{
  "mcpServers": {
    "askbill": {
      "command": "python",
      "args": ["/path/to/askbill_mcp_server.py"]
    },
    "url-validator": {
      "command": "python",
      "args": ["/path/to/url_validator_mcp.py"]
    }
  }
}
```

## Usage

The MCP server provides two main tools:

### 1. `validate_and_clean_text`
Cleans URLs in text content:
```python
# Input text with mixed URLs
text = "Check https://plaid.com/docs/api/auth and https://invalid-site.com"

# Output: 
# "Check https://plaid.com/docs/api/products/auth/* and "
# (corrected URL marked with *, invalid URL removed)
```

### 2. `validate_url_list`
Validates a list of URLs and returns detailed results.

## URL Correction Patterns

### Plaid-Specific Corrections
- `https://plaid.com/docs/api/auth` → `https://plaid.com/docs/api/products/auth/`
- `https://plaid.com/docs/identity` → `https://plaid.com/docs/api/products/identity/`
- Missing trailing slashes are added
- Common path variations are tried

### Generic Corrections
- Trailing slash variations (`/path` ↔ `/path/`)
- API version paths (`/api/` → `/api/v1/`, `/api/v2/`)
- Documentation path variations (`/docs/` ↔ `/documentation/`)

## Example Workflow

```python
# 1. AskBill generates response with URLs
askbill_response = """
For Plaid Auth, see:
- https://plaid.com/docs/api/auth (invalid)
- https://plaid.com/docs/api/products/auth/ (valid)
- https://broken-site.com/docs (invalid)
"""

# 2. Claude calls URL validator
cleaned_text, summary = await clean_text_urls(askbill_response)

# 3. Result:
"""
For Plaid Auth, see:
- https://plaid.com/docs/api/products/auth/* (corrected)
- https://plaid.com/docs/api/products/auth/ (valid)
(invalid URL removed)
"""
```

## Benefits

1. **Automatic URL Quality Control**: No broken links reach users
2. **Smart Corrections**: Common URL patterns are automatically fixed
3. **Clear Indicators**: `*` suffix shows which URLs were corrected
4. **Seamless Integration**: Works transparently with existing AskBill workflow
5. **Performance**: Efficient async validation with timeouts

## Monitoring

The validator provides detailed summaries:
- Total URLs processed
- Valid URLs (unchanged)
- Corrected URLs (marked with *)
- Invalid URLs (removed)
- Specific corrections made

This ensures you can monitor URL quality and adjust correction patterns as needed.