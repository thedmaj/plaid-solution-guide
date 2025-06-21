import React from 'react';
import { FileTextIcon, DownloadIcon, EyeIcon, EyeOffIcon } from 'lucide-react';

/**
 * Artifact Icon Component - Claude Desktop style
 * Displays a compact artifact representation in chat messages
 */
export const ArtifactIcon = ({ 
  artifact, 
  onView, 
  onDownload,
  className = '',
  isArtifactPanelOpen = false // New prop to track panel state
}) => {
  if (!artifact) return null;

  const handleView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onView?.(artifact.id);
  };

  const handleDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDownload?.(artifact.id);
  };

  // Extract icon from smart labeling metadata
  const smartIcon = artifact.metadata?.smartLabel?.icon || '📄';
  const isNew = artifact.metadata?.isNew;

  return (
    <div className={`inline-flex items-center gap-2 p-3 my-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-all duration-200 max-w-sm ${className}`}>
      {/* Smart Icon */}
      <div className="text-lg flex-shrink-0">
        {smartIcon}
      </div>
      
      {/* Artifact Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <FileTextIcon size={14} className="text-blue-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900 truncate">
            {artifact.title}
          </span>
          {isNew && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-1">
              New
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {artifact.type === 'markdown' ? 'Markdown Document' : artifact.type}
          {artifact.metadata?.version > 1 && ` • v${artifact.metadata.version}`}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-1 ml-2">
        <button
          onClick={handleView}
          className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            isArtifactPanelOpen 
              ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500' 
              : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
          }`}
          title={isArtifactPanelOpen ? "Close artifact panel" : "View artifact"}
        >
          {isArtifactPanelOpen ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-600 text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
          title="Download markdown"
        >
          <DownloadIcon size={14} />
        </button>
      </div>
    </div>
  );
};

export default ArtifactIcon;