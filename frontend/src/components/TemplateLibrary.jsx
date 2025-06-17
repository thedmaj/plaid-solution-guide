import React, { useState } from 'react';
import { useTemplateContext } from '../contexts/TemplateContext';

const TemplateLibrary = ({ onEditTemplate, onCreateTemplate }) => {
  const { templates, deleteTemplate, duplicateTemplate } = useTemplateContext();
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = async (templateId) => {
    if (confirmDelete === templateId) {
      try {
        await deleteTemplate(templateId);
        setConfirmDelete(null);
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template. Please try again.');
      }
    } else {
      setConfirmDelete(templateId);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleDuplicate = async (templateId) => {
    try {
      const newTemplate = await duplicateTemplate(templateId);
      if (newTemplate) {
        onEditTemplate(newTemplate.id);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Failed to duplicate template. Please try again.');
    }
  };

  return (
    <div className="bg-white border-l border-gray-200 w-80 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Templates</h3>
          <button
            onClick={onCreateTemplate}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md flex items-center"
            title="Create new template"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New
          </button>
        </div>
      </div>

      {/* Template List */}
      <div className="flex-1 overflow-y-auto">
        {templates.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No templates yet</p>
            <button
              onClick={onCreateTemplate}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Create your first template
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {template.name}
                    </h4>
                    {template.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 text-xs text-gray-400">
                      <span>Modified {new Date(template.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Actions Menu */}
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => onEditTemplate(template.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Edit template"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleDuplicate(template.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                      title="Duplicate template"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => handleDelete(template.id)}
                      className={`p-1 rounded ${
                        confirmDelete === template.id
                          ? 'text-red-600 bg-red-100'
                          : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                      title={confirmDelete === template.id ? 'Click again to confirm delete' : 'Delete template'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Template Preview */}
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 max-h-20 overflow-hidden">
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {template.content.substring(0, 150)}
                    {template.content.length > 150 && '...'}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateLibrary;