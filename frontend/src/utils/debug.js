/**
 * Debug utilities for the Smart Artifact system
 */

export const debugArtifacts = {
  /**
   * Log artifact detection process
   */
  logDetection: (content, result) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🎯 Artifact Detection');
      console.log('Content length:', content.length);
      console.log('Should create:', result.shouldCreateArtifact);
      console.log('Confidence:', Math.round((result.analysis?.confidence || 0) * 100) + '%');
      console.log('Suggested title:', result.suggestedTitle);
      console.log('Analysis:', result.analysis);
      console.groupEnd();
    }
  },

  /**
   * Log content merging process
   */
  logMerging: (existingContent, newContent, result) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔄 Content Merging');
      console.log('Existing content length:', existingContent?.length || 0);
      console.log('New content length:', newContent?.length || 0);
      console.log('Is significant change:', result.isSignificantChange);
      console.log('Number of changes:', result.changes?.length || 0);
      console.log('Changes:', result.changes);
      console.groupEnd();
    }
  },

  /**
   * Log smart artifact processing
   */
  logProcessing: (message, artifact, action) => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`✨ Smart Artifact Processing - ${action}`);
      console.log('Message:', {
        id: message.id,
        role: message.role,
        contentLength: message.content?.length
      });
      console.log('Artifact:', artifact ? {
        id: artifact.id,
        title: artifact.title,
        type: artifact.type
      } : 'None created');
      console.groupEnd();
    }
  }
};

export default debugArtifacts;