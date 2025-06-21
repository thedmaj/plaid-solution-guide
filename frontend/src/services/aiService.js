/**
 * AI-powered content operations service
 * Provides intelligent merge and text processing capabilities using Claude
 */

export class AIService {
  /**
   * Use AI to intelligently merge existing content with new content
   * @param {string} existingContent - The current artifact content
   * @param {string} newContent - The new content to merge
   * @param {Object} modificationScope - Optional scope information
   * @param {string} mergeInstructions - Optional specific merge instructions
   * @returns {Promise<Object>} Merge result
   */
  static async mergeContent(existingContent, newContent, modificationScope = null, mergeInstructions = null) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🤖 Using AI-powered merge for content...');
      
      const response = await fetch('/api/ai/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          existing_content: existingContent,
          new_content: newContent,
          modification_scope: modificationScope,
          merge_instructions: mergeInstructions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`AI merge failed: ${errorData.detail || 'Unknown error'}`);
      }

      const result = await response.json();
      
      console.log('✅ AI merge completed successfully');
      
      return {
        mergedContent: result.merged_content,
        changes: [
          {
            type: 'ai_merge',
            description: 'Content merged using AI',
            timestamp: new Date().toISOString()
          }
        ],
        isSignificantChange: true
      };
      
    } catch (error) {
      console.error('❌ AI merge error:', error);
      throw error;
    }
  }

  /**
   * Use AI to strip conversational and placeholder text from content
   * @param {string} rawContent - The raw content to clean
   * @param {string} stripInstructions - Optional specific stripping instructions
   * @returns {Promise<string>} Clean content
   */
  static async stripText(rawContent, stripInstructions = null) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('🤖 Using AI-powered text stripping...');
      
      const response = await fetch('/api/ai/strip-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          raw_content: rawContent,
          strip_instructions: stripInstructions
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`AI text strip failed: ${errorData.detail || 'Unknown error'}`);
      }

      const result = await response.json();
      
      console.log('✅ AI text stripping completed successfully');
      
      return result.clean_content;
      
    } catch (error) {
      console.error('❌ AI text strip error:', error);
      throw error;
    }
  }

  /**
   * Preview AI merge results without applying them
   * @param {string} existingContent - The current artifact content
   * @param {string} newContent - The new content to merge
   * @param {Object} modificationScope - Optional scope information
   * @returns {Promise<Object>} Preview result
   */
  static async previewMerge(existingContent, newContent, modificationScope = null) {
    try {
      // For preview, we'll use the same merge API but add preview instruction
      const mergeInstructions = 'This is a preview merge - show what the merged content would look like.';
      
      const result = await this.mergeContent(existingContent, newContent, modificationScope, mergeInstructions);
      
      return {
        previewContent: result.mergedContent,
        changes: result.changes,
        isSignificantChange: result.isSignificantChange
      };
      
    } catch (error) {
      console.error('❌ AI merge preview error:', error);
      throw error;
    }
  }
}