import React, { useState, useEffect } from 'react';

export const DebugPanel = ({ 
  currentWorkspace, 
  artifacts, 
  messages, 
  currentSession 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState([]);

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
        className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm z-50"
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