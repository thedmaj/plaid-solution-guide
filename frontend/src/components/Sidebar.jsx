import React, { useState } from 'react';
import { 
  PlusIcon, 
  MessageSquareIcon, 
  FileTextIcon, 
  LogOutIcon, 
  ChevronLeftIcon,
  UserIcon
} from 'lucide-react';

export const Sidebar = ({ 
  isOpen, 
  onToggle, 
  sessions, 
  currentSession, 
  onCreateNewSession, 
  onSelectSession,
  artifacts,
  onSelectArtifact,
  user,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState('chats');
  
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-r-md border border-l-0 border-gray-200 text-gray-500 hover:text-gray-700 transition-colors z-10"
      >
        <ChevronLeftIcon size={16} className="rotate-180" />
      </button>
    );
  }
  
  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <img src="/plaid-logo.svg" alt="Plaid Logo" className="h-8" />
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeftIcon size={16} />
          </button>
        </div>
        <button
          onClick={onCreateNewSession}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon size={16} />
          <span>New Chat</span>
        </button>
      </div>
      
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'chats'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('chats')}
        >
          Chats
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'artifacts'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('artifacts')}
        >
          Artifacts
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          <div className="py-2">
            {sessions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No chats yet. Start a new conversation!
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left text-sm ${
                    currentSession?.id === session.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  } transition-colors`}
                >
                  <MessageSquareIcon size={16} />
                  <div className="truncate flex-1">
                    {session.title || 'New conversation'}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(session.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="py-2">
            {artifacts.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No artifacts yet. Save content from a chat!
              </div>
            ) : (
              artifacts.map((artifact) => (
                <button
                  key={artifact.id}
                  onClick={() => onSelectArtifact(artifact.id)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FileTextIcon size={16} />
                  <div className="truncate flex-1">{artifact.title}</div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(artifact.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center">
            <UserIcon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{user.name}</div>
            <div className="text-xs text-gray-500 truncate">{user.email}</div>
          </div>
          <button
            onClick={onLogout}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Sign out"
          >
            <LogOutIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
