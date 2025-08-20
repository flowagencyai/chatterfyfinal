'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useAnonymousSession } from '../hooks/useAnonymousSession';
import { useTabSync } from '../hooks/useTabSync';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  reasoning?: string; // Para modelos de raciocínio (o1, etc)
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
  isLoading: boolean;
  
  // Thread actions
  createThread: (title?: string) => Thread;
  startNewConversation: () => void;
  selectThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  updateThreadTitle: (threadId: string, title: string) => void;
  
  // Message actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  clearThread: (threadId: string) => void;
  
  // Loading actions
  setIsLoading: (loading: boolean) => void;
  
  // Settings
  toggleTheme: () => void;
  resetAnonymousSession: () => void;
  
  // Security & Privacy
  clearUserDataOnLogout: () => void;
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
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // BUGFIX: Use refs to persist state during re-renders
  const threadsRef = useRef<Thread[]>([]);
  const currentThreadRef = useRef<Thread | null>(null);
  
  // Use the new anonymous session hook for better persistence
  const anonymousSession = useAnonymousSession();
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
  
  // Setup tab synchronization for anonymous sessions
  const handleThreadsUpdate = useCallback((newThreads: Thread[]) => {
    if (isAnonymous) {
      console.log('📡 [TabSync] Received threads update from another tab');
      setThreads(newThreads);
    }
  }, [isAnonymous]);
  
  const handleConversationCountUpdate = useCallback((count: number) => {
    if (isAnonymous) {
      console.log('📡 [TabSync] Received conversation count update from another tab');
      setConversationCount(count);
    }
  }, [isAnonymous]);
  
  const { broadcast } = useTabSync(
    undefined, // We don't need session updates as the hook handles it
    handleThreadsUpdate,
    handleConversationCountUpdate
  );

  // SECURITY FIX: Clear user data when authentication status changes
  const prevIsAnonymousRef = useRef<boolean | null>(null);
  useEffect(() => {
    // BUGFIX: Skip if session is still loading to avoid false logout detection
    if (status === 'loading') {
      return;
    }
    
    // Skip on first initialization
    if (prevIsAnonymousRef.current === null) {
      prevIsAnonymousRef.current = isAnonymous;
      return;
    }
    
    // BUGFIX: Only trigger on actual auth state changes, not hydration issues
    const wasAnonymous = prevIsAnonymousRef.current;
    const isNowAnonymous = isAnonymous;
    
    // Detect actual logout (authenticated -> anonymous) 
    // Only if we had a valid session before
    if (wasAnonymous === false && isNowAnonymous === true && session === null) {
      console.log('🔒 [SECURITY] Logout detectado - limpando dados do usuário');
      clearUserDataOnLogout();
    }
    
    // Detect login (anonymous -> authenticated)  
    if (wasAnonymous === true && isNowAnonymous === false && session?.user) {
      console.log('🔐 [SECURITY] Login detectado - carregando dados do usuário');
      // Force re-initialization to load user data
      setIsInitialized(false);
    }
    
    prevIsAnonymousRef.current = isAnonymous;
  }, [isAnonymous, status, session]);

  // BUGFIX: Wait for Next.js hydration to complete
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check if we're in draft mode (on homepage with no thread selected)
  useEffect(() => {
    setIsDraftMode(pathname === '/');
  }, [pathname]);

  // BUGFIX REMOVED: The problematic navigation useEffect was causing state resets
  // The initialization logic already handles URL restoration correctly
  // Navigation between threads is handled by Sidebar clicks and router.push() in createThread

  // Initialize on mount - BUGFIX: Wait for hydration AND session
  useEffect(() => {
    if (isInitialized || !anonymousSession.sessionId || !isHydrated) return; // Wait for session AND hydration
    console.log('🟢 [ChatContext] Inicializando contexto com sessão (pós-hidratação):', anonymousSession.sessionId);
    console.log('🔍 [DEBUG] URL atual:', typeof window !== 'undefined' ? window.location.href : 'SSR');
    console.log('🔍 [DEBUG] Pathname:', pathname);
    console.log('🔍 [DEBUG] Threads atuais:', threads.length);
    console.log('🔍 [DEBUG] Performance.navigation.type:', typeof window !== 'undefined' && window.performance ? window.performance.navigation?.type : 'N/A');
    
    // Check if we already have data loaded for this session to avoid reset
    const currentStorageKey = isAnonymous 
      ? `${STORAGE_KEY_THREADS}_${anonymousSession.sessionId}`
      : session?.user?.email 
        ? `${STORAGE_KEY_THREADS}_${session.user.email}`
        : null;
        
    if (currentStorageKey && threads.length > 0) {
      console.log('🟢 [ChatContext] Dados já carregados para esta sessão, mantendo estado atual');
      setIsInitialized(true);
      return;
    }
    
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

    // BUGFIX: Try to load threads from all possible sources (user + anonymous)
    const hasValidSession = session?.user?.email;
    console.log('🔍 [DEBUG] Session status:', status, 'hasValidSession:', !!hasValidSession, 'isAnonymous:', isAnonymous);
    console.log('🔍 [DEBUG] Session user:', session?.user?.email);
    
    // First, try to load from user session if we have one
    let threadsLoaded = false;
    if (hasValidSession) {
      console.log('🔍 [DEBUG] Tentando carregar threads de usuário logado:', session.user.email);
      const userThreads = localStorage.getItem(`${STORAGE_KEY_THREADS}_${session.user.email}`);
      if (userThreads) {
        const parsed = JSON.parse(userThreads);
        console.log('🔍 [DEBUG] Threads de usuário encontradas:', parsed.length);
        setThreads(parsed);
        threadsLoaded = true;
        
        // Extract threadId from current URL path (/c/[threadId])
        const pathMatch = pathname.match(/^\/c\/(.+)$/);
        const currentThreadId = pathMatch?.[1];
        
        if (currentThreadId) {
          const targetThread = parsed.find((t: Thread) => t.id === currentThreadId);
          setCurrentThread(targetThread || null);
          console.log('🔄 [ChatContext] Thread de usuário restaurada da URL:', currentThreadId, !!targetThread);
        } else {
          setCurrentThread(null);
        }
      }
    }
    
    // If no user threads found, try anonymous session
    if (!threadsLoaded) {
      const sessionId = anonymousSession.sessionId;
      
      // Load anonymous threads
      const savedThreads = localStorage.getItem(`${STORAGE_KEY_THREADS}_${sessionId}`);
      console.log('🔍 [DEBUG] SavedThreads key:', `${STORAGE_KEY_THREADS}_${sessionId}`);
      console.log('🔍 [DEBUG] SavedThreads raw:', savedThreads ? 'ENCONTRADO' : 'NÃO ENCONTRADO');
      if (savedThreads) {
        const parsed = JSON.parse(savedThreads);
        console.log('🔍 [DEBUG] Parsed threads:', parsed.length, 'threads');
        setThreads(parsed);
        
        // Count actual threads with messages (real conversations)
        const actualConversations = parsed.filter((t: Thread) => t.messages && t.messages.length > 0).length;
        console.log('🟢 [ChatContext] Conversações carregadas:', actualConversations);
        console.log('🟢 [ChatContext] Threads encontradas:', parsed.map(t => `${t.id.substring(0,8)}...${t.title}`));
        setConversationCount(actualConversations);
        
        // BUGFIX: Debug pathname durante inicialização
        console.log('🔍 [ChatContext] Pathname durante inicialização:', pathname);
        console.log('🔍 [ChatContext] Window location:', typeof window !== 'undefined' ? window.location.href : 'SSR');
        
        // Extract threadId from current URL path (/c/[threadId])
        const pathMatch = pathname.match(/^\/c\/(.+)$/);
        const currentThreadId = pathMatch?.[1];
        
        console.log('🔍 [ChatContext] PathMatch:', pathMatch, 'ThreadId:', currentThreadId);
        
        if (currentThreadId) {
          const targetThread = parsed.find((t: Thread) => t.id === currentThreadId);
          console.log('🔍 [ChatContext] TargetThread encontrada:', !!targetThread, targetThread?.title);
          setCurrentThread(targetThread || null);
          console.log('🔄 [ChatContext] CurrentThread restaurado da URL:', currentThreadId);
        } else {
          console.log('🏠 [ChatContext] Nenhum threadId na URL, entrando em modo draft');
          setCurrentThread(null); // No thread selected, will show draft mode
        }
      } else {
        // No existing threads, start in draft mode
        console.log('🔍 [DEBUG] Nenhum dado salvo encontrado - iniciando limpo');
        console.log('🔍 [DEBUG] LocalStorage keys:', typeof window !== 'undefined' ? Object.keys(localStorage) : 'N/A');
        setThreads([]);
        setCurrentThread(null);
        setConversationCount(0);
      }
    }
    
    // BUGFIX: Final fallback - try all possible thread keys in localStorage
    if (!threadsLoaded && threads.length === 0 && typeof window !== 'undefined') {
      console.log('🔍 [DEBUG] Tentando fallback - procurando threads em qualquer chave do localStorage');
      const allKeys = Object.keys(localStorage);
      console.log('🔍 [DEBUG] LocalStorage keys:', allKeys);
      
      // Look for any chat_threads_ key (both user and anonymous)
      const threadKeys = allKeys.filter(key => 
        key.startsWith('chat_threads_') && 
        key !== 'chat_threads_' && // Exclude empty key
        key.length > 'chat_threads_'.length // Must have content after prefix
      );
      console.log('🔍 [DEBUG] Thread keys encontradas:', threadKeys);
      
      if (threadKeys.length > 0) {
        // Priority: user threads first (@), then anonymous
        const userThreadKeys = threadKeys.filter(key => key.includes('@'));
        const anonThreadKeys = threadKeys.filter(key => !key.includes('@'));
        
        console.log('🔍 [DEBUG] User thread keys:', userThreadKeys);
        console.log('🔍 [DEBUG] Anon thread keys:', anonThreadKeys);
        
        // Try user threads first, then anonymous
        const keysToTry = [...userThreadKeys, ...anonThreadKeys];
        
        for (const threadKey of keysToTry) {
          const threadData = localStorage.getItem(threadKey);
          if (threadData) {
            const parsed = JSON.parse(threadData);
            console.log('🔍 [DEBUG] FALLBACK: Carregando threads de:', threadKey, 'Count:', parsed.length);
            setThreads(parsed);
            threadsLoaded = true;
            
            // Try to find current thread
            const pathMatch = pathname.match(/^\/c\/(.+)$/);
            const currentThreadId = pathMatch?.[1];
            
            if (currentThreadId) {
              const targetThread = parsed.find((t: Thread) => t.id === currentThreadId);
              setCurrentThread(targetThread || null);
              console.log('🔄 [ChatContext] FALLBACK Thread restaurada:', currentThreadId, !!targetThread);
              
              // If found the thread, break the loop
              if (targetThread) {
                break;
              }
            } else {
              // No specific thread requested, use first valid data
              break;
            }
          }
        }
      }
    }
    
    // Final cleanup if still no threads
    if (!threadsLoaded && threads.length === 0) {
      console.log('🔍 [DEBUG] Nenhum dado encontrado em nenhuma fonte - iniciando limpo');
      setThreads([]);
      setCurrentThread(null);
      if (isAnonymous) {
        setConversationCount(0);
      }
    }
    
    setIsInitialized(true);
    console.log('🟢 [ChatContext] Contexto inicializado com sucesso!');
  }, [isInitialized, anonymousSession.sessionId, session?.user?.email, pathname, isHydrated, isAnonymous]); // Include hydration dependency

  // BUGFIX: Ensure threads are visible in sidebar after initialization
  useEffect(() => {
    if (isInitialized && threads.length > 0) {
      console.log('🔍 [ChatContext] Verificando visibilidade das threads na sidebar...');
      console.log('🔍 [ChatContext] Threads carregadas:', threads.map(t => `${t.id.substring(0,8)}...${t.title}`));
      
      // Update refs to ensure consistency
      threadsRef.current = threads;
      if (currentThread) {
        currentThreadRef.current = currentThread;
      }
    }
  }, [isInitialized, threads, currentThread]);

  // Save threads when they change
  useEffect(() => {
    if (threads.length > 0) {
      const key = isAnonymous 
        ? `${STORAGE_KEY_THREADS}_${anonymousSession.sessionId}`
        : session?.user?.email 
          ? `${STORAGE_KEY_THREADS}_${session.user.email}`
          : null;
      
      if (key) {
        localStorage.setItem(key, JSON.stringify(threads));
        
        // Broadcast to other tabs if anonymous
        if (isAnonymous) {
          broadcast('threads_update', threads);
        }
      }
    }
  }, [threads, isAnonymous, anonymousSession.sessionId, session?.user?.email, broadcast]); // More specific dependency

  // Update conversation count based on threads with messages
  useEffect(() => {
    // Only update when we actually have threads AND the context is initialized
    if (isAnonymous && threads.length > 0 && isInitialized) {
      // Count only threads that have at least one message (real conversations)
      const actualConversations = threads.filter(t => t.messages && t.messages.length > 0).length;
      
      // Only update if different from current count and the count is meaningful
      if (actualConversations !== conversationCount && actualConversations > 0) {
        console.log('📊 [ChatContext] Atualizando contagem de', conversationCount, 'para', actualConversations);
        setConversationCount(actualConversations);
        localStorage.setItem(STORAGE_KEY_ANONYMOUS_COUNT, actualConversations.toString());
        
        // Broadcast to other tabs
        broadcast('conversation_count_update', actualConversations);
        console.log('📊 [ChatContext] Contagem atualizada:', actualConversations);
      }
    }
  }, [threads, isAnonymous, broadcast, conversationCount, isInitialized]); // Add isInitialized dependency

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
    
    // Conversation count will be updated automatically by the useEffect watching threads
    
    // BUGFIX: Defer navigation to avoid interfering with loading state during API calls
    setTimeout(() => {
      router.push(`/c/${newThread.id}`);
    }, 100);
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
    
    // BUGFIX: Always ensure state consistency with refs
    if (threads.length === 0 && threadsRef.current.length > 0) {
      console.log('🔄 [ChatContext] BUGFIX: Restaurando threads do ref para state');
      setThreads(threadsRef.current);
    }
    
    if (!currentThread && currentThreadRef.current) {
      console.log('🔄 [ChatContext] BUGFIX: Restaurando currentThread do ref para state');
      setCurrentThread(currentThreadRef.current);
    }
    
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
      
      // Conversation count will be updated automatically by the useEffect watching threads
      
      // BUGFIX: Defer navigation to avoid interfering with loading state
      // Navigate to the new thread URL after a small delay to let API call complete
      console.log('🟡 [ChatContext] Agendando navegação para:', `/c/${workingThread.id}`);
      setTimeout(() => {
        router.push(`/c/${workingThread.id}`);
      }, 100);
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
    localStorage.removeItem(`${STORAGE_KEY_THREADS}_${anonymousSession.sessionId}`);
    setConversationCount(0);
    setThreads([]);
    setCurrentThread(null);
    
    // Create new session
    const newSessionId = `anon_${uuidv4()}`;
    localStorage.setItem(STORAGE_KEY_ANONYMOUS_ID, newSessionId);
    
    // Also clear the cookie to force a new session
    document.cookie = 'anon_sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Reload the page to get a new session
    window.location.reload();
  }

  // SECURITY FIX: Clear all user data on logout
  function clearUserDataOnLogout() {
    console.log('🧹 [SECURITY] Limpando todos os dados do usuário...');
    
    // Clear all state
    setThreads([]);
    setCurrentThread(null);
    setConversationCount(0);
    
    // Clear refs
    threadsRef.current = [];
    currentThreadRef.current = null;
    
    // Don't clear localStorage keys that belong to anonymous sessions
    // Those will be handled by the regular anonymous session flow
    
    // Navigate to home ONLY if not on auth or pricing pages to avoid breaking flows
    const currentPath = pathname;
    const isOnAuthPage = currentPath.startsWith('/auth') || currentPath.startsWith('/api/auth');
    const isOnPricingPage = currentPath.startsWith('/pricing');
    
    if (!isOnAuthPage && !isOnPricingPage) {
      console.log('🔄 [SECURITY] Redirecionando para home...');
      router.push('/');
    } else if (isOnPricingPage) {
      console.log('ℹ️ [SECURITY] Mantendo usuário na página de pricing');
    } else {
      console.log('ℹ️ [SECURITY] Mantendo usuário na página de auth');
    }
    
    console.log('✅ [SECURITY] Dados do usuário limpos com sucesso');
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
      isLoading,
      createThread,
      startNewConversation,
      selectThread,
      deleteThread,
      updateThreadTitle,
      addMessage,
      clearThread,
      setIsLoading,
      toggleTheme,
      resetAnonymousSession,
      clearUserDataOnLogout
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