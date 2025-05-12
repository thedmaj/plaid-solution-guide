import React, { useState, useEffect, useRef } from 'react';
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
  ChevronRight as ExpandIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';

export const ArtifactPanel = ({ 
  artifact, 
  onUpdate, 
  onDownload, 
  onClose,
  onToggleChatCollapse,
  isChatCollapsed,
  className = 'w-1/2'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [downloadFormat, setDownloadFormat] = useState('markdown');
  const [splitView, setSplitView] = useState(false);
  const [mermaidInitialized, setMermaidInitialized] = useState(false);
  
  // Initialize mermaid once the component mounts
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: true,
        theme: 'default',
        securityLevel: 'loose'
      });
      setMermaidInitialized(true);
    } catch (error) {
      console.error('Error initializing mermaid:', error);
    }
  }, []);
  
  // Update local state when artifact changes
  useEffect(() => {
    if (artifact) {
      setEditedContent(artifact.content);
      setEditedTitle(artifact.title);
    }
  }, [artifact]);
  
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
  
  // Simplified render approach - just let mermaid handle it
  useEffect(() => {
    if (mermaidInitialized) {
      setTimeout(() => {
        try {
          mermaid.init('.mermaid');
        } catch (e) {
          console.warn('Mermaid rendering error:', e);
        }
      }, 100);
    }
  }, [editedContent, isEditing, splitView, isChatCollapsed, mermaidInitialized]);
  
  const handleSaveChanges = () => {
    if (artifact) {
      onUpdate(artifact.id, {
        title: editedTitle,
        content: editedContent
      });
      setIsEditing(false);
      setSplitView(false);
    }
  };
  
  const handleStartEditing = () => {
    setIsEditing(true);
    // Note: The useEffect will handle auto-collapsing chat and showing preview
  };
  
  const handleDownload = (format) => {
    if (artifact) {
      onDownload(artifact.id, format);
    }
  };
  
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
      
      // Special handling for mermaid
      if (!inline && match && match[1] === 'mermaid') {
        const diagramCode = String(children).trim();
        return (
          <div className="my-6 border border-gray-200 rounded-lg overflow-hidden">
            <div className="mermaid bg-white p-4" style={{ textAlign: 'center' }}>
              {diagramCode}
            </div>
          </div>
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
            <button
              onClick={handleStartEditing}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Edit artifact"
            >
              <EditIcon size={16} />
            </button>
          )}
          
          <div className="relative group">
            <button
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Download"
            >
              <DownloadIcon size={16} />
            </button>
            
            <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg overflow-hidden z-20 invisible group-hover:visible">
              <div className="py-1">
                <button
                  onClick={() => handleDownload('markdown')}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left flex items-center gap-2"
                >
                  <FileTextIcon size={14} />
                  <span>Markdown</span>
                </button>
                <button
                  onClick={() => handleDownload('docx')}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left flex items-center gap-2"
                >
                  <FileIcon size={14} />
                  <span>Word (DOCX)</span>
                </button>
                <button
                  onClick={() => handleDownload('pdf')}
                  className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left flex items-center gap-2"
                >
                  <FileIcon size={14} />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>
          
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
                  <ReactMarkdown components={components}>
                    {editedContent}
                  </ReactMarkdown>
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
          // View mode
          <div className="p-6 prose prose-blue max-w-none">
            <ReactMarkdown components={components}>
              {artifact.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 text-xs text-gray-500 bg-gray-50">
        Last updated: {new Date(artifact.updated_at || artifact.created_at).toLocaleString()}
      </div>
    </div>
  );
};