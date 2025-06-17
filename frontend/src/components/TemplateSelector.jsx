import React, { useState } from 'react';
import { useTemplateContext } from '../contexts/TemplateContext';

const TemplateSelector = ({ selectedTemplateId, onTemplateSelect, onCreateTemplate, onEditTemplate }) => {
  const { templates, loading } = useTemplateContext();
  const [isOpen, setIsOpen] = useState(false);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const handleTemplateSelect = (template) => {
    onTemplateSelect(template);
    setIsOpen(false);
  };

  const handleClearTemplate = () => {
    onTemplateSelect(null);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="text-sm">Loading templates...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Template:</span>
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between min-w-[200px] px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className="truncate">
              {selectedTemplate ? selectedTemplate.name : 'No Template'}
            </span>
            <svg
              className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute z-50 bottom-full mb-1 w-80 bg-white border border-gray-300 rounded-md shadow-lg">
              <div className="py-1 max-h-60 overflow-y-auto">
                {/* No Template Option */}
                <button
                  onClick={handleClearTemplate}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                    !selectedTemplateId ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">No Template</div>
                  <div className="text-xs text-gray-500">Use standard chat without template</div>
                </button>

                {/* Divider */}
                {templates.length > 0 && (
                  <div className="border-t border-gray-100 my-1"></div>
                )}

                {/* Template List */}
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`group relative flex items-center hover:bg-gray-100 ${
                      selectedTemplateId === template.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleTemplateSelect(template)}
                      className={`flex-1 text-left px-4 py-2 text-sm ${
                        selectedTemplateId === template.id ? 'text-blue-700' : 'text-gray-900'
                      }`}
                    >
                      <div className="font-medium truncate pr-8 flex items-center gap-2">
                        <span>{template.template_type === 'knowledge' ? '📚' : '📋'}</span>
                        {template.name}
                      </div>
                      {template.description && (
                        <div className="text-xs text-gray-500 truncate pr-8">{template.description}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">
                        Modified {new Date(template.last_modified).toLocaleDateString()}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTemplate && onEditTemplate(template.id);
                        setIsOpen(false);
                      }}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit template"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Create New Template */}
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => {
                    onCreateTemplate();
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Template
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Template Info */}
      {selectedTemplate && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-blue-900">{selectedTemplate.name}</div>
              {selectedTemplate.description && (
                <div className="text-xs text-blue-700 mt-1">{selectedTemplate.description}</div>
              )}
            </div>
            <button
              onClick={handleClearTemplate}
              className="text-blue-600 hover:text-blue-800 text-sm"
              title="Remove template"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default TemplateSelector;