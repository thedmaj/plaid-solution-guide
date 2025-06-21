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
// Removed: WorkspaceHeader - using simplified session artifact header
// Removed: useSessionWorkspace - simplified to direct artifact operations
import { ErrorBoundary } from './components/ErrorBoundary';
import { DebugPanel } from './components/DebugPanel';
import TemplateEditor from './components/TemplateEditor';
import TemplateLibrary from './components/TemplateLibrary';
import { TemplateProvider } from './contexts/TemplateContext';
import { ArtifactCreationDialog } from './components/ArtifactCreationDialog';
import { ContentMerger } from './utils/contentMerger';
import { SmartLabeling } from './utils/smartLabeling';

function App() {
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const chatInputRef = useRef(null);
  
  // SIMPLIFIED: Removed complex scoped instruction tracking
  
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

  // SIMPLIFIED: Direct artifact operations without workspace complexity
  
  // SIMPLIFIED: Remove complex workspace system - using simple session-based approach
  const createSessionArtifact = async (title, content, type = 'markdown', chatInstruction = '') => {
    // NEW artifacts always start at version 1
    const version = 1;
    
    // Use smart labeling for title if not provided or generic
    let finalTitle = title;
    if (!title || title.includes('Plaid Guide -') || title === 'New Conversation') {
      finalTitle = SmartLabeling.generateArtifactTitle(chatInstruction || currentChatInstruction, content, version);
    }
    // Don't add version suffix for version 1
    
    const smartLabel = SmartLabeling.generateLabel(chatInstruction || currentChatInstruction, content);
    
    const metadata = {
      sessionId: currentSession?.id,
      role: 'primary',
      autoCreated: true,
      createdAt: new Date().toISOString(),
      version: version,
      smartLabel: smartLabel,
      originalInstruction: chatInstruction || currentChatInstruction,
      isNew: true // Mark as new for UI indication
    };
    
    return await createArtifact(finalTitle, content, type, metadata);
  };

  // SIMPLIFIED: Using direct updateArtifact calls instead of wrapper

  // Get the primary artifact for current session
  const sessionArtifact = artifacts.find(a => 
    a.metadata?.sessionId === currentSession?.id && a.metadata?.role === 'primary'
  );
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [artifactPanelOpen, setArtifactPanelOpen] = useState(false);
  const [artifactPanelKey, setArtifactPanelKey] = useState(0); // Force re-mount when needed
  const [isRefreshingArtifact, setIsRefreshingArtifact] = useState(false); // Show refresh state
  const [isMergingContent, setIsMergingContent] = useState(false); // Show merge operation state
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [userClosedPanel, setUserClosedPanel] = useState(false); // Track if user deliberately closed panel
  const [mergeMode, setMergeMode] = useState('chat_only'); // User preference: 'chat_only' or 'merge_response'
  const [currentChatInstruction, setCurrentChatInstruction] = useState(''); // Track original user instruction for smart labeling
  
  // Reset merge state when switching to chat_only mode
  useEffect(() => {
    if (mergeMode === 'chat_only') {
      console.log('🔄 Switching to Chat Only mode - clearing merge state');
      setIsMergingContent(false);
    }
  }, [mergeMode]);
  
  // Debug current merge state
  useEffect(() => {
    console.log('🔍 Current merge state:', { isMergingContent, mergeMode });
  }, [isMergingContent, mergeMode]);
  
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

  // Debug: Log session artifact changes and reset panel close state on session change
  useEffect(() => {
    console.log('🏢 App.jsx: sessionArtifact updated:', sessionArtifact?.title);
    // Reset user closed panel flag when session changes
    setUserClosedPanel(false);
  }, [currentSession?.id]);

  // REMOVED: Auto-loading of artifacts - now click-based like Claude Desktop
  // Artifacts only load when user clicks the artifact icon

  // Track last processed message to avoid reprocessing old messages
  const [lastProcessedMessageIndex, setLastProcessedMessageIndex] = useState(-1);
  
  // SIMPLIFIED: Auto-generate artifacts for ALL substantial assistant responses (Claude Desktop style)
  useEffect(() => {
    const processNewAssistantMessage = async () => {
      if (!messages.length || !currentSession) return;
      
      // Only process if we have new messages
      if (messages.length <= lastProcessedMessageIndex + 1) return;
      
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role !== 'assistant') {
        setLastProcessedMessageIndex(messages.length - 1);
        return;
      }
      
      // Skip if message is too short to be substantial
      const content = lastMessage.content || '';
      if (content.length < 300) { // Increased threshold for artifact generation
        setLastProcessedMessageIndex(messages.length - 1);
        return;
      }
      
      try {
        // Check if this message already has an artifact (prevent duplicates on refresh)
        const existingArtifact = artifacts.find(a => 
          a.metadata?.sessionId === currentSession?.id &&
          Math.abs(new Date(a.created_at).getTime() - new Date(lastMessage.timestamp || new Date()).getTime()) < 30000
        );
        
        if (existingArtifact) {
          console.log('🔍 Artifact already exists for this message, skipping creation');
          setLastProcessedMessageIndex(messages.length - 1);
          return;
        }
        
        // ALWAYS generate artifact for substantial responses (Claude Desktop style)
        if (mergeMode === 'merge_response' && sessionArtifact) {
          // Merge mode: merge with existing artifact
          setIsMergingContent(true);
          
          console.log('🔄 Auto-merging with existing session artifact');
          const mergeResult = await ContentMerger.mergeContent(
            sessionArtifact.content,
            content,
            null, // No modification scope
            false // Not from scoped instruction
          );
          
          // Update metadata for version tracking
          const updatedMetadata = {
            ...sessionArtifact.metadata,
            version: (sessionArtifact.metadata?.version || 1) + 1,
            isNew: true,
            lastUpdated: new Date().toISOString()
          };
          
          await updateArtifact(sessionArtifact.id, {
            content: mergeResult.mergedContent,
            metadata: updatedMetadata
          });
          
          // Mark artifact in message for inline display (show icon after merge)
          lastMessage.artifactId = sessionArtifact.id;
        } else {
          // Check if this is a merge-related request even in Chat Only mode
          const isMergeRequest = currentChatInstruction.toLowerCase().includes('merge') ||
                                content.toLowerCase().includes('merged') ||
                                content.toLowerCase().includes('combining');
          
          if (isMergeRequest && sessionArtifact) {
            // User explicitly requested merge - update artifact and show icon
            console.log('🔄 Manual merge detected - updating artifact version');
            
            // Update artifact metadata to indicate manual merge and increment version
            const updatedMetadata = {
              ...sessionArtifact.metadata,
              version: (sessionArtifact.metadata?.version || 1) + 1,
              isNew: true,
              lastUpdated: new Date().toISOString(),
              manualMerge: true
            };
            
            await updateArtifact(sessionArtifact.id, {
              metadata: updatedMetadata
            });
            
            lastMessage.artifactId = sessionArtifact.id;
          } else {
            // Create new artifact for substantial responses (only if one doesn't exist)
            console.log('🆕 Auto-creating artifact for substantial response');
            
            const newArtifact = await createSessionArtifact('', content, 'markdown', currentChatInstruction);
            if (newArtifact) {
              // Mark artifact in message for inline display
              lastMessage.artifactId = newArtifact.id;
            }
          }
        }
      } catch (error) {
        console.error('Error in auto-processing:', error);
      } finally {
        setIsMergingContent(false);
        setLastProcessedMessageIndex(messages.length - 1);
      }
    };

    processNewAssistantMessage();
  }, [messages.length]); // Only depend on message count, not the messages themselves
  
  // Reset message tracking when session changes
  useEffect(() => {
    setLastProcessedMessageIndex(-1);
  }, [currentSession?.id]);
  
  const handleSendMessage = async (message) => {
    // Track the user instruction for smart labeling
    setCurrentChatInstruction(message);
    await sendMessage(message);
    // Artifact processing is now handled automatically by the handleNewAssistantMessage callback
  };
  
  const handleSendMessageWithTarget = async (message, targetArtifactId = null) => {
    // SIMPLIFIED: Direct message sending - scoped instructions removed
    await sendMessage(message);
  };
  
  const handleViewArtifact = (artifactId) => {
    // Check if this artifact is already selected and panel is open - if so, toggle panel closed
    if (selectedArtifact?.id === artifactId && artifactPanelOpen) {
      setArtifactPanelOpen(false);
      setUserClosedPanel(true);
    } else {
      // Select and open artifact in panel (click-based loading)
      selectArtifact(artifactId);
      setArtifactPanelOpen(true);
      setUserClosedPanel(false); // Reset user closed flag since they explicitly opened it
    }
  };
  
  const handleDownloadArtifact = (artifactId) => {
    downloadArtifact(artifactId);
  };
  
  const handleCreateArtifact = async (title, content, type = 'markdown') => {
    console.log('🎯 handleCreateArtifact called (Save as Artifact):', { 
      title, 
      contentLength: content?.length, 
      type,
      hasSession: !!currentSession,
      sessionId: currentSession?.id 
    });
    
    // Check if session already has a primary artifact
    if (sessionArtifact) {
      console.log('✅ Session has existing artifact - opening merge dialog');
      setArtifactCreationDialog({
        isOpen: true,
        content: content,
        title: title,
        type: type
      });
    } else {
      console.log('➕ Creating primary artifact for session');
      const newArtifact = await createSessionArtifact(title, content, type);
      if (newArtifact) {
        console.log('🆕 Session artifact created:', newArtifact.title);
        selectArtifact(newArtifact.id);
        setArtifactPanelOpen(true);
      }
    }
  };

  const handleMergeWithArtifact = async (title, content, type = 'markdown') => {
    console.log('🔄 handleMergeWithArtifact called (Merge button):', { 
      title, 
      contentLength: content?.length, 
      type 
    });
    
    // Always show merge dialog regardless of artifacts (merge button should only appear when artifacts exist)
    setArtifactCreationDialog({
      isOpen: true,
      content: content,
      title: title,
      type: type
    });
  };

  const handleCreateManualArtifact = async (content, title) => {
    if (!currentSession) return;
    
    // Use simplified session artifact creation
    const artifact = await createSessionArtifact(
      title || `Guide - ${new Date().toLocaleDateString()}`, 
      content
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
      
      // SIMPLIFIED: Direct prompt generation without state management
      
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

  // Helper function to force refresh artifact panel
  const forceRefreshArtifactPanel = (artifactId) => {
    console.log('🔄 Force refreshing artifact panel for:', artifactId);
    
    // Show refresh state
    setIsRefreshingArtifact(true);
    
    // Method 1: Close and reopen with delay
    setArtifactPanelOpen(false);
    
    // Method 2: Force re-mount by updating key
    setArtifactPanelKey(prev => prev + 1);
    
    setTimeout(() => {
      selectArtifact(artifactId);
      setArtifactPanelOpen(true);
      setIsRefreshingArtifact(false);
    }, 150); // Slightly longer delay to ensure complete refresh
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
    
    console.log('🆕 Creating new session artifact');
    
    // Use simplified session artifact creation
    if (currentSession) {
      const newArtifact = await createSessionArtifact(title, content, type || 'markdown');
      if (newArtifact) {
        selectArtifact(newArtifact.id);
        setArtifactPanelOpen(true);
      }
    }
    
    // Close the dialog
    setArtifactCreationDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleMergeWithExisting = async (selectedArtifact) => {
    const { content } = artifactCreationDialog;
    
    if (selectedArtifact && currentSession) {
      try {
        console.log('🔄 Starting simple merge process:', {
          targetArtifactId: selectedArtifact.id,
          targetArtifactTitle: selectedArtifact.title,
          originalLength: selectedArtifact.content?.length,
          newContentLength: content?.length
        });
        
        setIsMergingContent(true); // Start merge loading
        
        // Simple content merging using AI service
        const mergeResult = await ContentMerger.mergeContent(
          selectedArtifact.content,
          content,
          null, // No modification scope
          false // Not from scoped instruction
        );
        
        // Update the artifact with merged content
        const updatedArtifact = await updateArtifact(selectedArtifact.id, {
          content: mergeResult.mergedContent
        });
        
        console.log('✅ Simple merge completed:', {
          updatedArtifactId: updatedArtifact?.id,
          updatedLength: updatedArtifact?.content?.length
        });
        
        // Refresh the panel
        if (updatedArtifact) {
          selectArtifact(updatedArtifact.id);
          setArtifactPanelOpen(true);
        }
        
        // Close the dialog
        setArtifactCreationDialog(prev => ({ ...prev, isOpen: false }));
      } catch (error) {
        console.error('Error in simple merge:', error);
        alert('Failed to merge content. Please try again.');
      } finally {
        setIsMergingContent(false); // End merge loading
      }
    }
  };

  const handlePreviewMerge = async (existingContent, newContent) => {
    return await ContentMerger.previewMerge(existingContent, newContent);
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
        sessionArtifact={sessionArtifact}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleArtifactPanel={() => {
            setArtifactPanelOpen(!artifactPanelOpen);
            if (!artifactPanelOpen) {
              setUserClosedPanel(false); // Reset when manually opening
            }
          }}
          artifactPanelOpen={artifactPanelOpen}
          currentSession={currentSession}
          isChatCollapsed={isChatCollapsed}
          onToggleChatCollapse={handleToggleChatCollapse}
          templateLibraryOpen={templateLibraryOpen}
          onToggleTemplateLibrary={() => setTemplateLibraryOpen(!templateLibraryOpen)}
          onDeleteSession={deleteSession}
        />
        
        {/* Session Artifact Header */}
        {sessionArtifact && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-700">Active Guide:</span>
                <span className="text-sm text-blue-600">{sessionArtifact.title}</span>
              </div>
              <div className="text-xs text-blue-500">
                Updated {new Date(sessionArtifact.updated_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
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
                isLoading={chatLoading || isMergingContent}
                isMergingContent={isMergingContent}
                onCreateArtifact={handleCreateArtifact}
                onMergeWithArtifact={handleMergeWithArtifact}
                onCreateManualArtifact={handleCreateManualArtifact}
                currentSession={currentSession}
                sessionArtifact={sessionArtifact}
                isChatCollapsed={isChatCollapsed}
                onModeChange={handleModeChange}
                getLinkedArtifact={getLinkedArtifact}
                onDismissChange={dismissRecentChange}
                onViewArtifact={handleViewArtifact}
                onDownloadArtifact={handleDownloadArtifact}
                artifacts={artifacts}
                externalInputRef={chatInputRef}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
                onCreateTemplate={handleCreateTemplate}
                onEditTemplate={handleEditTemplate}
                mergeMode={mergeMode}
                onMergeModeChange={setMergeMode}
                artifactPanelOpen={artifactPanelOpen}
                selectedArtifact={selectedArtifact}
              />
            </div>
          </ErrorBoundary>
          
          {artifactPanelOpen && (
            <ErrorBoundary fallback="Error loading artifact panel">
              <ArtifactPanel 
                key={artifactPanelKey} // Force re-mount when key changes
                artifact={selectedArtifact}
                onUpdate={updateArtifact}
                onDownload={downloadArtifact}
                onClose={() => {
                  setArtifactPanelOpen(false);
                  setUserClosedPanel(true);
                }}
                onToggleChatCollapse={handleToggleChatCollapse}
                isChatCollapsed={isChatCollapsed}
                className={isChatCollapsed ? 'w-full' : 'w-1/2'}
                isLoading={artifactsLoading || isRefreshingArtifact}
                error={artifactsError}
                onScopedInstruction={handleArtifactScopedInstruction}
                sessions={sessions}
                currentSession={currentSession}
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
        existingArtifacts={sessionArtifact ? [sessionArtifact] : []} // Only show current session artifact
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
          sessionArtifact={sessionArtifact}
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