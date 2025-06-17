import React, { useState, useEffect } from 'react';
import { FileText as FileTextIcon, GitMerge as MergeIcon, Plus as PlusIcon, X as XIcon, ChevronDown as ChevronDownIcon } from 'lucide-react';

export const ArtifactCreationDialog = ({ 
  isOpen, 
  onClose, 
  existingArtifacts = [], // Array of all available artifacts
  newContent, 
  onCreateNew, 
  onMerge,
  previewMerge 
}) => {
  const [mergePreview, setMergePreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [showArtifactSelector, setShowArtifactSelector] = useState(false);
  
  // Auto-select first artifact if only one exists
  useEffect(() => {
    if (existingArtifacts.length === 1) {
      setSelectedArtifact(existingArtifacts[0]);
    } else if (existingArtifacts.length > 1) {
      // Select the most recently updated artifact by default
      const mostRecent = existingArtifacts.reduce((latest, current) => 
        new Date(current.updated_at) > new Date(latest.updated_at) ? current : latest
      );
      setSelectedArtifact(mostRecent);
    }
  }, [existingArtifacts]);
  
  const handleShowMergePreview = async () => {
    if (previewMerge && selectedArtifact && !mergePreview) {
      const preview = await previewMerge(selectedArtifact.content, newContent);
      setMergePreview(preview);
    }
    setShowPreview(!showPreview);
  };
  
  const handleArtifactSelect = (artifact) => {
    setSelectedArtifact(artifact);
    setShowArtifactSelector(false);
    // Clear previous preview when artifact changes
    setMergePreview(null);
    setShowPreview(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FileTextIcon size={20} />
                Artifact Action Required
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {existingArtifacts.length === 1 
                  ? "This chat session already has an artifact. How would you like to handle the new content?"
                  : `There are ${existingArtifacts.length} existing artifacts. Choose how to handle the new content.`
                }
              </p>
              
              {/* Artifact Selector */}
              {existingArtifacts.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select artifact to merge with:
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowArtifactSelector(!showArtifactSelector)}
                      className="w-full p-3 text-left border border-gray-300 rounded-lg hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">{selectedArtifact?.title || 'Select an artifact'}</div>
                        {selectedArtifact && (
                          <div className="text-xs text-gray-500 mt-1">
                            {selectedArtifact.content.length} characters • 
                            Last updated: {new Date(selectedArtifact.updated_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <ChevronDownIcon size={16} className="text-gray-400" />
                    </button>
                    
                    {showArtifactSelector && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {existingArtifacts.map((artifact) => (
                          <button
                            key={artifact.id}
                            onClick={() => handleArtifactSelect(artifact)}
                            className={`w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                              selectedArtifact?.id === artifact.id ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                          >
                            <div className="font-medium">{artifact.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {artifact.content.length} characters • 
                              Last updated: {new Date(artifact.updated_at).toLocaleString()}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Selected Artifact Display */}
              {selectedArtifact && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileTextIcon size={16} className="text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {existingArtifacts.length === 1 ? 'Existing Artifact' : 'Selected Artifact'}
                    </span>
                  </div>
                  <div className="text-sm text-blue-800">
                    <div className="font-medium">{selectedArtifact.title}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {selectedArtifact.content.length} characters • 
                      Last updated: {new Date(selectedArtifact.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Create New Option */}
              <button
                onClick={() => {
                  onCreateNew();
                  // Don't call onClose() here - let the parent handle it
                }}
                className="p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                    <PlusIcon size={20} className="text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Create New Artifact</div>
                    <div className="text-sm text-gray-600">Start a fresh artifact with this content</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  • Creates a new standalone artifact
                  • Preserves existing artifact unchanged
                  • Best for completely different topics
                </div>
              </button>

              {/* Merge Option */}
              <button
                onClick={() => {
                  if (selectedArtifact) {
                    onMerge(selectedArtifact);
                    // Don't call onClose() here - let the parent handle it
                  }
                }}
                disabled={!selectedArtifact}
                className={`p-4 border-2 rounded-lg transition-colors text-left group ${
                  selectedArtifact 
                    ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50' 
                    : 'border-gray-200 bg-gray-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <MergeIcon size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Merge with Existing</div>
                    <div className="text-sm text-gray-600">Intelligently combine with current artifact</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  • Updates existing artifact with new content
                  • Removes duplicates and organizes sections
                  • Best for expanding on the same topic
                </div>
              </button>
            </div>

            {/* Merge Preview */}
            {previewMerge && (
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={handleShowMergePreview}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <MergeIcon size={14} />
                  {showPreview ? 'Hide' : 'Preview'} merge result
                </button>
                
                {showPreview && (
                  <div className="mt-3 border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                    <div className="text-sm font-medium text-gray-700 mb-2">Merge Preview:</div>
                    <div className="text-sm text-gray-600 whitespace-pre-wrap font-mono">
                      {mergePreview ? mergePreview.substring(0, 1000) + (mergePreview.length > 1000 ? '...' : '') : 'Loading preview...'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};