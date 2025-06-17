import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X as XIcon, 
  Download as DownloadIcon, 
  FileText as FileTextIcon, 
  File as FileIcon, 
  Check as CheckIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Columns as SplitViewIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  MessageSquareIcon,
  CodeIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';
import remarkGfm from 'remark-gfm';
import { ErrorBoundary } from './ErrorBoundary';

export const ArtifactPanel = ({ 
  artifact, 
  onUpdate, 
  onDownload, 
  onClose,
  onToggleChatCollapse,
  isChatCollapsed,
  className = 'w-1/2',
  isLoading = false,
  error = null,
  onScopedInstruction, // New prop for handling scoped instructions from artifact highlighting
  forceRefresh = false // New prop to force content refresh
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [downloadFormat, setDownloadFormat] = useState('markdown');
  const [splitView, setSplitView] = useState(false);
  const [mermaidInitialized, setMermaidInitialized] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  
  // Highlighting state for artifact content
  const [contextMenu, setContextMenu] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const artifactContentRef = useRef(null);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  
  // Initialize mermaid once the component mounts
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false, // We'll manually control rendering
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'inherit'
      });
      setMermaidInitialized(true);
    } catch (error) {
      console.error('Error initializing mermaid:', error);
    }
  }, []);
  
  // Update local state when artifact changes (auto-reload)
  useEffect(() => {
    if (artifact) {
      console.log('🔄 ArtifactPanel: Auto-reloading artifact content', {
        title: artifact.title,
        contentLength: artifact.content?.length,
        isEditing
      });
      
      // Only update if not currently editing to avoid losing user changes
      if (!isEditing) {
        setEditedContent(artifact.content);
        setEditedTitle(artifact.title);
        setLastRefreshTime(Date.now()); // Update refresh timestamp
        
        // Skip automatic mermaid re-render after content update to prevent DOM corruption
      }
    }
  }, [artifact?.id, artifact?.content, artifact?.title, isEditing]);

  // Force refresh when forceRefresh prop changes
  useEffect(() => {
    if (forceRefresh && artifact) {
      console.log('🔄 ArtifactPanel: Force refreshing content');
      setEditedContent(artifact.content);
      setEditedTitle(artifact.title);
      setIsEditing(false); // Exit editing mode on force refresh
      setLastRefreshTime(Date.now()); // Update refresh timestamp
      
      // Skip automatic mermaid re-render after force refresh to prevent DOM corruption
    }
  }, [forceRefresh, artifact]);

  // Refresh content when panel becomes visible (component mounts or artifact changes)
  useEffect(() => {
    if (artifact) {
      console.log('🔄 ArtifactPanel: Panel opened/artifact changed, ensuring latest content');
      // Skip automatic mermaid render on panel open to prevent DOM corruption
    }
  }, [artifact?.id]); // Only depend on artifact ID change
  
  // Auto-collapse chat and show preview when entering edit mode
  useEffect(() => {
    if (isEditing) {
      // Auto-collapse chat when entering edit mode (if not already collapsed)
      if (!isChatCollapsed) {
        onToggleChatCollapse && onToggleChatCollapse(true);
      }
      
      // Automatically enable split view/preview when editing
      setSplitView(true);
    }
  }, [isEditing, isChatCollapsed, onToggleChatCollapse]);
  
  // Simple mermaid render function for manual use only
  const renderMermaidDiagrams = useCallback(() => {
    if (!mermaidInitialized) return;
    
    try {
      console.log('🎨 Manual mermaid render triggered');
      // Use simple mermaid initialization
      if (typeof mermaid.run === 'function') {
        mermaid.run({ querySelector: '.mermaid' }).catch(error => {
          console.warn('Mermaid.run error:', error);
        });
      } else {
        try {
          mermaid.init(undefined, '.mermaid');
        } catch (error) {
          console.warn('Mermaid.init error:', error);
        }
      }
    } catch (e) {
      console.warn('Mermaid render error:', e);
    }
  }, [mermaidInitialized]);

  // Simple one-time mermaid render after content loads
  useEffect(() => {
    if (mermaidInitialized && editedContent) {
      // Only render once when both mermaid is ready and content exists
      const timer = setTimeout(() => {
        console.log('🎨 One-time mermaid render after content load');
        renderMermaidDiagrams();
      }, 1000); // Wait for React to finish rendering
      
      return () => clearTimeout(timer);
    }
  }, [mermaidInitialized, renderMermaidDiagrams]); // Only depend on initialization, not content changes

  // Mermaid renders naturally through React markdown component

  // Text selection and highlighting functions for artifact content
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.length > 5) { // Minimum 5 characters for meaningful selection
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Check if selection is within our artifact content
      const contentElement = artifactContentRef.current;
      
      // Check if selection is within a mermaid diagram (avoid interfering with SVG)
      let isMermaidSelection = false;
      let node = range.commonAncestorContainer;
      
      // Walk up the DOM tree to check for mermaid class
      while (node && node.nodeType !== Node.DOCUMENT_NODE) {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList?.contains('mermaid')) {
          isMermaidSelection = true;
          break;
        }
        node = node.parentNode;
      }
      
      if (contentElement && contentElement.contains(range.commonAncestorContainer) && !isMermaidSelection) {
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
    
    // Re-render mermaid diagrams after context menu closes to fix rendering issues
    setTimeout(() => {
      if (mermaidInitialized) {
        try {
          // Compatibility check for mermaid API
          if (typeof mermaid.run === 'function') {
            mermaid.run({ querySelector: '.mermaid:not([data-processed])' });
          } else {
            mermaid.init(undefined, '.mermaid');
          }
        } catch (e) {
          console.warn('Mermaid re-rendering after context menu close:', e);
        }
      }
    }, 100);
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
    if (onScopedInstruction) {
      onScopedInstruction({
        type: actionType,
        highlightedText: text,
        artifactId: artifact?.id,
        highlightId: highlightId
      });
    }

    closeContextMenu();
  };

  // Close context menu when clicking outside and re-render mermaid
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu && !e.target.closest('.artifact-context-menu')) {
        closeContextMenu();
        // Skip automatic mermaid re-render after context menu close to prevent DOM corruption
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu]);
  
  // Force mermaid re-render when saving changes
  const handleSaveChanges = async () => {
    if (artifact) {
      await onUpdate(artifact.id, {
        title: editedTitle,
        content: editedContent
      });
      setIsEditing(false);
      setSplitView(false);
      
      // Skip automatic mermaid re-render after save to prevent DOM corruption
    }
  };
  
  // handleSaveChanges is now defined above in the useEffect section
  
  const handleStartEditing = () => {
    setIsEditing(true);
    // Note: The useEffect will handle auto-collapsing chat and showing preview
  };
  
  const handleDownload = () => {
    if (artifact) {
      onDownload(artifact.id);
    }
  };

  const handleDownloadSequenceDiagram = async (diagramElement) => {
    try {
      // Get the SVG element
      const svgElement = diagramElement.querySelector('svg');
      if (!svgElement) return;

      // Clone the SVG to avoid modifying the original
      const svgClone = svgElement.cloneNode(true);
      
      // Add viewBox if not present to ensure proper scaling
      if (!svgClone.getAttribute('viewBox')) {
        const width = svgClone.getAttribute('width');
        const height = svgClone.getAttribute('height');
        if (width && height) {
          svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }
      }

      // Convert SVG to string
      const svgData = new XMLSerializer().serializeToString(svgClone);
      
      // Create a Blob with the SVG data
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      
      // Create download link
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.download = `sequence_diagram_${Date.now()}.svg`;
      link.href = url;
      link.click();
      
      // Cleanup
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading sequence diagram:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className={`${className} border-l border-gray-200 bg-gray-50 flex items-center justify-center`}>
        <div className="text-center text-gray-500">
          <div className="flex space-x-2">
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`${className} border-l border-gray-200 bg-gray-50 flex items-center justify-center`}>
        <div className="text-center text-red-500">
          <p>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!artifact) {
    return (
      <div className={`${className} border-l border-gray-200 bg-gray-50 flex items-center justify-center`}>
        <div className="text-center text-gray-500">
          <FileTextIcon size={48} className="mx-auto mb-4 opacity-30" />
          <p>No artifact selected</p>
        </div>
      </div>
    );
  }
  
  // Custom renderer for code blocks
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      
      // Special handling for mermaid with error handling
      if (!inline && match && match[1] === 'mermaid') {
        const rawCode = String(children).trim();
        // Fix HTML entity encoding issues
        const diagramCode = rawCode
          .replace(/&gt;&gt;/g, '>>')
          .replace(/&lt;&lt;/g, '<<')
          .replace(/&amp;/g, '&');
        const diagramId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Debug logging for mermaid diagram processing
        console.log('🎨 Processing Mermaid diagram:', {
          diagramId,
          codeLength: diagramCode.length,
          codePreview: diagramCode.substring(0, 100) + '...',
          hasValidStart: diagramCode.includes('sequenceDiagram') || diagramCode.includes('graph') || diagramCode.includes('flowchart'),
          children: children,
          childrenType: typeof children
        });
        
        // Validate diagram code before rendering
        if (!diagramCode) {
          console.error('❌ Mermaid: Empty diagram code detected');
          return (
            <div className="my-6 border border-red-200 rounded-lg bg-red-50 p-4">
              <div className="text-red-700 text-sm">
                <strong>Mermaid Error:</strong> Empty diagram code
              </div>
            </div>
          );
        }
        
        return (
          <ErrorBoundary 
            fallback={
              <div className="my-6 border border-red-200 rounded-lg bg-red-50 p-4">
                <div className="text-red-700 text-sm">
                  <strong>Mermaid Error:</strong> Failed to render diagram
                </div>
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer">Show diagram code</summary>
                  <pre className="mt-2 p-2 bg-red-100 rounded text-red-800 overflow-x-auto">
                    {diagramCode}
                  </pre>
                </details>
              </div>
            }
          >
            <div className="my-6 border border-gray-200 rounded-lg overflow-hidden relative group">
              <div 
                id={diagramId}
                className="mermaid bg-white p-4" 
                style={{ textAlign: 'center' }}
                data-original-text={diagramCode}
                data-diagram-validated="true"
                suppressHydrationWarning={true}
                ref={(el) => {
                  // Trigger mermaid render when element is mounted
                  if (el && mermaidInitialized) {
                    setTimeout(() => {
                      try {
                        console.log('🎨 Triggering mermaid for element:', diagramId);
                        if (typeof mermaid.run === 'function') {
                          mermaid.run({ querySelector: `#${diagramId}` }).catch(error => {
                            console.warn('Mermaid render error for', diagramId, ':', error);
                          });
                        } else {
                          mermaid.init(undefined, `#${diagramId}`);
                        }
                      } catch (error) {
                        console.warn('Mermaid init error for', diagramId, ':', error);
                      }
                    }, 100);
                  }
                }}
              >
                {diagramCode}
              </div>
              <button
                onClick={(e) => handleDownloadSequenceDiagram(e.currentTarget.parentElement)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100"
                title="Download diagram"
              >
                <DownloadIcon size={16} />
              </button>
            </div>
          </ErrorBoundary>
        );
      }
      
      // Regular syntax highlighting for other code
      return !inline && match ? (
        <SyntaxHighlighter
          style={nord}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    img({ src, alt }) {
      // Handle images with proper styling
      return (
        <div className="my-6">
          <img 
            src={src} 
            alt={alt || "Image"} 
            className="max-w-full border border-gray-200 rounded-lg shadow-md" 
          />
          {alt && alt !== "Image" && (
            <p className="text-center text-sm text-gray-500 mt-2">{alt}</p>
          )}
        </div>
      );
    }
  };

  // Context Menu Component for artifact highlighting
  const ArtifactContextMenu = () => {
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
        className="artifact-context-menu fixed z-[1000] bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
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
    <div className={`${className} border-l border-gray-200 bg-white flex flex-col overflow-hidden transition-all duration-300 ease-in-out`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="font-medium flex items-center">
          <button
            onClick={() => {
              const newState = !isChatCollapsed;
              onToggleChatCollapse && onToggleChatCollapse(newState);
            }}
            className="p-2 mr-2 text-gray-500 hover:text-gray-700 transition-colors"
            title={isChatCollapsed ? "Expand chat" : "Collapse chat"}
          >
            {isChatCollapsed ? <ExpandIcon size={16} /> : <CollapseIcon size={16} />}
          </button>
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 w-64"
              placeholder="Artifact title"
            />
          ) : (
            artifact.title
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setSplitView(!splitView)}
                className={`p-2 ${splitView ? 'text-blue-600' : 'text-gray-500'} hover:text-blue-700 transition-colors`}
                title={splitView ? "Hide preview" : "Show preview"}
              >
                <SplitViewIcon size={16} />
              </button>
              <button
                onClick={handleSaveChanges}
                className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                title="Save changes"
              >
                <SaveIcon size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStartEditing}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Edit artifact"
              >
                <EditIcon size={16} />
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Download markdown"
              >
                <DownloadIcon size={16} />
              </button>
            </>
          )}
          
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Close panel"
          >
            <XIcon size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isEditing ? (
          splitView ? (
            // Split view with editor and preview
            <div className="h-full flex">
              <div className="w-1/2 h-full border-r border-gray-200">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-full p-4 border-none resize-none focus:ring-0 focus:outline-none"
                  placeholder="Enter markdown content..."
                />
              </div>
              <div className="w-1/2 h-full overflow-auto">
                <div className="p-6 prose prose-blue max-w-none">
                  <ErrorBoundary>
                    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
                      {editedContent}
                    </ReactMarkdown>
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          ) : (
            // Editor only
            <div className="h-full">
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-full p-4 border-none resize-none focus:ring-0 focus:outline-none"
                placeholder="Enter markdown content..."
              />
            </div>
          )
        ) : (
          // View mode with highlighting
          <div 
            ref={artifactContentRef}
            className="p-6 prose prose-blue max-w-none highlightable-content artifact-content"
            onMouseUp={handleMouseUp}
          >
            <ErrorBoundary>
              <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
                {artifact.content}
              </ReactMarkdown>
            </ErrorBoundary>
            
            {/* Highlights Summary */}
            {highlights.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <div className="text-sm text-blue-700 font-medium mb-2">Active Highlights:</div>
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
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 text-xs text-gray-500 bg-gray-50">
        Last updated: {new Date(artifact.updated_at || artifact.created_at).toLocaleString()}
      </div>

      {/* Context menu for artifact highlighting */}
      <ArtifactContextMenu />
    </div>
  );
};