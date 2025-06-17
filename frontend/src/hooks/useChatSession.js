import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useChatSession = (onNewAssistantMessage) => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState('solution_guide');
  
  // Load sessions from the backend
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setSessions([]);
          setCurrentSession(null);
          setMessages([]);
          return;
        }

        const response = await fetch('/api/chat/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Loaded sessions from backend:', {
            count: data.length,
            sessions: data.map(s => ({ id: s.id, title: s.title, type: typeof s.id }))
          });
          
          // Validate session data structure
          const validSessions = data.filter(session => {
            const isValid = session && session.id && typeof session.id !== 'undefined';
            if (!isValid) {
              console.error('❌ Invalid session found:', session);
            }
            return isValid;
          });
          
          if (validSessions.length !== data.length) {
            console.warn('⚠️ Some sessions were filtered out due to invalid data');
          }
          
          setSessions(validSessions);
          
          // Load the most recent session by default
          if (validSessions.length > 0) {
            const lastSession = validSessions[0];
            console.log('🔄 Auto-loading most recent session:', {
              id: lastSession.id,
              title: lastSession.title,
              mode: lastSession.mode
            });
            setCurrentSession(lastSession);
            setSelectedMode(lastSession.mode || 'solution_guide');
            await loadSession(lastSession.id);
          } else {
            createNewSession();
          }
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        createNewSession();
      }
    };
    
    loadSessions();
  }, [localStorage.getItem('token')]);
  
  const createNewSession = async (mode = selectedMode) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Ensure we're only sending the mode as a string
      const sessionMode = typeof mode === 'string' ? mode : selectedMode;

      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          mode: sessionMode
        })
      });

      if (response.ok) {
        const newSession = await response.json();
        setSessions(prevSessions => [newSession, ...prevSessions]);
        setCurrentSession(newSession);
        setSelectedMode(sessionMode);
        setMessages([]);
        return newSession;
      }
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };
  
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
        
        // Update the session in the sessions list
        setSessions(prevSessions => 
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
  
  const loadSession = async (sessionId) => {
    try {
      console.log('🔄 useChatSession: Loading session...', { sessionId, type: typeof sessionId });
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No token found when loading session');
        setIsLoading(false);
        return;
      }

      // Ensure sessionId is a string and validate it
      if (!sessionId || sessionId === null || sessionId === undefined) {
        console.error('❌ Invalid sessionId provided:', sessionId);
        setIsLoading(false);
        return;
      }
      
      // Convert to string and validate it's not empty
      const stringSessionId = String(sessionId).trim();
      if (!stringSessionId || stringSessionId === 'null' || stringSessionId === 'undefined') {
        console.error('❌ Invalid sessionId after conversion:', stringSessionId);
        setIsLoading(false);
        return;
      }
      
      console.log('📨 Loading session with ID:', stringSessionId);

      const response = await fetch(`/api/chat/sessions/${stringSessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Session load response:', { 
        ok: response.ok, 
        status: response.status, 
        statusText: response.statusText 
      });

      if (response.ok) {
        const sessionMessages = await response.json();
        console.log('📨 Loaded messages:', { 
          count: sessionMessages?.length, 
          firstMessage: sessionMessages?.[0]?.role 
        });
        
        // Validate messages array
        if (!Array.isArray(sessionMessages)) {
          console.error('❌ Invalid messages format:', sessionMessages);
          setMessages([]);
        } else {
          setMessages(sessionMessages);
        }
        
        // Update current session and mode
        const session = sessions.find(s => s.id === stringSessionId);
        console.log('🔍 Found session in list:', { 
          found: !!session, 
          sessionTitle: session?.title,
          sessionMode: session?.mode 
        });
        
        if (session) {
          setCurrentSession(session);
          setSelectedMode(session.mode || 'solution_guide');
        } else {
          console.warn('⚠️ Session not found in sessions list:', stringSessionId);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load session:', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText 
        });
      }
    } catch (error) {
      console.error('❌ Error loading session:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        sessionId
      });
      
      // Reset to empty state on error
      setMessages([]);
      setCurrentSession(null);
    } finally {
      setIsLoading(false);
    }
  };
  
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
        setSessions(prevSessions => 
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
        setSessions(prevSessions => 
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
  
  const sendMessage = async (content) => {
    if (!currentSession) return;
    if (!content || !content.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    setIsLoading(true);
    
    try {
      // Format messages according to backend expectations, including the current message
      const formattedMessages = [...messages, userMessage].map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        sources: msg.sources || []
      }));

      console.log('Sending message with session ID:', String(currentSession.id));
      console.log('Previous messages:', formattedMessages);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          session_id: String(currentSession.id),
          message: content,
          previous_messages: formattedMessages,
          mode: selectedMode
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(`Failed to get response from assistant: ${errorData.detail || 'Unknown error'}`);
      }
      
      const responseData = await response.json();
      console.log('Received response:', responseData);
      
      if (responseData.messages && Array.isArray(responseData.messages)) {
        // Find the assistant message in the response
        const assistantMsg = responseData.messages.find(msg => msg.role === 'assistant');
        if (assistantMsg) {
          setMessages([...updatedMessages, assistantMsg]);
          // Notify callback about new assistant message
          if (onNewAssistantMessage) {
            onNewAssistantMessage(assistantMsg, currentSession?.id);
          }
        } else {
          setMessages(updatedMessages); // fallback: just user message
        }
      } else {
        setMessages(updatedMessages); // fallback: just user message
      }
      
      // Handle session title update
      if (responseData.session && responseData.session.title) {
        const updatedSession = {
          ...currentSession,
          title: responseData.session.title,
          updated_at: responseData.session.updated_at
        };
        
        // Update current session
        setCurrentSession(updatedSession);
        
        // Update sessions list
        setSessions(prevSessions => 
          prevSessions.map(session => 
            session.id === updatedSession.id ? updatedSession : session
          )
        );
        
        console.log(`Session title updated to: "${responseData.session.title}"`);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      
    } finally {
      setIsLoading(false);
    }
  };
  
  // Simple function to simulate an assistant response for the demo
  const simulateAssistantResponse = (userMessage) => {
    // In a real app, this would come from Claude API + MCP server
    
    // Very basic simulation based on keywords in the user message
    if (userMessage.toLowerCase().includes('link')) {
      return "# Implementing Plaid Link\n\nPlaid Link is a drop-in module that provides a secure, elegant authentication flow for each financial institution that Plaid supports.\n\n## Integration Steps\n\n1. Create a Link token by calling the `/link/token/create` endpoint\n2. Initialize Link on your frontend\n3. Handle the onSuccess callback\n4. Exchange the public token for an access token\n\n```javascript\n// Example Link initialization\nconst handler = Plaid.create({\n  token: linkToken,\n  onSuccess: (public_token, metadata) => {\n    // Send public_token to your server to exchange for an access token\n    exchangePublicToken(public_token);\n  },\n  onExit: (err, metadata) => {\n    // Handle user exiting Link flow\n  },\n  onEvent: (eventName, metadata) => {\n    // Track Link events\n  }\n});\n\nhandler.open();\n```";
    } else if (userMessage.toLowerCase().includes('ach')) {
      return "# ACH Payment Processing with Plaid\n\nPlaid can help you facilitate ACH payments by providing bank account information securely.\n\n## Implementation Guide\n\n1. Collect bank account details using Plaid Auth\n2. Use the account and routing numbers with your payment processor\n3. Handle verification and risk assessment with Plaid Identity and Signal\n\n## Code Example\n\n```javascript\n// After completing Link flow and getting an access token\nasync function getAuthData(accessToken) {\n  try {\n    const response = await plaidClient.authGet({\n      access_token: accessToken\n    });\n    \n    const accountData = response.data.accounts;\n    const numbers = response.data.numbers;\n    \n    // Use these details with your ACH processor\n    return {\n      account_id: accountData[0].account_id,\n      routing_number: numbers.ach[0].routing,\n      account_number: numbers.ach[0].account\n    };\n  } catch (error) {\n    console.error('Error getting auth data:', error);\n  }\n}\n```";
    } else if (userMessage.toLowerCase().includes('webhook')) {
      return "# Plaid Webhook Verification\n\nSecuring your webhook endpoint is important to ensure that callbacks are coming from Plaid and not from unauthorized sources.\n\n## Verification Steps\n\n1. Retrieve the verification header from the request\n2. Verify the JWT signature using Plaid's public key\n3. Validate the JWT claims\n\n```javascript\nconst express = require('express');\nconst jwt = require('jsonwebtoken');\nconst jwksClient = require('jwks-rsa');\n\nconst app = express();\napp.use(express.json());\n\nconst client = jwksClient({\n  jwksUri: 'https://sandbox.plaid.com/.well-known/jwks.json'\n});\n\nfunction getKey(header, callback) {\n  client.getSigningKey(header.kid, (err, key) => {\n    const signingKey = key.publicKey || key.rsaPublicKey;\n    callback(null, signingKey);\n  });\n}\n\napp.post('/webhook', (request, response) => {\n  const plaidVerifyJwt = request.headers['plaid-verification'];\n  \n  jwt.verify(plaidVerifyJwt, getKey, {\n    algorithms: ['ES256']\n  }, (err, decoded) => {\n    if (err) {\n      return response.status(401).json({ error: 'Unauthorized' });\n    }\n    \n    // Webhook is verified, process the webhook\n    console.log('Webhook payload:', request.body);\n    response.status(200).send('Webhook received');\n  });\n});\n```";
    } else {
      return "I'd be happy to help with your Plaid implementation questions. Please provide more details about your specific use case, and I can give you targeted guidance on API endpoints, best practices, and implementation steps.\n\nSome common topics I can help with include:\n\n- Plaid Link integration\n- Authentication flows\n- Account funding and ACH transfers\n- Balance checking\n- Transaction data retrieval\n- Webhook implementation\n- Error handling and edge cases\n\nJust let me know what you're working on, and I'll create a tailored guide for your needs.";
    }
  };
  
  return {
    sessions,
    currentSession,
    messages,
    isLoading,
    selectedMode,
    createNewSession,
    loadSession,
    updateSessionTitle,
    deleteSession,
    sendMessage,
    handleModeChange
  };
};
