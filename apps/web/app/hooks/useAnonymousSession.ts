'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY_ANONYMOUS_ID = 'anonymous_session_id';
const STORAGE_KEY_BROWSER_ID = 'browser_fingerprint';
const COOKIE_NAME = 'anon_sid';
const SESSION_DURATION_DAYS = 30; // Keep session for 30 days

interface AnonymousSession {
  sessionId: string;
  browserId: string;
  isNew: boolean;
}

/**
 * Generate a simple browser fingerprint based on available properties
 * This helps identify returning users even after clearing cookies
 */
function generateBrowserFingerprint(): string {
  if (typeof window === 'undefined') return '';
  
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.maxTouchPoints || 0,
  ];
  
  // Simple hash function
  const hash = components.join('|').split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  
  return 'bf_' + Math.abs(hash).toString(36);
}

/**
 * Get or set a cookie value
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}; ${expires}; path=/; SameSite=Lax`;
}

/**
 * Custom hook for managing anonymous sessions with persistence
 */
export function useAnonymousSession(): AnonymousSession {
  const [session, setSession] = useState<AnonymousSession>({
    sessionId: '',
    browserId: '',
    isNew: true
  });

  useEffect(() => {
    // Generate browser fingerprint
    const browserId = generateBrowserFingerprint();
    
    // Check for existing session in order of preference:
    // 1. Cookie (most reliable, survives localStorage clear)
    // 2. localStorage with browser fingerprint match
    // 3. Create new session
    
    let sessionId: string | null = null;
    let isNew = false;
    
    // Try to get session from cookie first
    const cookieSession = getCookie(COOKIE_NAME);
    if (cookieSession) {
      sessionId = cookieSession;
      console.log('📍 Recovered session from cookie:', sessionId);
    }
    
    // If no cookie, check localStorage
    if (!sessionId) {
      const storedSessionId = localStorage.getItem(STORAGE_KEY_ANONYMOUS_ID);
      const storedBrowserId = localStorage.getItem(STORAGE_KEY_BROWSER_ID);
      
      // If browser fingerprint matches, reuse the session
      if (storedSessionId && storedBrowserId === browserId) {
        sessionId = storedSessionId;
        console.log('📍 Recovered session from localStorage:', sessionId);
      }
    }
    
    // Check if there are existing threads for any previous session
    if (!sessionId) {
      // Look for any existing thread data
      const keys = Object.keys(localStorage);
      const threadKeys = keys.filter(k => k.startsWith('chat_threads_anon_'));
      
      if (threadKeys.length > 0) {
        // Extract session ID from the first thread key found
        const existingSessionId = threadKeys[0].replace('chat_threads_anon_', '');
        const threads = localStorage.getItem(threadKeys[0]);
        
        if (threads) {
          try {
            const parsedThreads = JSON.parse(threads);
            if (parsedThreads.length > 0) {
              sessionId = existingSessionId;
              console.log('📍 Recovered session from existing threads:', sessionId);
            }
          } catch (e) {
            console.error('Failed to parse existing threads:', e);
          }
        }
      }
    }
    
    // If still no session, create a new one
    if (!sessionId) {
      sessionId = `anon_${uuidv4()}`;
      isNew = true;
      console.log('🆕 Creating new anonymous session:', sessionId);
    }
    
    // Save session to all storage methods
    localStorage.setItem(STORAGE_KEY_ANONYMOUS_ID, sessionId);
    localStorage.setItem(STORAGE_KEY_BROWSER_ID, browserId);
    setCookie(COOKIE_NAME, sessionId, SESSION_DURATION_DAYS);
    
    setSession({
      sessionId,
      browserId,
      isNew
    });
    
    // Listen for storage events to sync between tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_ANONYMOUS_ID && e.newValue) {
        console.log('🔄 Session synced from another tab:', e.newValue);
        setSession(prev => ({
          ...prev,
          sessionId: e.newValue!,
          isNew: false
        }));
        // Update cookie as well
        setCookie(COOKIE_NAME, e.newValue, SESSION_DURATION_DAYS);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  return session;
}