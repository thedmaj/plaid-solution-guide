/**
 * Utility for handling Server-Sent Events streaming from chat endpoint
 * Updated: Added authentication headers for streaming requests
 */

export class ChatStreamManager {
  constructor() {
    this.eventSource = null;
    this.abortController = null;
    this.typingQueue = [];
    this.isTyping = false;
  }

  /**
   * Start streaming chat response
   * @param {Object} requestData - Chat request data
   * @param {Function} onStreamStart - Called when stream starts
   * @param {Function} onStreamDelta - Called for each content chunk
   * @param {Function} onStreamComplete - Called when stream completes
   * @param {Function} onStreamError - Called on error
   */
  async startStream(requestData, { onStreamStart, onStreamDelta, onStreamComplete, onStreamError }) {
    try {
      // Clean up any existing stream
      this.cleanup();
      
      // Use fetch with ReadableStream instead of EventSource for POST requests
      this.abortController = new AbortController();
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      console.log('🔑 Streaming auth token:', token ? `${token.substring(0, 10)}...` : 'NO TOKEN');
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/plain'
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Added auth header to streaming request');
      } else {
        console.warn('⚠️ No auth token found for streaming request');
      }

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete lines (Server-Sent Events format)
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6)); // Remove 'data: ' prefix
              console.log('🔄 Parsed SSE event:', eventData);
              this.handleStreamEvent(eventData, { onStreamStart, onStreamDelta, onStreamComplete, onStreamError });
            } catch (e) {
              console.warn('Failed to parse SSE data:', line, e);
            }
          } else if (line.trim()) {
            console.log('🔍 Non-data SSE line:', line);
          }
        }
      }
      
    } catch (error) {
      console.error('Stream error:', error);
      if (onStreamError) {
        onStreamError(error);
      }
    }
  }

  /**
   * Queue typing content for natural typing speed
   */
  queueTyping(content, onStreamDelta) {
    this.typingQueue.push(content);
    if (!this.isTyping) {
      this.processTypingQueue(onStreamDelta);
    }
  }

  /**
   * Process queued typing content with natural delays
   */
  async processTypingQueue(onStreamDelta) {
    this.isTyping = true;
    
    while (this.typingQueue.length > 0) {
      const content = this.typingQueue.shift();
      onStreamDelta(content);
      
      // Minimal delay for smooth display
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    
    this.isTyping = false;
  }

  /**
   * Handle individual stream events
   */
  handleStreamEvent(event, callbacks) {
    const { onStreamStart, onStreamDelta, onStreamComplete, onStreamError } = callbacks;
    
    switch (event.type) {
      case 'start':
        console.log('🚀 Stream started:', event.timestamp);
        if (onStreamStart) onStreamStart(event);
        break;
        
      case 'delta':
        console.log('🔄 Processing delta event:', { 
          hasContent: !!event.content, 
          contentLength: event.content?.length || 0,
          contentPreview: event.content?.substring(0, 20) + '...' 
        });
        if (event.content && onStreamDelta) {
          // TEMPORARILY DISABLE TYPING QUEUE FOR DEBUGGING
          console.log('🔄 Calling onStreamDelta directly (bypassing queue)');
          onStreamDelta(event.content);
          // this.queueTyping(event.content, onStreamDelta);
        } else {
          console.warn('⚠️ Delta event missing content or callback:', { 
            hasContent: !!event.content, 
            hasCallback: !!onStreamDelta 
          });
        }
        break;
        
      case 'complete':
        console.log('✅ Stream completed:', event.timestamp);
        if (onStreamComplete) onStreamComplete(event.full_content);
        break;
        
      case 'error':
        console.error('❌ Stream error:', event.error);
        if (onStreamError) onStreamError(new Error(event.error));
        break;
        
      default:
        console.warn('Unknown stream event type:', event.type);
    }
  }

  /**
   * Stop the current stream
   */
  stopStream() {
    this.cleanup();
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    // Clear typing queue
    this.typingQueue = [];
    this.isTyping = false;
  }
}

// Export singleton instance
export const chatStreamManager = new ChatStreamManager();