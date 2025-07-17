import React, { useState, useEffect } from 'react';

export const DebugPanel = ({ 
  currentWorkspace, 
  artifacts, 
  messages, 
  currentSession,
  lastDebugInfo 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [askBillStatus, setAskBillStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Function to fetch AskBill status
  const fetchAskBillStatus = async () => {
    setStatusLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAskBillStatus({ status: 'no_auth', icon: '🔒' });
        return;
      }

      const response = await fetch('/api/askbill/status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAskBillStatus(data);
        // Removed console.log to reduce log spam
      } else {
        setAskBillStatus({ 
          status: 'fetch_error', 
          error: `HTTP ${response.status}`,
          icon: '❌' 
        });
      }
    } catch (error) {
      console.error('Failed to fetch AskBill status:', error);
      setAskBillStatus({ 
        status: 'fetch_error', 
        error: error.message,
        icon: '💥' 
      });
    } finally {
      setStatusLoading(false);
    }
  };

  // Auto-refresh AskBill status (only on open, no recurring updates)
  useEffect(() => {
    if (isOpen) {
      fetchAskBillStatus();
      // Removed recurring interval to reduce log spam
    }
  }, [isOpen]);

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type, ...args) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            // Handle circular references safely
            return JSON.stringify(arg, (key, value) => {
              // Skip circular references and problematic objects
              if (typeof value === 'object' && value !== null) {
                if (value.constructor === Window || 
                    value.constructor === Document ||
                    value.constructor === HTMLElement ||
                    key === 'window' || 
                    key === 'document' ||
                    key === 'target' ||
                    key === 'currentTarget' ||
                    key === 'view') {
                  return '[Circular/DOM Object]';
                }
              }
              return value;
            }, 2);
          } catch (error) {
            return `[Object: ${arg.constructor?.name || 'Unknown'}]`;
          }
        }
        return String(arg);
      }).join(' ');
      
      setLogs(prev => [...prev.slice(-50), { type, timestamp, message }]);
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', ...args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', ...args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', ...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm z-50 hover:bg-red-700 transition-colors"
      >
        Debug Panel
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-1/2 h-1/2 bg-black text-green-400 font-mono text-xs overflow-auto z-50 border-l border-t border-gray-600">
      <div className="sticky top-0 bg-gray-800 p-2 flex justify-between items-center">
        <span>Debug Panel</span>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-red-400"
        >
          ✕
        </button>
      </div>
      
      <div className="p-2">
        <div className="mb-4">
          <h3 className="text-yellow-400 font-bold">Current State:</h3>
          <div>Session: {currentSession?.id}</div>
          <div>Workspace: {currentWorkspace ? 'Exists' : 'None'}</div>
          <div>Primary Artifact: {currentWorkspace?.primaryArtifact?.id || 'None'}</div>
          <div>Artifacts Count: {artifacts.length}</div>
          <div>Messages Count: {messages.length}</div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-yellow-400 font-bold">AskBill MCP Status:</h3>
            <button 
              onClick={fetchAskBillStatus}
              disabled={statusLoading}
              className="text-xs bg-plaid-blue-600 hover:bg-plaid-blue-700 text-white px-2 py-1 rounded disabled:opacity-50"
            >
              {statusLoading ? '🔄' : '🔄 Refresh'}
            </button>
          </div>
          
          {askBillStatus ? (
            <div className="text-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{askBillStatus.icon}</span>
                <span className={`font-bold ${
                  askBillStatus.status === 'available' ? 'text-green-400' :
                  askBillStatus.status === 'unavailable' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {askBillStatus.status.toUpperCase()}
                </span>
              </div>
              
              {askBillStatus.error && (
                <div className="text-red-400 mb-2">Error: {askBillStatus.error}</div>
              )}
              
              {askBillStatus.connection_stats && (
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>Status: <span className="text-cyan-400">{askBillStatus.connection_stats.current_status}</span></div>
                  <div>Success Rate: <span className="text-green-400">{askBillStatus.connection_stats.success_rate?.toFixed(1)}%</span></div>
                  <div>Attempts: <span className="text-blue-400">{askBillStatus.connection_stats.connection_attempts}</span></div>
                  <div>Successful: <span className="text-green-400">{askBillStatus.connection_stats.successful_connections}</span></div>
                  <div>Failed: <span className="text-red-400">{askBillStatus.connection_stats.failed_connections}</span></div>
                  <div>Avg Response: <span className="text-yellow-400">{askBillStatus.connection_stats.avg_response_time?.toFixed(2)}s</span></div>
                  <div>Total Questions: <span className="text-purple-400">{askBillStatus.connection_stats.total_questions}</span></div>
                  <div>Successful Responses: <span className="text-green-400">{askBillStatus.connection_stats.successful_responses}</span></div>
                </div>
              )}
              
              {askBillStatus.client_info && (
                <div className="mt-2 text-xs text-gray-400">
                  <div>URI: {askBillStatus.client_info.uri}</div>
                  <div>Anonymous ID: {askBillStatus.client_info.anonymous_id}</div>
                </div>
              )}
              
              {askBillStatus.connection_stats?.last_error && (
                <div className="mt-2 text-xs text-red-400">
                  Last Error: {askBillStatus.connection_stats.last_error}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Click refresh to check status</div>
          )}
        </div>
        
        {/* Debug Info Section */}
        <div className="mb-4">
          <h3 className="text-yellow-400 font-bold">Last Chat Debug Info:</h3>
          {lastDebugInfo ? (
            <div className="text-sm">
              <div className="mb-2">
                <div className="text-cyan-400">Chat Mode: <span className="text-white">{lastDebugInfo.chat_mode}</span></div>
                <div className="text-cyan-400">AskBill Direct: <span className="text-white">{lastDebugInfo.is_askbill_direct ? 'Yes' : 'No'}</span></div>
                <div className="text-cyan-400">Knowledge Template: <span className="text-white">{lastDebugInfo.is_knowledge_template ? 'Yes' : 'No'}</span></div>
                <div className="text-cyan-400">AskBill Used: <span className="text-white">{lastDebugInfo.askbill_used ? 'Yes' : 'No'}</span></div>
              </div>
              
              {lastDebugInfo.raw_askbill_response && (
                <div className="mb-2">
                  <div className="text-red-400 font-bold">Raw AskBill Response:</div>
                  <div className="bg-gray-900 p-2 rounded text-xs max-h-32 overflow-auto text-green-300">
                    {lastDebugInfo.raw_askbill_response}
                  </div>
                </div>
              )}
              
              {lastDebugInfo.enhanced_message && (
                <div className="mb-2">
                  <div className="text-blue-400 font-bold">Enhanced Message to Claude:</div>
                  <div className="bg-gray-900 p-2 rounded text-xs max-h-32 overflow-auto text-blue-300">
                    {lastDebugInfo.enhanced_message}
                  </div>
                </div>
              )}
              
              {lastDebugInfo.system_prompt && (
                <div className="mb-2">
                  <div className="text-purple-400 font-bold">System Prompt:</div>
                  <div className="bg-gray-900 p-2 rounded text-xs max-h-32 overflow-auto text-purple-300">
                    {lastDebugInfo.system_prompt}
                  </div>
                </div>
              )}
              
              {lastDebugInfo.user_message && (
                <div className="mb-2">
                  <div className="text-orange-400 font-bold">Original User Message:</div>
                  <div className="bg-gray-900 p-2 rounded text-xs max-h-32 overflow-auto text-orange-300">
                    {lastDebugInfo.user_message}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No debug info available yet</div>
          )}
        </div>
        
        <div>
          <h3 className="text-yellow-400 font-bold">Console Logs:</h3>
          <div className="max-h-64 overflow-auto">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`mb-1 ${
                  log.type === 'error' ? 'text-red-400' : 
                  log.type === 'warn' ? 'text-yellow-400' : 
                  'text-green-400'
                }`}
              >
                <span className="text-gray-400">[{log.timestamp}]</span> {log.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};