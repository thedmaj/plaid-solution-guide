import React, { useState, useEffect } from 'react';
import { 
  XIcon, 
  DownloadIcon, 
  FileTextIcon, 
  FileIcon, 
  CheckIcon,
  EditIcon,
  SaveIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const ArtifactPanel = ({ 
  artifact, 
  onUpdate, 
  onDownload, 
  onClose 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [downloadFormat, setDownloadFormat] = useState('markdown');
  
  useEffect(() => {
    if (artifact) {
      setEditedContent(artifact.content);
      setEditedTitle(artifact.title);
    }
  }, [artifact]);
  
  const handleSaveChanges = () => {
    if (artifact) {
      onUpdate(artifact.id, {
        title: editedTitle,
        content: editedContent
      });
      setIsEditing(false);
    }
  };
  
  const handleDownload = (format) => {
    if (artifact) {
      onDownload(artifact.id, format);
    }
  };
  
  if (!artifact) {
    return (
      <div className="w-1/2 border-l border-gray-200 bg-gray-50 flex items-center justify-center">
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
    }
  };
  
  return (
    <div className="w-1/2 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="font-medium">
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
            <button
              onClick={handleSaveChanges}
              className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
              title="Save changes"
            >
              <SaveIcon size={16} />
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
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
          <div className="h-full">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-full p-4 border-none resize-none focus:ring-0 focus:outline-none"
              placeholder="Enter markdown content..."
            />
          </div>
        ) : (
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