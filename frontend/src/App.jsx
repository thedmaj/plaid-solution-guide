import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { ArtifactPanel } from './components/ArtifactPanel';
import { Header } from './components/Header';
import { useAuth } from './hooks/useAuth';
import { useChatSession } from './hooks/useChatSession';
import { useArtifacts } from './hooks/useArtifacts';
import { LoadingSpinner } from './components/LoadingSpinner';

function App() {
  const { user, isLoading: authLoading, login, logout } = useAuth();
  const { 
    messages, 
    sendMessage, 
    isLoading: chatLoading, 
    currentSession,
    sessions,
    createNewSession,
    loadSession
  } = useChatSession();
  
  const { 
    artifacts, 
    selectedArtifact, 
    createArtifact, 
    updateArtifact, 
    downloadArtifact,
    selectArtifact
  } = useArtifacts();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [artifactPanelOpen, setArtifactPanelOpen] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  
  const handleSendMessage = async (message) => {
    await sendMessage(message);
  };
  
  const handleCreateArtifact = (title, content, type = 'markdown') => {
    createArtifact(title, content, type);
    setArtifactPanelOpen(true);
  };
  
  const handleToggleChatCollapse = (isCollapsed) => {
    setIsChatCollapsed(isCollapsed);
  };
  
  if (authLoading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
          <img 
            src="/plaid-logo.svg" 
            alt="Plaid Logo" 
            className="h-12 mx-auto mb-6" 
          />
          <h1 className="text-2xl font-bold text-center mb-6">
            Plaid Solution Guide Assistant
          </h1>
          <button
            onClick={login}
            className="w-full py-2 px-4 bg-blue-800 text-white rounded hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        currentSession={currentSession}
        onCreateNewSession={createNewSession}
        onSelectSession={loadSession}
        artifacts={artifacts}
        onSelectArtifact={selectArtifact}
        user={user}
        onLogout={logout}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onToggleArtifactPanel={() => setArtifactPanelOpen(!artifactPanelOpen)}
          artifactPanelOpen={artifactPanelOpen}
          currentSession={currentSession}
          isChatCollapsed={isChatCollapsed}
          onToggleChatCollapse={handleToggleChatCollapse}
        />
        
        <div className="flex flex-1 overflow-hidden">
          {/* Chat window with conditional width based on collapsed state */}
          <div 
            className={`${
              isChatCollapsed ? 'w-0 opacity-0' : artifactPanelOpen ? 'w-1/2' : 'w-full'
            } transition-all duration-300 ease-in-out overflow-hidden`}
          >
            <ChatWindow 
              messages={messages} 
              onSendMessage={handleSendMessage}
              isLoading={chatLoading}
              onCreateArtifact={handleCreateArtifact}
              currentSession={currentSession}
              isChatCollapsed={isChatCollapsed}
            />
          </div>
          
          {artifactPanelOpen && (
            <ArtifactPanel 
              artifact={selectedArtifact}
              onUpdate={updateArtifact}
              onDownload={downloadArtifact}
              onClose={() => setArtifactPanelOpen(false)}
              onToggleChatCollapse={handleToggleChatCollapse}
              isChatCollapsed={isChatCollapsed}
              className={isChatCollapsed ? 'w-full' : 'w-1/2'}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;