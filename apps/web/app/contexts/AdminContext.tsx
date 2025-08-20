'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface AdminContextType {
  isAdmin: boolean;
  loading: boolean;
  checkAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async () => {
    if (status !== 'authenticated' || !session?.user?.email) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fazer uma requisição simples para verificar se o usuário é admin
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const userData = await response.json();
        setIsAdmin(userData.role === 'ADMIN');
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, [session, status]);

  return (
    <AdminContext.Provider value={{ isAdmin, loading, checkAdminStatus }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}