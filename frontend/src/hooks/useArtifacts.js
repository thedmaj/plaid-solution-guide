import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useArtifacts = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  
  // Load artifacts from localStorage on initial render
  useEffect(() => {
    const storedArtifacts = localStorage.getItem('plaid_artifacts');
    
    if (storedArtifacts) {
      setArtifacts(JSON.parse(storedArtifacts));
    }
  }, []);
  
  // Save artifacts to localStorage whenever they change
  useEffect(() => {
    if (artifacts.length > 0) {
      localStorage.setItem('plaid_artifacts', JSON.stringify(artifacts));
    }
  }, [artifacts]);
  
  const createArtifact = (title, content, type = 'markdown') => {
    const newArtifact = {
      id: uuidv4(),
      title,
      content,
      type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    setArtifacts(prevArtifacts => [newArtifact, ...prevArtifacts]);
    setSelectedArtifact(newArtifact);
    
    return newArtifact;
  };
  
  const updateArtifact = (artifactId, updates) => {
    setArtifacts(prevArtifacts => 
      prevArtifacts.map(artifact => 
        artifact.id === artifactId
          ? { 
              ...artifact, 
              ...updates, 
              updated_at: new Date().toISOString() 
            }
          : artifact
      )
    );
    
    if (selectedArtifact?.id === artifactId) {
      setSelectedArtifact(prev => ({ 
        ...prev, 
        ...updates, 
        updated_at: new Date().toISOString() 
      }));
    }
  };
  
  const deleteArtifact = (artifactId) => {
    setArtifacts(prevArtifacts => 
      prevArtifacts.filter(artifact => artifact.id !== artifactId)
    );
    
    if (selectedArtifact?.id === artifactId) {
      setSelectedArtifact(null);
    }
  };
  
  const selectArtifact = (artifactId) => {
    const artifact = artifacts.find(artifact => artifact.id === artifactId);
    setSelectedArtifact(artifact || null);
  };
  
  const downloadArtifact = async (artifactId, format = 'markdown') => {
    const artifact = artifacts.find(artifact => artifact.id === artifactId);
    
    if (!artifact) {
      console.error('Artifact not found');
      return;
    }
    
    try {
      // In a real app, you would call your backend API to convert and download
      // For this demo, we'll handle markdown directly in the browser
      if (format === 'markdown') {
        // Create a blob with the markdown content
        const blob = new Blob([artifact.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        // Create a download link and trigger it
        const link = document.createElement('a');
        link.href = url;
        link.download = `${artifact.title.replace(/\s+/g, '_')}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For DOCX and PDF, we need the backend to convert
        const response = await fetch(`/api/artifacts/${artifactId}/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ format }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to download artifact as ${format}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${artifact.title.replace(/\s+/g, '_')}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error downloading artifact:', error);
    }
  };
  
  return {
    artifacts,
    selectedArtifact,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    selectArtifact,
    downloadArtifact,
  };
};