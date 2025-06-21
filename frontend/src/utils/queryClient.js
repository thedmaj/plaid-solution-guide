import { QueryClient } from '@tanstack/react-query';

// Create a global query client with optimized settings
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache settings for different data types
      staleTime: 2 * 60 * 1000, // 2 minutes default (conservative)
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection (was cacheTime)
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Do refetch when network reconnects
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors, only network/5xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2; // Max 2 retries
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
      retryDelay: 1000, // 1 second delay for mutation retries
    },
  },
});

// Query key factories for consistent cache keys
export const queryKeys = {
  // Session-related queries
  sessions: () => ['sessions'],
  sessionMessages: (sessionId) => ['messages', sessionId],
  
  // Artifact-related queries  
  artifacts: () => ['artifacts'],
  artifact: (artifactId) => ['artifact', artifactId],
  
  // Template-related queries
  templates: () => ['templates'],
  template: (templateId) => ['template', templateId],
  
  // User-related queries
  user: () => ['user'],
  userProfile: () => ['user', 'profile'],
};

// Query options presets for different data types
export const queryOptions = {
  // Fast-changing data (short cache)
  realTime: {
    staleTime: 0, // Always consider stale
    gcTime: 1 * 60 * 1000, // 1 minute cache
  },
  
  // Frequently accessed but stable data
  frequent: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes cache
  },
  
  // Stable data that changes infrequently
  stable: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes cache
  },
  
  // Very stable data (user preferences, templates)
  persistent: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache
  },
};