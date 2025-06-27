import React, { useState } from 'react';
import { InfoIcon, XIcon, MessageSquareIcon, EditIcon, CodeIcon, FileTextIcon } from 'lucide-react';

export const HighlightingGuide = ({ renderAsHeaderButton = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  const features = [
    {
      icon: MessageSquareIcon,
      title: 'Ask Question',
      description: 'Ask specific questions about highlighted sections',
      color: 'text-green-600 bg-green-50'
    },
    {
      icon: EditIcon,
      title: 'Modify',
      description: 'Request modifications to specific parts',
      color: 'text-orange-600 bg-orange-50'
    },
    {
      icon: CodeIcon,
      title: 'Add Code',
      description: 'Request code examples for highlighted content',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      icon: FileTextIcon,
      title: 'Expand',
      description: 'Get more detailed explanations',
      color: 'text-blue-600 bg-blue-50'
    }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={renderAsHeaderButton 
          ? "p-2 text-gray-500 hover:text-gray-700 transition-colors"
          : "fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        }
        title="Learn about highlighting features"
      >
        <InfoIcon size={20} />
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Background overlay for header button mode */}
      {renderAsHeaderButton && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className={renderAsHeaderButton 
        ? "absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm z-20"
        : "fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm z-50"
      }>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Highlighting Features</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <XIcon size={16} />
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">
        Select text in Assistant's responses to get contextual assistance:
      </p>

      <div className="space-y-2">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className={`p-1 rounded ${feature.color}`}>
              <feature.icon size={14} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">{feature.title}</div>
              <div className="text-xs text-gray-600">{feature.description}</div>
            </div>
          </div>
        ))}
      </div>

        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            💡 Tip: Highlight any part of Assistant's solution guides to ask follow-up questions or request modifications.
          </p>
        </div>
      </div>
    </div>
  );
};