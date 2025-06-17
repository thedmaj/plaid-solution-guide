import React, { useState, useRef, useEffect } from 'react';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { ChatWindow } from './components/ChatWindow';
import { ArtifactPanel } from './components/ArtifactPanel';
import { Header } from './components/Header';
import { useAuth } from './hooks/useAuth';
import { useChatSession } from './hooks/useChatSession';
import { useSmartArtifacts } from './hooks/useSmartArtifacts';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GlobalNotifications } from './components/GlobalNotifications';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { useSessionWorkspace } from './hooks/useSessionWorkspace';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DebugPanel } from './components/DebugPanel';
import TemplateEditor from './components/TemplateEditor';
import TemplateLibrary from './components/TemplateLibrary';
import { TemplateProvider } from './contexts/TemplateContext';
import { ArtifactCreationDialog } from './components/ArtifactCreationDialog';
import { ContentMerger } from './utils/contentMerger';

function App() {
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const chatInputRef = useRef(null);
  
  // Track the current scoped instruction context
  const [pendingScopedInstruction, setPendingScopedInstruction] = useState(null);
  
  // Get smart artifacts hook first
  const { 
    artifacts, 
    selectedArtifact, 
    createArtifact, 
    updateArtifact, 
    downloadArtifact,
    selectArtifact,
    isLoading: artifactsLoading,
    error: artifactsError,
    processMessageForArtifacts,
    getLinkedArtifact,
    recentChanges,
    clearRecentChanges,
    dismissRecentChange
  } = useSmartArtifacts();

  const { 
    messages, 
    sendMessage, 
    isLoading: chatLoading, 
    currentSession,
    sessions,
    createNewSession,
    loadSession,
    deleteSession,
    handleModeChange
  } = useChatSession();

  // Get session workspace hook with artifact operations (after currentSession is defined)
  const workspaceArtifactOperations = {
    createArtifact,
    updateArtifact
  };
  
  const {
    currentWorkspace,
    workspaces,
    mergeSuggestions,
    workspaceSettings,
    processContentForWorkspace,
    handleMergeSuggestion,
    updateArtifactWithContent,
    createManualArtifact,
    getWorkspace,
    updateWorkspaceSettings
  } = useSessionWorkspace(currentSession?.id, artifacts, workspaceArtifactOperations);
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [artifactPanelOpen, setArtifactPanelOpen] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [workspaceMode, setWorkspaceMode] = useState(true); // Enable workspace features
  
  // Template system state
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Artifact creation dialog state
  const [artifactCreationDialog, setArtifactCreationDialog] = useState({
    isOpen: false,
    content: '',
    title: ''
  });
  
  // Debug dialog state changes
  useEffect(() => {
    console.log('🔍 DEBUG - artifactCreationDialog state:', artifactCreationDialog);
  }, [artifactCreationDialog]);

  // Global error handling
  useEffect(() => {
    const handleError = (event) => {
      console.error('🚨 Global error caught:', event.error);
      console.error('Error details:', {
        message: event.error?.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: event.type
      });
      
      // Check if this error might be causing [object Object] display
      if (event.error && typeof event.error === 'object') {
        console.error('🔍 Potential [object Object] source - error object:', event.error);
        console.error('Error object keys:', Object.keys(event.error));
      }
      
      // Prevent the default browser error handling that might show [object Object]
      event.preventDefault();
    };

    const handleUnhandledRejection = (event) => {
      console.error('🚨 Unhandled promise rejection:', event.reason);
      console.error('Promise rejection details:', {
        reason: event.reason,
        promise: event.promise,
        reasonType: typeof event.reason
      });
      
      // Check if this rejection might be causing [object Object] display
      if (event.reason && typeof event.reason === 'object') {
        console.error('🔍 Potential [object Object] source - rejection object:', event.reason);
        if (event.reason.message) {
          console.error('Rejection message:', event.reason.message);
        }
      }
      
      // Prevent the default browser rejection handling
      event.preventDefault();
    };

    // Also catch React errors at a higher level
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check for potential [object Object] in console errors
      args.forEach((arg, index) => {
        if (typeof arg === 'object' && arg !== null) {
          console.warn(`🔍 Console.error arg ${index} is an object:`, arg);
        }
      });
      originalConsoleError(...args);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, []);

  // Debug: Log workspace changes
  useEffect(() => {
    console.log('🏢 App.jsx: currentWorkspace updated:', currentWorkspace?.primaryArtifact?.title);
  }, [currentWorkspace]);

  // Process new assistant messages for workspace management
  useEffect(() => {
    const processLatestMessage = async () => {
      console.log('🔄 App.jsx: Processing latest message...', {
        messagesLength: messages.length,
        currentSession: currentSession?.id,
        pendingScope: pendingScopedInstruction?.artifactId
      });
      
      if (!messages.length || !currentSession) {
        console.log('❌ No messages or session, skipping processing');
        return;
      }
      
      const lastMessage = messages[messages.length - 1];
      console.log('📨 Last message:', {
        role: lastMessage.role,
        contentLength: lastMessage.content?.length,
        id: lastMessage.id
      });
      
      if (lastMessage.role !== 'assistant') {
        console.log('❌ Last message is not assistant, skipping');
        return;
      }
      
      try {
        // If this message is in response to a scoped instruction, use workspace update
        if (pendingScopedInstruction?.artifactId) {
          console.log('🎯 Processing scoped instruction for artifact:', pendingScopedInstruction.artifactId);
          const targetArtifact = artifacts.find(a => a.id === pendingScopedInstruction.artifactId);
          if (targetArtifact) {
            const updatedArtifact = await updateArtifactWithContent(
              targetArtifact, 
              lastMessage.content, 
              lastMessage.id,
              'scoped_instruction'
            );
            if (updatedArtifact) {
              console.log('🎯 App.jsx: Scoped instruction update completed, selecting artifact:', {
                artifactId: updatedArtifact.id,
                title: updatedArtifact.title,
                contentLength: updatedArtifact.content?.length
              });
              selectArtifact(updatedArtifact.id);
              setArtifactPanelOpen(true);
            }
          } else {
            console.warn('⚠️ Target artifact not found for scoped instruction');
          }
        } else {
          // Use workspace processing for new content
          console.log('🏢 Processing workspace content for new message');
          console.log('🔍 Last message structure:', lastMessage);
          const messageId = lastMessage.id || lastMessage.message_id || Date.now().toString();
          
          // Get the previous user message for context
          let userMessage = '';
          try {
            if (messages.length >= 2) {
              const userMsg = messages.find((msg, index) => 
                index < messages.length - 1 && 
                msg.role === 'user'
              );
              userMessage = userMsg?.content || '';
            }
            const userMsgPreview = userMessage && typeof userMessage === 'string' ? 
              userMessage.substring(0, 100) + '...' : 'No user message';
            console.log('📋 User message context:', userMsgPreview);
          } catch (error) {
            console.error('❌ Error finding user message:', error);
            userMessage = '';
          }
          
          const artifact = await processContentForWorkspace(
            lastMessage.content, 
            messageId, 
            currentSession.id,
            null, // forceTargetArtifactId
            true, // shouldAutoCreate
            userMessage, // pass user message for section targeting
            currentSession.title // pass session title for artifact naming
          );
          
          console.log('🏭 Workspace processing result:', artifact ? 'Artifact returned' : 'No artifact returned');
          
          if (artifact) {
            console.log('📄 App.jsx: Artifact processed, selecting and opening panel:', {
              artifactId: artifact.id,
              title: artifact.title,
              contentLength: artifact.content?.length
            });
            // Auto-open artifact panel if a new artifact was created
            setArtifactPanelOpen(true);
            selectArtifact(artifact.id);
          } else {
            console.log('❌ No artifact returned from workspace processing');
          }
        }
        
        // Clear pending scoped instruction
        setPendingScopedInstruction(null);
      } catch (error) {
        console.error('❌ Error processing message for workspace:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
    };

    processLatestMessage();
  }, [messages, currentSession?.id, pendingScopedInstruction?.artifactId]);
  
  const handleSendMessage = async (message) => {
    await sendMessage(message);
    // Artifact processing is now handled automatically by the handleNewAssistantMessage callback
  };
  
  const handleSendMessageWithTarget = async (message, targetArtifactId = null) => {
    // Store the target artifact for when the response arrives
    if (targetArtifactId) {
      setPendingScopedInstruction({ 
        artifactId: targetArtifactId, 
        type: 'modify', 
        highlightedText: 'conversation context' 
      });
    }
    
    await sendMessage(message);
  };
  
  const handleViewArtifact = (artifactId) => {
    selectArtifact(artifactId);
    setArtifactPanelOpen(true);
  };
  
  const handleCreateArtifact = (title, content, type = 'markdown') => {
    console.log('🎯 handleCreateArtifact called:', { 
      title, 
      contentLength: content?.length, 
      type,
      hasSession: !!currentSession,
      sessionId: currentSession?.id 
    });
    
    // Use workspace to check for existing artifacts instead of manually filtering
    const sessionArtifacts = currentWorkspace ? [
      ...(currentWorkspace.primaryArtifact ? [currentWorkspace.primaryArtifact] : []),
      ...currentWorkspace.supplementaryArtifacts
    ] : [];
    
    console.log('🔍 DEBUG - handleCreateArtifact:', {
      currentSessionId: currentSession?.id,
      hasWorkspace: !!currentWorkspace,
      hasPrimaryArtifact: !!currentWorkspace?.primaryArtifact,
      supplementaryCount: currentWorkspace?.supplementaryArtifacts?.length || 0,
      sessionArtifactsCount: sessionArtifacts.length,
      workspaceArtifacts: sessionArtifacts.map(a => ({ id: a.id, title: a.title }))
    });
    
    if (sessionArtifacts.length > 0) {
      console.log('✅ Opening merge dialog - found existing artifacts via workspace');
      // Open dialog to ask user's preference
      setArtifactCreationDialog({
        isOpen: true,
        content: content,
        title: title,
        type: type
      });
    } else {
      console.log('➕ Creating new artifact directly - no existing artifacts in workspace');
      // No existing artifacts, create new one directly
      createArtifact(title, content, type);
      setArtifactPanelOpen(true);
    }
  };

  const handleCreateManualArtifact = async (content, title) => {
    if (!currentSession) return;
    
    const artifact = await createManualArtifact(
      content, 
      title, 
      currentSession.id
    );
    
    if (artifact) {
      selectArtifact(artifact.id);
      setArtifactPanelOpen(true);
    }
  };

  const handleArtifactScopedInstruction = (scopedData) => {
    try {
      console.log('🎯 App.jsx: Handling artifact scoped instruction:', scopedData);
      
      const { type, highlightedText, artifactId } = scopedData;
      
      if (!artifactId || !type || !highlightedText) {
        console.error('❌ Invalid scoped data:', scopedData);
        return;
      }
      
      // Store the scoped instruction context for when the assistant responds
      setPendingScopedInstruction({ artifactId, type, highlightedText });
      
      // Create a contextual prompt based on the action type and artifact context
      let prompt = '';
      const artifact = artifacts.find(a => a.id === artifactId);
      
      if (!artifact) {
        console.error('❌ Artifact not found:', artifactId);
        return;
      }
      
      const context = `From artifact "${artifact?.title || 'Untitled'}": "${highlightedText}"`;
      
      switch (type) {
        case 'question':
          prompt = `I have a question about this specific part of the artifact:\n\n${context}\n\nMy question: `;
          break;
        case 'modify':
          prompt = `Please modify this specific section of the artifact:\n\n${context}\n\nModification needed: `;
          break;
        case 'code':
          prompt = `Please provide code examples for this section:\n\n${context}\n\nSpecific code request: `;
          break;
        case 'expand':
          prompt = `Please provide more detailed explanation for this section:\n\n${context}\n\nWhat I need expanded: `;
          break;
        default:
          prompt = `Regarding this section from the artifact: "${highlightedText}"\n\n`;
      }
      
      console.log('📝 Generated prompt:', prompt.substring(0, 100) + '...');
      
      // If chat is collapsed, expand it
      if (isChatCollapsed) {
        console.log('📱 Expanding chat from collapsed state');
        setIsChatCollapsed(false);
        
        // Wait for the transition to complete before setting input
        setTimeout(() => {
          if (chatInputRef.current) {
            console.log('🔗 Setting input via chatInputRef (after expand)');
            chatInputRef.current.setInput(prompt);
          } else {
            console.warn('⚠️ chatInputRef.current is null after expand');
          }
        }, 350); // Slightly longer than the CSS transition (300ms)
      } else {
        // Pre-fill chat input with the prompt immediately if chat is already expanded
        if (chatInputRef.current) {
          console.log('🔗 Setting input via chatInputRef (immediate)');
          chatInputRef.current.setInput(prompt);
        } else {
          console.warn('⚠️ chatInputRef.current is null');
        }
      }
    } catch (error) {
      console.error('❌ Error in handleArtifactScopedInstruction:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        scopedData
      });
    }
  };
  
  const handleToggleChatCollapse = (isCollapsed) => {
    try {
      console.log('🔄 App.jsx: Toggling chat collapse:', { from: isChatCollapsed, to: isCollapsed });
      setIsChatCollapsed(isCollapsed);
    } catch (error) {
      console.error('❌ Error in handleToggleChatCollapse:', error);
    }
  };

  // Template system handlers
  const handleCreateTemplate = () => {
    setEditingTemplateId(null);
    setTemplateEditorOpen(true);
  };

  const handleEditTemplate = (templateId) => {
    setEditingTemplateId(templateId);
    setTemplateEditorOpen(true);
  };

  const handleCloseTemplateEditor = () => {
    setTemplateEditorOpen(false);
    setEditingTemplateId(null);
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  // Artifact creation dialog handlers
  const handleCreateNewArtifact = async () => {
    const { content, title, type } = artifactCreationDialog;
    
    console.log('🆕 Creating new artifact via workspace system');
    
    // Use workspace system to create supplementary artifact
    if (currentSession) {
      const newArtifact = await createManualArtifact(content, title, currentSession.id, type || 'markdown');
      if (newArtifact) {
        selectArtifact(newArtifact.id);
        setArtifactPanelOpen(true);
      }
    } else {
      // Fallback to direct creation if no session
      const newArtifact = await createArtifact(title, content, type || 'markdown');
      setArtifactPanelOpen(true);
    }
    
    // Close the dialog
    setArtifactCreationDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleMergeWithExisting = async (selectedArtifact) => {
    const { content } = artifactCreationDialog;
    
    if (selectedArtifact && currentSession) {
      try {
        console.log('🔄 Starting merge process via workspace system:', {
          artifactId: selectedArtifact.id,
          originalLength: selectedArtifact.content?.length,
          newContentLength: content?.length
        });
        
        // Use workspace system to handle the merge
        const updatedArtifact = await updateArtifactWithContent(
          selectedArtifact, 
          content, 
          Date.now().toString(), // messageId
          'manual_merge'
        );
        
        console.log('✅ Workspace merge completed:', {
          updatedArtifactId: updatedArtifact?.id,
          updatedLength: updatedArtifact?.content?.length
        });
        
        // Force artifact panel to refresh with new content immediately
        if (updatedArtifact) {
          selectArtifact(updatedArtifact.id);
          setArtifactPanelOpen(true);
        } else {
          console.warn('⚠️ No artifact returned from workspace merge');
          // Fallback: re-select to trigger refresh
          selectArtifact(selectedArtifact.id);
          setArtifactPanelOpen(true);
        }
        
        // Close the dialog
        setArtifactCreationDialog(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error('Error merging content via workspace:', error);
        alert('Failed to merge content. Please try again.');
      }
    }
  };

  const handlePreviewMerge = async (existingContent, newContent) => {
    return ContentMerger.previewMerge(existingContent, newContent);
  };

  // Simplified workspace handling - auto-merge by default
  
  if (authLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <img src="/plaid-logo.svg" alt="Plaid Logo" className="h-12 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Welcome to Plaid Solution Guide</h1>
            <p className="text-gray-600 mt-2">Please sign in to continue</p>
          </div>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');
            try {
              await login(email, password);
            } catch (error) {
              console.error('Login failed:', error);
            }
          }} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                defaultValue="admin@example.com"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                defaultValue="admin123"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-800 text-white rounded hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  return (
    <TemplateProvider>
      <div className="flex h-screen bg-gray-50">
      <WorkspaceSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        currentSession={currentSession}
        onCreateNewSession={createNewSession}
        onSelectSession={(sessionId) => {
          try {
            console.log('🔄 App.jsx: Calling loadSession with:', { sessionId, type: typeof sessionId });
            loadSession(sessionId);
          } catch (error) {
            console.error('❌ App.jsx: Error calling loadSession:', error);
            console.error('Error details:', {
              message: error.message,
              stack: error.stack,
              sessionId,
              sessionIdType: typeof sessionId
            });
          }
        }}
        onDeleteSession={deleteSession}
        artifacts={artifacts}
        onSelectArtifact={selectArtifact}
        user={user}
        onLogout={logout}
        onToggleChatCollapse={handleToggleChatCollapse}
        onOpenArtifactPanel={setArtifactPanelOpen}
        workspaces={workspaces}
        workspaceMode={workspaceMode}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleArtifactPanel={() => setArtifactPanelOpen(!artifactPanelOpen)}
          artifactPanelOpen={artifactPanelOpen}
          currentSession={currentSession}
          isChatCollapsed={isChatCollapsed}
          onToggleChatCollapse={handleToggleChatCollapse}
          templateLibraryOpen={templateLibraryOpen}
          onToggleTemplateLibrary={() => setTemplateLibraryOpen(!templateLibraryOpen)}
          onDeleteSession={deleteSession}
        />
        
        {/* Workspace Header */}
        {currentWorkspace && (
          <WorkspaceHeader 
            workspace={currentWorkspace}
            onOpenSettings={() => setWorkspaceMode(!workspaceMode)}
            isCompact={!isChatCollapsed}
          />
        )}
        
        <div className="flex flex-1 overflow-hidden">
          {/* Chat window with conditional width based on collapsed state */}
          <ErrorBoundary fallback="Error loading chat window">
            <div 
              className={`${
                isChatCollapsed ? 'w-0 opacity-0' : artifactPanelOpen ? 'w-1/2' : 'w-full'
              } transition-all duration-300 ease-in-out overflow-hidden`}
            >
              <ChatWindow 
                messages={messages} 
                onSendMessage={handleSendMessage}
                onSendMessageWithTarget={handleSendMessageWithTarget}
                isLoading={chatLoading}
                onCreateArtifact={handleCreateArtifact}
                onCreateManualArtifact={handleCreateManualArtifact}
                currentSession={currentSession}
                currentWorkspace={currentWorkspace}
                isChatCollapsed={isChatCollapsed}
                onModeChange={handleModeChange}
                onProcessMessage={(message, sessionId) => processContentForWorkspace(message.content, message.id, sessionId)}
                getLinkedArtifact={getLinkedArtifact}
                onDismissChange={dismissRecentChange}
                onViewArtifact={handleViewArtifact}
                artifacts={artifacts}
                externalInputRef={chatInputRef}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
                onCreateTemplate={handleCreateTemplate}
                onEditTemplate={handleEditTemplate}
              />
            </div>
          </ErrorBoundary>
          
          {artifactPanelOpen && (
            <ErrorBoundary fallback="Error loading artifact panel">
              <ArtifactPanel 
                artifact={selectedArtifact}
                onUpdate={updateArtifact}
                onDownload={downloadArtifact}
                onClose={() => setArtifactPanelOpen(false)}
                onToggleChatCollapse={handleToggleChatCollapse}
                isChatCollapsed={isChatCollapsed}
                className={isChatCollapsed ? 'w-full' : 'w-1/2'}
                isLoading={artifactsLoading}
                error={artifactsError}
                onScopedInstruction={handleArtifactScopedInstruction}
              />
            </ErrorBoundary>
          )}
        </div>
        
        {/* Template Library Sidebar */}
        {templateLibraryOpen && (
          <TemplateLibrary
            onEditTemplate={handleEditTemplate}
            onCreateTemplate={handleCreateTemplate}
          />
        )}
      </div>
      
      {/* Template Editor Modal */}
      <TemplateEditor
        isOpen={templateEditorOpen}
        onClose={handleCloseTemplateEditor}
        templateId={editingTemplateId}
      />

      {/* Artifact Creation Dialog */}
      <ArtifactCreationDialog
        isOpen={artifactCreationDialog.isOpen}
        onClose={() => setArtifactCreationDialog(prev => ({ ...prev, isOpen: false }))}
        existingArtifacts={currentWorkspace ? [
          ...(currentWorkspace.primaryArtifact ? [currentWorkspace.primaryArtifact] : []),
          ...currentWorkspace.supplementaryArtifacts
        ] : []}
        newContent={artifactCreationDialog.content}
        onCreateNew={handleCreateNewArtifact}
        onMerge={handleMergeWithExisting}
        previewMerge={handlePreviewMerge}
      />
      
      {/* Global notifications for artifact changes */}
      {user && (
        <GlobalNotifications
          recentChanges={recentChanges}
          onViewArtifact={handleViewArtifact}
          onDismiss={dismissRecentChange}
          onDismissAll={clearRecentChanges}
        />
      )}
      
      {/* Debug Panel (only in development) */}
      {process.env.NODE_ENV === 'development' && user && (
        <DebugPanel
          currentWorkspace={currentWorkspace}
          artifacts={artifacts}
          messages={messages}
          currentSession={currentSession}
        />
      )}
    </div>
    </TemplateProvider>
  );
}

export default App;