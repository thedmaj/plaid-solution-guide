/**
 * Smart Session Workspace Hook
 * Manages session-scoped artifacts with intelligent merging and organization
 */

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ContentRelationshipAnalyzer } from '../utils/contentRelationshipAnalyzer';
import { ContentMerger } from '../utils/contentMerger';
import { detectArtifact } from '../utils/artifactDetection';

/**
 * Generate artifact title from content
 */
const generateArtifactTitle = (content) => {
  // Look for main headers
  const headerMatch = content.match(/^#\s+(.+)/m);
  if (headerMatch) {
    return headerMatch[1].trim();
  }
  
  // Look for keywords to generate appropriate title
  const keywords = {
    'plaid': 'Plaid Integration Guide',
    'link': 'Plaid Link Guide', 
    'auth': 'Authentication Guide',
    'identity': 'Identity Verification Guide',
    'transaction': 'Transaction Data Guide',
    'webhook': 'Webhook Implementation Guide',
    'api': 'API Integration Guide'
  };
  
  const contentLower = content.toLowerCase();
  for (const [keyword, title] of Object.entries(keywords)) {
    if (contentLower.includes(keyword)) {
      return title;
    }
  }
  
  return null;
};

export const useSessionWorkspace = (sessionId, artifacts, artifactOperations) => {
  const [workspaces, setWorkspaces] = useState(new Map()); // sessionId -> workspace
  const [mergeSuggestions, setMergeSuggestions] = useState([]);
  const [workspaceSettings, setWorkspaceSettings] = useState({
    autoMergeEnabled: true,
    mergeStrategy: 'always_merge', // Always merge by default
    maxPrimarySize: 50000, // Much larger size limit
    autoCreateArtifact: false, // Disabled - only create artifacts when user explicitly requests
    filterConversationalText: true // Remove assistant conversational text
  });

  // Get current session workspace
  const currentWorkspace = workspaces.get(sessionId);

  /**
   * Initialize workspace for a session
   */
  const initializeWorkspace = useCallback((sessionId) => {
    if (!workspaces.has(sessionId)) {
      console.log('🆕 Initializing new workspace for session:', sessionId);
      
      // Check if there are existing artifacts for this session with improved detection
      const sessionArtifacts = artifacts.filter(a => {
        // Check multiple possible sessionId locations
        const artifactSessionId = a.metadata?.sessionId || a.session_id || a.sessionId;
        return artifactSessionId === sessionId;
      });
      
      // Enhanced debug logging to understand artifact detection
      console.log('🔍 Enhanced artifact filtering debug:', {
        sessionId,
        totalArtifacts: artifacts.length,
        artifactDetails: artifacts.map(a => ({
          id: a.id,
          title: a.title,
          metadataSessionId: a.metadata?.sessionId,
          session_id: a.session_id,
          sessionIdField: a.sessionId,
          hasMetadata: !!a.metadata,
          metadataKeys: a.metadata ? Object.keys(a.metadata) : []
        })),
        sessionArtifactsFound: sessionArtifacts.length,
        sessionArtifactIds: sessionArtifacts.map(a => a.id)
      });
      
      // Find primary artifact - prefer explicitly marked, fallback to first/most recent
      let primaryArtifact = sessionArtifacts.find(a => a.metadata?.role === 'primary');
      if (!primaryArtifact && sessionArtifacts.length > 0) {
        // If no explicitly marked primary, use the most recently updated artifact
        primaryArtifact = sessionArtifacts.reduce((latest, current) => 
          new Date(current.updated_at || current.created_at) > new Date(latest.updated_at || latest.created_at) 
            ? current : latest
        );
        console.log('🔄 No explicit primary artifact, using most recent:', primaryArtifact.title);
      }
      
      const supplementaryArtifacts = sessionArtifacts.filter(a => 
        a.metadata?.role === 'supplementary' || (a.id !== primaryArtifact?.id)
      );
      
      console.log('🔍 Found existing artifacts for session:', {
        sessionId,
        totalArtifacts: artifacts.length,
        sessionArtifactsCount: sessionArtifacts.length,
        sessionArtifactIds: sessionArtifacts.map(a => a.id),
        sessionArtifactMetadata: sessionArtifacts.map(a => ({ 
          id: a.id, 
          title: a.title,
          sessionId: a.metadata?.sessionId,
          session_id: a.session_id,
          sessionIdField: a.sessionId,
          role: a.metadata?.role 
        })),
        primaryArtifact: primaryArtifact?.id,
        supplementaryCount: supplementaryArtifacts.length
      });
      
      const newWorkspace = {
        sessionId,
        primaryArtifact: primaryArtifact || null,
        supplementaryArtifacts: supplementaryArtifacts || [],
        contentHistory: [],
        settings: { ...workspaceSettings },
        metadata: {
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          totalContentAdded: 0,
          mergeDecisions: []
        }
      };

      setWorkspaces(prev => new Map(prev.set(sessionId, newWorkspace)));
      return newWorkspace;
    }
    return workspaces.get(sessionId);
  }, [workspaces, workspaceSettings, artifacts]);

  /**
   * Detect section-specific targeting from user message
   */
  const detectSectionTargeting = (userMessage, cleanContent) => {
    const sectionPatterns = [
      /modify.*section[:\s]+["']?([^"'\n]+)["']?/i,
      /update.*section[:\s]+["']?([^"'\n]+)["']?/i,
      /change.*section[:\s]+["']?([^"'\n]+)["']?/i,
      /edit.*section[:\s]+["']?([^"'\n]+)["']?/i,
      /modify.*["']([^"'\n]+)["']\s*section/i,
      /update.*["']([^"'\n]+)["']\s*section/i,
      /change.*["']([^"'\n]+)["']\s*section/i,
      /edit.*["']([^"'\n]+)["']\s*section/i,
      /in.*["']([^"'\n]+)["']\s*section/i,
      /for.*["']([^"'\n]+)["']\s*section/i
    ];

    for (const pattern of sectionPatterns) {
      const match = userMessage.match(pattern);
      if (match) {
        const targetSection = match[1].trim();
        console.log('🎯 Detected section targeting:', targetSection);
        
        // Check if the new content contains this section
        const headerPattern = new RegExp(`^#{1,6}\\s+.*${targetSection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'im');
        if (headerPattern.test(cleanContent)) {
          return {
            targetSection,
            placement: {
              type: 'replace_section',
              sectionName: targetSection
            }
          };
        }
      }
    }

    return null;
  };

  /**
   * Process new content for the workspace
   */
  const processContentForWorkspace = useCallback(async (content, messageId, sessionId, forceTargetArtifactId = null, shouldAutoCreate = true, userMessage = '', sessionTitle = null) => {
    console.log('🔄 Processing content for workspace (simplified):', { 
      contentLength: content.length, 
      messageId, 
      sessionId, 
      forceTargetArtifactId,
      shouldAutoCreate,
      hasUserMessage: !!userMessage
    });
    
    const workspace = workspaces.get(sessionId) || initializeWorkspace(sessionId);
    
    // If specific artifact is targeted (from scoped instructions)
    if (forceTargetArtifactId) {
      const targetArtifact = artifacts.find(a => a.id === forceTargetArtifactId);
      if (targetArtifact) {
        return await updateArtifactWithContent(targetArtifact, content, messageId, 'scoped_instruction');
      }
    }

    // Filter out conversational text from assistant responses
    const cleanContent = await ContentMerger.extractCleanContent(content);
    console.log('🧹 Cleaned content:', { 
      original: content?.length || 0, 
      cleaned: cleanContent?.length || 0,
      sample: cleanContent && typeof cleanContent === 'string' ? 
        cleanContent.substring(0, 200) + '...' : 'No clean content'
    });
    
    // If cleaned content is too short, skip artifact creation/merging (lowered threshold)
    if (cleanContent.length < 50) {
      console.log('❌ Content too short after cleaning, skipping artifact processing');
      console.log('Content sample:', content.substring(0, 300) + '...');
      return null;
    }

    // Detect section-specific targeting if we have a user message
    let sectionTargeting = null;
    if (userMessage && workspace.primaryArtifact) {
      sectionTargeting = detectSectionTargeting(userMessage, cleanContent);
      console.log('🎯 Section targeting detected:', sectionTargeting);
    }

    console.log('🏢 Workspace state check:', {
      hasPrimaryArtifact: !!workspace.primaryArtifact,
      primaryArtifactId: workspace.primaryArtifact?.id,
      supplementaryCount: workspace.supplementaryArtifacts?.length || 0,
      workspaceExists: !!workspace,
      workspaceMetadata: workspace?.metadata,
      shouldAutoCreate,
      autoCreateEnabled: workspaceSettings.autoCreateArtifact,
      sessionId,
      allWorkspaces: Array.from(workspaces.keys())
    });

    // If no primary artifact exists and auto-create is enabled, create one for solution guides
    if (!workspace.primaryArtifact && shouldAutoCreate && workspaceSettings.autoCreateArtifact) {
      console.log('🆕 Auto-creating primary artifact for workspace');
      return await createPrimaryArtifact(cleanContent, messageId, sessionId, sessionTitle);
    }

    // If primary artifact exists, merge with it
    if (workspace.primaryArtifact) {
      console.log('⚡ Auto-merging with primary artifact:', {
        artifactId: workspace.primaryArtifact.id,
        artifactTitle: workspace.primaryArtifact.title,
        placement: sectionTargeting?.placement?.type
      });
      return await mergeWithPrimaryArtifact(cleanContent, messageId, sectionTargeting?.placement);
    }

    // Return null if no action taken
    console.log('❌ No action taken - no primary artifact and auto-create disabled');
    return null;
  }, [workspaces, artifacts, initializeWorkspace, workspaceSettings.autoCreateArtifact]);

  /**
   * Make decision about what to do with new content
   */
  const makeContentDecision = (analysis, settings, content) => {
    const { mergeStrategy, autoMergeEnabled } = settings;

    // Always separate strategy
    if (mergeStrategy === 'always_separate') {
      return {
        action: 'create_supplementary',
        reason: 'User preference: always separate'
      };
    }

    // Always merge strategy
    if (mergeStrategy === 'always_merge' && autoMergeEnabled) {
      return {
        action: 'auto_merge',
        placement: analysis.suggestedPlacement
      };
    }

    // Smart suggest strategy (default)
    if (analysis.shouldMerge && analysis.confidence > 0.8 && autoMergeEnabled) {
      return {
        action: 'auto_merge',
        placement: analysis.suggestedPlacement
      };
    } else if (analysis.shouldMerge && analysis.confidence > 0.4) {
      return {
        action: 'suggest_merge',
        analysis
      };
    } else {
      return {
        action: 'create_supplementary',
        reason: analysis.reasoning
      };
    }
  };

  /**
   * Create primary artifact for workspace
   */
  const createPrimaryArtifact = async (content, messageId, sessionId, sessionTitle = null) => {
    try {
      // Use session title if available and valid, otherwise generate from content
      const title = (sessionTitle && sessionTitle !== 'New Conversation' && sessionTitle.trim())
        ? sessionTitle
        : generateArtifactTitle(content) || `Solution Guide - ${new Date().toLocaleDateString()}`;
      
      const artifactData = {
        title,
        content,
        type: 'markdown',
        metadata: {
          sessionId,
          role: 'primary',
          sourceMessages: [messageId],
          workspaceGenerated: true,
          creationReason: 'auto_created_primary',
          autoMergeEnabled: true,
          inheritedFromSession: !!(sessionTitle && sessionTitle !== 'New Conversation')
        }
      };

      const newArtifact = await artifactOperations.createArtifact(
        artifactData.title,
        artifactData.content,
        artifactData.type,
        artifactData.metadata
      );

      // Update workspace
      setWorkspaces(prev => {
        const updated = new Map(prev);
        const workspace = updated.get(sessionId);
        if (workspace) {
          workspace.primaryArtifact = newArtifact;
          workspace.metadata.lastActivity = new Date().toISOString();
          workspace.contentHistory.push({
            action: 'create_primary',
            artifactId: newArtifact.id,
            messageId,
            timestamp: new Date().toISOString()
          });
        }
        return updated;
      });

      return newArtifact;
    } catch (error) {
      console.error('Error creating primary artifact:', error);
      return null;
    }
  };

  /**
   * Merge content with primary artifact
   */
  const mergeWithPrimaryArtifact = async (content, messageId, placement) => {
    console.log('🔄 Starting merge with primary artifact:', { 
      contentLength: content?.length, 
      messageId, 
      placement,
      primaryArtifactId: currentWorkspace?.primaryArtifact?.id 
    });
    const workspace = currentWorkspace;
    if (!workspace?.primaryArtifact) {
      console.error('❌ No primary artifact found for merge');
      return null;
    }
    
    console.log('🔍 Primary artifact structure:', {
      id: workspace.primaryArtifact.id,
      title: workspace.primaryArtifact.title,
      hasContent: !!workspace.primaryArtifact.content,
      metadata: workspace.primaryArtifact.metadata,
      metadataType: typeof workspace.primaryArtifact.metadata
    });

    try {
      const cleanContent = await ContentMerger.extractCleanContent(content);
      console.log('🧹 Clean content extracted:', cleanContent.length, 'chars');
      
      const mergedContent = await performContentMerge(
        workspace.primaryArtifact.content,
        cleanContent,
        placement
      );
      console.log('🔄 Content merged successfully:', mergedContent.length, 'chars');

      const existingMetadata = workspace.primaryArtifact.metadata || {};
      const existingSourceMessages = existingMetadata.sourceMessages || [];
      console.log('🔍 Existing metadata:', existingMetadata);
      console.log('🔍 Existing source messages:', existingSourceMessages);
      
      const updatedArtifact = await artifactOperations.updateArtifact(
        workspace.primaryArtifact.id,
        {
          content: mergedContent,
          metadata: {
            ...existingMetadata,
            sourceMessages: [
              ...existingSourceMessages,
              messageId
            ],
            lastMerge: new Date().toISOString()
          }
        }
      );

      console.log('✅ Artifact updated successfully:', {
        artifactId: updatedArtifact.id,
        title: updatedArtifact.title,
        contentLength: updatedArtifact.content?.length,
        newContent: mergedContent.length
      });

      // Update workspace
      setWorkspaces(prev => {
        const updated = new Map(prev);
        const ws = updated.get(sessionId);
        if (ws) {
          ws.primaryArtifact = updatedArtifact;
          ws.metadata.lastActivity = new Date().toISOString();
          ws.metadata.totalContentAdded += cleanContent.length;
          ws.contentHistory.push({
            action: 'merge_primary',
            artifactId: updatedArtifact.id,
            messageId,
            contentLength: cleanContent.length,
            timestamp: new Date().toISOString()
          });
        }
        return updated;
      });

      return updatedArtifact;
    } catch (error) {
      console.error('Error merging with primary artifact:', error);
      return null;
    }
  };

  /**
   * Perform intelligent content merging
   */
  const performContentMerge = async (existingContent, newContent, placement) => {
    if (!placement) {
      // Simple append
      return existingContent + '\n\n' + newContent;
    }

    switch (placement.type) {
      case 'append_to_end':
        return existingContent + '\n\n' + newContent;
      
      case 'insert_after_section':
        return insertAfterSection(existingContent, newContent, placement.sectionIndex);
      
      case 'new_section':
        return existingContent + '\n\n## ' + placement.title + '\n\n' + newContent;
      
      case 'replace_section':
        return replaceSectionInContent(existingContent, newContent, placement.sectionName);
      
      default:
        return existingContent + '\n\n' + newContent;
    }
  };

  /**
   * Replace a specific section in the content
   */
  const replaceSectionInContent = (existingContent, newContent, sectionName) => {
    const lines = existingContent.split('\n');
    const headerPattern = /^(#{1,6})\s+(.+)$/;
    
    let sectionStart = -1;
    let sectionEnd = -1;
    let sectionLevel = 0;

    // Find the target section
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(headerPattern);
      
      if (match) {
        const level = match[1].length;
        const title = match[2].trim();
        
        // Check if this is our target section (case-insensitive, flexible matching)
        if (title.toLowerCase().includes(sectionName.toLowerCase()) || 
            sectionName.toLowerCase().includes(title.toLowerCase())) {
          sectionStart = i;
          sectionLevel = level;
          
          // Find the end of this section (next header of same or higher level)
          for (let j = i + 1; j < lines.length; j++) {
            const nextMatch = lines[j].match(headerPattern);
            if (nextMatch && nextMatch[1].length <= level) {
              sectionEnd = j;
              break;
            }
          }
          
          // If no next section found, section goes to end
          if (sectionEnd === -1) {
            sectionEnd = lines.length;
          }
          
          break;
        }
      }
    }

    if (sectionStart === -1) {
      // Section not found, append new content
      console.log(`⚠️ Section "${sectionName}" not found, appending content`);
      return existingContent + '\n\n' + newContent;
    }

    // Replace the section
    const before = lines.slice(0, sectionStart);
    const after = lines.slice(sectionEnd);
    
    const result = [
      ...before,
      ...newContent.split('\n'),
      '',
      ...after
    ].join('\n');

    console.log(`✅ Replaced section "${sectionName}" (lines ${sectionStart}-${sectionEnd})`);
    return result;
  };

  /**
   * Insert content after a specific section
   */
  const insertAfterSection = (existingContent, newContent, sectionIndex) => {
    const lines = existingContent.split('\n');
    const headerPattern = /^#{1,6}\s+/;
    
    let currentSection = -1;
    let insertIndex = lines.length;

    for (let i = 0; i < lines.length; i++) {
      if (headerPattern.test(lines[i])) {
        currentSection++;
        if (currentSection === sectionIndex + 1) {
          insertIndex = i;
          break;
        }
      }
    }

    const before = lines.slice(0, insertIndex);
    const after = lines.slice(insertIndex);
    
    return [
      ...before,
      '',
      ...newContent.split('\n'),
      '',
      ...after
    ].join('\n');
  };

  /**
   * Create supplementary artifact
   */
  const createSupplementaryArtifact = async (content, messageId, sessionId, reason) => {
    try {
      const detection = detectArtifact(content, 'assistant');
      const artifactData = {
        title: detection.suggestedTitle || `Related - ${new Date().toLocaleDateString()}`,
        content: await ContentMerger.extractCleanContent(content),
        type: detection.artifactType || 'markdown',
        metadata: {
          sessionId,
          role: 'supplementary',
          sourceMessages: [messageId],
          workspaceGenerated: true,
          creationReason: reason,
          relationToPrimary: 'related'
        }
      };

      const newArtifact = await artifactOperations.createArtifact(
        artifactData.title,
        artifactData.content,
        artifactData.type,
        artifactData.metadata
      );

      // Update workspace
      setWorkspaces(prev => {
        const updated = new Map(prev);
        const workspace = updated.get(sessionId);
        if (workspace) {
          workspace.supplementaryArtifacts.push(newArtifact);
          workspace.metadata.lastActivity = new Date().toISOString();
          workspace.contentHistory.push({
            action: 'create_supplementary',
            artifactId: newArtifact.id,
            messageId,
            reason,
            timestamp: new Date().toISOString()
          });
        }
        return updated;
      });

      return newArtifact;
    } catch (error) {
      console.error('Error creating supplementary artifact:', error);
      return null;
    }
  };

  /**
   * Create merge suggestion for user decision
   */
  const createMergeSuggestion = async (content, messageId, analysis, workspace) => {
    console.log('🔔 Creating merge suggestion:', { 
      contentLength: content.length, 
      messageId, 
      workspaceId: workspace.sessionId,
      primaryArtifactTitle: workspace.primaryArtifact?.title 
    });
    
    const suggestion = {
      id: uuidv4(),
      sessionId: workspace.sessionId,
      content: await ContentMerger.extractCleanContent(content),
      messageId,
      analysis,
      targetArtifact: workspace.primaryArtifact,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    setMergeSuggestions(prev => {
      const newSuggestions = [...prev, suggestion];
      console.log('📋 Updated merge suggestions count:', newSuggestions.length);
      return newSuggestions;
    });
  };

  /**
   * Handle user decision on merge suggestion
   */
  const handleMergeSuggestion = async (suggestionId, decision, customPlacement = null) => {
    console.log('🎯 Handling merge suggestion:', { suggestionId, decision, customPlacement });
    const suggestion = mergeSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) {
      console.error('❌ Suggestion not found:', suggestionId, 'Available:', mergeSuggestions.map(s => s.id));
      return;
    }
    console.log('📋 Found suggestion:', suggestion);

    try {
      let result = null;

      switch (decision) {
        case 'accept':
          result = await mergeWithPrimaryArtifact(
            suggestion.content,
            suggestion.messageId,
            customPlacement || suggestion.analysis.suggestedPlacement
          );
          break;
        
        case 'create_separate':
          result = await createSupplementaryArtifact(
            suggestion.content,
            suggestion.messageId,
            suggestion.sessionId,
            'user_requested_separation'
          );
          break;
        
        case 'reject':
          // Just remove the suggestion
          break;
      }

      // Update workspace settings based on user choice
      if (workspaceSettings.userPreferences.rememberChoices) {
        updateUserPreferences(suggestion.analysis, decision);
      }

      // Remove suggestion
      setMergeSuggestions(prev => prev.filter(s => s.id !== suggestionId));

      return result;
    } catch (error) {
      console.error('Error handling merge suggestion:', error);
      return null;
    }
  };

  /**
   * Update user preferences based on decisions
   */
  const updateUserPreferences = (analysis, decision) => {
    // Learn from user decisions to improve future suggestions
    setWorkspaceSettings(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        userDecisions: [
          ...(prev.metadata?.userDecisions || []),
          {
            analysis: {
              topicSimilarity: analysis.topicSimilarity,
              contentTypeCompatibility: analysis.contentTypeCompatibility,
              confidence: analysis.confidence
            },
            decision,
            timestamp: new Date().toISOString()
          }
        ].slice(-50) // Keep last 50 decisions
      }
    }));
  };

  /**
   * Update artifact with content (for manual edits and highlighting)
   */
  const updateArtifactWithContent = async (artifact, content, messageId, source = 'manual_edit') => {
    try {
      const cleanContent = await ContentMerger.extractCleanContent(content);
      
      // For manual edits, use smart merging
      const mergeResult = await ContentMerger.mergeContent(
        artifact.content,
        cleanContent,
        null, // No specific scope
        source === 'scoped_instruction' // Flag for scoped instructions
      );

      const existingMetadata = artifact.metadata || {};
      const existingSourceMessages = existingMetadata.sourceMessages || [];
      
      const updatedArtifact = await artifactOperations.updateArtifact(
        artifact.id,
        {
          content: mergeResult.mergedContent,
          metadata: {
            ...existingMetadata,
            sourceMessages: [
              ...existingSourceMessages,
              messageId
            ],
            lastUpdateSource: source,
            lastUpdate: new Date().toISOString()
          }
        }
      );

      // Update workspace if this is the primary artifact
      setWorkspaces(prev => {
        const updated = new Map(prev);
        for (const [sessionId, workspace] of updated) {
          if (workspace.primaryArtifact?.id === artifact.id) {
            workspace.primaryArtifact = updatedArtifact;
            workspace.metadata.lastActivity = new Date().toISOString();
            workspace.contentHistory.push({
              action: `update_${source}`,
              artifactId: updatedArtifact.id,
              messageId,
              timestamp: new Date().toISOString()
            });
            break;
          }
        }
        return updated;
      });

      return updatedArtifact;
    } catch (error) {
      console.error('Error updating artifact with content:', error);
      return null;
    }
  };

  /**
   * Get workspace for a session
   */
  const getWorkspace = useCallback((sessionId) => {
    return workspaces.get(sessionId) || initializeWorkspace(sessionId);
  }, [workspaces, initializeWorkspace]);

  /**
   * Create artifact manually (from user action)
   */
  const createManualArtifact = async (content, title, sessionId, type = 'markdown') => {
    try {
      const workspace = workspaces.get(sessionId) || initializeWorkspace(sessionId);
      const cleanContent = await ContentMerger.extractCleanContent(content);
      
      const artifactData = {
        title: title || generateArtifactTitle(cleanContent) || `Guide - ${new Date().toLocaleDateString()}`,
        content: cleanContent,
        type,
        metadata: {
          sessionId,
          role: workspace.primaryArtifact ? 'supplementary' : 'primary',
          sourceMessages: [], // No specific source message for manual creation
          workspaceGenerated: false,
          creationReason: 'manual_creation',
          autoMergeEnabled: false
        }
      };

      const newArtifact = await artifactOperations.createArtifact(
        artifactData.title,
        artifactData.content,
        artifactData.type,
        artifactData.metadata
      );

      // Update workspace
      setWorkspaces(prev => {
        const updated = new Map(prev);
        const ws = updated.get(sessionId);
        if (ws) {
          if (!ws.primaryArtifact && artifactData.metadata.role === 'primary') {
            ws.primaryArtifact = newArtifact;
          } else {
            ws.supplementaryArtifacts.push(newArtifact);
          }
          ws.metadata.lastActivity = new Date().toISOString();
          ws.contentHistory.push({
            action: 'create_manual',
            artifactId: newArtifact.id,
            timestamp: new Date().toISOString()
          });
        }
        return updated;
      });

      return newArtifact;
    } catch (error) {
      console.error('Error creating manual artifact:', error);
      return null;
    }
  };

  /**
   * Get all session artifacts (primary + supplementary)
   */
  const getSessionArtifacts = useCallback((sessionId) => {
    const workspace = workspaces.get(sessionId);
    if (!workspace) return [];

    return [
      ...(workspace.primaryArtifact ? [workspace.primaryArtifact] : []),
      ...workspace.supplementaryArtifacts
    ];
  }, [workspaces]);

  /**
   * Update workspace settings
   */
  const updateWorkspaceSettings = useCallback((newSettings) => {
    setWorkspaceSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // Unified workspace initialization and artifact synchronization
  useEffect(() => {
    // TEMPORARILY DISABLED TO FIX INFINITE LOOP
    // TODO: Re-enable workspace sync after fixing the loop
    if (process.env.NODE_ENV === 'development') {
      console.log('Workspace sync disabled temporarily');
    }
  }, [sessionId, artifacts]);

  return {
    // Core workspace data
    currentWorkspace,
    workspaces,
    mergeSuggestions,
    workspaceSettings,

    // Main functions
    processContentForWorkspace,
    handleMergeSuggestion,
    updateArtifactWithContent,
    createManualArtifact,

    // Utility functions
    getWorkspace,
    getSessionArtifacts,
    updateWorkspaceSettings,
    initializeWorkspace,

    // For backward compatibility
    processMessageForArtifacts: processContentForWorkspace
  };
};

export default useSessionWorkspace;