import React, { useState, useEffect } from 'react';
import { FileTextIcon, SparklesIcon, EditIcon, PlusIcon, XIcon } from 'lucide-react';

export const ArtifactNotification = ({ 
  message, 
  linkedArtifact, 
  recentChanges, 
  onViewArtifact,
  onDismissChange 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show notification for this message if it has a linked artifact or recent changes
  useEffect(() => {
    if (linkedArtifact || (recentChanges && recentChanges.length > 0)) {
      setIsVisible(true);
    }
  }, [linkedArtifact, recentChanges]);

  if (!isVisible) return null;

  const handleViewArtifact = () => {
    if (linkedArtifact && onViewArtifact) {
      onViewArtifact(linkedArtifact.id);
    }
  };

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'create':
        return <PlusIcon size={14} className="text-green-600" />;
      case 'update':
        return <EditIcon size={14} className="text-blue-600" />;
      default:
        return <SparklesIcon size={14} className="text-purple-600" />;
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
    <div className="mt-2">
      {/* Linked Artifact Display */}
      {linkedArtifact && (
        <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm">
          <FileTextIcon size={14} className="text-indigo-600" />
          <span className="text-indigo-800 flex-1">
            Auto-created artifact: <strong>{linkedArtifact.title}</strong>
          </span>
          <button
            onClick={handleViewArtifact}
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            View
          </button>
        </div>
      )}

      {/* Recent Changes Display */}
      {recentChanges && recentChanges.map((change) => (
        <div
          key={change.id}
          className={`flex items-center gap-2 p-2 border rounded-lg text-sm mt-1 ${getChangeColor(change.type)}`}
        >
          {getChangeIcon(change.type)}
          <span className="flex-1">{change.message}</span>
          <button
            onClick={() => onViewArtifact && onViewArtifact(change.artifactId)}
            className="underline hover:no-underline"
          >
            View
          </button>
          {onDismissChange && (
            <button
              onClick={() => onDismissChange(change.id)}
              className="ml-1 opacity-60 hover:opacity-100"
            >
              <XIcon size={12} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ArtifactNotification;