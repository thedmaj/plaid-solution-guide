/**
 * Content Relationship Analyzer
 * Analyzes content relationships for Smart Session Workspace decisions
 */

export class ContentRelationshipAnalyzer {
  static TOPIC_KEYWORDS = {
    plaid: ['plaid', 'api', 'financial', 'bank', 'account', 'transaction', 'link', 'webhook'],
    auth: ['auth', 'authentication', 'login', 'token', 'jwt', 'oauth', 'credential'],
    integration: ['integration', 'implement', 'setup', 'configure', 'install', 'deploy'],
    error: ['error', 'exception', 'bug', 'debug', 'troubleshoot', 'fix', 'issue'],
    security: ['security', 'secure', 'encrypt', 'decrypt', 'https', 'ssl', 'certificate'],
    testing: ['test', 'testing', 'unit', 'integration', 'mock', 'stub', 'jest', 'spec']
  };

  static CONTENT_TYPE_PATTERNS = {
    guide: /(?:guide|tutorial|how\s+to|step(?:\s+by\s+step)?|walkthrough)/i,
    code: /(?:```|function|class|const|let|var|import|export|def|if|for|while)/i,
    diagram: /(?:mermaid|diagram|flowchart|sequence|graph|chart|architecture)/i,
    reference: /(?:reference|documentation|docs|api|endpoint|field|parameter)/i,
    explanation: /(?:explain|understand|concept|theory|overview|introduction)/i,
    implementation: /(?:implement|build|create|develop|code|program|script)/i
  };

  /**
   * Analyze if new content fits with existing artifact
   * @param {string} newContent - New content to analyze
   * @param {Object} existingArtifact - Existing artifact to compare against
   * @returns {Object} Analysis result with merge recommendation
   */
  static analyzeContentFit(newContent, existingArtifact) {
    if (!newContent || !existingArtifact) {
      return this.createAnalysisResult(false, 0, 'Missing content or artifact');
    }

    const analysis = {
      topicSimilarity: this.calculateTopicSimilarity(newContent, existingArtifact.content),
      contentTypeCompatibility: this.analyzeContentTypes(newContent, existingArtifact),
      structuralFit: this.analyzeStructuralFit(newContent, existingArtifact),
      sizeFeasibility: this.checkSizeLimits(newContent, existingArtifact),
      userContext: this.analyzeUserIntent(newContent),
      temporalRelevance: this.analyzeTemporalContext(existingArtifact)
    };

    const mergeScore = this.calculateMergeScore(analysis);
    const shouldMerge = mergeScore > 0.6;

    return {
      shouldMerge,
      confidence: mergeScore,
      analysis,
      suggestedPlacement: shouldMerge ? this.suggestPlacement(newContent, existingArtifact) : null,
      alternativeActions: this.suggestAlternatives(analysis),
      reasoning: this.generateReasoning(analysis, shouldMerge)
    };
  }

  /**
   * Calculate topic similarity between contents
   */
  static calculateTopicSimilarity(newContent, existingContent) {
    const newKeywords = this.extractTopicKeywords(newContent);
    const existingKeywords = this.extractTopicKeywords(existingContent);
    
    if (newKeywords.length === 0 || existingKeywords.length === 0) {
      return 0.1; // Low similarity if we can't extract keywords
    }

    // Calculate keyword overlap
    const overlap = newKeywords.filter(keyword => 
      existingKeywords.includes(keyword)
    ).length;
    
    const maxKeywords = Math.max(newKeywords.length, existingKeywords.length);
    const overlapScore = overlap / maxKeywords;

    // Calculate semantic similarity based on topic categories
    const newTopics = this.categorizeTopics(newKeywords);
    const existingTopics = this.categorizeTopics(existingKeywords);
    
    const topicOverlap = Object.keys(newTopics).filter(topic => 
      existingTopics[topic]
    ).length;
    
    const semanticScore = topicOverlap / Math.max(Object.keys(newTopics).length, 1);

    return (overlapScore * 0.6) + (semanticScore * 0.4);
  }

  /**
   * Extract topic-relevant keywords from content
   */
  static extractTopicKeywords(content) {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const topicKeywords = [];
    
    // Extract keywords that match our topic categories
    Object.values(this.TOPIC_KEYWORDS).flat().forEach(keyword => {
      if (words.includes(keyword)) {
        topicKeywords.push(keyword);
      }
    });

    // Add important nouns and technical terms
    const technicalTerms = words.filter(word => 
      word.length > 4 && (
        word.includes('api') ||
        word.includes('auth') ||
        word.includes('token') ||
        word.endsWith('ing') ||
        word.endsWith('tion') ||
        word.endsWith('ment')
      )
    );

    return [...new Set([...topicKeywords, ...technicalTerms])];
  }

  /**
   * Categorize keywords into topic buckets
   */
  static categorizeTopics(keywords) {
    const topics = {};
    
    Object.entries(this.TOPIC_KEYWORDS).forEach(([topic, topicWords]) => {
      const matches = keywords.filter(keyword => 
        topicWords.includes(keyword)
      ).length;
      
      if (matches > 0) {
        topics[topic] = matches;
      }
    });

    return topics;
  }

  /**
   * Analyze content type compatibility
   */
  static analyzeContentTypes(newContent, existingArtifact) {
    const newType = this.detectContentType(newContent);
    const existingTypes = this.getExistingContentTypes(existingArtifact);

    // Content type compatibility matrix
    const compatibilityMatrix = {
      guide: ['guide', 'explanation', 'implementation', 'reference'],
      code: ['code', 'implementation', 'guide'],
      diagram: ['diagram', 'guide', 'explanation', 'reference'],
      reference: ['reference', 'guide', 'explanation'],
      explanation: ['explanation', 'guide', 'reference'],
      implementation: ['implementation', 'guide', 'code']
    };

    const compatibleTypes = compatibilityMatrix[newType] || [];
    const hasCompatibleType = existingTypes.some(type => 
      compatibleTypes.includes(type)
    );

    return hasCompatibleType ? 0.8 : 0.3;
  }

  /**
   * Detect the primary content type of new content
   */
  static detectContentType(content) {
    const scores = {};
    
    Object.entries(this.CONTENT_TYPE_PATTERNS).forEach(([type, pattern]) => {
      const matches = content.match(pattern);
      scores[type] = matches ? matches.length : 0;
    });

    // Return the type with the highest score
    return Object.entries(scores).reduce((best, [type, score]) => 
      score > best.score ? { type, score } : best,
      { type: 'explanation', score: 0 }
    ).type;
  }

  /**
   * Get existing content types from artifact
   */
  static getExistingContentTypes(artifact) {
    const content = artifact.content || '';
    const types = [];

    Object.entries(this.CONTENT_TYPE_PATTERNS).forEach(([type, pattern]) => {
      if (pattern.test(content)) {
        types.push(type);
      }
    });

    return types.length > 0 ? types : ['explanation'];
  }

  /**
   * Analyze structural fit (sections, organization)
   */
  static analyzeStructuralFit(newContent, existingArtifact) {
    const newSections = this.extractSections(newContent);
    const existingSections = this.extractSections(existingArtifact.content);

    if (newSections.length === 0) {
      return 0.7; // Content without headers fits anywhere
    }

    // Check if new sections complement existing ones
    const sectionSimilarity = newSections.reduce((total, newSection) => {
      const similarity = existingSections.reduce((max, existingSection) => {
        const sectionSim = this.calculateSectionSimilarity(newSection, existingSection);
        return Math.max(max, sectionSim);
      }, 0);
      return total + similarity;
    }, 0) / newSections.length;

    return sectionSimilarity;
  }

  /**
   * Extract section headers from content
   */
  static extractSections(content) {
    const sections = [];
    const headerMatches = content.match(/^#{1,6}\s+(.+)$/gm);
    
    if (headerMatches) {
      headerMatches.forEach(header => {
        const title = header.replace(/^#{1,6}\s+/, '').trim();
        sections.push(title);
      });
    }

    return sections;
  }

  /**
   * Calculate similarity between section titles
   */
  static calculateSectionSimilarity(section1, section2) {
    const words1 = section1.toLowerCase().split(/\s+/);
    const words2 = section2.toLowerCase().split(/\s+/);
    
    const overlap = words1.filter(word => words2.includes(word)).length;
    const total = new Set([...words1, ...words2]).size;
    
    return overlap / total;
  }

  /**
   * Check if adding content would exceed size limits
   */
  static checkSizeLimits(newContent, existingArtifact) {
    const currentSize = (existingArtifact.content || '').length;
    const newSize = newContent.length;
    const totalSize = currentSize + newSize;

    const limits = {
      excellent: 3000,   // Under 3k chars - excellent
      good: 6000,        // Under 6k chars - good
      acceptable: 10000, // Under 10k chars - acceptable
      large: 15000       // Under 15k chars - large but manageable
    };

    if (totalSize < limits.excellent) return 1.0;
    if (totalSize < limits.good) return 0.8;
    if (totalSize < limits.acceptable) return 0.6;
    if (totalSize < limits.large) return 0.4;
    return 0.2; // Too large
  }

  /**
   * Analyze user intent from content patterns
   */
  static analyzeUserIntent(content) {
    const modificationKeywords = [
      'add', 'include', 'also', 'additionally', 'moreover', 'furthermore',
      'update', 'modify', 'change', 'improve', 'enhance', 'expand'
    ];

    const creationKeywords = [
      'create', 'new', 'fresh', 'different', 'separate', 'another',
      'build', 'make', 'generate', 'write'
    ];

    const lowerContent = content.toLowerCase();
    
    const modificationScore = modificationKeywords.reduce((score, keyword) => 
      lowerContent.includes(keyword) ? score + 1 : score, 0
    );

    const creationScore = creationKeywords.reduce((score, keyword) => 
      lowerContent.includes(keyword) ? score + 1 : score, 0
    );

    if (modificationScore > creationScore) return 0.8; // Likely modification
    if (creationScore > modificationScore) return 0.2; // Likely new creation
    return 0.5; // Neutral
  }

  /**
   * Analyze temporal context (how recent/active the artifact is)
   */
  static analyzeTemporalContext(artifact) {
    const now = new Date();
    const updatedAt = new Date(artifact.updated_at || artifact.created_at);
    const hoursSinceUpdate = (now - updatedAt) / (1000 * 60 * 60);

    if (hoursSinceUpdate < 1) return 1.0;  // Very recent
    if (hoursSinceUpdate < 6) return 0.8;  // Recent
    if (hoursSinceUpdate < 24) return 0.6; // Same day
    if (hoursSinceUpdate < 168) return 0.4; // Same week
    return 0.2; // Older
  }

  /**
   * Calculate overall merge score
   */
  static calculateMergeScore(analysis) {
    const weights = {
      topicSimilarity: 0.3,
      contentTypeCompatibility: 0.2,
      structuralFit: 0.15,
      sizeFeasibility: 0.15,
      userContext: 0.1,
      temporalRelevance: 0.1
    };

    return Object.entries(weights).reduce((score, [key, weight]) => {
      return score + (analysis[key] * weight);
    }, 0);
  }

  /**
   * Suggest where to place new content in existing artifact
   */
  static suggestPlacement(newContent, existingArtifact) {
    const newSections = this.extractSections(newContent);
    const existingSections = this.extractSections(existingArtifact.content);

    if (newSections.length === 0) {
      return {
        type: 'append_to_end',
        position: 'document_end',
        reason: 'No clear section structure'
      };
    }

    // Find best matching section
    let bestMatch = null;
    let bestScore = 0;

    newSections.forEach(newSection => {
      existingSections.forEach((existingSection, index) => {
        const similarity = this.calculateSectionSimilarity(newSection, existingSection);
        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = {
            type: 'insert_after_section',
            sectionIndex: index,
            sectionTitle: existingSection,
            reason: `Related to "${existingSection}" section`
          };
        }
      });
    });

    if (bestMatch && bestScore > 0.3) {
      return bestMatch;
    }

    return {
      type: 'new_section',
      position: 'document_end',
      title: newSections[0],
      reason: 'Create new section'
    };
  }

  /**
   * Suggest alternative actions
   */
  static suggestAlternatives(analysis) {
    const alternatives = [];

    if (analysis.topicSimilarity < 0.3) {
      alternatives.push({
        action: 'create_separate',
        reason: 'Different topic - better as separate artifact',
        confidence: 0.8
      });
    }

    if (analysis.sizeFeasibility < 0.4) {
      alternatives.push({
        action: 'create_separate',
        reason: 'Would make artifact too large',
        confidence: 0.9
      });
    }

    if (analysis.contentTypeCompatibility < 0.5) {
      alternatives.push({
        action: 'create_specialized',
        reason: 'Different content type - consider specialized artifact',
        confidence: 0.7
      });
    }

    if (alternatives.length === 0) {
      alternatives.push({
        action: 'merge',
        reason: 'Content fits well with existing artifact',
        confidence: this.calculateMergeScore(analysis)
      });
    }

    return alternatives;
  }

  /**
   * Generate human-readable reasoning
   */
  static generateReasoning(analysis, shouldMerge) {
    const reasons = [];

    if (analysis.topicSimilarity > 0.7) {
      reasons.push('Strong topic similarity');
    } else if (analysis.topicSimilarity < 0.3) {
      reasons.push('Different topic area');
    }

    if (analysis.contentTypeCompatibility > 0.7) {
      reasons.push('Compatible content type');
    } else if (analysis.contentTypeCompatibility < 0.5) {
      reasons.push('Different content type');
    }

    if (analysis.sizeFeasibility < 0.4) {
      reasons.push('Would create large document');
    }

    if (analysis.temporalRelevance > 0.8) {
      reasons.push('Recently active artifact');
    }

    return shouldMerge ? 
      `Merge recommended: ${reasons.join(', ')}` :
      `Separate artifact suggested: ${reasons.join(', ')}`;
  }

  /**
   * Create standardized analysis result
   */
  static createAnalysisResult(shouldMerge, confidence, reason) {
    return {
      shouldMerge,
      confidence,
      analysis: {},
      suggestedPlacement: null,
      alternativeActions: [],
      reasoning: reason
    };
  }
}

export default ContentRelationshipAnalyzer;