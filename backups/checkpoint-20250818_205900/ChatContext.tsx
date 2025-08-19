'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    id: string;
    filename: string;
    type: string;
  }>;
}

export interface Thread {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isTemporary?: boolean;
}

interface ChatContextType {
  threads: Thread[];
  currentThread: Thread | null;
  conversationCount: number;
  isAnonymous: boolean;
  anonymousConversationLimit: number;
  theme: 'light' | 'dark';
  isDraftMode: boolean;
  
  // Thread actions
  createThread: (title?: string) => Thread;
  startNewConversation: () => void;
  selectThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  updateThreadTitle: (threadId: string, title: string) => void;
  
  // Message actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearThread: (threadId: string) => void;
  
  // Settings
  toggleTheme: () => void;
  resetAnonymousSession: () => void;
}

const ANONYMOUS_CONVERSATION_LIMIT = 50;
const STORAGE_KEY_THREADS = 'chat_threads';
const STORAGE_KEY_ANONYMOUS_COUNT = 'anonymous_conversation_count';
const STORAGE_KEY_ANONYMOUS_ID = 'anonymous_session_id';
const STORAGE_KEY_THEME = 'chat_theme';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [conversationCount, setConversationCount] = useState(0);
  const [isDraftMode, setIsDraftMode] = useState(false);
  
  // BUGFIX: Use refs to persist state during re-renders
  const threadsRef = useRef<Thread[]>([]);
  const currentThreadRef = useRef<Thread | null>(null);
  
  const [anonymousSessionId, setAnonymousSessionId] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Sync refs with state
  useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);
  
  useEffect(() => {
    currentThreadRef.current = currentThread;
  }, [currentThread]);
  
  const isAnonymous = status === 'unauthenticated';

  // Check if we're in draft mode (on homepage with no thread selected)
  useEffect(() => {
    setIsDraftMode(pathname === '/');
  }, [pathname]);

  // Initialize on mount
  useEffect(() => {
    if (isInitialized) return; // Prevent re-initialization
    // Don't wait for session status - can cause resets
    console.log('🟢 [ChatContext] Inicializando contexto...');
    
    
    // Load theme
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const defaultTheme = prefersDark ? 'dark' : 'light';
      setTheme(defaultTheme);
      document.documentElement.setAttribute('data-theme', defaultTheme);
    }

    // Load or create anonymous session - don't rely on volatile session status
    const hasValidSession = session?.user?.email;
    if (!hasValidSession) {
      let sessionId = localStorage.getItem(STORAGE_KEY_ANONYMOUS_ID);
      if (!sessionId) {
        sessionId = `anon_${uuidv4()}`;
        localStorage.setItem(STORAGE_KEY_ANONYMOUS_ID, sessionId);
      }
      setAnonymousSessionId(sessionId);
      
      // Load anonymous conversation count
      const count = parseInt(localStorage.getItem(STORAGE_KEY_ANONYMOUS_COUNT) || '0');
      setConversationCount(count);
      
      // Load anonymous threads
      const savedThreads = localStorage.getItem(`${STORAGE_KEY_THREADS}_${sessionId}`);
      if (savedThreads) {
        const parsed = JSON.parse(savedThreads);
        setThreads(parsed);
        
        // Extract threadId from current URL path (/c/[threadId])
        const pathMatch = pathname.match(/^\/c\/(.+)$/);
        const currentThreadId = pathMatch?.[1];
        
        if (currentThreadId) {
          const targetThread = parsed.find((t: Thread) => t.id === currentThreadId);
          setCurrentThread(targetThread || null);
        } else {
          setCurrentThread(null); // No thread selected, will show draft mode
        }
      } else {
        // No existing threads, start in draft mode
        setThreads([]);
        setCurrentThread(null);
      }
    } else if (hasValidSession) {
      // Load user threads from localStorage (would be from API in production)
      const savedThreads = localStorage.getItem(`${STORAGE_KEY_THREADS}_${session.user.email}`);
      if (savedThreads) {
        const parsed = JSON.parse(savedThreads);
        setThreads(parsed);
        
        // Extract threadId from current URL path (/c/[threadId])
        const pathMatch = pathname.match(/^\/c\/(.+)$/);
        const currentThreadId = pathMatch?.[1];
        
        if (currentThreadId) {
          const targetThread = parsed.find((t: Thread) => t.id === currentThreadId);
          setCurrentThread(targetThread || null);
        } else {
          setCurrentThread(null); // No thread selected, will show draft mode
        }
      } else {
        // No existing threads, start in draft mode
        setThreads([]);
        setCurrentThread(null);
      }
    }
    
    setIsInitialized(true);
    console.log('🟢 [ChatContext] Contexto inicializado com sucesso!');
  }, [isInitialized]); // BUGFIX: Removido status e outras deps que causam re-init

  // Save threads when they change
  useEffect(() => {
    if (threads.length > 0) {
      const key = isAnonymous 
        ? `${STORAGE_KEY_THREADS}_${anonymousSessionId}`
        : session?.user?.email 
          ? `${STORAGE_KEY_THREADS}_${session.user.email}`
          : null;
      
      if (key) {
        localStorage.setItem(key, JSON.stringify(threads));
      }
    }
  }, [threads, isAnonymous, anonymousSessionId, session?.user?.email]); // More specific dependency

  // Save conversation count for anonymous users
  useEffect(() => {
    if (isAnonymous) {
      localStorage.setItem(STORAGE_KEY_ANONYMOUS_COUNT, conversationCount.toString());
    }
  }, [conversationCount, isAnonymous]);

  function createNewThread(title?: string, existingThreads?: Thread[]): Thread {
    // Use existing threads or current state
    const threadsToCheck = existingThreads || threads;
    
    // Se não foi fornecido um título, criar um numerado baseado nas threads existentes
    let threadTitle = title;
    if (!title) {
      // Coletar todos os números já usados em "Nova conversa X"
      const usedNumbers = new Set<number>();
      
      threadsToCheck.forEach(t => {
        const match = t.title.match(/^Nova conversa(?:\s+(\d+))?$/);
        if (match) {
          // Se é "Nova conversa" sem número, considerar como número 1
          const num = match[1] ? parseInt(match[1]) : 1;
          usedNumbers.add(num);
        }
      });
      
      // Encontrar o menor número disponível
      let nextNumber = 1;
      while (usedNumbers.has(nextNumber)) {
        nextNumber++;
      }
      
      // Se for 1, usar apenas "Nova conversa", senão adicionar número
      threadTitle = nextNumber === 1 ? 'Nova conversa' : `Nova conversa ${nextNumber}`;
    }
    
    return {
      id: uuidv4(),
      title: threadTitle,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isTemporary: isAnonymous
    };
  }

  function startNewConversation() {
    // Just navigate to homepage, don't create thread yet
    setCurrentThread(null);
    router.push('/');
  }

  function createThread(title?: string): Thread {
    // Check if anonymous user has reached conversation limit BEFORE creating
    if (isAnonymous && conversationCount >= ANONYMOUS_CONVERSATION_LIMIT) {
      // Redirect to pricing page for upgrade
      if (confirm(`Você atingiu o limite de ${ANONYMOUS_CONVERSATION_LIMIT} conversas gratuitas. Deseja ver os planos disponíveis?`)) {
        window.location.href = '/pricing';
      }
      // Return a dummy thread to avoid errors, but don't actually create it
      return threads[0] || createNewThread(title);
    }
    
    // Get current threads to ensure proper numbering
    const currentThreads = threads;
    const newThread = createNewThread(title, currentThreads);
    setThreads(prev => [newThread, ...prev]);
    setCurrentThread(newThread);
    
    // Increment conversation count for anonymous users
    if (isAnonymous) {
      setConversationCount(prev => prev + 1);
    }
    
    // Navigate to the new thread URL
    router.push(`/c/${newThread.id}`);
    return newThread;
  }

  function selectThread(threadId: string) {
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      setCurrentThread(thread);
      // Navigate to the thread URL if not already there
      if (pathname !== `/c/${threadId}`) {
        router.push(`/c/${threadId}`);
      }
    }
  }

  function deleteThread(threadId: string) {
    setThreads(prev => prev.filter(t => t.id !== threadId));
    if (currentThread?.id === threadId) {
      const remaining = threads.filter(t => t.id !== threadId);
      setCurrentThread(remaining[0] || null);
    }
  }

  function updateThreadTitle(threadId: string, title: string) {
    setThreads(prev => prev.map(t => 
      t.id === threadId 
        ? { ...t, title, updatedAt: new Date() }
        : t
    ));
  }

  function addMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    console.log('🟡 [ChatContext] addMessage chamado:', message);
    console.log('🟡 [ChatContext] currentThread:', currentThread);
    console.log('🟡 [ChatContext] threads count:', threads.length);
    console.log('🟡 [ChatContext] threadsRef count:', threadsRef.current.length);
    console.log('🟡 [ChatContext] currentThreadRef:', currentThreadRef.current);
    
    // BUGFIX: Use refs as fallback when state is lost
    const actualThreads = threads.length > 0 ? threads : threadsRef.current;
    const actualCurrentThread = currentThread || currentThreadRef.current;
    
    console.log('🟡 [ChatContext] USANDO - actualThreads:', actualThreads.length, 'actualCurrentThread:', !!actualCurrentThread);
    
    // If no current thread (draft mode), create one automatically
    let workingThread = actualCurrentThread;
    
    // BUGFIX: Para resposta do assistente, tenta encontrar thread mais recente primeiro
    if (!workingThread && message.role === 'assistant' && actualThreads.length > 0) {
      console.log('🟡 [ChatContext] BUGFIX: Usando thread mais recente para resposta do assistente');
      workingThread = actualThreads[0]; // Thread mais recente
      setCurrentThread(workingThread);
      currentThreadRef.current = workingThread;
    }
    if (!workingThread) {
      console.log('🟡 [ChatContext] Criando nova thread - isAnonymous:', isAnonymous, 'conversationCount:', conversationCount);
      
      // Check limit for anonymous users before creating
      if (isAnonymous && conversationCount >= ANONYMOUS_CONVERSATION_LIMIT) {
        console.log('🟡 [ChatContext] Limite atingido, redirecionando...');
        if (confirm(`Você atingiu o limite de ${ANONYMOUS_CONVERSATION_LIMIT} conversas gratuitas. Deseja ver os planos disponíveis?`)) {
          window.location.href = '/pricing';
        }
        return;
      }
      
      // Create new thread with message content as title (truncated)
      const title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
      console.log('🟡 [ChatContext] Criando thread com título:', title);
      
      workingThread = createNewThread(title);
      console.log('🟡 [ChatContext] Thread criada:', workingThread);
      
      const newThreads = [workingThread!, ...actualThreads];
      setThreads(newThreads);
      setCurrentThread(workingThread);
      
      // Update refs immediately
      threadsRef.current = newThreads;
      currentThreadRef.current = workingThread;
      
      console.log('🟡 [ChatContext] Thread setada como current');
      
      // Increment conversation count for anonymous users
      if (isAnonymous) {
        setConversationCount(prev => prev + 1);
        console.log('🟡 [ChatContext] Contador incrementado');
      }
      
      // Navigate to the new thread URL
      console.log('🟡 [ChatContext] Navegando para:', `/c/${workingThread.id}`);
      router.push(`/c/${workingThread.id}`);
    }
    
    const newMessage: Message = {
      ...message,
      id: uuidv4(),
      timestamp: new Date()
    };

    // Use setThreads with callback to ensure we get the latest state
    setThreads(prev => {
      const workingThreads = prev.length > 0 ? prev : threadsRef.current;
      const currentThreadFromState = workingThreads.find(t => t.id === workingThread!.id);
      
      if (!currentThreadFromState) {
        // Thread was just created, add message to it and include in threads
        const updatedThread = {
          ...workingThread!,
          messages: [newMessage],
          updatedAt: new Date()
        };
        
        // Update currentThread to the latest version
        setCurrentThread(updatedThread);
        
        // Return new threads array with updated thread
        const result = workingThreads.map(t => t.id === workingThread!.id ? updatedThread : t);
        threadsRef.current = result; // Update ref
        return result;
      }
      
      // Update existing thread with new message
      const updatedMessages = [...currentThreadFromState.messages, newMessage];
      let updatedThread = {
        ...currentThreadFromState,
        messages: updatedMessages,
        updatedAt: new Date()
      };
      
      // If first user message and thread has default title, update title
      if (message.role === 'user' && 
          currentThreadFromState.messages.length === 0 && 
          currentThreadFromState.title.startsWith('Nova conversa')) {
        updatedThread.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
      }

      const newThreads = workingThreads.map(t => 
        t.id === workingThread!.id ? updatedThread : t
      );
      
      // Update currentThread to the latest version
      setCurrentThread(updatedThread);
      currentThreadRef.current = updatedThread; // Update ref
      
      // Update ref
      threadsRef.current = newThreads;
      
      return newThreads;
    });

  }

  function clearThread(threadId: string) {
    setThreads(prev => prev.map(t => 
      t.id === threadId 
        ? { ...t, messages: [], updatedAt: new Date() }
        : t
    ));
    
    if (currentThread?.id === threadId) {
      setCurrentThread(prev => prev ? { ...prev, messages: [] } : null);
    }
  }

  function toggleTheme() {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(STORAGE_KEY_THEME, newTheme);
  }

  function resetAnonymousSession() {
    localStorage.removeItem(STORAGE_KEY_ANONYMOUS_COUNT);
    localStorage.removeItem(STORAGE_KEY_ANONYMOUS_ID);
    localStorage.removeItem(`${STORAGE_KEY_THREADS}_${anonymousSessionId}`);
    setConversationCount(0);
    setThreads([]);
    setCurrentThread(null);
    
    // Create new session
    const newSessionId = `anon_${uuidv4()}`;
    localStorage.setItem(STORAGE_KEY_ANONYMOUS_ID, newSessionId);
    setAnonymousSessionId(newSessionId);
    
    // Create initial thread
    const initialThread = createNewThread('Nova conversa');
    setThreads([initialThread]);
    setCurrentThread(initialThread);
  }

  return (
    <ChatContext.Provider value={{
      threads,
      currentThread,
      conversationCount,
      isAnonymous,
      anonymousConversationLimit: ANONYMOUS_CONVERSATION_LIMIT,
      theme,
      isDraftMode,
      createThread,
      startNewConversation,
      selectThread,
      deleteThread,
      updateThreadTitle,
      addMessage,
      clearThread,
      toggleTheme,
      resetAnonymousSession
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}