import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { Message } from './Message';
import { HighlightableMessage } from './HighlightableMessage';
import { SendIcon, SparklesIcon, FileTextIcon, PlusIcon, EditIcon, ChevronDownIcon } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { nord } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatModeSelector } from './ChatModeSelector';
import { ArtifactTargeting } from '../utils/artifactTargeting';
import TemplateSelector from './TemplateSelector';
import { buildPromptWithTemplate } from '../hooks/useTemplates';

export const ChatWindow = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  onCreateArtifact,
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
  onEditTemplate
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Artifact targeting state
  const [targetMode, setTargetMode] = useState('auto'); // 'auto', 'update', 'create'
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [targetingAnalysis, setTargetingAnalysis] = useState(null);

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
  
  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !isChatCollapsed) {
      inputRef.current.focus();
    }
  }, [isChatCollapsed]);
  
  // Analyze message for artifact targeting
  useEffect(() => {
    if (input.trim()) {
      const sessionArtifacts = ArtifactTargeting.getSessionArtifacts(artifacts, currentSession?.id);
      const analysis = ArtifactTargeting.analyzeModificationIntent(input, sessionArtifacts);
      setTargetingAnalysis(analysis);
      
      // Auto-set target mode based on analysis
      if (targetMode === 'auto') {
        if (analysis.isModification && analysis.suggestedArtifact) {
          setSelectedArtifact(analysis.suggestedArtifact);
        } else {
          setSelectedArtifact(null);
        }
      }
    } else {
      setTargetingAnalysis(null);
      if (targetMode === 'auto') {
        setSelectedArtifact(null);
      }
    }
  }, [input, artifacts, currentSession?.id, targetMode]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      // Determine target artifact based on mode
      let targetArtifact = null;
      if (targetMode === 'update' || (targetMode === 'auto' && selectedArtifact)) {
        targetArtifact = selectedArtifact;
      }
      
      // Apply template if selected
      let messageToSend = input;
      if (selectedTemplate) {
        messageToSend = buildPromptWithTemplate(input, selectedTemplate);
        console.log('📋 Using template:', selectedTemplate.name);
      }
      
      // Use enhanced send function if available
      if (onSendMessageWithTarget) {
        onSendMessageWithTarget(messageToSend, targetArtifact?.id);
      } else {
        onSendMessage(messageToSend);
      }
      
      setInput('');
      setTargetingAnalysis(null);
      setTargetMode('auto');
      setSelectedArtifact(null);
    }
  };
  

  // Handler for save as artifact button - always shows dialog for choice
  const handleSaveAsArtifact = (content) => {
    const title = `Guide ${new Date().toLocaleString()}`;
    onCreateArtifact(title, content);
  };

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
            <ChatModeSelector 
              selectedMode={currentSession?.mode || 'solution_guide'} 
              onModeChange={onModeChange}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
              {[
                "Generate a solution guide for integrating Plaid Link web SDK with products auth and identity",
                "Generate a solution guide with implementing CRA base report. Include a mermaid sequence diagram for all API calls",
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
            <ChatModeSelector 
              selectedMode={currentSession?.mode || 'solution_guide'} 
              onModeChange={onModeChange}
            />
            {messages.map((message, index) => {
              // Use HighlightableMessage for assistant responses with substantial content
              if (message.role === 'assistant' && message.content && message.content.length > 200) {
                const linkedArtifact = getLinkedArtifact ? getLinkedArtifact(message.id) : null;
                // Filter recent changes for this specific message
                const messageChanges = []; // TODO: Implement filtering logic
                
                return (
                  <HighlightableMessage 
                    key={index} 
                    message={message} 
                    onCreateArtifact={() => handleSaveAsArtifact(message.content)}
                    onCreateManualArtifact={onCreateManualArtifact}
                    onScopedInstruction={handleScopedInstruction}
                    markdownComponents={components}
                    linkedArtifact={linkedArtifact}
                    recentChanges={messageChanges}
                    onViewArtifact={onViewArtifact}
                    onDismissChange={onDismissChange}
                  />
                );
              }
              
              // Use regular Message for user messages and short assistant responses
              return (
                <Message 
                  key={index} 
                  message={message} 
                  onCreateArtifact={() => handleSaveAsArtifact(message.content)}
                  onCreateManualArtifact={onCreateManualArtifact}
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
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Template Selector */}
          <TemplateSelector
            selectedTemplateId={selectedTemplate?.id}
            onTemplateSelect={onTemplateSelect}
            onCreateTemplate={onCreateTemplate}
            onEditTemplate={onEditTemplate}
          />
          
          {/* Artifact Targeting UI */}
          {targetingAnalysis && ArtifactTargeting.getSessionArtifacts(artifacts, currentSession?.id).length > 0 && (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm">
                {targetMode === 'auto' && targetingAnalysis.isModification ? (
                  <>
                    <EditIcon size={14} className="text-blue-600" />
                    <span className="text-gray-700">
                      Will update: <strong>{selectedArtifact?.title || 'Latest artifact'}</strong>
                    </span>
                    <span className="text-xs text-gray-500">({targetingAnalysis.confidence > 0.7 ? 'High' : targetingAnalysis.confidence > 0.5 ? 'Medium' : 'Low'} confidence)</span>
                  </>
                ) : targetMode === 'update' && selectedArtifact ? (
                  <>
                    <EditIcon size={14} className="text-blue-600" />
                    <span className="text-gray-700">
                      Will update: <strong>{selectedArtifact.title}</strong>
                    </span>
                  </>
                ) : (
                  <>
                    <PlusIcon size={14} className="text-green-600" />
                    <span className="text-gray-700">Will create new artifact</span>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTargetSelector(!showTargetSelector)}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-white border rounded hover:bg-gray-50"
                  >
                    {targetMode === 'auto' ? 'Auto' : targetMode === 'update' ? 'Update' : 'Create'}
                    <ChevronDownIcon size={12} />
                  </button>
                  
                  {showTargetSelector && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowTargetSelector(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-1 z-20 min-w-48">
                        <button
                          type="button"
                          onClick={() => { setTargetMode('auto'); setShowTargetSelector(false); }}
                          className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 ${
                            targetMode === 'auto' ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          Auto-detect (recommended)
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTargetMode('create'); setShowTargetSelector(false); }}
                          className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 ${
                            targetMode === 'create' ? 'bg-green-50 text-green-700' : ''
                          }`}
                        >
                          Always create new
                        </button>
                        {ArtifactTargeting.getSessionArtifacts(artifacts, currentSession?.id).length > 0 && (
                          <>
                            <div className="border-t my-1" />
                            <div className="px-2 py-1 text-xs text-gray-500 font-medium">Update existing:</div>
                            {ArtifactTargeting.getSessionArtifacts(artifacts, currentSession?.id).map(artifact => (
                              <button
                                key={artifact.id}
                                type="button"
                                onClick={() => {
                                  setTargetMode('update');
                                  setSelectedArtifact(artifact);
                                  setShowTargetSelector(false);
                                }}
                                className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-50 ${
                                  targetMode === 'update' && selectedArtifact?.id === artifact.id ? 'bg-orange-50 text-orange-700' : ''
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <FileTextIcon size={10} />
                                  <span className="truncate">{artifact.title}</span>
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex items-end space-x-2">
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
          </div>
        </form>
        <div className="text-xs text-gray-500 mt-2 text-center">
          Claude AI is connected to Plaid documentation via AskBill
        </div>
      </div>
    </div>
  );
};