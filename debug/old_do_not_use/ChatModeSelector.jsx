import React from 'react';
import { HelpCircle } from 'lucide-react';

export const ChatModeSelector = ({ selectedMode, onModeChange }) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm font-medium text-gray-700">Chat Mode:</span>
      <div className="flex gap-2">
        <button
          onClick={() => onModeChange('solution_guide')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            selectedMode === 'solution_guide'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Solution Guide
        </button>
        <button
          onClick={() => onModeChange('free_wheelin')}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            selectedMode === 'free_wheelin'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Free Wheelin
        </button>
      </div>
      <HelpCircle size={16} className="text-gray-400" />
    </div>
  );
}; 