import React, { useState, useEffect } from 'react';
import { useTemplateContext } from '../contexts/TemplateContext';
import { parseTemplate } from '../hooks/useTemplates';
import { useAuth } from '../hooks/useAuth';

const TemplateEditor = ({ isOpen, onClose, templateId = null }) => {
  const { createTemplate, updateTemplate, deleteTemplate, getTemplate, reloadTemplates } = useTemplateContext();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    template_type: 'format',
    tags: []
  });
  const [copyToAllUsers, setCopyToAllUsers] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Check if current user is admin
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMIN';

  // Load template data if editing
  useEffect(() => {
    if (templateId) {
      const template = getTemplate(templateId);
      if (template) {
        setFormData({
          name: template.name,
          description: template.description,
          content: template.content,
          template_type: template.template_type || 'format',
          tags: template.tags || []
        });
      }
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        description: '',
        content: '',
        template_type: 'format',
        tags: []
      });
    }
  }, [templateId, getTemplate, isOpen]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let savedTemplate;
      if (templateId) {
        savedTemplate = await updateTemplate(templateId, formData);
      } else {
        savedTemplate = await createTemplate(formData);
      }
      
      // If admin and copyToAllUsers is checked, distribute to all users
      if (isAdmin && copyToAllUsers && savedTemplate) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/templates/${savedTemplate.id}/distribute`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to distribute template to all users');
          }
          
          const result = await response.json();
          alert(`Template successfully copied to ${result.copied_to_users} users!`);
        } catch (error) {
          console.error('Error distributing template:', error);
          alert('Template saved, but failed to copy to all users. Please try again or contact support.');
        }
      }
      
      // Reload templates to ensure UI is up to date
      await reloadTemplates();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleDelete = async () => {
    if (!templateId) return;
    
    setSaving(true);
    try {
      await deleteTemplate(templateId);
      // Reload templates to ensure UI is up to date
      await reloadTemplates();
      onClose();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template. Please try again.');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  const generatePreview = () => {
    if (!formData.content) {
      return 'Start typing your template content...';
    }
    
    try {
      const { staticContent, instructions } = parseTemplate(formData.content);
      
      // Replace placeholders with sample AI-generated content
      let previewContent = staticContent;
      instructions.forEach((instructionText, index) => {
        const placeholder = `[AI_PLACEHOLDER_${index}]`;
        const sampleContent = `*[AI will generate content for: "${instructionText}"]*`;
        previewContent = previewContent.replace(placeholder, sampleContent);
      });

      return previewContent || 'Preview will appear here...';
    } catch (error) {
      console.error('Error generating preview:', error);
      return 'Error generating preview. Please check your template syntax.';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {templateId ? 'Edit Template' : 'Create New Template'}
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handlePreview}
                  className={`px-4 py-2 text-sm font-medium rounded-md border ${
                    showPreview 
                      ? 'bg-gray-100 text-gray-700 border-gray-300' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                {templateId && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.name.trim() || !formData.content.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-plaid-blue-600 border border-transparent rounded-md hover:bg-plaid-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white px-6 py-4 space-y-4">
            {/* Template Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Plaid Integration Guide"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of this template"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Type
                </label>
                <select
                  value={formData.template_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="format">📋 Format Template</option>
                  <option value="knowledge">📚 Knowledge Template</option>
                </select>
              </div>
              
              {/* Admin Option - Copy to All Users */}
              {isAdmin && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <input
                      id="copyToAllUsers"
                      type="checkbox"
                      checked={copyToAllUsers}
                      onChange={(e) => setCopyToAllUsers(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label htmlFor="copyToAllUsers" className="text-sm font-medium text-blue-900 cursor-pointer">
                        Copy template to all users
                      </label>
                      <p className="text-xs text-blue-700 mt-1">
                        When checked, this template will be copied to every user's template library. 
                        Each user will get their own independent copy that they can modify.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Template Content */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Template Content *
                </label>
                <div className="text-xs text-gray-500">
                  Use {`{{ instruction }}`} for AI-generated content
                </div>
              </div>
              
              <div className={`grid gap-4 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {/* Editor */}
                <div>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    placeholder={formData.template_type === 'knowledge' ? 
                      `# Plaid Signal Integration (Sandbox End-to-End Guide)

## Overview
This guide provides a complete, step-by-step integration of Plaid's Signal product using the Sandbox environment. It is intended to support both frontend and backend implementations in a language-agnostic format with optional language-specific hints.

## Assumptions
- The developer has a Plaid account and Sandbox client_id and secret are available
- The application is able to make HTTP requests
- You have been approved for Signal access (or are using Sandbox while waiting for approval)

## Prerequisites
Before starting the integration, ensure the following:
- You have a Plaid Developer Dashboard account
- You have obtained your client ID and Sandbox secret from the dashboard

## Step 1: Create a Signal Ruleset in the Dashboard
Before beginning your integration, first create a ruleset in the Plaid Dashboard.

{{ enhance the above steps with user-specific requirements }}

## Step 2: Backend - Create a Link Token
{{ describe backend implementation details }}

## Additional Steps
{{ add more implementation steps as needed }}`
                      :
                      `# Solution Guide Template

## Overview

{{ provide an overview of the solution including what this guide covers and the main objectives }}

## Prerequisites

{{ list any requirements, accounts, or setup needed before starting }}

## Implementation Steps

{{ describe step-by-step implementation with clear numbered steps }}

## Code Examples

{{ provide relevant code examples and API calls }}

## Testing

{{ explain how to test the implementation }}

## Troubleshooting

{{ common issues and their solutions }}

## Resources

{{ list relevant Plaid documentation links and additional resources }}`}
                  />
                </div>

                {/* Preview */}
                {showPreview && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
                    <div className="h-96 p-3 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto">
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                          {generatePreview()}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Help Text */}
            <div className={`border rounded-md p-4 ${
              formData.template_type === 'knowledge' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h4 className={`text-sm font-medium mb-2 ${
                formData.template_type === 'knowledge' 
                  ? 'text-green-900' 
                  : 'text-blue-900'
              }`}>
                {formData.template_type === 'knowledge' ? '📚 Knowledge Template' : '📋 Format Template'}
              </h4>
              
              {formData.template_type === 'knowledge' ? (
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• <strong>Embed specific product knowledge</strong> directly in the template content</li>
                  <li>• Use <code className="bg-green-100 px-1 rounded">{`{{ instruction }}`}</code> for parts that need user-specific customization</li>
                  <li>• Template knowledge <strong>overrides</strong> AskBill MCP server content</li>
                  <li>• Include detailed implementation steps, code examples, and specific API details</li>
                  <li>• Best for specialized guides with expert knowledge (e.g., Signal integration)</li>
                </ul>
              ) : (
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use standard Markdown formatting for structure</li>
                  <li>• Wrap AI instructions in double curly braces: <code className="bg-blue-100 px-1 rounded">{`{{ instruction }}`}</code></li>
                  <li>• Instructions should be clear and specific (e.g., "list required Plaid APIs with descriptions")</li>
                  <li>• Static text will remain unchanged in the final output</li>
                  <li>• AI will replace instruction blocks with generated content using AskBill knowledge</li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Template
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete the template "{formData.name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {saving ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={saving}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  No, Keep Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEditor;