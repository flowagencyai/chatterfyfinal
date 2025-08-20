'use client';

import { useEffect } from 'react';

const TAB_SYNC_KEY = 'tab_sync_event';

interface TabSyncEvent {
  type: 'session_update' | 'threads_update' | 'conversation_count_update';
  timestamp: number;
  data: any;
}

/**
 * Custom hook for syncing data between tabs
 * Broadcasts changes and listens for updates from other tabs
 */
export function useTabSync(
  onSessionUpdate?: (sessionId: string) => void,
  onThreadsUpdate?: (threads: any[]) => void,
  onConversationCountUpdate?: (count: number) => void
) {
  useEffect(() => {
    // Listen for updates from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TAB_SYNC_KEY && e.newValue) {
        try {
          const event: TabSyncEvent = JSON.parse(e.newValue);
          
          // Ignore old events (more than 1 second old)
          if (Date.now() - event.timestamp > 1000) return;
          
          switch (event.type) {
            case 'session_update':
              onSessionUpdate?.(event.data);
              break;
            case 'threads_update':
              onThreadsUpdate?.(event.data);
              break;
            case 'conversation_count_update':
              onConversationCountUpdate?.(event.data);
              break;
          }
        } catch (error) {
          console.error('Failed to parse tab sync event:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [onSessionUpdate, onThreadsUpdate, onConversationCountUpdate]);
  
  // Broadcast an update to other tabs
  const broadcast = (type: TabSyncEvent['type'], data: any) => {
    const event: TabSyncEvent = {
      type,
      timestamp: Date.now(),
      data
    };
    
    // Set and immediately remove to trigger storage event
    localStorage.setItem(TAB_SYNC_KEY, JSON.stringify(event));
    setTimeout(() => {
      localStorage.removeItem(TAB_SYNC_KEY);
    }, 100);
  };
  
  return { broadcast };
}