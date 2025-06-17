/**
 * Workspace Header Component
 * Shows current workspace status and provides workspace controls
 */

import React, { useState } from 'react';
import { 
  FileTextIcon, 
  FolderIcon, 
  SettingsIcon,
  ChevronDownIcon,
  LayersIcon,
  PlusIcon
} from 'lucide-react';

export const WorkspaceHeader = ({ 
  workspace, 
  onOpenSettings, 
  onSplitWorkspace,
  className = '',
  isCompact = false 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!workspace || !workspace.primaryArtifact) {
    return null; // Don't show header if no workspace
  }

  const { primaryArtifact, supplementaryArtifacts, metadata } = workspace;
  const totalArtifacts = 1 + supplementaryArtifacts.length;
  const contentSections = extractSectionCount(primaryArtifact.content);

  const formatSize = (content) => {
    const chars = content?.length || 0;
    if (chars < 1000) return `${chars} chars`;
    return `${(chars / 1000).toFixed(1)}k chars`;
  };

  const formatLastActivity = (timestamp) => {
    const now = new Date();
    const activity = new Date(timestamp);
    const diffMinutes = Math.floor((now - activity) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return activity.toLocaleDateString();
  };

  if (isCompact) {
    return (
      <div className={`workspace-header-compact bg-blue-50 border-b border-blue-200 px-3 py-1 ${className}`}>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <LayersIcon size={14} className="text-blue-600" />
            <span className="text-blue-800 font-medium">
              Building: {primaryArtifact.title}
            </span>
            <span className="text-blue-600 text-xs">
              {contentSections} sections
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            {supplementaryArtifacts.length > 0 && (
              <span className="text-xs text-blue-600">
                +{supplementaryArtifacts.length} related
              </span>
            )}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="Workspace details"
            >
              <ChevronDownIcon 
                size={12} 
                className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium">Primary Document</div>
                <div>{formatSize(primaryArtifact.content)}</div>
                <div>Last updated: {formatLastActivity(metadata.lastActivity)}</div>
              </div>
              {supplementaryArtifacts.length > 0 && (
                <div>
                  <div className="font-medium">Related Artifacts</div>
                  {supplementaryArtifacts.slice(0, 2).map(artifact => (
                    <div key={artifact.id} className="truncate">
                      📄 {artifact.title}
                    </div>
                  ))}
                  {supplementaryArtifacts.length > 2 && (
                    <div>+{supplementaryArtifacts.length - 2} more...</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`workspace-header bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <LayersIcon size={20} className="text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">
                Session Workspace
              </h3>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {totalArtifacts} artifact{totalArtifacts !== 1 ? 's' : ''}
              </span>
              <span className="text-blue-600">
                Last activity: {formatLastActivity(metadata.lastActivity)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Artifact */}
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <FileTextIcon size={16} className="text-blue-600" />
                <span className="font-medium text-blue-900">Primary Document</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                  Primary
                </span>
              </div>
              
              <div className="text-sm text-gray-700 mb-2">
                <div className="font-medium truncate">{primaryArtifact.title}</div>
                <div className="text-xs text-gray-500">
                  {formatSize(primaryArtifact.content)} • {contentSections} sections
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Created: {new Date(primaryArtifact.created_at).toLocaleDateString()}</span>
                {metadata.totalContentAdded > 0 && (
                  <span>• Added: {formatSize({ length: metadata.totalContentAdded })}</span>
                )}
              </div>
            </div>

            {/* Supplementary Artifacts */}
            {supplementaryArtifacts.length > 0 && (
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <FolderIcon size={16} className="text-gray-600" />
                  <span className="font-medium text-gray-900">Related Artifacts</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {supplementaryArtifacts.length}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {supplementaryArtifacts.slice(0, 3).map(artifact => (
                    <div key={artifact.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <FileTextIcon size={12} className="text-gray-400" />
                        <span className="truncate flex-1">{artifact.title}</span>
                        <span className="text-xs text-gray-400">
                          {formatSize(artifact.content)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {supplementaryArtifacts.length > 3 && (
                    <div className="text-xs text-gray-500 italic">
                      +{supplementaryArtifacts.length - 3} more artifacts...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          {onSplitWorkspace && (
            <button
              onClick={onSplitWorkspace}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
              title="Split workspace"
            >
              <PlusIcon size={16} />
            </button>
          )}
          
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
              title="Workspace settings"
            >
              <SettingsIcon size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Extract section count from markdown content
 */
const extractSectionCount = (content) => {
  if (!content) return 0;
  const sections = content.match(/^#{1,6}\s+/gm);
  return sections ? sections.length : 0;
};

export default WorkspaceHeader;