import React from 'react';
import { FileIcon, CopyIcon, CheckIcon, BookmarkIcon, GitMerge } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import remarkGfm from 'remark-gfm';
import { ErrorBoundary } from './ErrorBoundary';

export const Message = ({ message, onCreateArtifact, onMergeWithArtifact, markdownComponents, hasExistingArtifacts = false }) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  console.log("Rendering markdown content:", message.content, typeof message.content);
  
  return (
    <div 
      className={`flex gap-4 p-4 ${
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
            C
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-1">
          <div className="font-medium">
            {message.role === 'user' ? message.sender || 'You' : 'Claude'}
          </div>
          <div className="ml-2 text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
        
        <div className="prose prose-blue max-w-none">
          <ErrorBoundary>
            {console.log('About to render markdown in Message.jsx:', message.content)}
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
          
          {message.content && message.content.length > 100 && (
            <>
              <button
                onClick={() => {
                  console.log('🎯 Create artifact button clicked in Message.jsx');
                  if (onCreateArtifact) {
                    onCreateArtifact();
                  } else {
                    console.error('❌ onCreateArtifact prop is missing');
                  }
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1"
                title="Save as artifact"
              >
                <BookmarkIcon size={16} />
              </button>
              
              {hasExistingArtifacts && onMergeWithArtifact && (
                <button
                  onClick={() => {
                    console.log('🔄 Merge artifact button clicked in Message.jsx');
                    if (onMergeWithArtifact) {
                      onMergeWithArtifact(message.content);
                    } else {
                      console.error('❌ onMergeWithArtifact prop is missing');
                    }
                  }}
                  className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                  title="Merge with existing artifact"
                >
                  <GitMerge size={16} />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
