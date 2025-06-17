import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useArtifacts = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
  }, [localStorage.getItem('token')]);
  
  const createArtifact = async (title, content, type = 'markdown') => {
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
      
      setError(null);
    } catch (err) {
      console.error('Error deleting artifact:', err);
      setError(err.message);
      throw err;
    }
  };
  
  const selectArtifact = (artifactId) => {
    const artifact = artifacts.find(artifact => artifact.id === artifactId);
    setSelectedArtifact(artifact || null);
  };
  
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
  
  return {
    artifacts,
    selectedArtifact,
    isLoading,
    error,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    selectArtifact,
    downloadArtifact,
  };
};