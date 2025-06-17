/**
 * Artifact Targeting Utilities
 * Smart detection and management for artifact creation vs modification
 */

export class ArtifactTargeting {
  static MODIFICATION_KEYWORDS = [
    'add', 'include', 'insert', 'append', 'expand', 'update', 
    'modify', 'change', 'edit', 'improve', 'enhance', 'extend',
    'incorporate', 'integrate', 'attach', 'supplement', 'augment'
  ];

  static CREATION_KEYWORDS = [
    'create', 'generate', 'make', 'build', 'develop', 'design',
    'write', 'compose', 'draft', 'produce', 'new', 'fresh'
  ];

  static DIAGRAM_KEYWORDS = [
    'diagram', 'chart', 'graph', 'visualization', 'flowchart',
    'sequence', 'mermaid', 'schema', 'architecture'
  ];

  /**
   * Analyze message to determine if it's likely a modification request
   * @param {string} message - User's message
   * @param {Array} sessionArtifacts - Artifacts in current session
   * @returns {Object} Analysis result
   */
  static analyzeModificationIntent(message, sessionArtifacts = []) {
    if (!message || !sessionArtifacts.length) {
      return { 
        isModification: false, 
        confidence: 0, 
        reason: sessionArtifacts.length ? 'no_message' : 'no_artifacts',
        suggestedArtifact: null
      };
    }

    const lowerMessage = message.toLowerCase();
    const words = lowerMessage.split(/\s+/);

    // Check for modification keywords
    const modificationMatches = this.MODIFICATION_KEYWORDS.filter(keyword => 
      lowerMessage.includes(keyword)
    );

    // Check for creation keywords
    const creationMatches = this.CREATION_KEYWORDS.filter(keyword => 
      lowerMessage.includes(keyword)
    );

    // Special case: Adding diagrams to existing content
    const isDiagramAddition = this.DIAGRAM_KEYWORDS.some(keyword => 
      lowerMessage.includes(keyword)
    ) && modificationMatches.length > 0;

    // Calculate confidence
    let confidence = 0;
    let reasons = [];

    if (modificationMatches.length > 0) {
      confidence += 0.4 * modificationMatches.length;
      reasons.push(`modification_keywords: ${modificationMatches.join(', ')}`);
    }

    if (isDiagramAddition) {
      confidence += 0.3;
      reasons.push('diagram_addition');
    }

    // Contextual clues
    if (lowerMessage.includes('also') || lowerMessage.includes('additionally')) {
      confidence += 0.2;
      reasons.push('additive_language');
    }

    if (lowerMessage.includes('to the') || lowerMessage.includes('to it')) {
      confidence += 0.15;
      reasons.push('reference_to_existing');
    }

    // Reduce confidence for creation keywords
    if (creationMatches.length > 0) {
      confidence -= 0.2 * creationMatches.length;
      reasons.push(`creation_keywords: ${creationMatches.join(', ')}`);
    }

    // Find the most recent artifact that could be modified
    const suggestedArtifact = this.findMostRelevantArtifact(message, sessionArtifacts);

    const isModification = confidence > 0.3;

    return {
      isModification,
      confidence: Math.max(0, Math.min(1, confidence)),
      reasons,
      suggestedArtifact: isModification ? suggestedArtifact : null,
      modificationMatches,
      creationMatches
    };
  }

  /**
   * Find the most relevant artifact for modification
   * @param {string} message - User's message
   * @param {Array} artifacts - Available artifacts
   * @returns {Object|null} Most relevant artifact
   */
  static findMostRelevantArtifact(message, artifacts) {
    if (!artifacts.length) return null;

    // For now, return the most recently updated artifact
    // TODO: Implement content similarity matching
    const sortedArtifacts = [...artifacts].sort((a, b) => 
      new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
    );

    return sortedArtifacts[0];
  }

  /**
   * Get artifacts from the current session
   * @param {Array} allArtifacts - All available artifacts
   * @param {string} sessionId - Current session ID
   * @returns {Array} Session artifacts
   */
  static getSessionArtifacts(allArtifacts, sessionId) {
    if (!sessionId) return [];
    
    return allArtifacts.filter(artifact => 
      artifact.metadata?.sessionId === sessionId
    );
  }

  /**
   * Generate user-friendly explanation for the targeting decision
   * @param {Object} analysis - Result from analyzeModificationIntent
   * @returns {string} Human-readable explanation
   */
  static explainTargeting(analysis) {
    if (!analysis.isModification) {
      return "Creating a new artifact";
    }

    const { confidence, suggestedArtifact, reasons } = analysis;
    
    let explanation = `Updating "${suggestedArtifact?.title || 'existing artifact'}"`;
    
    if (confidence > 0.7) {
      explanation += " (high confidence)";
    } else if (confidence > 0.5) {
      explanation += " (medium confidence)";
    } else {
      explanation += " (low confidence)";
    }

    return explanation;
  }
}

export default ArtifactTargeting;