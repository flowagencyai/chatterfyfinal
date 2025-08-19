'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ChatProvider } from './contexts/ChatContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ChatProvider>
        {children}
      </ChatProvider>
    </SessionProvider>
  );
}