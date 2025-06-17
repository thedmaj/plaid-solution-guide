import React from 'react';
import { SparklesIcon, FileTextIcon, XIcon } from 'lucide-react';

export const GlobalNotifications = ({ 
  recentChanges, 
  onViewArtifact, 
  onDismiss,
  onDismissAll 
}) => {
  if (!recentChanges || recentChanges.length === 0) return null;

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'create':
        return <SparklesIcon size={16} className="text-green-600" />;
      case 'update':
        return <FileTextIcon size={16} className="text-blue-600" />;
      default:
        return <FileTextIcon size={16} className="text-purple-600" />;
    }
  };

  const getChangeColor = (changeType) => {
    switch (changeType) {
      case 'create':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'update':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-purple-50 border-purple-200 text-purple-800';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-40 space-y-2 max-w-sm">
      {recentChanges.slice(0, 3).map((change) => (
        <div
          key={change.id}
          className={`flex items-start gap-3 p-3 border rounded-lg shadow-lg ${getChangeColor(change.type)} animate-slide-in`}
        >
          {getChangeIcon(change.type)}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">{change.message}</div>
            <div className="text-xs opacity-75 mt-1">
              {new Date(change.timestamp).toLocaleTimeString()}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onViewArtifact(change.artifactId)}
              className="text-xs underline hover:no-underline"
            >
              View
            </button>
            <button
              onClick={() => onDismiss(change.id)}
              className="opacity-60 hover:opacity-100"
            >
              <XIcon size={14} />
            </button>
          </div>
        </div>
      ))}
      
      {recentChanges.length > 3 && (
        <div className="text-center">
          <button
            onClick={onDismissAll}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Dismiss all ({recentChanges.length})
          </button>
        </div>
      )}
    </div>
  );
};