import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { detectArtifact } from '../utils/artifactDetection';
import { ContentMerger } from '../utils/contentMerger';
import { debugArtifacts } from '../utils/debug';

export const useSmartArtifacts = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [artifactMessageLinks, setArtifactMessageLinks] = useState(new Map()); // messageId -> artifactId
  const [recentChanges, setRecentChanges] = useState([]); // Track recent changes for UI feedback

  // Load artifacts from backend on initial render
  useEffect(() => {
    const loadArtifacts = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setArtifacts([]);
          setSelectedArtifact(null);
          setError(null);
          return;
        }

        const response = await fetch('/api/artifacts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to load artifacts');
        }
        const data = await response.json();
        setArtifacts(data);
        setError(null);
      } catch (err) {
        console.error('Error loading artifacts:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadArtifacts();
  }, []);

  /**
   * Smart artifact processing for new messages
   * Automatically detects and creates/updates artifacts
   */
  const processMessageForArtifacts = useCallback(async (message, sessionId, linkedArtifactId = null, sessionTitle = null) => {
    if (message.role !== 'assistant') return null;

    const detection = detectArtifact(message.content, message.role);
    debugArtifacts.logDetection(message.content, detection);

    // If a specific artifact was linked (from scoped instruction), always try to update it
    if (linkedArtifactId) {
      const artifact = artifacts.find(a => a.id === linkedArtifactId);
      if (artifact) {
        return await updateLinkedArtifact(linkedArtifactId, message, detection, true);
      }
    }

    if (!detection.shouldCreateArtifact) return null;

    // Check if this is a modification of an existing artifact (for general conversation)
    const autoLinkedArtifactId = findLinkedArtifact(message, sessionId);
    
    if (autoLinkedArtifactId && detection.analysis.isPartialUpdate) {
      // Update existing artifact
      return await updateLinkedArtifact(autoLinkedArtifactId, message, detection);
    } else if (detection.shouldCreateArtifact) {
      // Create new artifact - pass session title for intelligent naming
      return await createSmartArtifact(message, detection, sessionId, sessionTitle);
    }

    return null;
  }, [artifacts]);

  /**
   * Find if this message should update an existing artifact
   */
  const findLinkedArtifact = useCallback((message, sessionId) => {
    // Look for recent artifacts in the same session that could be updated
    const recentArtifacts = artifacts
      .filter(artifact => {
        // Check if artifact was created recently (within last hour)
        const createdAt = new Date(artifact.created_at);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return createdAt > oneHourAgo;
      })
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    // For now, return the most recently updated artifact
    // TODO: Implement more sophisticated matching based on content similarity
    return recentArtifacts[0]?.id || null;
  }, [artifacts]);

  /**
   * Create a new artifact with smart detection
   */
  const createSmartArtifact = async (message, detection, sessionId, sessionTitle = null) => {
    try {
      // Use session title if available and valid, otherwise fall back to detection title
      const artifactTitle = sessionTitle && sessionTitle !== 'New Conversation' && sessionTitle.trim()
        ? sessionTitle 
        : detection.suggestedTitle;

      const artifactData = {
        title: artifactTitle,
        content: message.content,
        type: detection.artifactType,
        metadata: {
          autoCreated: true,
          sessionId: sessionId,
          messageId: message.id,
          detectionConfidence: detection.analysis.confidence,
          creationReason: detection.reason,
          inheritedFromSession: !!sessionTitle
        }
      };

      const newArtifact = await createArtifact(
        artifactData.title,
        artifactData.content,
        artifactData.type
      );

      // Link message to artifact
      setArtifactMessageLinks(prev => new Map(prev.set(message.id, newArtifact.id)));

      // Track change for UI feedback
      setRecentChanges(prev => [{
        id: Date.now(),
        type: 'create',
        artifactId: newArtifact.id,
        artifactTitle: newArtifact.title,
        timestamp: new Date(),
        message: `Created "${newArtifact.title}"`
      }, ...prev.slice(0, 4)]);

      return newArtifact;
    } catch (error) {
      console.error('Error creating smart artifact:', error);
      return null;
    }
  };

  /**
   * Update an existing artifact with smart merging
   */
  const updateLinkedArtifact = async (artifactId, message, detection, isFromScopedInstruction = false) => {
    try {
      const existingArtifact = artifacts.find(a => a.id === artifactId);
      if (!existingArtifact) return null;

      // Analyze modification scope
      const modificationScope = ContentMerger.analyzeModificationScope(message.content);
      
      // Merge content intelligently (this will clean the content automatically)
      const mergeResult = ContentMerger.mergeContent(
        existingArtifact.content,
        message.content,
        modificationScope,
        isFromScopedInstruction
      );

      // Always update for scoped instructions, even if change seems minor
      const shouldUpdate = mergeResult.isSignificantChange || 
                          mergeResult.mergedContent !== existingArtifact.content;

      if (!shouldUpdate) return existingArtifact;

      // Update the artifact
      const updatedArtifact = await updateArtifact(artifactId, {
        content: mergeResult.mergedContent,
        metadata: {
          ...existingArtifact.metadata,
          lastModificationScope: modificationScope,
          lastUpdateMessageId: message.id,
          updatedFromScopedInstruction: isFromScopedInstruction
        }
      });

      // Track change for UI feedback
      const changeSummary = ContentMerger.generateChangeSummary(mergeResult.changes);
      setRecentChanges(prev => [{
        id: Date.now(),
        type: 'update',
        artifactId: updatedArtifact.id,
        artifactTitle: updatedArtifact.title,
        timestamp: new Date(),
        message: changeSummary,
        changes: mergeResult.changes
      }, ...prev.slice(0, 4)]);

      return updatedArtifact;
    } catch (error) {
      console.error('Error updating linked artifact:', error);
      return null;
    }
  };

  /**
   * Original createArtifact function (enhanced)
   */
  const createArtifact = async (title, content, type = 'markdown', metadata = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          type,
          metadata
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create artifact');
      }
      
      const newArtifact = await response.json();
      setArtifacts(prevArtifacts => [newArtifact, ...prevArtifacts]);
      setSelectedArtifact(newArtifact);
      setError(null);
      
      return newArtifact;
    } catch (err) {
      console.error('Error creating artifact:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Enhanced updateArtifact function
   */
  const updateArtifact = async (artifactId, updates) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/artifacts/${artifactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update artifact');
      }
      
      const updatedArtifact = await response.json();
      
      setArtifacts(prevArtifacts => 
        prevArtifacts.map(artifact => 
          artifact.id === artifactId ? updatedArtifact : artifact
        )
      );
      
      if (selectedArtifact?.id === artifactId) {
        setSelectedArtifact(updatedArtifact);
      }
      
      setError(null);
      return updatedArtifact;
    } catch (err) {
      console.error('Error updating artifact:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Delete artifact
   */
  const deleteArtifact = async (artifactId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/artifacts/${artifactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete artifact');
      }
      
      setArtifacts(prevArtifacts => 
        prevArtifacts.filter(artifact => artifact.id !== artifactId)
      );
      
      if (selectedArtifact?.id === artifactId) {
        setSelectedArtifact(null);
      }

      // Remove from links
      setArtifactMessageLinks(prev => {
        const newMap = new Map(prev);
        for (const [messageId, aId] of newMap.entries()) {
          if (aId === artifactId) {
            newMap.delete(messageId);
          }
        }
        return newMap;
      });
      
      setError(null);
    } catch (err) {
      console.error('Error deleting artifact:', err);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Select artifact
   */
  const selectArtifact = (artifactId) => {
    const artifact = artifacts.find(artifact => artifact.id === artifactId);
    setSelectedArtifact(artifact || null);
  };

  /**
   * Download artifact
   */
  const downloadArtifact = async (artifactId) => {
    const artifact = artifacts.find(artifact => artifact.id === artifactId);
    
    if (!artifact) {
      console.error('Artifact not found');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/artifacts/${artifactId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download artifact');
      }
      
      // Get the filename from the Content-Disposition header or use a default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${artifact.title.replace(/\s+/g, '_')}.md`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading artifact:', error);
      setError(error.message);
      alert(`Failed to download artifact: ${error.message}`);
    }
  };

  /**
   * Check if a message is linked to an artifact
   */
  const getLinkedArtifact = (messageId) => {
    const artifactId = artifactMessageLinks.get(messageId);
    return artifacts.find(a => a.id === artifactId) || null;
  };

  /**
   * Clear recent changes (for UI cleanup)
   */
  const clearRecentChanges = () => {
    setRecentChanges([]);
  };

  /**
   * Dismiss a specific recent change
   */
  const dismissRecentChange = (changeId) => {
    setRecentChanges(prev => prev.filter(change => change.id !== changeId));
  };

  return {
    // Original API
    artifacts,
    selectedArtifact,
    isLoading,
    error,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    selectArtifact,
    downloadArtifact,
    
    // New smart features
    processMessageForArtifacts,
    getLinkedArtifact,
    recentChanges,
    clearRecentChanges,
    dismissRecentChange,
    artifactMessageLinks,
    // For scoped instructions
    updateLinkedArtifact: (artifactId, message) => updateLinkedArtifact(artifactId, message, { analysis: {} }, true)
  };
};