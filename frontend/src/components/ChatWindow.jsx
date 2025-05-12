import React, { useState, useRef, useEffect } from 'react';
import { Message } from './Message';
import { SendIcon, SparklesIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const ChatWindow = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  onCreateArtifact,
  currentSession,
  isChatCollapsed
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !isChatCollapsed) {
      inputRef.current.focus();
    }
  }, [isChatCollapsed]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };
  
  const handleCreateArtifactFromMessage = (content) => {
    const title = `Guide ${new Date().toLocaleString()}`;
    onCreateArtifact(title, content);
  };
  
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
  
  // If chat is collapsed, return an empty div
  if (isChatCollapsed) {
    return <div className="hidden"></div>;
  }
  
  return (
    <div className="flex flex-col h-full flex-1 overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <SparklesIcon size={48} className="text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Plaid Solution Guide Assistant
            </h2>
            <p className="text-gray-600 max-w-md mb-6">
              Ask questions about Plaid APIs, create implementation guides, or generate code samples for specific use cases.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {[
                "How do I implement Plaid Link?",
                "Create a guide for ACH payments",
                "What's the best way to handle webhook verification?",
                "Generate a sample app for balance checking"
              ].map((suggestion, i) => (
                <button
                  key={i}
                  className="p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setInput(suggestion);
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              return (
                <Message 
                  key={index} 
                  message={message} 
                  onCreateArtifact={() => handleCreateArtifactFromMessage(message.content)} 
                  markdownComponents={components}
                />
              );
            })}
            {isLoading && (
              <div className="flex items-center space-x-2 p-4 rounded-lg bg-gray-50 max-w-3xl my-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about Plaid..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '200px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={`p-3 rounded-lg ${
              isLoading || !input.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } transition-colors`}
          >
            <SendIcon size={20} />
          </button>
        </form>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Claude AI is connected to Plaid documentation via AskBill
        </div>
      </div>
    </div>
  );
};