# Format Template Logic - Mermaid Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI as Frontend UI
    participant Backend
    participant TemplateEngine as Template Engine
    participant AskBill as AskBill MCP
    participant Claude as Claude AI
    participant Artifact as Artifact System

    Note over User, Artifact: Format Template Flow - Solution Guide Override

    User->>UI: Select "Format Template"
    User->>UI: Choose "Solution Guide Template"
    User->>UI: Enter request message
    UI->>Backend: Send request with format template

    Backend->>TemplateEngine: Check template type
    TemplateEngine->>TemplateEngine: Identify "Format Template"
    
    alt Format Template Selected
        TemplateEngine->>TemplateEngine: Check if default system template
        
        alt Default System Template (Solution Guide)
            Note over TemplateEngine: Override structure with format template
            TemplateEngine->>TemplateEngine: Load format template structure
            TemplateEngine->>AskBill: Query for current Plaid documentation
            AskBill-->>TemplateEngine: Return latest docs/APIs
            TemplateEngine->>TemplateEngine: Apply format structure to content
            TemplateEngine->>Claude: Send formatted content + structure
        else Other Format Template
            TemplateEngine->>TemplateEngine: Apply custom format template
            TemplateEngine->>AskBill: Query for relevant documentation
            AskBill-->>TemplateEngine: Return docs
            TemplateEngine->>Claude: Send formatted content
        end
    else Knowledge Template
        Note over TemplateEngine: Use expert knowledge path
        TemplateEngine->>Claude: Send expert knowledge template
    else No Template
        Note over TemplateEngine: Standard AskBill query path
        TemplateEngine->>AskBill: Query documentation
        AskBill-->>TemplateEngine: Return docs
        TemplateEngine->>Claude: Send raw content
    end

    Claude->>Claude: Generate solution guide
    Claude-->>Backend: Return generated content
    Backend->>Artifact: Create/Update artifact
    Artifact-->>Backend: Confirm artifact created
    Backend-->>UI: Return response + artifact
    UI->>UI: Display in chat + artifact panel
    UI-->>User: Show formatted solution guide
```

## Key Logic Points:

1. **Format Template Detection**: System identifies when a format template is selected
2. **Default System Template Check**: Special handling for "Solution Guide" template
3. **Structure Override**: Format template structure overrides default system layout
4. **Content Sourcing**: Still queries AskBill for current documentation
5. **Formatted Processing**: Content is structured according to format template before sending to Claude
6. **Final Generation**: Claude generates the solution guide with the imposed structure
7. **Artifact Creation**: Result is displayed in both chat and artifact panel

## Format Template Priority:
- **Structure**: Defined by Format Template
- **Content**: Sourced from AskBill (current docs)
- **Intelligence**: Enhanced by Claude AI
- **Result**: Structured solution guide following format template layout