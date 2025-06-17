/**
 * Merge Suggestion Component
 * Shows intelligent suggestions for merging content with existing artifacts
 */

import React, { useState } from 'react';
import {
  MergeIcon,
  FileTextIcon,
  PlusIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InfoIcon,
  ZapIcon
} from 'lucide-react';

export const MergeSuggestion = ({
  suggestion,
  onAccept,
  onReject,
  onCreateSeparate,
  onCustomPlacement,
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { analysis, targetArtifact, content } = suggestion;
  const confidenceLevel = getConfidenceLevel(analysis.confidence);
  const contentPreview = content.substring(0, 150) + (content.length > 150 ? '...' : '');

  const handleAction = async (action, ...args) => {
    console.log('🔴 MergeSuggestion handleAction called:', { action, suggestionId: suggestion.id, args });
    setIsProcessing(true);
    try {
      switch (action) {
        case 'accept':
          console.log('🔴 Calling onAccept with:', suggestion.id, ...args);
          await onAccept(suggestion.id, ...args);
          break;
        case 'reject':
          await onReject(suggestion.id);
          break;
        case 'create_separate':
          await onCreateSeparate(suggestion.id);
          break;
        case 'custom':
          await onCustomPlacement(suggestion.id, ...args);
          break;
      }
    } catch (error) {
      console.error('Error handling merge suggestion:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`merge-suggestion bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="p-2 bg-blue-100 rounded-full">
            <ZapIcon size={16} className="text-blue-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-blue-900">Smart Merge Suggestion</h4>
            <ConfidenceBadge level={confidenceLevel} confidence={analysis.confidence} />
          </div>

          <p className="text-sm text-blue-800 mb-2">
            {analysis.reasoning}
          </p>

          <div className="flex items-center gap-4 text-xs text-blue-600 mb-3">
            <div className="flex items-center gap-1">
              <FileTextIcon size={12} />
              <span>Target: {targetArtifact.title}</span>
            </div>
            {analysis.suggestedPlacement && (
              <div className="flex items-center gap-1">
                <InfoIcon size={12} />
                <span>Place: {getPlacementDescription(analysis.suggestedPlacement)}</span>
              </div>
            )}
          </div>

          {/* Content Preview */}
          <div className="bg-white border border-blue-200 rounded p-3 mb-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Content to add:</div>
            <div className="text-sm text-gray-800 font-mono bg-gray-50 p-2 rounded text-xs">
              {contentPreview}
            </div>
          </div>

          {/* Analysis Details Toggle */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors mb-3"
          >
            {showDetails ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
            <span>{showDetails ? 'Hide' : 'Show'} analysis details</span>
          </button>

          {showDetails && (
            <AnalysisDetails analysis={analysis} />
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => handleAction('reject')}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isProcessing}
        >
          <XIcon size={16} />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4">
        <button
          onClick={() => {
            console.log('🟢 MERGE BUTTON CLICKED! Suggestion ID:', suggestion.id);
            handleAction('accept');
          }}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-blue-800"
          style={{ zIndex: 9999 }}
        >
          <MergeIcon size={14} />
          <span>Merge to {targetArtifact.title}</span>
        </button>

        <button
          onClick={() => handleAction('create_separate')}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <PlusIcon size={14} />
          <span>Create Separate</span>
        </button>

        {analysis.suggestedPlacement && (
          <CustomPlacementButton
            placement={analysis.suggestedPlacement}
            onCustom={(placement) => handleAction('custom', placement)}
            disabled={isProcessing}
          />
        )}
      </div>

      {isProcessing && (
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
};

/**
 * Confidence Badge Component
 */
const ConfidenceBadge = ({ level, confidence }) => {
  const colors = {
    high: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <span className={`px-2 py-0.5 border rounded-full text-xs font-medium ${colors[level]}`}>
      {level} ({Math.round(confidence * 100)}%)
    </span>
  );
};

/**
 * Analysis Details Component
 */
const AnalysisDetails = ({ analysis }) => {
  const metrics = [
    { label: 'Topic Similarity', value: analysis.topicSimilarity, format: 'percentage' },
    { label: 'Content Type Fit', value: analysis.contentTypeCompatibility, format: 'percentage' },
    { label: 'Structural Fit', value: analysis.structuralFit, format: 'percentage' },
    { label: 'Size Feasibility', value: analysis.sizeFeasibility, format: 'percentage' },
    { label: 'User Context', value: analysis.userContext, format: 'percentage' },
    { label: 'Temporal Relevance', value: analysis.temporalRelevance, format: 'percentage' }
  ];

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-3 mb-3">
      <div className="text-xs font-medium text-gray-600 mb-2">Analysis Breakdown:</div>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map(metric => (
          <div key={metric.label} className="flex justify-between items-center">
            <span className="text-xs text-gray-600">{metric.label}:</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${metric.value * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-gray-800 w-8">
                {Math.round(metric.value * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {analysis.alternativeActions && analysis.alternativeActions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-600 mb-1">Alternative Suggestions:</div>
          <div className="space-y-1">
            {analysis.alternativeActions.map((action, index) => (
              <div key={index} className="text-xs text-gray-600">
                • {action.reason} (confidence: {Math.round(action.confidence * 100)}%)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Custom Placement Button Component
 */
const CustomPlacementButton = ({ placement, onCustom, disabled }) => {
  const [showOptions, setShowOptions] = useState(false);

  const placementOptions = [
    { value: 'append_to_end', label: 'Add to end' },
    { value: 'new_section', label: 'New section' },
    { value: 'insert_after_section', label: 'After specific section' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={disabled}
        className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <span className="text-sm">Custom</span>
        <ChevronDownIcon size={12} />
      </button>

      {showOptions && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-20 min-w-40">
            {placementOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onCustom({ ...placement, type: option.value });
                  setShowOptions(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Utility Functions
 */
const getConfidenceLevel = (confidence) => {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
};

const getPlacementDescription = (placement) => {
  switch (placement?.type) {
    case 'append_to_end':
      return 'End of document';
    case 'new_section':
      return `New section: "${placement.title}"`;
    case 'insert_after_section':
      return `After "${placement.sectionTitle}"`;
    default:
      return 'Smart placement';
  }
};

export default MergeSuggestion;