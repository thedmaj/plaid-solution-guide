import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useChatSession = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Simulate loading sessions from local storage or API
  useEffect(() => {
    const loadSessions = async () => {
      const storedSessions = localStorage.getItem('plaid_sessions');
      
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions);
        setSessions(parsedSessions);
        
        // Load the most recent session by default
        if (parsedSessions.length > 0) {
          const lastSession = parsedSessions[0];
          setCurrentSession(lastSession);
          loadSessionMessages(lastSession.id);
        } else {
          createNewSession();
        }
      } else {
        createNewSession();
      }
    };
    
    loadSessions();
  }, []);
  
  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('plaid_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);
  
  const createNewSession = () => {
    const newSession = {
      id: uuidv4(),
      title: 'New conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setSessions(prevSessions => [newSession, ...prevSessions]);
    setCurrentSession(newSession);
    setMessages([]);
    
    return newSession;
  };
  
  const loadSession = async (sessionId) => {
    const session = sessions.find(s => s.id === sessionId);
    
    if (session) {
      setCurrentSession(session);
      await loadSessionMessages(sessionId);
    }
  };
  
  const loadSessionMessages = async (sessionId) => {
    const storedMessages = localStorage.getItem(`plaid_messages_${sessionId}`);
    if (storedMessages) {
      const loadedMessages = JSON.parse(storedMessages).filter(m => m.content && m.content.trim());
      setMessages(loadedMessages);
      console.log("Loaded messages from localStorage:", loadedMessages);
    } else {
      setMessages([]);
    }
  };
  
  const saveSessionMessages = (sessionId, messages) => {
    localStorage.setItem(`plaid_messages_${sessionId}`, JSON.stringify(messages));
  };
  
  const updateSessionTitle = (sessionId, title) => {
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === sessionId 
          ? { ...session, title, updated_at: new Date().toISOString() } 
          : session
      )
    );
    
    if (currentSession?.id === sessionId) {
      setCurrentSession(prev => ({ ...prev, title, updated_at: new Date().toISOString() }));
    }
  };
  
  const sendMessage = async (content) => {
    if (!currentSession) return;
    if (!content || !content.trim()) return; // Prevent empty messages
    
    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    saveSessionMessages(currentSession.id, updatedMessages);
    
    if (messages.length === 0) {
      const title = content.length > 30 ? `${content.substring(0, 30)}...` : content;
      updateSessionTitle(currentSession.id, title);
    }
    
    setIsLoading(true);
    
    try {
      const filteredMessages = messages.filter(m => m.content && m.content.trim());
      console.log("Sending previous_messages to backend:", filteredMessages);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSession.id,
          message: content,
          previous_messages: filteredMessages,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from assistant');
      }
      
      const responseData = await response.json();
      
      // Extract the response text from the backend response
      // The backend returns { content: "response text" } in the assistant_message
      const responseText = responseData.content || '';
      
      // Log for debugging
      console.log("Backend response data:", responseData);
      console.log("Assistant message content:", responseText);
      
      const assistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date().toISOString(),
        sources: responseData.sources || [],
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveSessionMessages(currentSession.id, finalMessages);
      
      // After receiving the response from the backend
      console.log("Claude API response:", response);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add an error message
      const errorMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveSessionMessages(currentSession.id, finalMessages);
      
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
    sendMessage,
    createNewSession,
    loadSession,
    updateSessionTitle,
  };
};
