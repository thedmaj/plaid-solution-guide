/**
 * Smart Content Merging System
 * Handles intelligent merging of partial updates with existing artifacts
 * 
 * UPDATED: Now uses AI-powered merging via Claude for intelligent content integration
 * The local algorithms are preserved but commented out for potential future reversion
 */

import { AIService } from '../services/aiService';

export class ContentMerger {
  /**
   * Extract clean content from AI response, removing conversational parts
   * NOW USES AI: This method now uses Claude to intelligently strip conversational content
   * @param {string} rawContent - Raw AI response
   * @returns {string} Clean content suitable for artifacts
   */
  static async extractCleanContent(rawContent) {
    try {
      // Use AI-powered text stripping with enhanced instructions for removing acknowledgements
      const stripInstructions = `
        CRITICAL: Extract ONLY the clean solution guide content, removing ALL AI acknowledgements, tool invocations, and conversational text.
        
        REMOVE COMPLETELY:
        - AI acknowledgements like "I'll help you", "I'll create", "Let me first check", "Here's what I'll do"
        - Tool invocations like <invoke name="plaid_docs"> or any <invoke>...</invoke> blocks
        - Conversational phrases like "Let me", "I can", "This will", "Here's the", "Based on", "Using the"
        - Meta-commentary about checking documentation or what the AI is doing
        - Any explanatory text about the AI's process or methodology
        - Everything that appears before solution guide markers like "--- SOLUTION GUIDE ---"
        
        KEEP ONLY:
        - The actual solution guide content starting from the first real header
        - All headers, especially the main solution guide title (must start with # for H1)
        - All substantial technical content including code, lists, tables, and paragraphs
        - Technical implementation details and step-by-step instructions
        - Code examples, API calls, and configuration details
        - Mermaid diagrams and technical documentation
        
        EXTRACTION RULES:
        1. If you find "--- SOLUTION GUIDE ---" marker, extract ONLY content after it
        2. Remove any remaining conversational text even after the marker
        3. Start with the first substantial header (# Title)
        4. Ensure proper markdown formatting is preserved
        5. Do NOT include any AI process descriptions or tool usage explanations
        
        OUTPUT: Return ONLY the clean solution guide content with no preamble or explanation.
      `;
      
      const cleanContent = await AIService.stripText(rawContent, stripInstructions);
      return cleanContent;
    } catch (error) {
      console.error('AI text stripping failed, falling back to local algorithm:', error);
      // Fallback to local algorithm if AI fails
      return this.extractCleanContentLocal(rawContent);
    }
  }

  /**
   * LOCAL ALGORITHM (PRESERVED): Extract clean content using local patterns
   * This is the original local algorithm, preserved for fallback use
   * @param {string} rawContent - Raw AI response
   * @returns {string} Clean content suitable for artifacts
   */
  static extractCleanContentLocal(rawContent) {
    if (!rawContent) return '';

    // First, remove tool invocation blocks completely
    rawContent = this.removeToolInvocations(rawContent);
    
    // Then, look for solution guide markers and extract content after them
    const markedContent = this.extractContentAfterMarkers(rawContent);
    if (markedContent) {
      rawContent = markedContent;
    }

    const lines = rawContent.split('\n');
    const cleanLines = [];
    let inCodeBlock = false;
    let foundSubstantialContent = false;
    let skipAcknowledgement = true; // Start by skipping acknowledgement sections

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Track code blocks
      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        cleanLines.push(line);
        foundSubstantialContent = true;
        skipAcknowledgement = false; // Found substantial content, stop skipping
        continue;
      }

      // Include everything inside code blocks
      if (inCodeBlock) {
        cleanLines.push(line);
        continue;
      }

      // Check if this line starts substantial content (stop skipping acknowledgements)
      if (this.isSubstantialContentStart(trimmed)) {
        foundSubstantialContent = true;
        skipAcknowledgement = false;
      }

      // Enhanced acknowledgement and conversational patterns including tool invocations
      const acknowledgementPatterns = [
        // Tool invocations and documentation checks
        /^<invoke\s+name=/i,
        /<\/invoke>/i,
        /^(let me first check|i'll first check|let me check)/i,
        /^(plaid's documentation|the documentation|checking.*documentation)/i,
        
        // Standard acknowledgements
        /^(i'll help|i'll assist|i'll create|i'll add|i'll update|i'll modify)/i,
        /^(here|i'll|i've|let me|i can|i will|i'm going to|i have|this is|this will|now let me)/i,
        /^(the following|below is|as you can see|you can|note that|remember to)/i,
        /^(this (code|example|implementation|approach|solution))/i,
        /^(based on|according to|in this case|for this)/i,
        /^(i understand|great|excellent|perfect)/i,
        /^(i'll go ahead and|i'll now|i'll proceed to|i'll start by)/i,
        /^(here's (an? |the )?updated?|here's what)/i,
        /^(i've (created|added|updated|modified))/i,
        /\b(helps?|allows?|enables?)\b.*\byou\b/i,
        /^\*\*note:/i,
        /^\*\*important:/i,
        /\b(this will|this should|this provides|this allows)\b/i,
        
        // Additional patterns for acknowledgements
        /^(certainly|absolutely|of course|sure)/i,
        /^(i'll (be happy to|gladly|definitely))/i,
        /^(let's|let me (start|begin|create|build))/i,
        /^(first,? let me|to (start|begin))/i,
        /^(i'll make sure|i'll ensure)/i,
        
        // Tool and documentation specific patterns
        /^(using the|with the above|from the documentation)/i,
        /^(the .*documentation shows|according to the docs)/i
      ];

      const isAcknowledgement = acknowledgementPatterns.some(pattern => 
        pattern.test(trimmed)
      );

      // Include headers, lists, tables, and substantial content
      const isSubstantialContent = (
        trimmed.match(/^#{1,6}\s+/) ||  // Headers
        trimmed.match(/^\d+\.\s+/) ||   // Numbered lists
        trimmed.match(/^[-*+]\s+/) ||   // Bullet lists
        trimmed.match(/^\|.*\|/) ||     // Tables
        (trimmed.length > 50 && !isAcknowledgement) // Long non-acknowledgement lines
      );

      // Skip acknowledgements at the beginning, but include substantial content
      if (skipAcknowledgement && isAcknowledgement && !isSubstantialContent) {
        continue;
      }

      if (isSubstantialContent) {
        foundSubstantialContent = true;
        skipAcknowledgement = false;
        cleanLines.push(line);
      } else if (foundSubstantialContent && trimmed.length > 0 && !isAcknowledgement) {
        // Include content after we've found substantial content, unless it's acknowledgement
        cleanLines.push(line);
      } else if (trimmed === '') {
        // Keep empty lines for formatting, but only after substantial content
        if (!skipAcknowledgement) {
          cleanLines.push(line);
        }
      }
    }

    return cleanLines.join('\n').trim();
  }

  /**
   * Extract content after solution guide markers
   * @param {string} content - Raw content to process
   * @returns {string|null} Content after markers, or null if no markers found
   */
  static extractContentAfterMarkers(content) {
    // Define solution guide markers in order of priority
    const markers = [
      /---\s*SOLUTION\s+GUIDE\s*---/i,
      /===\s*SOLUTION\s+GUIDE\s*===/i,
      /\*\*\*\s*SOLUTION\s+GUIDE\s*\*\*\*/i,
      /\[SOLUTION\s+GUIDE\s+BEGINS?\]/i,
      /\[START\s+SOLUTION\s+GUIDE\]/i,
      /BEGIN_SOLUTION_GUIDE/i,
      /GUIDE_START/i
    ];

    // First, try to find explicit markers
    for (const marker of markers) {
      const match = content.match(marker);
      if (match) {
        const markerIndex = match.index + match[0].length;
        let extractedContent = content.substring(markerIndex).trim();
        
        // Additional cleanup after marker extraction
        extractedContent = this.cleanPostMarkerContent(extractedContent);
        
        return extractedContent;
      }
    }

    // Fallback: Look for tool invocations followed by substantial content
    // This handles cases where AI responses include tool calls before the actual content
    const toolInvocationPattern = /<invoke[^>]*>[\s\S]*?<\/invoke>/gi;
    const afterToolInvocations = content.replace(toolInvocationPattern, '').trim();
    
    if (afterToolInvocations.length < content.length * 0.8) { // If we removed significant content
      // Look for first substantial header after tool invocations
      const headerMatch = afterToolInvocations.match(/^#{1,2}\s+[^#\n]+/m);
      if (headerMatch) {
        return afterToolInvocations.substring(headerMatch.index).trim();
      }
    }

    // Final fallback: Look for first substantial header if it's not at the very beginning
    const headerMatch = content.match(/^#{1,2}\s+[^#\n]+/m);
    if (headerMatch && headerMatch.index > 200) { // Increased threshold for better detection
      return content.substring(headerMatch.index).trim();
    }

    return null;
  }

  /**
   * Clean content that appears after solution guide markers
   * @param {string} content - Content after marker extraction
   * @returns {string} Cleaned content
   */
  static cleanPostMarkerContent(content) {
    const lines = content.split('\n');
    const cleanLines = [];
    let foundSubstantialContent = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines at the beginning
      if (!foundSubstantialContent && trimmed === '') {
        continue;
      }

      // Check if this line is substantial content
      if (this.isSubstantialContentStart(trimmed)) {
        foundSubstantialContent = true;
        cleanLines.push(line);
        continue;
      }

      // Skip remaining acknowledgements even after marker
      const postMarkerAcknowledgements = [
        /^(based on|according to|here's|using the|with the above)/i,
        /^(let me now|i'll now|now i'll)/i,
        /^(the documentation shows|from the documentation)/i
      ];

      const isPostMarkerAck = postMarkerAcknowledgements.some(pattern => 
        pattern.test(trimmed)
      );

      if (!foundSubstantialContent && isPostMarkerAck) {
        continue; // Skip post-marker acknowledgements
      }

      // Include line if we've found substantial content or if it's substantial itself
      if (foundSubstantialContent || this.isSubstantialContentStart(trimmed)) {
        foundSubstantialContent = true;
        cleanLines.push(line);
      }
    }

    return cleanLines.join('\n').trim();
  }

  /**
   * Remove tool invocation blocks from content
   * @param {string} content - Raw content with potential tool invocations
   * @returns {string} Content with tool invocations removed
   */
  static removeToolInvocations(content) {
    // Remove XML-style tool invocations
    const toolInvocationPattern = /<invoke[^>]*>[\s\S]*?<\/invoke>/gi;
    let cleanedContent = content.replace(toolInvocationPattern, '');
    
    // Remove any remaining invoke parameter blocks
    const parameterPattern = /<parameter[^>]*>[\s\S]*?<\/parameter>/gi;
    cleanedContent = cleanedContent.replace(parameterPattern, '');
    
    // Clean up any remaining invoke tags
    cleanedContent = cleanedContent.replace(/<\/?invoke[^>]*>/gi, '');
    cleanedContent = cleanedContent.replace(/<\/?parameter[^>]*>/gi, '');
    
    // Remove empty lines that might be left behind
    cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return cleanedContent.trim();
  }

  /**
   * Check if a line indicates the start of substantial content
   * @param {string} line - Trimmed line to check
   * @returns {boolean} True if this line starts substantial content
   */
  static isSubstantialContentStart(line) {
    return (
      line.match(/^#{1,6}\s+/) ||    // Any header
      line.match(/^\d+\.\s+/) ||     // Numbered list
      line.match(/^[-*+]\s+/) ||     // Bullet list
      line.match(/^\|.*\|/) ||       // Table
      line.match(/^```/) ||          // Code block
      (line.length > 100 && !line.match(/^(i'll|here|let me|this)/i)) // Long substantial line
    );
  }
  /**
   * Merge new content with existing artifact content
   * NOW USES AI: This method now uses Claude for intelligent content merging
   * @param {string} existingContent - Original artifact content
   * @param {string} rawNewContent - Raw new content from Claude
   * @param {Object} modificationScope - Scope analysis from ArtifactDetector
   * @param {boolean} isFromScopedInstruction - Whether this update is from a scoped instruction
   * @returns {Object} Merge result with content and change metadata
   */
  static async mergeContent(existingContent, rawNewContent, modificationScope = null, isFromScopedInstruction = false) {
    try {
      // Use AI-powered merging for intelligent content integration
      const mergeInstructions = isFromScopedInstruction 
        ? 'This is a scoped instruction update - apply changes precisely to the specified section. CRITICAL ANTI-TRUNCATION RULES: NEVER truncate any content in a merge. NEVER use phrases like "[Previous content remains unchanged through X section]" or "[Remaining content remains unchanged from Y through Z section]". NEVER reference previous sections with "as mentioned above" or "in the previous section". ALWAYS include complete sections in their entirety. The merged document must be complete, standalone, and self-contained. Include ALL sections completely - never use truncation references.'
        : 'Merge the new content intelligently with the existing content. CRITICAL ANTI-TRUNCATION RULES: NEVER truncate any content in a merge. NEVER use phrases like "[Previous content remains unchanged through X section]" or "[Remaining content remains unchanged from Y through Z section]". NEVER reference previous sections with "as mentioned above", "in the previous section", "refer to the section above", or similar cross-references. ALWAYS include complete sections in their entirety. The final merged document must be completely standalone and self-contained. Each section must contain all necessary information and context. Write as if this is the only document the reader will see. Include ALL sections completely - never use truncation references.';
      
      return await AIService.mergeContent(existingContent, rawNewContent, modificationScope, mergeInstructions);
    } catch (error) {
      console.error('AI merge failed, falling back to local algorithm:', error);
      // Fallback to local algorithm if AI fails
      return this.mergeContentLocal(existingContent, rawNewContent, modificationScope, isFromScopedInstruction);
    }
  }

  /**
   * LOCAL ALGORITHM (PRESERVED): Merge using local algorithms
   * This is the original local merge algorithm, preserved for fallback use
   * @param {string} existingContent - Original artifact content
   * @param {string} rawNewContent - Raw new content from Claude
   * @param {Object} modificationScope - Scope analysis from ArtifactDetector
   * @param {boolean} isFromScopedInstruction - Whether this update is from a scoped instruction
   * @returns {Object} Merge result with content and change metadata
   */
  static async mergeContentLocal(existingContent, rawNewContent, modificationScope = null, isFromScopedInstruction = false) {
    // Extract clean content first
    const newContent = await this.extractCleanContentLocal(rawNewContent);
    
    if (!newContent.trim()) {
      return {
        mergedContent: existingContent,
        changes: [],
        isSignificantChange: false
      };
    }
    
    if (!existingContent) {
      return {
        mergedContent: newContent,
        changes: [{
          type: 'create',
          description: 'New artifact created',
          content: newContent
        }],
        isSignificantChange: true
      };
    }

    // For scoped instructions, check if the new content looks like a complete artifact
    if (isFromScopedInstruction) {
      const newContentSections = this.parseSections(newContent);
      
      // If new content has multiple sections or looks complete, use it as replacement
      if (newContentSections.length > 1 || this.looksLikeCompleteArtifact(newContent)) {
        return {
          mergedContent: newContent,
          changes: [{
            type: 'replace',
            description: 'Artifact updated from scoped instruction',
            oldContent: existingContent,
            newContent: newContent
          }],
          isSignificantChange: true
        };
      }
    }

    // If it's not a partial update, perform intelligent merging
    if (!modificationScope?.isPartialUpdate) {
      return this.performIntelligentMergeLocal(existingContent, newContent);
    }

    // Handle partial updates intelligently
    return this.mergePartialUpdateLocal(existingContent, newContent, modificationScope);
  }

  /**
   * LOCAL ALGORITHM (PRESERVED): Perform intelligent merging by analyzing and combining sections
   * This is the original local merge algorithm, preserved for fallback use
   * @param {string} existingContent 
   * @param {string} newContent 
   * @returns {Object}
   */
  static performIntelligentMergeLocal(existingContent, newContent) {
    const existingSections = this.parseSections(existingContent);
    const newSections = this.parseSections(newContent);
    const changes = [];
    let mergedSections = [];
    
    // Start with existing sections
    const processedNewSections = new Set();
    
    // Process existing sections - update or keep them
    existingSections.forEach(existingSection => {
      const matchingNewSection = newSections.find(newSection => 
        this.sectionsMatch(existingSection.title, newSection.title)
      );
      
      if (matchingNewSection) {
        // Check if content is actually different
        if (!this.isContentDuplicate(existingSection.content, matchingNewSection.content)) {
          mergedSections.push(matchingNewSection);
          processedNewSections.add(matchingNewSection.title);
          changes.push({
            type: 'update',
            description: `Updated section: ${existingSection.title}`,
            sectionTitle: existingSection.title,
            oldContent: existingSection.content,
            newContent: matchingNewSection.content
          });
        } else {
          // Keep existing if content is similar
          mergedSections.push(existingSection);
          processedNewSections.add(matchingNewSection.title);
        }
      } else {
        // Keep existing section if no match in new content
        mergedSections.push(existingSection);
      }
    });
    
    // Add new sections that weren't matched
    newSections.forEach(newSection => {
      if (!processedNewSections.has(newSection.title)) {
        mergedSections.push(newSection);
        changes.push({
          type: 'add',
          description: `Added new section: ${newSection.title}`,
          sectionTitle: newSection.title,
          content: newSection.content
        });
      }
    });
    
    // Sort sections intelligently based on solution guide structure
    mergedSections = this.sortSectionsIntelligently(mergedSections);
    
    // Rebuild content
    const mergedContent = mergedSections
      .map(section => section.content)
      .join('\n\n')
      .replace(/\n{3,}/g, '\n\n'); // Clean up excessive newlines
    
    return {
      mergedContent,
      changes,
      isSignificantChange: changes.length > 0
    };
  }

  /**
   * Sort sections based on typical solution guide structure
   * @param {Array} sections 
   * @returns {Array}
   */
  static sortSectionsIntelligently(sections) {
    const sectionOrder = [
      'overview', 'introduction', 'getting started', 'setup', 'prerequisites', 'requirements',
      'authentication', 'configuration', 'implementation', 'integration', 'code', 'examples',
      'api calls', 'endpoints', 'testing', 'validation', 'error handling', 'troubleshooting',
      'best practices', 'security', 'performance', 'deployment', 'conclusion', 'next steps',
      'references', 'resources', 'appendix'
    ];
    
    return sections.sort((a, b) => {
      const aPriority = this.getSectionPriority(a.title, sectionOrder);
      const bPriority = this.getSectionPriority(b.title, sectionOrder);
      return aPriority - bPriority;
    });
  }

  /**
   * LOCAL ALGORITHM (PRESERVED): Merge partial updates with existing content
   * This is the original local partial merge algorithm, preserved for fallback use
   * @param {string} existingContent 
   * @param {string} newContent 
   * @param {Object} modificationScope 
   * @returns {Object}
   */
  static mergePartialUpdateLocal(existingContent, newContent, modificationScope) {
    const changes = [];
    let mergedContent = existingContent;

    // Parse both contents into sections
    const existingSections = this.parseSections(existingContent);
    const newSections = this.parseSections(newContent);

    // Identify which sections in newContent are actual updates vs placeholders
    const updatedSections = this.identifyUpdatedSections(newSections, modificationScope);

    // Merge updated sections
    updatedSections.forEach(section => {
      const existingSection = existingSections.find(es => 
        this.sectionsMatch(es.title, section.title)
      );

      if (existingSection) {
        // Replace existing section
        mergedContent = this.replaceSectionInContent(
          mergedContent, 
          existingSection, 
          section
        );
        
        changes.push({
          type: 'update',
          description: `Updated section: ${section.title}`,
          sectionTitle: section.title,
          oldContent: existingSection.content,
          newContent: section.content
        });
      } else {
        // Add new section
        mergedContent = this.addSectionToContent(mergedContent, section);
        
        changes.push({
          type: 'add',
          description: `Added new section: ${section.title}`,
          sectionTitle: section.title,
          content: section.content
        });
      }
    });

    return {
      mergedContent,
      changes,
      isSignificantChange: changes.length > 0
    };
  }

  /**
   * Parse content into sections based on headers
   * @param {string} content 
   * @returns {Array} Array of section objects
   */
  static parseSections(content) {
    if (!content) return [];

    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;

    lines.forEach((line, index) => {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        // Save previous section if exists
        if (currentSection) {
          sections.push({
            ...currentSection,
            content: currentSection.lines.join('\n').trim()
          });
        }

        // Start new section
        currentSection = {
          level: headerMatch[1].length,
          title: headerMatch[2].trim(),
          startLine: index,
          lines: [line]
        };
      } else if (currentSection) {
        currentSection.lines.push(line);
      } else {
        // Content before first header
        if (!sections.length) {
          sections.push({
            level: 0,
            title: '_preamble',
            startLine: 0,
            lines: [line],
            content: ''
          });
        } else {
          sections[0].lines.push(line);
        }
      }
    });

    // Add final section
    if (currentSection) {
      sections.push({
        ...currentSection,
        content: currentSection.lines.join('\n').trim()
      });
    }

    // Update content for all sections
    return sections.map(section => ({
      ...section,
      content: section.lines.join('\n').trim()
    }));
  }

  /**
   * Identify which sections are actual updates vs placeholders
   * @param {Array} sections 
   * @param {Object} modificationScope 
   * @returns {Array}
   */
  static identifyUpdatedSections(sections, modificationScope) {
    return sections.filter(section => {
      // Skip sections that look like placeholders
      const placeholderPatterns = [
        /\[previous.*remain.*same\]/i,
        /\[rest.*content.*remains\]/i,
        /\[other.*sections.*unchanged\]/i,
        /\[continue.*existing\]/i,
        /\[keep.*previous\]/i
      ];

      const hasPlaceholderText = placeholderPatterns.some(pattern => 
        pattern.test(section.content)
      );

      // Include section if it has substantial content and isn't a placeholder
      return !hasPlaceholderText && section.content.length > 50;
    });
  }

  /**
   * Check if two section titles match (fuzzy matching)
   * @param {string} title1 
   * @param {string} title2 
   * @returns {boolean}
   */
  static sectionsMatch(title1, title2) {
    if (!title1 || !title2) return false;

    const normalize = (str) => str.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const norm1 = normalize(title1);
    const norm2 = normalize(title2);

    // Exact match
    if (norm1 === norm2) return true;

    // Substring match for longer titles
    if (norm1.length > 10 && norm2.length > 10) {
      return norm1.includes(norm2) || norm2.includes(norm1);
    }

    // Word overlap for shorter titles
    const words1 = norm1.split(' ');
    const words2 = norm2.split(' ');
    const overlap = words1.filter(word => words2.includes(word));
    
    return overlap.length >= Math.min(words1.length, words2.length) / 2;
  }

  /**
   * Replace a section in the content
   * @param {string} content 
   * @param {Object} oldSection 
   * @param {Object} newSection 
   * @returns {string}
   */
  static replaceSectionInContent(content, oldSection, newSection) {
    const lines = content.split('\n');
    
    // Find the end of the old section
    let endLine = lines.length;
    for (let i = oldSection.startLine + 1; i < lines.length; i++) {
      if (lines[i].match(/^#{1,6}\s+/)) {
        endLine = i;
        break;
      }
    }

    // Replace the section
    const beforeSection = lines.slice(0, oldSection.startLine);
    const afterSection = lines.slice(endLine);
    const newSectionLines = newSection.content.split('\n');

    return [...beforeSection, ...newSectionLines, ...afterSection].join('\n');
  }

  /**
   * Add a new section to content with intelligent positioning
   * @param {string} content 
   * @param {Object} section 
   * @returns {string}
   */
  static addSectionToContent(content, section) {
    const lines = content.split('\n');
    const existingSections = this.parseSections(content);
    
    // Define typical solution guide section order
    const sectionOrder = [
      'overview', 'introduction', 'getting started', 'setup', 'prerequisites', 'requirements',
      'authentication', 'configuration', 'implementation', 'integration', 'code', 'examples',
      'api calls', 'endpoints', 'testing', 'validation', 'error handling', 'troubleshooting',
      'best practices', 'security', 'performance', 'deployment', 'conclusion', 'next steps',
      'references', 'resources', 'appendix'
    ];
    
    // Find the best position for the new section
    const newSectionPriority = this.getSectionPriority(section.title, sectionOrder);
    let insertPosition = lines.length; // Default to end
    
    // Find the right position based on section priority
    for (let i = existingSections.length - 1; i >= 0; i--) {
      const existingSection = existingSections[i];
      const existingPriority = this.getSectionPriority(existingSection.title, sectionOrder);
      
      if (existingPriority <= newSectionPriority) {
        // Insert after this section
        const endLine = this.findSectionEndLine(existingSection, lines);
        insertPosition = endLine;
        break;
      }
    }
    
    // Insert the new section
    const beforeSection = lines.slice(0, insertPosition);
    const afterSection = lines.slice(insertPosition);
    const newSectionLines = section.content.split('\n');
    
    return [...beforeSection, '', ...newSectionLines, '', ...afterSection].join('\n');
  }
  
  /**
   * Get section priority based on typical solution guide structure
   * @param {string} title 
   * @param {Array} sectionOrder 
   * @returns {number}
   */
  static getSectionPriority(title, sectionOrder) {
    const normalizedTitle = title.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    for (let i = 0; i < sectionOrder.length; i++) {
      if (normalizedTitle.includes(sectionOrder[i])) {
        return i;
      }
    }
    
    return sectionOrder.length; // Unknown sections go to the end
  }
  
  /**
   * Find the end line of a section
   * @param {Object} section 
   * @param {Array} lines 
   * @returns {number}
   */
  static findSectionEndLine(section, lines) {
    // Find the start of the next section or end of content
    for (let i = section.startLine + 1; i < lines.length; i++) {
      if (lines[i].match(/^#{1,6}\s+/)) {
        return i;
      }
    }
    return lines.length;
  }

  /**
   * Generate a summary of changes for user display
   * @param {Array} changes 
   * @returns {string}
   */
  static generateChangeSummary(changes) {
    if (!changes.length) return 'No changes detected';

    const summary = changes.map(change => {
      switch (change.type) {
        case 'create':
          return '✨ Created new artifact';
        case 'replace':
          return '🔄 Completely updated content';
        case 'update':
          return `📝 Updated "${change.sectionTitle}"`;
        case 'add':
          return `➕ Added "${change.sectionTitle}"`;
        default:
          return `Modified content`;
      }
    });

    return summary.join(', ');
  }

  /**
   * Check if content looks like a complete artifact
   * @param {string} content 
   * @returns {boolean}
   */
  static looksLikeCompleteArtifact(content) {
    // Check for artifact-like patterns
    const hasMainHeader = /^#\s+/.test(content); // H1 header at start
    const hasMultipleSections = (content.match(/^#{1,6}\s+/gm) || []).length >= 2;
    const hasSubstantialContent = content.length > 500;
    const hasCodeBlocks = /```[\s\S]*?```/.test(content);
    const hasList = /^\s*[-*+]\s+|^\s*\d+\.\s+/m.test(content);
    
    return hasMainHeader || (hasMultipleSections && hasSubstantialContent) || 
           (hasCodeBlocks && hasList) || hasSubstantialContent;
  }

  /**
   * Calculate the significance of changes
   * @param {Array} changes 
   * @returns {Object}
   */
  static analyzeChangeSignificance(changes) {
    let totalCharactersChanged = 0;
    let sectionsModified = 0;
    let newSections = 0;

    changes.forEach(change => {
      if (change.type === 'add') {
        newSections++;
        totalCharactersChanged += change.content?.length || 0;
      } else if (change.type === 'update') {
        sectionsModified++;
        totalCharactersChanged += Math.abs(
          (change.newContent?.length || 0) - (change.oldContent?.length || 0)
        );
      } else if (change.type === 'replace') {
        totalCharactersChanged += change.newContent?.length || 0;
      }
    });

    return {
      totalCharactersChanged,
      sectionsModified,
      newSections,
      isMinorChange: totalCharactersChanged < 100 && sectionsModified <= 1,
      isMajorChange: totalCharactersChanged > 500 || sectionsModified > 3
    };
  }

  /**
   * Check if content is duplicate (similar)
   * @param {string} existing 
   * @param {string} newContent 
   * @returns {boolean}
   */
  static isContentDuplicate(existing, newContent) {
    // Normalize content for comparison
    const normalize = (content) => content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
    
    const normalizedExisting = normalize(existing);
    const normalizedNew = normalize(newContent);
    
    // Calculate similarity ratio
    const similarity = this.calculateSimilarity(normalizedExisting, normalizedNew);
    return similarity > 0.8; // 80% similarity threshold
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * @param {string} str1 
   * @param {string} str2 
   * @returns {number} Similarity ratio between 0 and 1
   */
  static calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 
   * @param {string} str2 
   * @returns {number}
   */
  static levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Preview merge result without actually merging
   * NOW USES AI: This method now uses Claude for intelligent merge preview
   * @param {string} existingContent 
   * @param {string} newContent 
   * @returns {string}
   */
  static async previewMerge(existingContent, newContent) {
    try {
      // Use AI-powered merge preview
      const result = await AIService.previewMerge(existingContent, newContent, { isPartialUpdate: true });
      return result.previewContent;
    } catch (error) {
      console.error('AI preview failed, falling back to local algorithm:', error);
      // Fallback to local algorithm
      return this.previewMergeLocal(existingContent, newContent);
    }
  }

  /**
   * LOCAL ALGORITHM (PRESERVED): Preview merge result using local algorithms
   * This is the original local preview algorithm, preserved for fallback use
   * @param {string} existingContent 
   * @param {string} newContent 
   * @returns {string}
   */
  static async previewMergeLocal(existingContent, newContent) {
    // Use the same merge logic but return the result
    const result = await this.mergeContentLocal(existingContent, newContent, { isPartialUpdate: true }, false);
    return result.mergedContent;
  }

  /**
   * Deduplicate content intelligently by removing similar sections
   * @param {string} content 
   * @returns {string}
   */
  static deduplicateContent(content) {
    const sections = this.parseSections(content);
    const uniqueSections = [];
    
    sections.forEach(section => {
      const isDuplicate = uniqueSections.some(unique => 
        this.isContentDuplicate(unique.content, section.content)
      );
      
      if (!isDuplicate) {
        uniqueSections.push(section);
      }
    });
    
    return uniqueSections.map(section => section.content).join('\n\n');
  }
}

export default ContentMerger;