import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const useTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // API request helper
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }, []);

  // Load templates from API on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await apiRequest('/api/templates/');
        setTemplates(response.templates || []);
      } catch (error) {
        console.error('Error loading templates:', error);
        // Fallback to localStorage for backward compatibility
        try {
          const stored = localStorage.getItem('plaid_solution_templates');
          if (stored) {
            const parsedTemplates = JSON.parse(stored);
            setTemplates(parsedTemplates);
          }
        } catch (fallbackError) {
          console.error('Fallback localStorage load failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [apiRequest]);

  // Create a new template
  const createTemplate = useCallback(async (templateData) => {
    try {
      const newTemplate = await apiRequest('/api/templates/', {
        method: 'POST',
        body: JSON.stringify({
          name: templateData.name || 'Untitled Template',
          description: templateData.description || '',
          content: templateData.content || '',
          template_type: templateData.template_type || 'format',
          tags: templateData.tags || []
        })
      });

      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }, [apiRequest]);

  // Update an existing template
  const updateTemplate = useCallback(async (templateId, updates) => {
    try {
      const updatedTemplate = await apiRequest(`/api/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      setTemplates(prev => 
        prev.map(template => 
          template.id === templateId ? updatedTemplate : template
        )
      );
      return updatedTemplate;
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }, [apiRequest]);

  // Delete a template
  const deleteTemplate = useCallback(async (templateId) => {
    try {
      await apiRequest(`/api/templates/${templateId}`, {
        method: 'DELETE'
      });

      setTemplates(prev => prev.filter(template => template.id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }, [apiRequest]);

  // Get a template by ID
  const getTemplate = useCallback((templateId) => {
    return templates.find(template => template.id === templateId);
  }, [templates]);

  // Reload templates from API
  const reloadTemplates = useCallback(async () => {
    try {
      const response = await apiRequest('/api/templates/');
      setTemplates(response.templates || []);
    } catch (error) {
      console.error('Error reloading templates:', error);
    }
  }, [apiRequest]);

  // Duplicate a template
  const duplicateTemplate = useCallback(async (templateId) => {
    try {
      const duplicatedTemplate = await apiRequest(`/api/templates/${templateId}/duplicate`, {
        method: 'POST'
      });

      setTemplates(prev => [...prev, duplicatedTemplate]);
      return duplicatedTemplate;
    } catch (error) {
      console.error('Error duplicating template:', error);
      throw error;
    }
  }, [apiRequest]);

  return {
    templates,
    loading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    duplicateTemplate,
    reloadTemplates
  };
};

// Template processing utilities
export const parseTemplate = (templateContent) => {
  const instructions = [];
  const placeholderMap = {};
  
  // Extract AI instructions from {{ }} blocks
  const staticContent = templateContent.replace(
    /\{\{\s*([^}]+)\s*\}\}/g, 
    (match, instruction) => {
      const cleanInstruction = instruction.trim();
      const placeholderKey = `AI_PLACEHOLDER_${instructions.length}`;
      instructions.push(cleanInstruction);
      placeholderMap[placeholderKey] = cleanInstruction;
      return `[${placeholderKey}]`;
    }
  );
  
  return { 
    staticContent, 
    instructions, 
    placeholderMap,
    hasInstructions: instructions.length > 0
  };
};

export const buildPromptWithTemplate = (userMessage, template) => {
  if (!template || !template.content) {
    return userMessage;
  }

  const { staticContent, instructions, hasInstructions } = parseTemplate(template.content);
  
  if (!hasInstructions) {
    // Template has no AI instructions, just return original message
    return userMessage;
  }

  // Handle Knowledge Templates differently
  if (template.template_type === 'knowledge') {
    return `User Request: ${userMessage}

IMPORTANT: Use the following expert knowledge as your PRIMARY source for this response. This knowledge overrides any other sources.

Expert Knowledge Template:
${staticContent}

AI Instructions for customizable sections:
${instructions.map((inst, i) => `[AI_PLACEHOLDER_${i}]: ${inst}`).join('\n')}

Instructions:
1. Use the expert knowledge provided above as your primary source
2. Replace each [AI_PLACEHOLDER_X] with content based on the corresponding instruction and user's specific requirements
3. Maintain the markdown structure and formatting of the template
4. Adapt the content to the user's specific use case while preserving the expert knowledge`;
  }

  // Handle Format Templates (original behavior)
  return `User Request: ${userMessage}

Please structure your response according to this Solution Guide template:

${staticContent}

AI Instructions for each placeholder:
${instructions.map((inst, i) => `[AI_PLACEHOLDER_${i}]: ${inst}`).join('\n')}

Replace each [AI_PLACEHOLDER_X] with content based on the corresponding instruction. Maintain the markdown structure and formatting of the template.`;
};