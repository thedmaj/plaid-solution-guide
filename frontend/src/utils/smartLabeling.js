/**
 * Smart Labeling System for Artifacts
 * Generates meaningful labels based on chat instruction keywords
 */

export class SmartLabeling {
  static LABEL_PATTERNS = {
    // Product-specific labels
    'link': { label: 'Link Integration', priority: 10, icon: '🔗' },
    'auth': { label: 'Authentication', priority: 9, icon: '🔐' },
    'identity': { label: 'Identity Verification', priority: 9, icon: '👤' },
    'transactions': { label: 'Transactions', priority: 9, icon: '💳' },
    'accounts': { label: 'Accounts', priority: 8, icon: '🏦' },
    'balance': { label: 'Account Balances', priority: 8, icon: '💰' },
    'transfer': { label: 'Transfer', priority: 9, icon: '↔️' },
    'payment': { label: 'Payments', priority: 9, icon: '💸' },
    'liabilities': { label: 'Liabilities', priority: 7, icon: '📊' },
    'assets': { label: 'Assets', priority: 7, icon: '🏠' },
    'income': { label: 'Income Verification', priority: 8, icon: '💼' },
    'invest': { label: 'Investments', priority: 7, icon: '📈' },
    'webhook': { label: 'Webhooks', priority: 8, icon: '🔔' },
    
    // Technical implementation labels
    'guide': { label: 'Implementation Guide', priority: 6, icon: '📋' },
    'tutorial': { label: 'Tutorial', priority: 6, icon: '📚' },
    'integration': { label: 'Integration', priority: 7, icon: '🔌' },
    'sdk': { label: 'SDK Integration', priority: 7, icon: '⚙️' },
    'api': { label: 'API Reference', priority: 6, icon: '🔧' },
    'example': { label: 'Code Examples', priority: 5, icon: '💻' },
    'sample': { label: 'Sample Code', priority: 5, icon: '💻' },
    'flow': { label: 'Process Flow', priority: 6, icon: '📊' },
    'sequence': { label: 'Sequence Diagram', priority: 5, icon: '📈' },
    'architecture': { label: 'Architecture', priority: 6, icon: '🏗️' },
    
    // Framework/Platform labels
    'react': { label: 'React', priority: 4, icon: '⚛️' },
    'node': { label: 'Node.js', priority: 4, icon: '🟢' },
    'python': { label: 'Python', priority: 4, icon: '🐍' },
    'javascript': { label: 'JavaScript', priority: 4, icon: '🟨' },
    'typescript': { label: 'TypeScript', priority: 4, icon: '🔷' },
    'mobile': { label: 'Mobile', priority: 5, icon: '📱' },
    'ios': { label: 'iOS', priority: 5, icon: '🍎' },
    'android': { label: 'Android', priority: 5, icon: '🤖' },
    'web': { label: 'Web', priority: 4, icon: '🌐' },
    
    // Use case labels
    'quickstart': { label: 'Quick Start', priority: 8, icon: '🚀' },
    'troubleshoot': { label: 'Troubleshooting', priority: 7, icon: '🔍' },
    'error': { label: 'Error Handling', priority: 6, icon: '❗' },
    'test': { label: 'Testing', priority: 5, icon: '🧪' },
    'sandbox': { label: 'Sandbox', priority: 5, icon: '🏖️' },
    'production': { label: 'Production', priority: 7, icon: '🏭' },
    'security': { label: 'Security', priority: 8, icon: '🛡️' },
    'compliance': { label: 'Compliance', priority: 7, icon: '✅' },
    
    // Generic fallbacks
    'plaid': { label: 'Plaid', priority: 3, icon: '🔷' },
    'field': { label: 'Field Reference', priority: 4, icon: '📝' },
    'list': { label: 'Reference List', priority: 4, icon: '📄' },
    'describe': { label: 'Description', priority: 3, icon: '📝' }
  };

  /**
   * Generate a smart label for an artifact based on the chat instruction
   * @param {string} chatInstruction - The user's original chat message
   * @param {string} content - The generated content (for fallback analysis)
   * @returns {Object} - { label, icon, keywords }
   */
  static generateLabel(chatInstruction, content = '') {
    // First try to detect the general topic and create a descriptive name
    const topicLabel = this.detectTopicAndGenerateLabel(chatInstruction, content);
    if (topicLabel.confidence > 0.7) {
      return topicLabel;
    }
    
    const text = (chatInstruction + ' ' + content).toLowerCase();
    const words = text.replace(/[^\w\s]/g, ' ').split(/\s+/);
    
    // Find matching patterns with their priorities
    const matches = [];
    
    Object.entries(this.LABEL_PATTERNS).forEach(([keyword, config]) => {
      if (words.some(word => word.includes(keyword) || keyword.includes(word))) {
        matches.push({
          keyword,
          ...config,
          relevance: this.calculateRelevance(keyword, text)
        });
      }
    });
    
    // Sort by priority (high first) then by relevance
    matches.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.relevance - a.relevance;
    });
    
    // Use the best match or generate fallback
    if (matches.length > 0) {
      const best = matches[0];
      return {
        label: best.label,
        icon: best.icon,
        keywords: matches.slice(0, 3).map(m => m.keyword),
        confidence: Math.min(best.relevance * 10, 1)
      };
    }
    
    // Fallback label generation
    return this.generateFallbackLabel(chatInstruction, content);
  }
  
  /**
   * Calculate relevance score for a keyword match
   */
  static calculateRelevance(keyword, text) {
    const regex = new RegExp(keyword, 'gi');
    const matches = text.match(regex) || [];
    const density = matches.length / text.split(' ').length;
    const position = text.indexOf(keyword.toLowerCase()) / text.length;
    
    // Higher score for more frequent mentions and earlier position
    return density * 0.7 + (1 - position) * 0.3;
  }
  
  /**
   * Detect topic and generate intelligent label based on context
   * Uses natural language processing to understand the general topic
   */
  static detectTopicAndGenerateLabel(chatInstruction, content) {
    const fullText = (chatInstruction + ' ' + content).toLowerCase();
    
    // Topic detection patterns with more contextual understanding
    const topicPatterns = [
      // Specific product integrations
      {
        pattern: /(?:integrate|integrating|integration|implement|implementing|setup|set up).*(?:plaid link|link.*(?:web|sdk|mobile))/,
        label: 'Plaid Link Integration Guide',
        icon: '🔗',
        confidence: 0.9
      },
      {
        pattern: /(?:auth|authentication).*(?:flow|process|implementation|guide)/,
        label: 'Authentication Implementation',
        icon: '🔐',
        confidence: 0.9
      },
      {
        pattern: /(?:transactions|transaction).*(?:sync|fetch|retrieve|get|pull)/,
        label: 'Transaction Data Integration',
        icon: '💳',
        confidence: 0.9
      },
      {
        pattern: /(?:accounts|account).*(?:balance|balances|information|data)/,
        label: 'Account Data Retrieval',
        icon: '🏦',
        confidence: 0.9
      },
      {
        pattern: /(?:transfer|transfers|payment|payments).*(?:api|implementation|flow)/,
        label: 'Transfer & Payments Setup',
        icon: '💸',
        confidence: 0.9
      },
      {
        pattern: /(?:identity|identity verification).*(?:process|implementation|guide)/,
        label: 'Identity Verification Guide',
        icon: '👤',
        confidence: 0.9
      },
      {
        pattern: /(?:webhook|webhooks).*(?:setup|configuration|implementation)/,
        label: 'Webhook Configuration',
        icon: '🔔',
        confidence: 0.9
      },
      
      // Implementation approaches
      {
        pattern: /(?:react|reactjs).*(?:integration|implementation|guide|tutorial)/,
        label: 'React Implementation Guide',
        icon: '⚛️',
        confidence: 0.85
      },
      {
        pattern: /(?:node|nodejs|node\.js).*(?:integration|implementation|backend)/,
        label: 'Node.js Backend Guide',
        icon: '🟢',
        confidence: 0.85
      },
      {
        pattern: /(?:mobile|ios|android).*(?:integration|sdk|implementation)/,
        label: 'Mobile SDK Integration',
        icon: '📱',
        confidence: 0.85
      },
      {
        pattern: /(?:python).*(?:integration|implementation|backend|api)/,
        label: 'Python Implementation',
        icon: '🐍',
        confidence: 0.85
      },
      
      // Use cases and processes
      {
        pattern: /(?:quickstart|quick start|getting started|begin|start)/,
        label: 'Quick Start Guide',
        icon: '🚀',
        confidence: 0.8
      },
      {
        pattern: /(?:troubleshoot|troubleshooting|debug|debugging|error|errors)/,
        label: 'Troubleshooting Guide',
        icon: '🔍',
        confidence: 0.8
      },
      {
        pattern: /(?:sequence diagram|flow diagram|process flow|workflow)/,
        label: 'Process Flow Diagram',
        icon: '📊',
        confidence: 0.8
      },
      {
        pattern: /(?:fields|field).*(?:reference|list|description|describe)/,
        label: 'Field Reference Guide',
        icon: '📝',
        confidence: 0.8
      },
      {
        pattern: /(?:sandbox|testing|test).*(?:environment|setup|guide)/,
        label: 'Sandbox Testing Guide',
        icon: '🏖️',
        confidence: 0.8
      },
      {
        pattern: /(?:production|prod).*(?:deployment|setup|configuration)/,
        label: 'Production Setup Guide',
        icon: '🏭',
        confidence: 0.8
      },
      {
        pattern: /(?:security|secure|encryption).*(?:implementation|guide|best practices)/,
        label: 'Security Implementation',
        icon: '🛡️',
        confidence: 0.8
      },
      
      // General patterns
      {
        pattern: /(?:generate|create).*(?:solution guide|guide|documentation)/,
        label: 'Solution Guide',
        icon: '📋',
        confidence: 0.7
      },
      {
        pattern: /(?:example|examples|sample|samples).*(?:code|implementation)/,
        label: 'Code Examples',
        icon: '💻',
        confidence: 0.7
      }
    ];
    
    // Check each pattern
    for (const topicPattern of topicPatterns) {
      if (topicPattern.pattern.test(fullText)) {
        return {
          label: topicPattern.label,
          icon: topicPattern.icon,
          keywords: this.extractKeywords(chatInstruction),
          confidence: topicPattern.confidence
        };
      }
    }
    
    // If no specific pattern matches, try to extract meaningful topic
    return this.extractTopicFromText(chatInstruction, content);
  }
  
  /**
   * Extract topic from text using keyword analysis
   */
  static extractTopicFromText(chatInstruction, content) {
    const text = chatInstruction.toLowerCase();
    
    // Look for action verbs + objects to form natural titles
    const actionPatterns = [
      { pattern: /(?:generate|create|build|make).*?(?:guide|solution|implementation|integration)/, action: 'create' },
      { pattern: /(?:implement|integrate|setup|set up).*?(?:plaid|api|sdk)/, action: 'implement' },
      { pattern: /(?:explain|describe|show).*?(?:how|process|flow)/, action: 'explain' },
      { pattern: /(?:list|describe).*?(?:fields|properties|attributes)/, action: 'reference' }
    ];
    
    for (const actionPattern of actionPatterns) {
      if (actionPattern.pattern.test(text)) {
        const subject = this.extractSubject(text);
        if (subject) {
          return {
            label: this.formatTopicLabel(actionPattern.action, subject),
            icon: this.getIconForSubject(subject),
            keywords: [actionPattern.action, subject],
            confidence: 0.75
          };
        }
      }
    }
    
    return this.generateFallbackLabel(chatInstruction, content);
  }
  
  /**
   * Extract the main subject from the instruction
   */
  static extractSubject(text) {
    const subjects = [
      'plaid link', 'authentication', 'transactions', 'accounts', 'transfers', 
      'payments', 'identity', 'webhooks', 'api', 'integration', 'sdk',
      'react', 'node', 'python', 'mobile', 'ios', 'android'
    ];
    
    for (const subject of subjects) {
      if (text.includes(subject)) {
        return subject;
      }
    }
    
    // Extract meaningful nouns if no specific subject found
    const words = text.split(/\s+/).filter(word => word.length > 4);
    return words.find(word => !['generate', 'create', 'implement', 'integrate', 'guide', 'solution'].includes(word)) || null;
  }
  
  /**
   * Format topic label based on action and subject
   */
  static formatTopicLabel(action, subject) {
    const subjectTitle = subject.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    switch (action) {
      case 'create':
        return `${subjectTitle} Guide`;
      case 'implement':
        return `${subjectTitle} Integration`;
      case 'explain':
        return `${subjectTitle} Overview`;
      case 'reference':
        return `${subjectTitle} Reference`;
      default:
        return `${subjectTitle} Guide`;
    }
  }
  
  /**
   * Get appropriate icon for subject
   */
  static getIconForSubject(subject) {
    const iconMap = {
      'plaid link': '🔗', 'link': '🔗',
      'authentication': '🔐', 'auth': '🔐',
      'transactions': '💳', 'transaction': '💳',
      'accounts': '🏦', 'account': '🏦',
      'transfers': '💸', 'transfer': '💸',
      'payments': '💸', 'payment': '💸',
      'identity': '👤',
      'webhooks': '🔔', 'webhook': '🔔',
      'react': '⚛️',
      'node': '🟢', 'nodejs': '🟢',
      'python': '🐍',
      'mobile': '📱', 'ios': '🍎', 'android': '🤖',
      'api': '🔧',
      'integration': '🔌',
      'sdk': '⚙️'
    };
    
    return iconMap[subject] || '📄';
  }
  
  /**
   * Extract keywords from instruction
   */
  static extractKeywords(instruction) {
    return instruction
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 3);
  }
  
  /**
   * Generate fallback label when no patterns match
   */
  static generateFallbackLabel(chatInstruction, content) {
    const text = chatInstruction.toLowerCase();
    
    // Extract key nouns and verbs
    const meaningfulWords = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !['the', 'and', 'for', 'with', 'that', 'this', 'from', 'they', 'have', 'will', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'into'].includes(word)
      )
      .slice(0, 3);
    
    if (meaningfulWords.length > 0) {
      const label = meaningfulWords
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return {
        label: label.length > 25 ? label.substring(0, 25) + '...' : label,
        icon: '📄',
        keywords: meaningfulWords,
        confidence: 0.5
      };
    }
    
    return {
      label: 'Plaid Guide',
      icon: '📄',
      keywords: [],
      confidence: 0.3
    };
  }
  
  /**
   * Generate version label for artifact updates
   * @param {number} version - Version number
   * @returns {string} - Formatted version string
   */
  static generateVersionLabel(version = 1) {
    // Only show version if > 1
    if (version <= 1) return '';
    return ` v${version}`;
  }
  
  /**
   * Generate full artifact title with smart label and version
   * @param {string} chatInstruction - Original chat instruction
   * @param {string} content - Generated content
   * @param {number} version - Version number
   * @returns {string} - Complete artifact title
   */
  static generateArtifactTitle(chatInstruction, content = '', version = 1) {
    const smartLabel = this.generateLabel(chatInstruction, content);
    const versionLabel = this.generateVersionLabel(version);
    
    return smartLabel.label + versionLabel;
  }
}

export default SmartLabeling;