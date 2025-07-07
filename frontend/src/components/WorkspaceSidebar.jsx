/**
 * Enhanced Sidebar with Workspace Support
 * Groups artifacts by session workspaces while maintaining backward compatibility
 */

import React, { useState, useMemo } from 'react';
import { 
  PlusIcon, 
  MessageSquareIcon, 
  FileTextIcon, 
  LogOutIcon, 
  ChevronLeftIcon,
  UserIcon,
  UserPlusIcon,
  LayersIcon,
  FolderIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  TrashIcon,
  SettingsIcon
} from 'lucide-react';
import { CreateUserOverlay } from './CreateUserOverlay';
import AdminConsole from './AdminConsole';

export const WorkspaceSidebar = ({ 
  isOpen, 
  onToggle, 
  sessions, 
  currentSession, 
  onCreateNewSession, 
  onSelectSession,
  onDeleteSession, // Add delete session handler
  artifacts,
  onSelectArtifact,
  user,
  onLogout,
  onToggleChatCollapse,
  onOpenArtifactPanel,
  workspaces = new Map(), // Workspace data
  workspaceMode = false // Toggle between workspace and classic view
}) => {
  const [activeTab, setActiveTab] = useState('chats');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showAdminConsole, setShowAdminConsole] = useState(false);
  const [expandedWorkspaces, setExpandedWorkspaces] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null); // Track which session to confirm delete
  
  // Handle session deletion with confirmation
  const handleDeleteSession = async (sessionId, event) => {
    event.stopPropagation(); // Prevent session selection when clicking delete
    
    if (confirmDelete === sessionId) {
      // Second click confirms deletion
      try {
        await onDeleteSession(sessionId);
        setConfirmDelete(null);
      } catch (error) {
        console.error('Error deleting session:', error);
        alert('Failed to delete session. Please try again.');
      }
    } else {
      // First click shows confirmation
      setConfirmDelete(sessionId);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };
  
  // Group artifacts by workspace or show classic view
  const organizedArtifacts = useMemo(() => {
    if (!workspaceMode || workspaces.size === 0) {
      // Classic view - just return all artifacts
      return {
        ungrouped: artifacts || [],
        workspaceGroups: []
      };
    }

    const workspaceGroups = [];
    const ungroupedArtifacts = [...(artifacts || [])];

    // Create workspace groups
    for (const [sessionId, workspace] of workspaces) {
      const session = sessions.find(s => s.id === sessionId);
      if (!workspace.primaryArtifact && workspace.supplementaryArtifacts.length === 0) {
        continue; // Skip empty workspaces
      }

      const workspaceArtifacts = [
        ...(workspace.primaryArtifact ? [workspace.primaryArtifact] : []),
        ...workspace.supplementaryArtifacts
      ];

      // Remove these artifacts from ungrouped list
      workspaceArtifacts.forEach(artifact => {
        const index = ungroupedArtifacts.findIndex(a => a.id === artifact.id);
        if (index !== -1) {
          ungroupedArtifacts.splice(index, 1);
        }
      });

      workspaceGroups.push({
        sessionId,
        session,
        workspace,
        artifacts: workspaceArtifacts,
        isActive: currentSession?.id === sessionId
      });
    }

    return {
      ungrouped: ungroupedArtifacts,
      workspaceGroups: workspaceGroups.sort((a, b) => 
        new Date(b.workspace.metadata.lastActivity) - new Date(a.workspace.metadata.lastActivity)
      )
    };
  }, [artifacts, workspaces, sessions, currentSession, workspaceMode]);

  const handleArtifactDoubleClick = (artifactId) => {
    onSelectArtifact(artifactId);
    onToggleChatCollapse(true);
    onOpenArtifactPanel(true);
  };

  const handleSessionDoubleClick = (sessionId) => {
    onSelectSession(sessionId);
    onToggleChatCollapse(false);
  };

  const handleCreateUserSuccess = (newUser) => {
    console.log('User created successfully:', newUser);
  };

  const toggleWorkspaceExpansion = (sessionId) => {
    setExpandedWorkspaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const formatLastActivity = (timestamp) => {
    const now = new Date();
    const activity = new Date(timestamp);
    const diffMinutes = Math.floor((now - activity) / (1000 * 60));
    
    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return activity.toLocaleDateString();
  };
  
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-r-md border border-l-0 border-gray-200 text-gray-500 hover:text-gray-700 transition-colors z-10"
      >
        <ChevronRightIcon size={16} />
      </button>
    );
  }

  return (
    <>
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Plaid Guide</h2>
            <button
              onClick={onToggle}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronLeftIcon size={20} />
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'chats'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab('artifacts')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'artifacts'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Artifacts
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'chats' && (
            <div className="p-4">
              <button
                onClick={() => onCreateNewSession()}
                className="w-full flex items-center gap-2 p-3 text-left bg-plaid-blue-600 text-white rounded-lg hover:bg-plaid-blue-700 transition-colors mb-4 focus:outline-none focus:ring-2 focus:ring-plaid-blue-500 focus:ring-opacity-50"
              >
                <PlusIcon size={16} className="text-white" />
                <span className="text-white">New Chat</span>
              </button>

              <div className="space-y-2">
                {sessions.map((session) => {
                  const isActive = currentSession?.id === session.id;
                  return (
                    <div
                      key={session.id}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-plaid-blue-50 border border-plaid-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div 
                        onClick={() => {
                          try {
                            console.log('🖱️ WorkspaceSidebar: Clicking session:', { 
                              sessionId: session.id, 
                              sessionType: typeof session.id,
                              sessionData: session 
                            });
                            onSelectSession(session.id);
                          } catch (error) {
                            console.error('❌ WorkspaceSidebar: Error in session click:', error);
                            console.error('Session data that caused error:', session);
                          }
                        }}
                        onDoubleClick={() => handleSessionDoubleClick(session.id)}
                        className="flex items-center gap-2"
                      >
                        <MessageSquareIcon 
                          size={16} 
                          className={isActive ? 'text-plaid-blue-600' : 'text-gray-500'} 
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${
                            isActive ? 'text-plaid-blue-900' : 'text-gray-900'
                          }`}>
                            {session.title || 'New conversation'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(session.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                          confirmDelete === session.id
                            ? 'text-red-600 bg-red-100'
                            : 'text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100'
                        }`}
                        title={confirmDelete === session.id ? 'Click again to confirm delete' : 'Delete conversation'}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  );
                })}

                {sessions.length === 0 && (
                  <div className="text-center py-8">
                    <MessageSquareIcon size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No conversations yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'artifacts' && (
            <div className="p-4">
              {/* Workspace Groups */}
              {organizedArtifacts.workspaceGroups.map((group) => {
                const isExpanded = expandedWorkspaces.has(group.sessionId);
                const { workspace, artifacts: groupArtifacts, isActive } = group;
                
                return (
                  <div key={group.sessionId} className="mb-4">
                    <button
                      onClick={() => toggleWorkspaceExpansion(group.sessionId)}
                      className={`w-full flex items-center gap-2 p-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-plaid-blue-50 border border-plaid-blue-200' 
                          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <LayersIcon 
                        size={16} 
                        className={isActive ? 'text-plaid-blue-600' : 'text-gray-600'} 
                      />
                      <div className="flex-1 text-left">
                        <div className={`text-sm font-medium ${
                          isActive ? 'text-plaid-blue-900' : 'text-gray-900'
                        }`}>
                          {group.session?.title || 'Workspace'}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span>{groupArtifacts.length} artifacts</span>
                          <span>•</span>
                          <span>{formatLastActivity(workspace.metadata.lastActivity)}</span>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDownIcon size={16} className="text-gray-400" />
                      ) : (
                        <ChevronRightIcon size={16} className="text-gray-400" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="ml-4 mt-2 space-y-1">
                        {groupArtifacts.map((artifact) => {
                          const isPrimary = artifact.id === workspace.primaryArtifact?.id;
                          return (
                            <div
                              key={artifact.id}
                              onClick={() => onSelectArtifact(artifact.id)}
                              onDoubleClick={() => handleArtifactDoubleClick(artifact.id)}
                              className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer group"
                            >
                              <FileTextIcon 
                                size={14} 
                                className={isPrimary ? 'text-plaid-blue-600' : 'text-gray-500'} 
                              />
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm truncate ${
                                  isPrimary ? 'font-medium text-plaid-blue-900' : 'text-gray-900'
                                }`}>
                                  {artifact.title}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                  {isPrimary && (
                                    <span className="px-1.5 py-0.5 bg-plaid-blue-100 text-plaid-blue-700 rounded text-xs font-medium">
                                      Primary
                                    </span>
                                  )}
                                  <span>{new Date(artifact.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Ungrouped Artifacts */}
              {organizedArtifacts.ungrouped.length > 0 && (
                <div className="mb-4">
                  {organizedArtifacts.workspaceGroups.length > 0 && (
                    <div className="flex items-center gap-2 px-2 py-1 mb-2">
                      <FolderIcon size={14} className="text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">Other Artifacts</span>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    {organizedArtifacts.ungrouped.map((artifact) => (
                      <div
                        key={artifact.id}
                        onClick={() => onSelectArtifact(artifact.id)}
                        onDoubleClick={() => handleArtifactDoubleClick(artifact.id)}
                        className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 cursor-pointer group"
                      >
                        <FileTextIcon size={16} className="text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {artifact.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(artifact.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {organizedArtifacts.workspaceGroups.length === 0 && organizedArtifacts.ungrouped.length === 0 && (
                <div className="text-center py-8">
                  <FileTextIcon size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No artifacts yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Artifacts will appear here as you chat
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-col gap-3">
            {/* User Info */}
            <div className="flex items-center gap-2">
              <UserIcon size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">{user?.email || 'User'}</span>
              {(user?.role === 'ADMIN' || user?.role === 'admin') && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              )}
            </div>
            
            {/* Admin Actions (if admin) */}
            {(user?.role === 'ADMIN' || user?.role === 'admin') && (
              <div className="flex items-center gap-2 p-2 bg-plaid-blue-50 rounded-lg">
                <button
                  onClick={() => setShowAdminConsole(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-plaid-blue-600 text-white rounded hover:bg-plaid-blue-700 transition-colors flex-1"
                  title="Admin Console"
                >
                  <SettingsIcon size={14} />
                  <span>Admin Console</span>
                </button>
                <button
                  onClick={() => setShowCreateUser(true)}
                  className="p-2 text-plaid-blue-600 hover:text-plaid-blue-700 hover:bg-plaid-blue-100 rounded transition-colors"
                  title="Quick Create User"
                >
                  <UserPlusIcon size={14} />
                </button>
              </div>
            )}

            
            {/* Logout */}
            <div className="flex justify-end">
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                title="Logout"
              >
                <LogOutIcon size={14} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCreateUser && (
        <CreateUserOverlay
          onClose={() => setShowCreateUser(false)}
          onSuccess={handleCreateUserSuccess}
        />
      )}

      {showAdminConsole && (
        <AdminConsole
          onClose={() => setShowAdminConsole(false)}
        />
      )}
    </>
  );
};

export default WorkspaceSidebar;