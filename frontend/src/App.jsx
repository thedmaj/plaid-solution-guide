import React, { useState, useRef, useEffect, useCallback } from 'react';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { ChatWindow } from './components/ChatWindow';
import { ArtifactPanel } from './components/ArtifactPanel';
import { Header } from './components/Header';
import { useAuth } from './hooks/useAuth';
import { useChatSession } from './hooks/useChatSession';
import { useSmartArtifacts } from './hooks/useSmartArtifacts';
import { LoadingSpinner } from './components/LoadingSpinner';
import { GlobalNotifications } from './components/GlobalNotifications';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DebugPanel } from './components/DebugPanel';
import TemplateEditor from './components/TemplateEditor';
import TemplateLibrary from './components/TemplateLibrary';
import { TemplateProvider } from './contexts/TemplateContext';
import { ArtifactCreationDialog } from './components/ArtifactCreationDialog';
import { ContentMerger } from './utils/contentMerger';
import { SmartLabeling } from './utils/smartLabeling';
import { ErrorToast } from './components/ErrorToast';

function App() {
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const chatInputRef = useRef(null);
  
  
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
    setMessages,
    sendMessage, 
    isLoading: chatLoading, 
    currentSession,
    sessions,
    createNewSession,
    loadSession,
    deleteSession,
    selectedMode,
    lastDebugInfo,
    handleModeChange
  } = useChatSession();

  
  // CRITICAL: Function to assign artifact ID to a message
  // This function is ESSENTIAL for making artifact icons appear in chat messages
  // DO NOT remove or modify without ensuring artifact icons continue to work
  // WARNING: Removing this function will break artifact icon display entirely
  const assignArtifactToMessage = useCallback((messageId, artifactId) => {
    if (!messageId || !artifactId) {
      console.error('❌ ARTIFACT ICON: Invalid parameters for assignArtifactToMessage:', { messageId, artifactId });
      return;
    }
    
    console.log('🔗 ARTIFACT ICON: Assigning artifact ID to message:', { messageId, artifactId });
    
    setMessages(prevMessages => {
      // Find the target message
      const targetMessage = prevMessages.find(msg => msg.id === messageId);
      if (!targetMessage) {
        console.error('❌ ARTIFACT ICON: Target message not found:', messageId);
        return prevMessages;
      }
      
      // Check if message already has this artifact ID to prevent unnecessary updates
      if (targetMessage?.artifactId === artifactId) {
        console.log('🚫 ARTIFACT ICON: Message already has this artifact ID, skipping update');
        return prevMessages;
      }
      
      console.log('✅ ARTIFACT ICON: Updating message with artifact ID');
      const updatedMessages = prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, artifactId: artifactId }
          : msg
      );
      
      // CRITICAL: Verify the assignment worked
      const updatedMessage = updatedMessages.find(msg => msg.id === messageId);
      if (updatedMessage?.artifactId === artifactId) {
        console.log('✅ ARTIFACT ICON: Successfully assigned artifact to message:', {
          messageId: updatedMessage.id,
          artifactId: updatedMessage.artifactId,
          messageContent: updatedMessage.content?.substring(0, 50) + '...'
        });
      } else {
        console.error('❌ ARTIFACT ICON: Assignment failed! Message does not have artifact ID:', {
          messageId,
          expectedArtifactId: artifactId,
          actualArtifactId: updatedMessage?.artifactId
        });
      }
      
      return updatedMessages;
    });
  }, [setMessages]);
  
  const createSessionArtifact = async (title, content, type = 'markdown', chatInstruction = '', messageHash = null) => {
    const version = 1;
    
    // Use smart labeling for title if not provided or generic
    let finalTitle = title;
    if (!title || title.includes('Plaid Guide -') || title === 'New Conversation') {
      finalTitle = SmartLabeling.generateArtifactTitle(chatInstruction || currentChatInstruction, content, version);
    }
    
    const smartLabel = SmartLabeling.generateLabel(chatInstruction || currentChatInstruction, content);
    
    const metadata = {
      sessionId: currentSession?.id,
      role: 'primary',
      autoCreated: true,
      createdAt: new Date().toISOString(),
      version: version,
      smartLabel: smartLabel,
      originalInstruction: chatInstruction || currentChatInstruction,
      isNew: true,
      sourceMessageHash: messageHash // Add for idempotency tracking
    };
    
    return await createArtifact(finalTitle, content, type, metadata);
  };


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
  const [mergeMode, setMergeMode] = useState('merge_response'); // User preference: 'chat_only' or 'merge_response'
  const [currentChatInstruction, setCurrentChatInstruction] = useState(''); // Track original user instruction for smart labeling
  const [globalError, setGlobalError] = useState(null); // Global error state for user notifications
  
  // Reset merge state when switching to chat_only mode
  useEffect(() => {
    if (mergeMode === 'chat_only') {
      console.log('🔄 Switching to Chat Only mode - clearing merge state');
      setIsMergingContent(false);
    }
  }, [mergeMode]);
  
  
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
  const lastProcessedMessageIndexRef = useRef(-1);
  
  
  // ======================================================= 
  // CRITICAL SECTION: ARTIFACT CREATION AND ASSIGNMENT
  // =======================================================
  // ESSENTIAL: Auto-generate artifacts for ALL substantial assistant responses (Claude Desktop style)
  // WARNING: This useEffect is CRITICAL for artifact icon functionality
  // DO NOT remove or modify without ensuring artifact icons continue to work
  // 
  // IMPORTANT FIX: This useEffect creates artifacts for substantial responses AND handles streaming
  // KEY BEHAVIOR: When messages are streaming, skip processing but don't update lastProcessedIndex
  // This allows re-processing when streaming completes to create artifacts and show icons
  // 
  // ARTIFACT ICON DEPENDENCY: The EyeIcon/EyeOffIcon that appears after chat messages
  // depends on this useEffect creating artifacts and assigning them to messages
  useEffect(() => {
    
    const processNewAssistantMessage = async () => {
      
      if (!messages.length || !currentSession) {
        console.log('🚫 Early return: no messages or session');
        return;
      }
      
      // Only process if we have new messages
      if (messages.length <= lastProcessedMessageIndexRef.current + 1) {
        console.log('🚫 Early return: no new messages to process');
        return;
      }
      
      console.log('✅ New messages detected, continuing with processing');
      
      const lastMessage = messages[messages.length - 1];
      console.log('📝 Processing last message:', {
        id: lastMessage.id,
        role: lastMessage.role,
        contentLength: lastMessage.content?.length,
        hasArtifactId: !!lastMessage.artifactId,
        streaming: lastMessage.streaming
      });
      
      if (lastMessage.role !== 'assistant') {
        console.log('🚫 Not an assistant message, updating index');
        lastProcessedMessageIndexRef.current = messages.length - 1;
        return;
      }
      
      // CRITICAL: Skip if message is still loading/streaming
      // WARNING: DO NOT MODIFY THIS LOGIC WITHOUT TESTING ARTIFACT ICONS
      // This logic is ESSENTIAL for artifact icon functionality:
      // 1. When streaming: Exit early but DON'T update lastProcessedIndex
      // 2. When complete: Re-run this function to create artifacts
      // 3. Updating lastProcessedIndex here would prevent re-processing completed messages
      if (lastMessage.streaming || lastMessage.loading) {
        console.log('🚫 Message still loading/streaming, skipping processing');
        return; // CRITICAL: Don't update lastProcessedIndex - we need to try again when complete
      }
      
      // Skip if this message already has an artifactId (already processed)
      if (lastMessage.artifactId) {
        console.log('🚫 Message already has artifactId, skipping processing');
        lastProcessedMessageIndexRef.current = messages.length - 1;
        return;
      }
      
      console.log('✅ Message is complete and ready for processing');
      
      // Skip if message is too short to be substantial
      const content = lastMessage.content || '';
      if (content.length < 300) { // Restore threshold for artifact generation
        console.log('🚫 Message too short for artifact generation:', content.length);
        lastProcessedMessageIndexRef.current = messages.length - 1;
        return;
      }
      
      console.log('✅ Message qualifies for artifact processing, length:', content.length);
      
      try {
        // Enhanced idempotency check to prevent merge redos on session reload
        // Check if this message already has an artifact (prevent duplicates on refresh)
        const existingArtifact = artifacts.find(a => 
          a.metadata?.sessionId === currentSession?.id &&
          Math.abs(new Date(a.created_at).getTime() - new Date(lastMessage.timestamp || new Date()).getTime()) < 30000
        );
        
        // Also check if this message already has an artifactId (stronger check)
        const messageHasArtifact = lastMessage.artifactId || existingArtifact;
        
        // Check if this exact message content was already processed (content hash check)
        const messageContentHash = btoa(content.substring(0, 200)); // Simple hash of first 200 chars
        const existingProcessedArtifact = artifacts.find(a => 
          a.metadata?.sessionId === currentSession?.id &&
          a.metadata?.sourceMessageHash === messageContentHash
        );
        
        if (messageHasArtifact || existingProcessedArtifact) {
          console.log('🔍 Message already processed - skipping to prevent merge redo', {
            artifactId: existingArtifact?.id || existingProcessedArtifact?.id,
            artifactTitle: existingArtifact?.title || existingProcessedArtifact?.title,
            hasMessageArtifactId: !!lastMessage.artifactId,
            foundByHash: !!existingProcessedArtifact,
            foundByTimestamp: !!existingArtifact
          });
          
          // Make sure the message has the artifact ID
          const targetArtifact = existingArtifact || existingProcessedArtifact;
          if (!lastMessage.artifactId && targetArtifact) {
            console.log('🔗 Adding missing artifactId to existing message');
            assignArtifactToMessage(lastMessage.id, targetArtifact.id);
          }
          lastProcessedMessageIndexRef.current = messages.length - 1;
          return;
        }
        
        // Get current merge mode and session artifact from latest state
        const currentMergeMode = mergeMode;
        const currentSessionArtifact = artifacts.find(a => 
          a.metadata?.sessionId === currentSession?.id && a.metadata?.role === 'primary'
        );
        
        // ALWAYS generate artifact for substantial responses (Claude Desktop style)
        if (currentMergeMode === 'merge_response' && currentSessionArtifact) {
          // Merge mode: merge with existing artifact
          setIsMergingContent(true);
          
          console.log('🔄 Auto-merging with existing session artifact');
          const mergeResult = await ContentMerger.mergeContent(
            currentSessionArtifact.content,
            content,
            null, // No modification scope
            false // Not from scoped instruction
          );
          
          // Update metadata for version tracking and idempotency
          const updatedMetadata = {
            ...currentSessionArtifact.metadata,
            version: (currentSessionArtifact.metadata?.version || 1) + 1,
            isNew: true,
            lastUpdated: new Date().toISOString(),
            sourceMessageHash: messageContentHash // Add for idempotency tracking
          };
          
          const updatedArtifact = await updateArtifact(currentSessionArtifact.id, {
            content: mergeResult.mergedContent,
            metadata: updatedMetadata
          });
          
          console.log('🔄 Artifact updated after merge:', {
            id: updatedArtifact?.id,
            title: updatedArtifact?.title,
            contentLength: updatedArtifact?.content?.length,
            version: updatedArtifact?.metadata?.version
          });
          
          // CRITICAL: Mark artifact in message for inline display (show icon after merge)
          // ESSENTIAL: This ensures artifact icons appear after merge operations
          if (updatedArtifact) {
            console.log('🔗 ARTIFACT ICON: Assigning artifact after auto-merge', {
              messageId: lastMessage.id,
              artifactId: updatedArtifact.id,
              artifactTitle: updatedArtifact.title,
              version: updatedArtifact.metadata?.version
            });
            
            // IMMEDIATE assignment for merge
            assignArtifactToMessage(lastMessage.id, updatedArtifact.id);
            
            // Backup assignments to ensure icon appears after merge
            setTimeout(() => {
              console.log('🔗 ARTIFACT ICON: Backup assignment after auto-merge');
              assignArtifactToMessage(lastMessage.id, updatedArtifact.id);
            }, 100);
            
            setTimeout(() => {
              console.log('🔗 ARTIFACT ICON: Final backup assignment after auto-merge');
              assignArtifactToMessage(lastMessage.id, updatedArtifact.id);
            }, 500);
          }
          
          
        } else {
          // Check if this is a merge-related request even in Chat Only mode
          const isMergeRequest = currentChatInstruction.toLowerCase().includes('merge') ||
                                content.toLowerCase().includes('merged') ||
                                content.toLowerCase().includes('combining');
          
          if (isMergeRequest && currentSessionArtifact) {
            // User explicitly requested merge - update artifact and show icon
            console.log('🔄 Manual merge detected - updating artifact version');
            
            // Update artifact metadata to indicate manual merge and increment version
            const updatedMetadata = {
              ...currentSessionArtifact.metadata,
              version: (currentSessionArtifact.metadata?.version || 1) + 1,
              isNew: true,
              lastUpdated: new Date().toISOString(),
              manualMerge: true,
              sourceMessageHash: messageContentHash // Add for idempotency tracking
            };
            
            const updatedArtifact = await updateArtifact(currentSessionArtifact.id, {
              metadata: updatedMetadata
            });
            
            // CRITICAL: Use the returned updatedArtifact.id to ensure artifact icon appears
            if (updatedArtifact) {
              console.log('🔗 ARTIFACT ICON: Assigning artifact after manual merge', {
                messageId: lastMessage.id,
                artifactId: updatedArtifact.id,
                artifactTitle: updatedArtifact.title,
                version: updatedArtifact.metadata?.version
              });
              
              // IMMEDIATE assignment for manual merge
              assignArtifactToMessage(lastMessage.id, updatedArtifact.id);
              
              // Backup assignments to ensure icon appears after manual merge
              setTimeout(() => {
                console.log('🔗 ARTIFACT ICON: Backup assignment after manual merge');
                assignArtifactToMessage(lastMessage.id, updatedArtifact.id);
              }, 100);
              
              setTimeout(() => {
                console.log('🔗 ARTIFACT ICON: Final backup assignment after manual merge');
                assignArtifactToMessage(lastMessage.id, updatedArtifact.id);
              }, 500);
            }
            
          } else {
            // Create new artifact for substantial responses (only if one doesn't exist)
            console.log('🆕 ARTIFACT ICON: Creating new artifact for substantial response');
            
            // ENHANCED DEBUGGING: Check createArtifact function availability
            console.log('🔍 ARTIFACT ICON: Checking createArtifact function:', {
              createArtifactExists: typeof createArtifact === 'function',
              currentSessionExists: !!currentSession,
              currentSessionId: currentSession?.id,
              contentLength: content?.length,
              currentChatInstruction: currentChatInstruction
            });
            
            const newArtifact = await createSessionArtifact('', content, 'markdown', currentChatInstruction, messageContentHash);
            if (newArtifact) {
              console.log('✅ ARTIFACT ICON: New artifact created:', {
                id: newArtifact.id,
                title: newArtifact.title,
                messageId: lastMessage.id,
                contentLength: newArtifact.content?.length,
                artifactType: newArtifact.type,
                artifactMetadata: newArtifact.metadata
              });
              
              // CRITICAL: Mark artifact in message for inline display
              // This assignment is essential for artifact icons to appear
              console.log('🔗 ARTIFACT ICON: About to assign artifact to message', {
                messageId: lastMessage.id,
                artifactId: newArtifact.id,
                artifactTitle: newArtifact.title,
                messageRole: lastMessage.role,
                messageContentLength: lastMessage.content?.length
              });
              
              // IMMEDIATE assignment + delayed backup to ensure icon appears
              assignArtifactToMessage(lastMessage.id, newArtifact.id);
              
              // Backup assignment with delay to ensure state synchronization
              setTimeout(() => {
                console.log('🔗 ARTIFACT ICON: Backup assignment for reliability');
                assignArtifactToMessage(lastMessage.id, newArtifact.id);
              }, 100);
              
              // Additional backup after longer delay
              setTimeout(() => {
                console.log('🔗 ARTIFACT ICON: Final backup assignment');
                assignArtifactToMessage(lastMessage.id, newArtifact.id);
              }, 500);
            } else {
              console.error('❌ ARTIFACT ICON: Failed to create artifact - createSessionArtifact returned null/undefined');
              console.error('❌ ARTIFACT ICON: Debugging artifact creation failure:', {
                createArtifactFunction: typeof createArtifact,
                currentSession: currentSession,
                contentProvided: !!content,
                contentLength: content?.length
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in auto-processing:', error);
        setGlobalError(`Failed to process artifact: ${error.message}`);
      } finally {
        setIsMergingContent(false);
        lastProcessedMessageIndexRef.current = messages.length - 1;
      }
    };

    // Only process if messages length changed and we have new messages
    const currentLength = messages.length;
    const lastProcessedLength = lastProcessedMessageIndexRef.current + 1;
    
    
    if (currentLength > lastProcessedLength) {
      processNewAssistantMessage();
    } else {
      // No new messages to process based on length comparison
    }
  }, [messages.length, currentSession?.id, messages[messages.length - 1]?.streaming, messages[messages.length - 1]?.loading]); 
  // CRITICAL DEPENDENCIES EXPLANATION:
  // - messages.length: Re-run when new messages are added
  // - currentSession?.id: Re-run when session changes
  // - streaming/loading status: ESSENTIAL for artifact icons - re-run when streaming completes
  // WARNING: DO NOT REMOVE streaming/loading dependencies - this breaks artifact icon creation
  // The streaming dependencies ensure artifacts are created AFTER messages finish streaming
  // =======================================================
  // END CRITICAL SECTION: ARTIFACT CREATION AND ASSIGNMENT
  // =======================================================
  
  // Reset message tracking when session changes
  useEffect(() => {
    lastProcessedMessageIndexRef.current = -1;
  }, [currentSession?.id]);
  
  // Reset template selection when session changes (default to "No Template")
  useEffect(() => {
    if (currentSession?.id) {
      setSelectedTemplate(null);
      console.log('🔄 Template reset to "No Template" for new session:', currentSession.id);
    }
  }, [currentSession?.id]);
  
  const handleSendMessage = async (message, selectedTemplate = null) => {
    // Track the user instruction for smart labeling
    setCurrentChatInstruction(message);
    await sendMessage(message, selectedTemplate);
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
      // Always get the freshest artifact from state before selecting
      const freshArtifact = artifacts.find(a => a.id === artifactId);
      console.log('🔄 handleViewArtifact: Fresh artifact data:', {
        id: freshArtifact?.id,
        title: freshArtifact?.title,
        contentLength: freshArtifact?.content?.length,
        version: freshArtifact?.metadata?.version,
        lastUpdated: freshArtifact?.metadata?.lastUpdated
      });
      
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
  // const forceRefreshArtifactPanel = (artifactId) => {
  //   console.log('🔄 Force refreshing artifact panel for:', artifactId);
  //   
  //   // Show refresh state
  //   setIsRefreshingArtifact(true);
  //   
  //   // Method 1: Close and reopen with delay
  //   setArtifactPanelOpen(false);
  //   
  //   // Method 2: Force re-mount by updating key
  //   setArtifactPanelKey(prev => prev + 1);
  //   
  //   setTimeout(() => {
  //     selectArtifact(artifactId);
  //     setArtifactPanelOpen(true);
  //     setIsRefreshingArtifact(false);
  //   }, 150); // Slightly longer delay to ensure complete refresh
  // };

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
            <img src="/plaid-logo.jpg" alt="Plaid Logo" className="h-12 mx-auto mb-4" />
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-plaid-blue-500 focus:border-plaid-blue-500"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-plaid-blue-500 focus:border-plaid-blue-500"
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-2 px-4 bg-plaid-blue-800 text-white rounded hover:bg-plaid-blue-900 focus:outline-none focus:ring-2 focus:ring-plaid-blue-500 focus:ring-opacity-50"
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
          <div className="bg-plaid-blue-50 border-b border-plaid-blue-200 px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-plaid-blue-700">Active Guide:</span>
                <span className="text-sm text-plaid-blue-600">{sessionArtifact.title}</span>
              </div>
              <div className="text-xs text-plaid-blue-500">
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
                selectedMode={selectedMode}
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
                key={`${artifactPanelKey}-${selectedArtifact?.id}-${selectedArtifact?.updated_at || selectedArtifact?.metadata?.lastUpdated}`} // Force re-mount when artifact content changes
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
          lastDebugInfo={lastDebugInfo}
        />
      )}

      {/* Global Error Toast */}
      <ErrorToast
        error={globalError}
        onDismiss={() => setGlobalError(null)}
        onRetry={() => {
          // Could implement retry logic here if needed
          setGlobalError(null);
        }}
      />
        </div>
    </TemplateProvider>
  );
}

export default App;