import React, { useState, useRef, useEffect, useImperativeHandle, useMemo, useCallback } from 'react';
import { Message } from './Message';
import { HighlightableMessage } from './HighlightableMessage';
import { SendIcon, SparklesIcon } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TemplateSelector from './TemplateSelector';
import { buildPromptWithTemplate } from '../hooks/useTemplates';
import ArtifactIcon from './ArtifactIcon';

export const ChatWindow = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  isMergingContent, // New prop for merge loading state
  onCreateArtifact,
  onMergeWithArtifact, // New prop for merge functionality
  onCreateManualArtifact, // New prop for manual artifact creation
  currentSession,
  currentWorkspace, // Current workspace to check for existing artifacts
  isChatCollapsed,
  onModeChange,
  onProcessMessage, // New prop for processing messages for artifacts
  getLinkedArtifact, // New prop to get linked artifacts
  onDismissChange, // New prop to dismiss changes
  onViewArtifact, // New prop to view artifacts
  externalInputRef, // New prop to expose input control to parent
  artifacts = [], // All available artifacts
  onSendMessageWithTarget, // Enhanced send with target selection
  // Template system props
  selectedTemplate,
  onTemplateSelect,
  onCreateTemplate,
  onEditTemplate,
  // Merge mode props
  mergeMode = 'chat_only',
  onMergeModeChange,
  // Artifact handling props
  onDownloadArtifact,
  // Panel state props
  artifactPanelOpen = false, // New prop to track panel state
  selectedArtifact = null // New prop to track selected artifact
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Optimized: Pre-compute artifact mappings for O(1) lookups
  const artifactMappings = useMemo(() => {
    console.log('🔄 Recomputing artifact mappings with', artifacts.length, 'artifacts');
    artifacts.forEach(artifact => {
      console.log('📄 Artifact in mapping:', {
        id: artifact.id,
        title: artifact.title,
        contentLength: artifact.content?.length,
        version: artifact.metadata?.version,
        updated: artifact.updated_at
      });
    });
    
    const directIdMap = new Map(); // message.artifactId -> artifact
    const temporalMap = new Map(); // temporal key -> artifact
    const sessionArtifacts = []; // Store session artifacts for fallback
    
    artifacts.forEach(artifact => {
      // Direct artifact ID mapping (highest priority)
      if (artifact.id) {
        directIdMap.set(artifact.id, artifact);
      }
      
      // Session-based temporal mapping for auto-created artifacts
      if (artifact.metadata?.sessionId === currentSession?.id && artifact.metadata?.autoCreated) {
        sessionArtifacts.push(artifact);
        
        // Create temporal lookup key based on creation time
        if (artifact.created_at) {
          try {
            const artifactTime = new Date(artifact.created_at).getTime();
            // Create multiple temporal keys for 30-second window matching
            for (let offset = -30000; offset <= 30000; offset += 5000) {
              const timeKey = `temporal_${artifactTime + offset}`;
              if (!temporalMap.has(timeKey)) {
                temporalMap.set(timeKey, artifact);
              }
            }
          } catch (error) {
            // Handle invalid date gracefully
            console.warn('Invalid artifact creation date:', artifact.created_at);
          }
        }
      }
    });
    
    return {
      directIdMap,
      temporalMap,
      sessionArtifacts: sessionArtifacts.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    };
  }, [artifacts, currentSession?.id]);

  // CRITICAL: Optimized helper function with O(1) lookups
  // This function is essential for artifact icon display - DO NOT REMOVE OR MODIFY
  const getMessageArtifact = useCallback((message, messageIndex) => {
    // Null/undefined safety check
    if (!message) {
      console.log('🚫 ARTIFACT ICON: No message provided');
      return null;
    }
    
    // Priority 1: Check if message has direct artifact link
    if (message.artifactId) {
      const artifact = artifactMappings.directIdMap.get(message.artifactId);
      if (artifact) {
        console.log('✅ ARTIFACT ICON: Found artifact via direct ID:', {
          messageId: message.id,
          artifactId: message.artifactId,
          artifactTitle: artifact.title,
          artifactContentLength: artifact.content?.length,
          artifactVersion: artifact.metadata?.version
        });
        return artifact;
      } else {
        console.log('⚠️ ARTIFACT ICON: Message has artifactId but artifact not found in map:', {
          messageId: message.id,
          artifactId: message.artifactId,
          availableArtifacts: Array.from(artifactMappings.directIdMap.keys())
        });
      }
    }
    
    // Priority 2: For substantial assistant responses, use temporal matching
    if (message.role === 'assistant' && message.content?.length > 300) {
      // Try temporal mapping first (O(1) lookup)
      if (message.timestamp) {
        try {
          const messageTime = new Date(message.timestamp).getTime();
          const temporalKey = `temporal_${Math.round(messageTime / 5000) * 5000}`; // Round to 5-second intervals
          const temporalArtifact = artifactMappings.temporalMap.get(temporalKey);
          if (temporalArtifact) {
            return temporalArtifact;
          }
        } catch (error) {
          // Handle invalid timestamp gracefully
          console.warn('Invalid message timestamp:', message.timestamp);
        }
      }
      
      // Fallback: Linear search through session artifacts (only when temporal fails)
      const messageTime = message.timestamp ? 
        new Date(message.timestamp).getTime() : 
        new Date().getTime();
      
      for (const artifact of artifactMappings.sessionArtifacts) {
        try {
          const artifactTime = new Date(artifact.created_at).getTime();
          if (Math.abs(artifactTime - messageTime) < 30000) {
            return artifact;
          }
        } catch (error) {
          // Skip artifacts with invalid dates
          continue;
        }
      }
    }
    
    return null;
  }, [artifactMappings]);
  

  // Expose input control to parent component
  useImperativeHandle(externalInputRef, () => ({
    setInput: (text) => {
      try {
        console.log('📝 ChatWindow: Setting input text:', text?.substring(0, 50) + '...');
        setInput(text);
        // Focus the input and position cursor at end
        if (inputRef.current) {
          inputRef.current.focus();
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(text.length, text.length);
            }
          }, 0);
        } else {
          console.warn('⚠️ ChatWindow: inputRef.current is null when setting input');
        }
      } catch (error) {
        console.error('❌ Error in ChatWindow setInput:', error);
      }
    },
    focusInput: () => {
      try {
        if (inputRef.current) {
          inputRef.current.focus();
        } else {
          console.warn('⚠️ ChatWindow: inputRef.current is null when focusing');
        }
      } catch (error) {
        console.error('❌ Error in ChatWindow focusInput:', error);
      }
    }
  }), []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Scroll to bottom when loading completes (to ensure artifact icons are visible)
  useEffect(() => {
    if (!isLoading && !isMergingContent) {
      // Longer delay to ensure artifact icons are fully rendered
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  }, [isLoading, isMergingContent]);
  
  // Scroll to bottom when artifacts change (new icons appear)
  useEffect(() => {
    if (artifacts.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  }, [artifacts.length]);
  
  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !isChatCollapsed) {
      inputRef.current.focus();
    }
  }, [isChatCollapsed]);
  
  
  const scrollToBottom = () => {
    // Use setTimeout to ensure all content (including artifact icons) is rendered
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !isMergingContent) {
      // Apply template if selected
      let messageToSend = input;
      if (selectedTemplate) {
        messageToSend = buildPromptWithTemplate(input, selectedTemplate);
        console.log('📋 Using template:', selectedTemplate.name);
      }
      
      // Send the message with template information
      onSendMessage(messageToSend, selectedTemplate);
      setInput('');
    }
  };
  

  // Handler for save as artifact button - always shows dialog for choice
  const handleSaveAsArtifact = (content) => {
    console.log('🎯 ChatWindow handleSaveAsArtifact called:', { contentLength: content?.length });
    const title = `Guide ${new Date().toLocaleString()}`;
    if (onCreateArtifact) {
      onCreateArtifact(title, content);
    } else {
      console.error('❌ onCreateArtifact prop is missing in ChatWindow');
    }
  };

  const handleMergeWithArtifact = (content) => {
    console.log('🔄 ChatWindow handleMergeWithArtifact called:', { contentLength: content?.length });
    const title = `Guide ${new Date().toLocaleString()}`;
    if (onMergeWithArtifact) {
      // Use the dedicated merge handler
      onMergeWithArtifact(title, content);
    } else {
      console.error('❌ onMergeWithArtifact prop is missing in ChatWindow');
    }
  };

  // Check if there are existing artifacts for merge functionality
  const hasExistingArtifacts = artifacts.length > 0;

  // Debug logging (reduced frequency to prevent spam)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 ChatWindow state:', {
        hasCurrentWorkspace: !!currentWorkspace,
        hasPrimaryArtifact: !!currentWorkspace?.primaryArtifact,
        supplementaryCount: currentWorkspace?.supplementaryArtifacts?.length || 0,
        totalArtifacts: artifacts.length,
        hasExistingArtifacts,
        sessionId: currentSession?.id
      });
    }
  }, [currentWorkspace?.primaryArtifact?.id, artifacts.length, currentSession?.id]);

  const handleScopedInstruction = (scopedData) => {
    const { type, highlightedText } = scopedData;
    
    // Create a contextual prompt based on the action type
    let prompt = '';
    const context = `Original content: "${highlightedText}"`;
    
    switch (type) {
      case 'question':
        prompt = `I have a question about this specific part of the solution guide:\n\n${context}\n\nMy question: `;
        break;
      case 'modify':
        prompt = `Please modify this specific section of the solution guide:\n\n${context}\n\nModification needed: `;
        break;
      case 'code':
        prompt = `Please provide code examples for this section:\n\n${context}\n\nSpecific code request: `;
        break;
      case 'expand':
        prompt = `Please provide more detailed explanation for this section:\n\n${context}\n\nWhat I need expanded: `;
        break;
      default:
        prompt = `Regarding this section: "${highlightedText}"\n\n`;
    }
    
    // Set the prompt in the input field for user to complete
    setInput(prompt);
    
    // Focus the input field
    if (inputRef.current) {
      inputRef.current.focus();
      // Position cursor at the end
      setTimeout(() => {
        const textarea = inputRef.current;
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }, 0);
    }
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
                "Generate a solution guide for integrating Plaid Link web SDK with products auth and identity",
                "Generate a solution guide with implementing Consumer Report base report. Include a mermaid sequence diagram for all API calls",
                "Generate a solution guide the integrating Plaid Transfers. Include a sequence diagram for all API calls including sweeping funds",
                "List and describe all the fields in the transactions object returned by the transactions/sync product"
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
              // CRITICAL: Find artifact for this message to display artifact icon
              // This is essential for showing artifact icons in chat messages
              const messageArtifact = getMessageArtifact(message, index);
              
              // CRITICAL: Debug logging for artifact icon visibility - DO NOT REMOVE
              // This helps identify when artifact icons are missing
              if (message.role === 'assistant' && message.content?.length > 300) {
                console.log('🔍 ARTIFACT ICON: Checking message for artifact:', {
                  messageId: message.id,
                  hasArtifactId: !!message.artifactId,
                  artifactId: message.artifactId,
                  foundArtifact: !!messageArtifact,
                  artifactTitle: messageArtifact?.title,
                  contentLength: message.content?.length,
                  timestamp: message.timestamp,
                  availableArtifacts: artifacts.length
                });
                
                // CRITICAL: Alert if substantial message has no artifact
                if (!messageArtifact && !message.loading && !message.streaming) {
                  console.warn('⚠️ ARTIFACT ICON: Substantial assistant message missing artifact!', {
                    messageId: message.id,
                    contentLength: message.content?.length,
                    messageTimestamp: message.timestamp,
                    availableArtifacts: artifacts.map(a => ({ id: a.id, title: a.title, created: a.created_at }))
                  });
                }
              }
              
              // Use HighlightableMessage for assistant responses with substantial content
              if (message.role === 'assistant' && message.content && message.content.length > 200) {
                const linkedArtifact = getLinkedArtifact ? getLinkedArtifact(message.id) : null;
                // Filter recent changes for this specific message
                const messageChanges = []; // TODO: Implement filtering logic
                
                return (
                  <div key={index}>
                    <HighlightableMessage 
                      message={message} 
                      onScopedInstruction={handleScopedInstruction}
                      markdownComponents={components}
                      linkedArtifact={linkedArtifact}
                      recentChanges={messageChanges}
                      onViewArtifact={onViewArtifact}
                      onDismissChange={onDismissChange}
                      onCreateArtifact={() => handleSaveAsArtifact(message.content)}
                      onMergeWithArtifact={() => handleMergeWithArtifact(message.content)}
                      hasExistingArtifacts={hasExistingArtifacts}
                    />
                    {/* ======================================================= */}
                    {/* CRITICAL SECTION: ARTIFACT ICON DISPLAY - DO NOT REMOVE */}
                    {/* ======================================================= */}
                    {/* This displays the artifact icon after HighlightableMessage components */}
                    {/* Removing this will break artifact icon functionality completely */}
                    {/* This code is ESSENTIAL for showing artifact icons in chat */}
                    {messageArtifact && (
                      <ArtifactIcon
                        artifact={messageArtifact}
                        onView={onViewArtifact}
                        onDownload={onDownloadArtifact}
                        className="ml-12 -mt-2"
                        isArtifactPanelOpen={artifactPanelOpen && selectedArtifact?.id === messageArtifact.id}
                      />
                    )}
                    {/* ======================================================= */}
                    {/* END CRITICAL SECTION: ARTIFACT ICON DISPLAY */}
                    {/* ======================================================= */}
                  </div>
                );
              }
              
              // Use regular Message for user messages and short assistant responses
              return (
                <div key={index}>
                  <Message 
                    message={message} 
                    markdownComponents={components}
                    onCreateArtifact={() => handleSaveAsArtifact(message.content)}
                    onMergeWithArtifact={() => handleMergeWithArtifact(message.content)}
                    hasExistingArtifacts={hasExistingArtifacts}
                  />
                  {/* ======================================================= */}
                  {/* CRITICAL SECTION: ARTIFACT ICON DISPLAY - DO NOT REMOVE */}
                  {/* ======================================================= */}
                  {/* This displays the artifact icon after regular Message components */}
                  {/* Removing this will break artifact icon functionality completely */}
                  {/* This code is ESSENTIAL for showing artifact icons in chat */}
                  {messageArtifact && (
                    <ArtifactIcon
                      artifact={messageArtifact}
                      onView={onViewArtifact}
                      onDownload={onDownloadArtifact}
                      className="ml-12 -mt-2"
                      isArtifactPanelOpen={artifactPanelOpen && selectedArtifact?.id === messageArtifact.id}
                    />
                  )}
                  {/* ======================================================= */}
                  {/* END CRITICAL SECTION: ARTIFACT ICON DISPLAY */}
                  {/* ======================================================= */}
                </div>
              );
            })}
            {isLoading && !isMergingContent && (
              <div className="flex items-center space-x-2 p-4 rounded-lg bg-gray-50 max-w-3xl my-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            )}
            {isMergingContent && (
              <div className="flex items-center space-x-2 p-4 rounded-lg bg-blue-50 border border-blue-200 max-w-3xl my-2">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-blue-700 font-medium">Merging content... Please wait</span>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Template Selector */}
          <TemplateSelector
            selectedTemplateId={selectedTemplate?.id}
            onTemplateSelect={onTemplateSelect}
            onCreateTemplate={onCreateTemplate}
            onEditTemplate={onEditTemplate}
          />
          
          
          {/* Merge Mode Selector */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <label htmlFor="merge-mode" className="text-sm font-medium text-gray-700">
                Response Mode:
              </label>
              <select
                id="merge-mode"
                value={mergeMode}
                onChange={(e) => onMergeModeChange?.(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="chat_only">Chat Only</option>
                <option value="merge_response">Merge Response</option>
              </select>
            </div>
            <div className="text-xs text-gray-500">
              {mergeMode === 'chat_only' ? 
                'Responses stay in chat' : 
                'Responses auto-merge to guide'
              }
            </div>
          </div>
          
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isMergingContent ? "AI is merging content..." : "Ask a question about Plaid..."}
                disabled={isMergingContent}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition ${
                  isMergingContent ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                rows={1}
                style={{ minHeight: '44px', maxHeight: '200px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !isMergingContent) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || isMergingContent || !input.trim()}
              className={`p-3 rounded-lg ${
                isLoading || isMergingContent || !input.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } transition-colors`}
            >
              <SendIcon size={20} />
            </button>
          </div>
        </form>
        <div className="text-xs text-gray-500 mt-2 text-center">
          {selectedTemplate 
            ? `📋 Using Template: ${selectedTemplate.name}`
            : 'AI Assistant is connected to Plaid documentation via AskBill'
          }
        </div>
      </div>
    </div>
  );
};