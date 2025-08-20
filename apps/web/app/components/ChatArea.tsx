'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useChatContext } from '../contexts/ChatContext';
import styles from './ChatArea.module.css';
import MessageList from './MessageList';
import UpgradeModal from './UpgradeModal';
import ChatHeader from './ChatHeader';
import FileDropZone from './FileDropZone';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';

export default function ChatArea() {
  const { data: session, status } = useSession();
  const {
    currentThread,
    addMessage,
    clearThread,
    updateThread,
    isAnonymous,
    conversationCount,
    anonymousConversationLimit,
    threads,
    isDraftMode,
    isLoading,
    setIsLoading
  } = useChatContext();
  


  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false); // Prevent duplicate processing
  const processingRef = useRef(false); // Persistent across re-renders
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState({
    provider: 'deepseek',
    model: 'deepseek-chat', 
    name: 'DeepSeek Chat'
  });
  

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() && attachments.length === 0) return;
    if (isLoading || isProcessing || processingRef.current) {
      return;
    }
    
    // Wait for session to load to avoid authentication conflicts
    if (status === 'loading') return;
    
    // In draft mode (no currentThread), addMessage will create a new thread automatically
    // For existing threads, proceed normally

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);
    processingRef.current = true;
    setIsLoading(true);

    try {
      // Add user message to thread first
      const userMessageObj = {
        role: 'user' as const,
        content: userMessage,
        attachments: attachments.map(f => ({
          id: URL.createObjectURL(f),
          filename: f.name,
          type: f.type
        }))
      };
      
      addMessage(userMessageObj);

      // Prepare messages for API - include the new user message
      // Note: Don't rely on currentThread.messages as it hasn't been updated yet
      const apiMessages = [...(currentThread?.messages || []).map(m => ({
        role: m.role,
        content: m.content
      })), { role: 'user', content: userMessage }];
      

      // Get org/user info
      let headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      let endpoint = `${API_BASE}/v1/chat/completions`;
      
      // Determine authentication state more robustly
      const isAuthenticated = status === 'authenticated' && session?.user;
      const shouldUseAnonymous = status === 'unauthenticated' || isAnonymous;
      
      if (shouldUseAnonymous) {
        // Use anonymous endpoint (no auth required)
        endpoint = `${API_BASE}/v1/anonymous/chat/completions`;
      } else if (isAuthenticated) {
        // Use authenticated user info
        try {
          const userInfo = await fetch('/api/user/session').then(r => r.json());
          if (userInfo.user) {
            headers['X-Org-Id'] = userInfo.user.orgId;
            headers['X-User-Id'] = userInfo.user.id;
          } else {
            console.warn('No user info returned from session endpoint');
            // Fallback to anonymous endpoint
            endpoint = `${API_BASE}/v1/anonymous/chat/completions`;
          }
        } catch (error) {
          console.error('Failed to get user session:', error);
          // Fallback to anonymous endpoint
          endpoint = `${API_BASE}/v1/anonymous/chat/completions`;
        }
      }

      const requestBody = {
        model: selectedModel.model,
        messages: apiMessages,
        stream: false, // Will implement streaming later
        provider: selectedModel.provider
      };
      
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No reader available');
        
        const decoder = new TextDecoder();
        let assistantMessage = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const eventLines = line.split('\n');
            let event: string | null = null;
            let data: string | null = null;

            for (const eventLine of eventLines) {
              if (eventLine.startsWith('event:')) {
                event = eventLine.slice(6).trim();
              } else if (eventLine.startsWith('data:')) {
                data = eventLine.slice(5).trim();
              }
            }

            if (event === 'token' && data) {
              try {
                const parsed = JSON.parse(data);
                assistantMessage += parsed.content;
                
                // For streaming, just accumulate the message content
                // We'll add the complete message at the end
              } catch (err) {
                console.error('Error parsing stream data:', err);
              }
            }

            if (event === 'done') {
              // Finalize the message
              if (assistantMessage) {
                addMessage({
                  role: 'assistant',
                  content: assistantMessage
                });
              }
            }

            if (event === 'error' && data) {
              try {
                const error = JSON.parse(data);
                throw new Error(error.message || 'Stream error');
              } catch {
                throw new Error('Stream error');
              }
            }
          }
        }
      } else {
        // Non-streaming response
        const data = await response.json();
        
        const assistantMessage = data.choices?.[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.';
        
        addMessage({
          role: 'assistant',
          content: assistantMessage
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage({
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
      });
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
      processingRef.current = false;
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // For textarea, we need to manually trigger form submission
      // since Enter normally creates new line in textarea
      const form = e.currentTarget.form;
      if (form) {
        // Use requestSubmit() to trigger the form's onSubmit event properly
        form.requestSubmit();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFilesDropped = (files: File[]) => {
    setAttachments(prev => [...prev, ...files]);
  };


  const handleRegenerateResponse = async (messageIndex: number) => {
    if (!currentThread || isLoading || isProcessing) return;
    
    // Find the user message that triggered this assistant response
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0 || !currentThread.messages[userMessageIndex]) return;
    
    const userMessage = currentThread.messages[userMessageIndex];
    if (userMessage.role !== 'user') return;

    // Remove the assistant message we want to regenerate
    const updatedMessages = currentThread.messages.slice(0, messageIndex);
    
    // Update the thread to remove the assistant response
    const updatedThread = {
      ...currentThread,
      messages: updatedMessages
    };

    // Remove the assistant message by clearing and re-adding messages up to that point
    clearThread(currentThread.id);
    
    // Re-add all messages up to the user message
    updatedMessages.forEach(msg => {
      addMessage({
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments
      });
    });

    // Trigger a new API call with the user's message
    setIsProcessing(true);
    setIsLoading(true);

    try {
      // Prepare messages for API call (up to the user message we want to regenerate from)
      const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Get authentication info and endpoint
      let headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      let endpoint = `${API_BASE}/v1/chat/completions`;
      
      const isAuthenticated = status === 'authenticated' && session?.user;
      const shouldUseAnonymous = status === 'unauthenticated' || isAnonymous;
      
      if (shouldUseAnonymous) {
        endpoint = `${API_BASE}/v1/anonymous/chat/completions`;
      } else if (isAuthenticated) {
        try {
          const userInfo = await fetch('/api/user/session').then(r => r.json());
          if (userInfo.user) {
            headers['X-Org-Id'] = userInfo.user.orgId;
            headers['X-User-Id'] = userInfo.user.id;
          } else {
            endpoint = `${API_BASE}/v1/anonymous/chat/completions`;
          }
        } catch (error) {
          console.error('Failed to get user session:', error);
          endpoint = `${API_BASE}/v1/anonymous/chat/completions`;
        }
      }

      const requestBody = {
        model: selectedModel.model,
        messages: apiMessages,
        stream: false,
        provider: selectedModel.provider
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || 'Desculpe, não consegui gerar uma nova resposta.';
      
      addMessage({
        role: 'assistant',
        content: assistantMessage
      });
      
    } catch (error) {
      console.error('Error regenerating response:', error);
      addMessage({
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao gerar uma nova resposta. Por favor, tente novamente.'
      });
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  const handleClearChat = () => {
    if (currentThread && window.confirm('Tem certeza que deseja limpar esta conversa?')) {
      clearThread(currentThread.id);
    }
  };

  const handleResetStorage = () => {
    if (window.confirm('Limpar TODOS os dados salvos? Isso irá remover todas as conversas.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // Show welcome screen when no thread but still allow input
  const showWelcomeScreen = !currentThread;

  return (
    <>
      <FileDropZone onFilesAdded={handleFilesDropped}>
        <div className={styles.chatArea}>
          {/* Header */}
          <ChatHeader 
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            threadTitle={(() => {
              // Don't show title if it's the same as the first user message
              const firstMessage = currentThread?.messages?.[0];
              const title = currentThread?.title;
              if (firstMessage?.role === 'user' && title === firstMessage.content) {
                return undefined;
              }
              return title;
            })()}
            onClearChat={handleClearChat}
          />
          

          {/* Messages */}
          {showWelcomeScreen ? (
            <div className={styles.welcomeScreen}>
              <div className={styles.welcomeContent}>
                <h2>Como posso ajudar você hoje?</h2>
                <p>Faça uma pergunta ou inicie uma conversa</p>
                
                <div className={styles.suggestions}>
                  <button className={styles.suggestionButton} onClick={() => setInput('💡 Explique um conceito')}>
                    💡 Explique um conceito
                  </button>
                  <button className={styles.suggestionButton} onClick={() => setInput('✍️ Ajude com escrita')}>
                    ✍️ Ajude com escrita
                  </button>
                  <button className={styles.suggestionButton} onClick={() => setInput('🔍 Faça uma pesquisa')}>
                    🔍 Faça uma pesquisa
                  </button>
                  <button className={styles.suggestionButton} onClick={() => setInput('🧠 Brainstorm ideias')}>
                    🧠 Brainstorm ideias
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <MessageList 
              key={currentThread.id}
              messages={currentThread.messages || []} 
              isLoading={isLoading}
              onRegenerateResponse={handleRegenerateResponse}
            />
          )}

        {/* Input Area */}
        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            {/* Attachments */}
            {attachments.length > 0 && (
              <div className={styles.attachments}>
                {attachments.map((file, index) => (
                  <div key={index} className={styles.attachment}>
                    <span>{file.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className={styles.removeAttachment}
                      aria-label="Remove attachment"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form 
              onSubmit={handleSubmit} 
              className={styles.inputForm}
            >
              <button
                type="button"
                className={styles.attachButton}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>


              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Envie uma mensagem..."
                className={styles.textarea}
                disabled={isLoading}
                rows={1}
              />

              <button
                type="submit"
                className={styles.sendButton}
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                aria-label="Send message"
              >
                {isLoading ? (
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </form>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
          </div>

          {/* Footer Info */}
          <div className={styles.inputFooter}>
            <p>
              O modelo pode cometer erros. Verifique informações importantes.
            </p>
          </div>
        </div>
        </div>
      </FileDropZone>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </>
  );
}