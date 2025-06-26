import React, { useState, useRef, useEffect } from 'react';
import { FileIcon, CopyIcon, CheckIcon, BookmarkIcon, MessageSquareIcon, EditIcon, CodeIcon, FileTextIcon, GitMerge } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ErrorBoundary } from './ErrorBoundary';
import { ArtifactNotification } from './ArtifactNotification';

export const HighlightableMessage = ({ 
  message, 
  onCreateArtifact, 
  onMergeWithArtifact,
  onScopedInstruction,
  markdownComponents,
  linkedArtifact,
  recentChanges,
  onViewArtifact,
  onDismissChange,
  hasExistingArtifacts = false
}) => {
  const [copied, setCopied] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const messageContentRef = useRef(null);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.length > 5) { // Minimum 5 characters for meaningful selection
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Check if selection is within our message content
      const messageElement = messageContentRef.current;
      if (messageElement && messageElement.contains(range.commonAncestorContainer)) {
        setContextMenu({
          x: Math.min(rect.right + window.scrollX, window.innerWidth - 250), // Prevent overflow
          y: rect.bottom + window.scrollY + 5,
          text: selectedText,
          range: range.cloneRange()
        });
      }
    } else {
      setContextMenu(null);
    }
  };

  const handleMouseUp = (e) => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      handleTextSelection();
    }, 10);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    window.getSelection().removeAllRanges();
  };

  const handleScopedAction = (actionType, text) => {
    const highlightId = Date.now().toString();
    
    // Add highlight to the list
    setHighlights(prev => [...prev, {
      id: highlightId,
      text: text,
      actionType: actionType,
      timestamp: new Date().toISOString()
    }]);

    // Call the parent handler with scoped instruction
    onScopedInstruction({
      type: actionType,
      highlightedText: text,
      originalMessage: message,
      highlightId: highlightId
    });

    closeContextMenu();
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu && !e.target.closest('.context-menu')) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);

  const ContextMenu = () => {
    if (!contextMenu) return null;

    const actions = [
      {
        icon: MessageSquareIcon,
        label: 'Ask Question',
        action: () => handleScopedAction('question', contextMenu.text),
        description: 'Ask a specific question about this section'
      },
      {
        icon: EditIcon,
        label: 'Modify',
        action: () => handleScopedAction('modify', contextMenu.text),
        description: 'Request modifications to this section'
      },
      {
        icon: CodeIcon,
        label: 'Add Code',
        action: () => handleScopedAction('code', contextMenu.text),
        description: 'Request code examples for this section'
      },
      {
        icon: FileTextIcon,
        label: 'Expand',
        action: () => handleScopedAction('expand', contextMenu.text),
        description: 'Request more detailed explanation'
      }
    ];

    return (
      <div 
        className="context-menu fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
        style={{
          left: `${contextMenu.x}px`,
          top: `${contextMenu.y}px`,
        }}
      >
        <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
          Selected: "{contextMenu.text.substring(0, 50)}{contextMenu.text.length > 50 ? '...' : ''}"
        </div>
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
            title={action.description}
          >
            <action.icon size={16} className="text-gray-500" />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div 
      className={`flex gap-4 p-4 relative ${
        message.role === 'user' ? 'bg-white' : 'bg-gray-50'
      } border-b border-gray-100`}
    >
      <div className="flex-shrink-0 w-8 h-8">
        {message.role === 'user' ? (
          <div className="bg-blue-100 text-blue-800 w-8 h-8 rounded-full flex items-center justify-center">
            {message.sender?.slice(0, 1).toUpperCase() || 'U'}
          </div>
        ) : (
          <div className="bg-indigo-100 text-indigo-800 w-8 h-8 rounded-full flex items-center justify-center">
            A
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-1">
          <div className="font-medium">
            {message.role === 'user' ? message.sender || 'You' : 'Assistant'}
          </div>
          <div className="ml-2 text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
          {highlights.length > 0 && (
            <div className="ml-2 text-xs text-blue-600">
              {highlights.length} highlight{highlights.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        <div 
          ref={messageContentRef}
          className="prose prose-blue max-w-none highlightable-content"
          onMouseUp={handleMouseUp}
        >
          <ErrorBoundary>
            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
              {String(message.content)}
            </ReactMarkdown>
          </ErrorBoundary>
        </div>
        
        {message.sources && Array.isArray(message.sources) && message.sources.length > 0 && (
          <div className="mt-2 text-xs text-gray-500">
            <div className="font-medium mb-1">Sources:</div>
            <ul className="space-y-1">
              {message.sources.map((source, index) => (
                <li key={index} className="flex items-center">
                  <FileIcon size={12} className="mr-1" />
                  <span>{source.title || 'Plaid Documentation'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Highlights Summary */}
        {highlights.length > 0 && (
          <div className="mt-3 p-2 bg-blue-50 rounded-md">
            <div className="text-xs text-blue-700 font-medium mb-1">Active Highlights:</div>
            <div className="space-y-1">
              {highlights.map((highlight) => (
                <div key={highlight.id} className="text-xs text-blue-600 flex items-center gap-2">
                  <span className="capitalize">{highlight.actionType}:</span>
                  <span className="truncate flex-1">
                    "{highlight.text.substring(0, 40)}{highlight.text.length > 40 ? '...' : ''}"
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Artifact Notifications */}
        <ArtifactNotification
          message={message}
          linkedArtifact={linkedArtifact}
          recentChanges={recentChanges}
          onViewArtifact={onViewArtifact}
          onDismissChange={onDismissChange}
        />
      </div>
      
      {message.role === 'assistant' && (
        <div className="flex-shrink-0 flex flex-col gap-2">
          <button
            onClick={copyToClipboard}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
            title="Copy to clipboard"
          >
            {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
          </button>
        </div>
      )}

      <ContextMenu />
    </div>
  );
};