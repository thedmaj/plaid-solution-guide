#!/usr/bin/env python3

# Simple test for Knowledge Template detection
def _detect_knowledge_template_usage(message: str) -> bool:
    """
    Detect if a message was processed by a Knowledge Template
    Knowledge Templates include this marker text in the processed message
    """
    knowledge_markers = [
        "IMPORTANT: Use the following expert knowledge as your PRIMARY source",
        "Expert Knowledge Template:",
        "AI Instructions for customizable sections:"
    ]
    
    return any(marker in message for marker in knowledge_markers)

# Test cases
regular_message = "Generate a solution guide for implementing Plaid Auth API"

knowledge_template_message = """User Request: Generate auth guide

IMPORTANT: Use the following expert knowledge as your PRIMARY source for this response. This knowledge overrides any other sources.

Expert Knowledge Template:
# Plaid Auth Integration Guide

## Overview
Plaid Auth allows you to retrieve real-time balance and account information."""

print("Testing Knowledge Template Detection:")
print(f"Regular message: {_detect_knowledge_template_usage(regular_message)}")
print(f"Knowledge template: {_detect_knowledge_template_usage(knowledge_template_message)}")

# Expected: False, True
if not _detect_knowledge_template_usage(regular_message) and _detect_knowledge_template_usage(knowledge_template_message):
    print("✅ Detection logic works correctly!")
else:
    print("❌ Detection logic failed")