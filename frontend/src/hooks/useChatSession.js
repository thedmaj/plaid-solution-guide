import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { queryKeys, queryOptions } from '../utils/queryClient';
import { chatStreamManager } from '../utils/streaming';

export const useChatSession = (onNewAssistantMessage) => {
  const queryClient = useQueryClient();
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState('solution_guide');
  const [lastDebugInfo, setLastDebugInfo] = useState(null);
  
  // Fetch sessions with React Query
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: queryKeys.sessions(),
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) return [];

      const response = await fetch('/api/chat/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load sessions');
      }

      const data = await response.json();
      console.log('📊 Loaded sessions from backend:', {
        count: data.length,
        sessions: data.map(s => ({ id: s.id, title: s.title, type: typeof s.id }))
      });
      
      // Validate session data structure and remove duplicates
      const validSessions = data.filter(session => {
        const isValid = session && session.id && typeof session.id !== 'undefined';
        if (!isValid) {
          console.error('❌ Invalid session found:', session);
        }
        return isValid;
      });
      
      // Remove duplicates by ID (keep the first occurrence)
      const uniqueSessions = validSessions.filter((session, index, self) => 
        index === self.findIndex(s => s.id === session.id)
      );
      
      if (validSessions.length !== data.length) {
        console.warn('⚠️ Some sessions were filtered out due to invalid data');
      }
      
      if (uniqueSessions.length !== validSessions.length) {
        console.warn('⚠️ Duplicate sessions found and removed:', validSessions.length - uniqueSessions.length);
      }
      
      console.log('📋 Sessions loaded:', {
        total: data.length,
        valid: validSessions.length,
        unique: uniqueSessions.length,
        sessions: uniqueSessions.map(s => ({ id: s.id, title: s.title }))
      });
      
      return uniqueSessions;
    },
    ...queryOptions.frequent,
    enabled: !!localStorage.getItem('token')
  });

  // Auto-load most recent session
  useEffect(() => {
    if (sessions.length > 0 && !currentSession) {
      const lastSession = sessions[0];
      console.log('🔄 Auto-loading most recent session:', {
        id: lastSession.id,
        title: lastSession.title,
        mode: lastSession.mode
      });
      setCurrentSession(lastSession);
      setSelectedMode(lastSession.mode || 'solution_guide');
      // Don't call loadSession here as setCurrentSession will trigger the React Query
    } else if (sessions.length === 0 && !sessionsLoading && !currentSession) {
      createNewSession();
    }
  }, [sessions.length, sessionsLoading]); // Remove currentSession to prevent infinite loop
  
  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (mode = selectedMode) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const sessionMode = typeof mode === 'string' ? mode : selectedMode;

      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ mode: sessionMode })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      return response.json();
    },
    onSuccess: (newSession, mode) => {
      // Update cache with new session (avoid duplicates)
      queryClient.setQueryData(queryKeys.sessions(), (old = []) => {
        // Check if session already exists to prevent duplicates
        const existingSessionIndex = old.findIndex(session => session.id === newSession.id);
        if (existingSessionIndex >= 0) {
          // Update existing session
          const updated = [...old];
          updated[existingSessionIndex] = newSession;
          return updated;
        } else {
          // Add new session at the beginning
          return [newSession, ...old];
        }
      });
      setCurrentSession(newSession);
      setSelectedMode(mode);
      setMessages([]);
    },
    onError: (error) => {
      console.error('Error creating new session:', error);
    }
  });

  const createNewSession = useCallback((mode) => {
    // Use current selectedMode if no mode provided
    const targetMode = mode || selectedMode;
    
    // Deep safety check - ensure we never deal with objects that could have circular refs
    let safeMode;
    if (typeof targetMode === 'string') {
      safeMode = targetMode;
    } else if (typeof targetMode === 'object' && targetMode !== null) {
      // This is an event object or other object - use default
      console.warn('⚠️ createNewSession received object instead of string, using default mode');
      safeMode = 'solution_guide'; // Use hardcoded default to avoid any circular refs
    } else {
      safeMode = 'solution_guide'; // Use hardcoded default
    }
    
    // console.log('🚀 createNewSession called with safe mode:', safeMode);
    createSessionMutation.mutate(safeMode);
  }, [selectedMode, createSessionMutation]);
  
  const handleModeChange = async (mode) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !currentSession) return;

      console.log('Updating mode to:', mode); // Debug log

      // Update the mode in the backend
      const response = await fetch(`/api/chat/sessions/${currentSession.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          mode,
          title: currentSession.title || 'New conversation'
        })
      });

      if (response.ok) {
        const updatedSession = await response.json();
        console.log('Server response:', updatedSession); // Debug log
        
        // Update all state in a single batch
        setSelectedMode(mode); // Use the requested mode, not the response mode
        setCurrentSession(prevSession => ({
          ...prevSession,
          mode: mode // Use the requested mode
        }));
        
        // Update the session in the React Query cache
        queryClient.setQueryData(queryKeys.sessions(), (prevSessions = []) => 
          prevSessions.map(session => 
            session.id === currentSession.id 
              ? { ...session, mode: mode } // Use the requested mode
              : session
          )
        );
      } else {
        const errorData = await response.json();
        console.error('Error updating session mode:', errorData);
        throw new Error(errorData.detail || 'Failed to update session mode');
      }
    } catch (error) {
      console.error('Error updating session mode:', error);
      // Revert the mode change in the UI if the server update failed
      setSelectedMode(currentSession.mode);
    }
  };
  
  // Load messages for a specific session with React Query
  const { data: sessionMessages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: queryKeys.sessionMessages(currentSession?.id),
    queryFn: async () => {
      if (!currentSession?.id) {
        console.log('📨 No current session, returning empty messages');
        return [];
      }
      
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token found');

      const stringSessionId = String(currentSession.id).trim();
      if (!stringSessionId || stringSessionId === 'null' || stringSessionId === 'undefined') {
        throw new Error('Invalid session ID');
      }
      
      console.log('📨 React Query: Loading messages for session:', stringSessionId);
      console.log('📨 React Query: Query enabled?', !!currentSession?.id && !!localStorage.getItem('token'));
      console.log('📨 React Query: Current session data:', currentSession);

      const response = await fetch(`/api/chat/sessions/${stringSessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📨 React Query: Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📨 React Query: Failed response:', { status: response.status, error: errorText });
        throw new Error(`Failed to load session: ${response.status} - ${errorText}`);
      }

      const sessionMessages = await response.json();
      console.log('📨 Loaded messages:', { 
        count: sessionMessages?.length, 
        firstMessage: sessionMessages?.[0]?.role,
        sessionId: stringSessionId 
      });
      
      if (!Array.isArray(sessionMessages)) {
        throw new Error('Invalid messages format');
      }
      
      return sessionMessages;
    },
    ...queryOptions.frequent,
    enabled: !!currentSession?.id && !!localStorage.getItem('token')
  });

  // Debug React Query state - run frequently to catch issues
  useEffect(() => {
    const debugInfo = {
      currentSessionId: currentSession?.id,
      messagesLoading,
      messagesError: messagesError?.message,
      sessionMessagesCount: sessionMessages?.length,
      queryEnabled: !!currentSession?.id && !!localStorage.getItem('token'),
      hasToken: !!localStorage.getItem('token'),
      sessionExists: !!currentSession
    };
    console.log('📨 React Query State Debug:', debugInfo);
    
    // Log if query should be enabled but no messages are loading/loaded
    if (debugInfo.queryEnabled && !debugInfo.messagesLoading && debugInfo.sessionMessagesCount === 0) {
      console.warn('⚠️ Query should be enabled but no messages found. Potential issue!');
    }
  }, [currentSession?.id, messagesLoading, messagesError, sessionMessages?.length, currentSession]);

  // Update local messages when session messages change
  useEffect(() => {
    console.log('📨 useChatSession: sessionMessages changed:', {
      currentSessionId: currentSession?.id,
      messagesCount: sessionMessages?.length,
      firstMessage: sessionMessages?.[0]?.content?.substring(0, 50)
    });
    setMessages(sessionMessages);
  }, [sessionMessages]);

  const loadSession = useCallback(async (sessionId) => {
    try {
      console.log('🔄 useChatSession: Loading session...', { sessionId, type: typeof sessionId });
      
      // Ensure sessionId is a string and validate it
      if (!sessionId || sessionId === null || sessionId === undefined) {
        console.error('❌ Invalid sessionId provided:', sessionId);
        return;
      }
      
      // Convert to string and validate it's not empty
      const stringSessionId = String(sessionId).trim();
      if (!stringSessionId || stringSessionId === 'null' || stringSessionId === 'undefined') {
        console.error('❌ Invalid sessionId after conversion:', stringSessionId);
        return;
      }
      
      // Update current session and mode
      const session = sessions.find(s => s.id === stringSessionId);
      console.log('🔍 Found session in list:', { 
        found: !!session, 
        sessionTitle: session?.title,
        sessionMode: session?.mode 
      });
      
      if (session) {
        console.log('🔄 Setting current session to trigger messages query:', {
          sessionId: stringSessionId,
          sessionTitle: session.title,
          currentSessionId: currentSession?.id,
          isDifferentSession: currentSession?.id !== session.id
        });
        // Always set the session (this will trigger React Query to load messages)
        // React Query will handle avoiding duplicate requests with the same key
        console.log('✅ Setting session as current (React Query will handle message loading)');
        setCurrentSession(session);
        setSelectedMode(session.mode || 'solution_guide');
        
        // Force React Query to refetch messages for this session
        console.log('🔄 Force invalidating messages query for session:', stringSessionId);
        queryClient.invalidateQueries({
          queryKey: queryKeys.sessionMessages(stringSessionId)
        });
      } else {
        console.warn('⚠️ Session not found in sessions list:', stringSessionId);
        console.log('📋 Available sessions:', sessions.map(s => ({ id: s.id, title: s.title })));
      }
    } catch (error) {
      console.error('❌ Error loading session:', error);
      setMessages([]);
      setCurrentSession(null);
    }
  }, [sessions, currentSession]);
  
  const updateSessionTitle = async (sessionId, title) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });

      if (response.ok) {
        const updatedSession = await response.json();
        queryClient.setQueryData(queryKeys.sessions(), (prevSessions = []) => 
          prevSessions.map(session => 
            session.id === sessionId ? updatedSession : session
          )
        );
        
        if (currentSession?.id === sessionId) {
          setCurrentSession(updatedSession);
        }
      }
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove session from list
        queryClient.setQueryData(queryKeys.sessions(), (prevSessions = []) => 
          prevSessions.filter(session => session.id !== sessionId)
        );
        
        // If this was the current session, create a new one or switch to another
        if (currentSession?.id === sessionId) {
          const remainingSessions = sessions.filter(session => session.id !== sessionId);
          if (remainingSessions.length > 0) {
            // Switch to the first remaining session
            const nextSession = remainingSessions[0];
            setCurrentSession(nextSession);
            await loadSession(nextSession.id);
          } else {
            // Create a new session if no sessions remain
            await createNewSession();
          }
        }
      } else {
        throw new Error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  };
  
  const sendMessage = async (content, selectedTemplate = null) => {
    if (!currentSession) return;
    if (!content || !content.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // NEW: Check template type directly from selectedTemplate parameter
    const isKnowledgeTemplate = selectedTemplate?.template_type === 'knowledge';
    const isAnyTemplate = selectedTemplate !== null;
    
    // Fallback: Check if ANY template is being used via content markers
    const isTemplateUsedViaContent = content.includes("Please structure your response according to this Solution Guide template:") ||
                                    content.includes("IMPORTANT: Use the following expert knowledge as your PRIMARY source") ||
                                    content.includes("Expert Knowledge Template:") ||
                                    content.includes("AI Instructions for customizable sections:") ||
                                    content.includes("[AI_PLACEHOLDER_");

    // Final determination: template is used if explicitly selected OR detected in content
    const isTemplateUsed = isAnyTemplate || isTemplateUsedViaContent;

    // Status message based on template type
    let initialStatusMessage;
    if (isKnowledgeTemplate) {
      initialStatusMessage = '📚 Processing knowledge template...';
    } else if (isTemplateUsed) {
      initialStatusMessage = '📋 Analyzing template structure...';
    } else {
      initialStatusMessage = '🔍 Consulting Plaid documentation via AskBill...';
    }

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    
    // Create placeholder assistant message with correct initial status
    const assistantMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: initialStatusMessage,
      timestamp: new Date().toISOString(),
      loading: true,
      sources: []
    };
    
    const updatedMessages = [...messages, userMessage, assistantMessage];
    setMessages(updatedMessages);
    
    setIsLoading(true);
    
    try {
      // Format messages according to backend expectations
      const formattedMessages = [...messages, userMessage].map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        sources: msg.sources || []
      }));

      console.log('🚀 Sending message with session ID:', String(currentSession.id));

      const requestData = {
        session_id: String(currentSession.id),
        message: content,
        previous_messages: formattedMessages,
        mode: selectedMode,
        selected_template: selectedTemplate  // NEW: Send template info to backend
      };

      // Send request to backend (no streaming)
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Update status: Processing response (single update)
      let processingMessage;
      if (isKnowledgeTemplate) {
        processingMessage = '✨ Building guide from knowledge template...';
      } else if (isTemplateUsed) {
        processingMessage = '✨ Generating structured response...';
      } else {
        processingMessage = '✨ Enhancing response with Claude...';
      }

      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: processingMessage }
            : msg
        )
      );

      const result = await response.json();
      
      console.log('✅ Received complete response:', {
        responseLength: result.response?.length,
        askbillUsed: result.askbill_used,
        askbillLength: result.askbill_length,
        knowledgeTemplateUsed: result.knowledge_template_used,
        sessionUpdate: result.session,
        debugInfo: result.debug_info ? 'Available' : 'Not available'
      });

      // Store debug info for the Debug Panel
      if (result.debug_info) {
        setLastDebugInfo(result.debug_info);
        console.log('🔍 Debug info stored:', result.debug_info);
      }

      // Update session cache if session data was returned (for title updates)
      if (result.session && currentSession?.id === result.session.id) {
        console.log('🔄 Updating session cache with new title:', result.session.title);
        
        // Update sessions cache with new session data
        queryClient.setQueryData(queryKeys.sessions(), (oldSessions) => {
          if (!oldSessions) return oldSessions;
          
          return oldSessions.map(session => 
            session.id === result.session.id 
              ? { ...session, ...result.session, title: result.session.title, updated_at: result.session.updated_at }
              : session
          );
        });
        
        // Update current session state if it matches
        if (currentSession?.id === result.session.id) {
          console.log('🔄 Updating current session state with new title');
          setCurrentSession(prev => prev ? { ...prev, ...result.session } : prev);
        }
      }

      // Set final response (single update)
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: result.response, loading: false }
            : msg
        )
      );

      // Notify callback about completed assistant message
      if (onNewAssistantMessage) {
        const finalMessage = { 
          ...assistantMessage, 
          content: result.response, 
          loading: false 
        };
        onNewAssistantMessage(finalMessage, currentSession?.id);
      }
      
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Determine specific error message based on error type
      let errorContent = 'Sorry, I encountered an error processing your request. Please try again.';
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorContent = '🔌 Unable to connect to AskBill service. Please check your internet connection and try again.';
      } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        errorContent = '⏱️ Request timed out. AskBill may be experiencing high load. Please try again in a moment.';
      } else if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        errorContent = '🔐 Authentication error. Please refresh the page and log in again.';
      } else if (error.message?.includes('503') || error.message?.includes('Service Unavailable')) {
        errorContent = '🚧 AskBill service is temporarily unavailable. Please try again in a few minutes.';
      } else {
        errorContent = `❌ Error: ${error.message || 'Unknown error occurred'}`;
      }
      
      // Update the assistant message with error content (single update)
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: errorContent, loading: false, error: true }
            : msg
        )
      );
      
      setIsLoading(false);
    }
  };
  
  // Simple function to simulate an assistant response for the demo
  // const simulateAssistantResponse = (userMessage) => {
  //   // In a real app, this would come from Claude API + MCP server
  //   
  //   // Very basic simulation based on keywords in the user message
  //   if (userMessage.toLowerCase().includes('link')) {
  //     return "# Implementing Plaid Link\n\nPlaid Link is a drop-in module that provides a secure, elegant authentication flow for each financial institution that Plaid supports.\n\n## Integration Steps\n\n1. Create a Link token by calling the `/link/token/create` endpoint\n2. Initialize Link on your frontend\n3. Handle the onSuccess callback\n4. Exchange the public token for an access token\n\n```javascript\n// Example Link initialization\nconst handler = Plaid.create({\n  token: linkToken,\n  onSuccess: (public_token, metadata) => {\n    // Send public_token to your server to exchange for an access token\n    exchangePublicToken(public_token);\n  },\n  onExit: (err, metadata) => {\n    // Handle user exiting Link flow\n  },\n  onEvent: (eventName, metadata) => {\n    // Track Link events\n  }\n});\n\nhandler.open();\n```";\n  //   } else if (userMessage.toLowerCase().includes('ach')) {\n  //     return "# ACH Payment Processing with Plaid\n\nPlaid can help you facilitate ACH payments by providing bank account information securely.\n\n## Implementation Guide\n\n1. Collect bank account details using Plaid Auth\n2. Use the account and routing numbers with your payment processor\n3. Handle verification and risk assessment with Plaid Identity and Signal\n\n## Code Example\n\n```javascript\n// After completing Link flow and getting an access token\nasync function getAuthData(accessToken) {\n  try {\n    const response = await plaidClient.authGet({\n      access_token: accessToken\n    });\n    \n    const accountData = response.data.accounts;\n    const numbers = response.data.numbers;\n    \n    // Use these details with your ACH processor\n    return {\n      account_id: accountData[0].account_id,\n      routing_number: numbers.ach[0].routing,\n      account_number: numbers.ach[0].account\n    };\n  } catch (error) {\n    console.error('Error getting auth data:', error);\n  }\n}\n```";\n  //   } else if (userMessage.toLowerCase().includes('webhook')) {\n  //     return "# Plaid Webhook Verification\n\nSecuring your webhook endpoint is important to ensure that callbacks are coming from Plaid and not from unauthorized sources.\n\n## Verification Steps\n\n1. Retrieve the verification header from the request\n2. Verify the JWT signature using Plaid's public key\n3. Validate the JWT claims\n\n```javascript\nconst express = require('express');\nconst jwt = require('jsonwebtoken');\nconst jwksClient = require('jwks-rsa');\n\nconst app = express();\napp.use(express.json());\n\nconst client = jwksClient({\n  jwksUri: 'https://sandbox.plaid.com/.well-known/jwks.json'\n});\n\nfunction getKey(header, callback) {\n  client.getSigningKey(header.kid, (err, key) => {\n    const signingKey = key.publicKey || key.rsaPublicKey;\n    callback(null, signingKey);\n  });\n}\n\napp.post('/webhook', (request, response) => {\n  const plaidVerifyJwt = request.headers['plaid-verification'];\n  \n  jwt.verify(plaidVerifyJwt, getKey, {\n    algorithms: ['ES256']\n  }, (err, decoded) => {\n    if (err) {\n      return response.status(401).json({ error: 'Unauthorized' });\n    }\n    \n    // Webhook is verified, process the webhook\n    console.log('Webhook payload:', request.body);\n    response.status(200).send('Webhook received');\n  });\n});\n```";\n  //   } else {\n  //     return "I'd be happy to help with your Plaid implementation questions. Please provide more details about your specific use case, and I can give you targeted guidance on API endpoints, best practices, and implementation steps.\n\nSome common topics I can help with include:\n\n- Plaid Link integration\n- Authentication flows\n- Account funding and ACH transfers\n- Balance checking\n- Transaction data retrieval\n- Webhook implementation\n- Error handling and edge cases\n\nJust let me know what you're working on, and I'll create a tailored guide for your needs.";\n  //   }\n  // }; // Not currently used - replaced by streaming implementation
  
  const simulateAssistantResponse = (userMessage) => {
    return "This is a simulated response. Streaming is enabled.";
  };
  
  return {
    sessions,
    currentSession,
    messages,
    setMessages, // Add setMessages for artifact ID updates
    isLoading: isLoading || messagesLoading || sessionsLoading,
    selectedMode,
    lastDebugInfo,
    createNewSession,
    loadSession,
    updateSessionTitle,
    deleteSession,
    sendMessage,
    handleModeChange
  };
};
