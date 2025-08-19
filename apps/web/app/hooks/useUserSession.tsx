'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface UserSessionData {
  id: string;
  email: string;
  name: string | null;
  orgId: string;
  orgName: string;
  plan: {
    code: string;
    name: string;
    dailyTokenLimit: number;
    storageLimitMB: number;
    maxFileSizeMB: number;
  } | null;
}

interface UserSessionContextType {
  user: UserSessionData | null;
  loading: boolean;
  error: string | null;
  refreshSession: () => void;
}

const UserSessionContext = createContext<UserSessionContextType>({
  user: null,
  loading: true,
  error: null,
  refreshSession: () => {}
});

export function UserSessionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<UserSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserSession = async () => {
    if (status === 'authenticated' && session?.user?.email) {
      try {
        setLoading(true);
        const response = await fetch('/api/user/session');
        
        if (!response.ok) {
          throw new Error('Failed to fetch user session');
        }

        const data = await response.json();
        setUser(data.user);
        setError(null);
      } catch (err) {
        console.error('Error fetching user session:', err);
        setError('Failed to load user session');
      } finally {
        setLoading(false);
      }
    } else if (status === 'unauthenticated') {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSession();
  }, [session, status]);

  return (
    <UserSessionContext.Provider 
      value={{ 
        user, 
        loading, 
        error, 
        refreshSession: fetchUserSession 
      }}
    >
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession() {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error('useUserSession must be used within UserSessionProvider');
  }
  return context;
}