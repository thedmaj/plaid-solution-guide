import React, { useState } from 'react';
import { 
  Menu, 
  PanelRight as PanelRightIcon, 
  PanelLeftClose as PanelRightCloseIcon, 
  MoreHorizontal as MoreHorizontalIcon,
  FileText as FileTextIcon,
  Download as DownloadIcon,
  Trash as TrashIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon
} from 'lucide-react';

export const Header = ({ 
  onToggleSidebar, 
  onToggleArtifactPanel, 
  artifactPanelOpen,
  currentSession,
  isChatCollapsed,
  onToggleChatCollapse
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Menu size={20} />
        </button>
        
        <h1 className="font-medium text-gray-800 truncate max-w-lg">
          {currentSession?.title || 'New conversation'}
        </h1>
      </div>
      
      <div className="flex items-center gap-3">
        {artifactPanelOpen && (
          <button
            onClick={() => onToggleChatCollapse && onToggleChatCollapse(!isChatCollapsed)}
            className={`p-2 ${
              isChatCollapsed ? 'text-blue-600' : 'text-gray-500'
            } hover:text-blue-700 transition-colors`}
            title={isChatCollapsed ? "Expand chat" : "Collapse chat"}
          >
            {isChatCollapsed ? <ExpandIcon size={20} /> : <CollapseIcon size={20} />}
          </button>
        )}
        
        <button
          onClick={onToggleArtifactPanel}
          className={`p-2 ${
            artifactPanelOpen
              ? 'text-blue-600 hover:text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          } transition-colors`}
          title={artifactPanelOpen ? 'Close artifact panel' : 'Open artifact panel'}
        >
          {artifactPanelOpen ? (
            <PanelRightCloseIcon size={20} />
          ) : (
            <PanelRightIcon size={20} />
          )}
        </button>
        
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <MoreHorizontalIcon size={20} />
          </button>
          
          {menuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setMenuOpen(false)}
              />
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-20">
                <div className="py-1">
                  <button
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left flex items-center gap-2"
                  >
                    <FileTextIcon size={16} />
                    <span>Export conversation</span>
                  </button>
                  <button
                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left flex items-center gap-2"
                  >
                    <DownloadIcon size={16} />
                    <span>Save as artifact</span>
                  </button>
                  <div className="border-t border-gray-100 my-1" />
                  <button
                    className="w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 text-left flex items-center gap-2"
                  >
                    <TrashIcon size={16} />
                    <span>Clear conversation</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};