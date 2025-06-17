/**
 * Smart Artifact Detection System
 * Automatically detects when Claude responses should become artifacts
 */

export class ArtifactDetector {
  static DETECTION_RULES = {
    // Minimum content length for auto-creation
    MIN_CONTENT_LENGTH: 500,
    
    // Keywords that suggest artifact-worthy content
    ARTIFACT_KEYWORDS: [
      'solution guide', 'implementation guide', 'tutorial', 'documentation',
      'step-by-step', 'api reference', 'code example', 'integration',
      'workflow', 'procedure', 'instructions', 'setup', 'configuration'
    ],
    
    // Structural patterns that indicate substantial content
    STRUCTURAL_PATTERNS: [
      /#{1,6}\s+.+/g,           // Markdown headers
      /```[\s\S]*?```/g,        // Code blocks
      /\d+\.\s+.+/g,           // Numbered lists
      /[-*+]\s+.+/g,           // Bullet lists
      /\|.+\|/g,               // Tables
      /```mermaid[\s\S]*?```/g // Mermaid diagrams
    ]
  };

  /**
   * Analyzes content to determine if it should become an artifact
   * @param {string} content - The message content to analyze
   * @param {string} role - The message role (user/assistant)
   * @returns {Object} Detection result with shouldCreateArtifact boolean and metadata
   */
  static analyzeContent(content, role = 'assistant') {
    // Only auto-create artifacts for assistant responses
    if (role !== 'assistant') {
      return { shouldCreateArtifact: false, reason: 'user_message' };
    }

    if (!content || typeof content !== 'string') {
      return { shouldCreateArtifact: false, reason: 'invalid_content' };
    }

    const analysis = {
      contentLength: content.length,
      hasHeaders: false,
      hasCodeBlocks: false,
      hasLists: false,
      hasTables: false,
      hasDiagrams: false,
      hasArtifactKeywords: false,
      structuralComplexity: 0,
      suggestedTitle: null,
      confidence: 0
    };

    // Check length requirement
    if (content.length < this.DETECTION_RULES.MIN_CONTENT_LENGTH) {
      return { 
        shouldCreateArtifact: false, 
        reason: 'too_short',
        analysis
      };
    }

    // Analyze structural patterns
    this.DETECTION_RULES.STRUCTURAL_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        analysis.structuralComplexity += matches.length;
        
        if (pattern.source.includes('#{1,6}')) {
          analysis.hasHeaders = true;
        } else if (pattern.source.includes('```')) {
          analysis.hasCodeBlocks = true;
        } else if (pattern.source.includes('\\d+\\.')) {
          analysis.hasLists = true;
        } else if (pattern.source.includes('\\|')) {
          analysis.hasTables = true;
        } else if (pattern.source.includes('mermaid')) {
          analysis.hasDiagrams = true;
        }
      }
    });

    // Check for artifact keywords
    const lowerContent = content.toLowerCase();
    analysis.hasArtifactKeywords = this.DETECTION_RULES.ARTIFACT_KEYWORDS.some(
      keyword => lowerContent.includes(keyword)
    );

    // Extract suggested title from content
    analysis.suggestedTitle = this.extractTitle(content);

    // Calculate confidence score
    analysis.confidence = this.calculateConfidence(analysis);

    // Decision logic
    const shouldCreateArtifact = (
      analysis.confidence >= 0.6 || // High confidence threshold
      (analysis.hasHeaders && analysis.structuralComplexity >= 3) || // Structured content
      (analysis.hasCodeBlocks && analysis.hasLists) || // Technical documentation
      analysis.hasDiagrams // Always create for diagrams
    );

    return {
      shouldCreateArtifact,
      reason: shouldCreateArtifact ? 'auto_detected' : 'insufficient_complexity',
      analysis,
      suggestedTitle: analysis.suggestedTitle || this.generateDefaultTitle(),
      artifactType: this.determineArtifactType(analysis)
    };
  }

  /**
   * Extract a meaningful title from content
   * @param {string} content 
   * @returns {string|null}
   */
  static extractTitle(content) {
    // Try to find the first H1 header
    const h1Match = content.match(/^#\s+(.+)$/m);
    if (h1Match) {
      return h1Match[1].trim();
    }

    // Try to find the first H2 header
    const h2Match = content.match(/^##\s+(.+)$/m);
    if (h2Match) {
      return h2Match[1].trim();
    }

    // Look for title-like patterns in the first few lines
    const lines = content.split('\n').slice(0, 5);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 100) {
        // Check if it looks like a title (contains guide/tutorial/etc.)
        const titleKeywords = ['guide', 'tutorial', 'implementation', 'setup', 'integration'];
        if (titleKeywords.some(keyword => trimmed.toLowerCase().includes(keyword))) {
          return trimmed.replace(/[#*]/g, '').trim();
        }
      }
    }

    return null;
  }

  /**
   * Generate a default title based on current date
   * @returns {string}
   */
  static generateDefaultTitle() {
    const now = new Date();
    return `Solution Guide - ${now.toLocaleDateString()}`;
  }

  /**
   * Calculate confidence score based on analysis
   * @param {Object} analysis 
   * @returns {number} Confidence between 0 and 1
   */
  static calculateConfidence(analysis) {
    let score = 0;

    // Content length contribution (max 0.2)
    score += Math.min(analysis.contentLength / 2000, 0.2);

    // Structural elements (max 0.4)
    if (analysis.hasHeaders) score += 0.15;
    if (analysis.hasCodeBlocks) score += 0.1;
    if (analysis.hasLists) score += 0.1;
    if (analysis.hasTables) score += 0.05;

    // Complexity bonus (max 0.2)
    score += Math.min(analysis.structuralComplexity / 10, 0.2);

    // Keyword presence (max 0.2)
    if (analysis.hasArtifactKeywords) score += 0.2;

    // Diagrams are strong indicators (max 0.3)
    if (analysis.hasDiagrams) score += 0.3;

    return Math.min(score, 1);
  }

  /**
   * Determine the type of artifact based on content analysis
   * @param {Object} analysis 
   * @returns {string}
   */
  static determineArtifactType(analysis) {
    if (analysis.hasDiagrams) return 'technical_guide';
    if (analysis.hasCodeBlocks && analysis.hasHeaders) return 'implementation_guide';
    if (analysis.hasLists && analysis.hasHeaders) return 'solution_guide';
    return 'markdown';
  }

  /**
   * Check if content looks like a partial update
   * @param {string} content 
   * @returns {boolean}
   */
  static isPartialUpdate(content) {
    const partialIndicators = [
      '[previous sections remain the same',
      '[rest of the content remains',
      '[other sections unchanged',
      '[continue with the existing',
      '[keep the previous',
      'previous content remains'
    ];

    const lowerContent = content.toLowerCase();
    return partialIndicators.some(indicator => lowerContent.includes(indicator));
  }

  /**
   * Extract modification scope from partial updates
   * @param {string} content 
   * @returns {Object}
   */
  static analyzeModificationScope(content) {
    const scope = {
      isPartialUpdate: this.isPartialUpdate(content),
      modifiedSections: [],
      preservedSections: []
    };

    if (scope.isPartialUpdate) {
      // Try to identify which sections are being modified
      const sectionMatches = content.match(/#{1,6}\s+(.+)/g);
      if (sectionMatches) {
        scope.modifiedSections = sectionMatches.map(match => 
          match.replace(/#{1,6}\s+/, '').trim()
        );
      }
    }

    return scope;
  }
}

/**
 * Helper function to be used in components
 * @param {string} content 
 * @param {string} role 
 * @returns {Object}
 */
export const detectArtifact = (content, role = 'assistant') => {
  return ArtifactDetector.analyzeContent(content, role);
};

export default ArtifactDetector;