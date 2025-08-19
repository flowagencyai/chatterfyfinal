'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ChatProvider } from './contexts/ChatContext';
import { ToastProvider } from './contexts/ToastContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ChatProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </ChatProvider>
    </SessionProvider>
  );
}