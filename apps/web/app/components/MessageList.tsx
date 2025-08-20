'use client';

import { useEffect, useRef, useState } from 'react';
import { Message } from '../contexts/ChatContext';
import styles from './MessageList.module.css';
import ProviderIcon from './ProviderIcon';
import ReasoningProgress from './ReasoningProgress';
import MessageRenderer from './MessageRenderer';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onRegenerateResponse?: (messageIndex: number) => void;
  currentProvider?: string;
  currentModel?: { provider: string; model: string; name: string };
}

export default function MessageList({ messages, isLoading, onRegenerateResponse, currentProvider = 'deepseek', currentModel }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleRegenerateMessage = (index: number) => {
    if (onRegenerateResponse) {
      onRegenerateResponse(index);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    
    return (
      <div
        key={message.id}
        className={`${styles.messageWrapper} ${
          isUser ? styles.userMessage : styles.assistantMessage
        } ${isSystem ? styles.systemMessage : ''}`}
      >
        <div className={styles.messageContent}>
          {/* Avatar */}
          <div className={styles.avatar}>
            {isUser ? (
              <div className={styles.userAvatar}>
                U
              </div>
            ) : (
              <div className={styles.assistantAvatar}>
                <ProviderIcon provider={currentProvider} size={20} />
              </div>
            )}
          </div>

          {/* Message Body */}
          <div className={styles.messageBody}>
            <div className={styles.messageHeader}>
              <span className={styles.authorName}>
                {isUser ? 'Você' : 'Assistente'}
              </span>
              <span className={styles.timestamp}>
                {formatTime(message.timestamp)}
              </span>
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className={styles.attachments}>
                {message.attachments.map((attachment, idx) => (
                  <div key={idx} className={styles.attachment}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>{attachment.filename}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Reasoning (apenas para modelos de raciocínio) */}
            {message.reasoning && !isUser && (
              <div className={styles.reasoningSection}>
                <details className={styles.reasoningDetails}>
                  <summary className={styles.reasoningSummary}>
                    <span>🧠 Processo de raciocínio</span>
                  </summary>
                  <div className={styles.reasoningContent}>
                    {message.reasoning.split('\n').map((line, i) => (
                      <p key={i}>{line || '\u00A0'}</p>
                    ))}
                  </div>
                </details>
              </div>
            )}

            {/* Message Text - Renderização moderna com markdown */}
            <div className={styles.messageText}>
              {isUser ? (
                // Usuário: texto simples formatado
                message.content.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00A0'}</p>
                ))
              ) : (
                // Assistente: renderização completa com markdown e syntax highlighting
                <MessageRenderer content={message.content} />
              )}
            </div>

            {/* Action Buttons for Assistant Messages */}
            {!isUser && !isSystem && (
              <div className={styles.messageActions}>
                <button
                  className={styles.actionButton}
                  onClick={() => handleCopyMessage(message.content, message.id)}
                  title="Copiar resposta"
                  aria-label="Copiar resposta"
                >
                  {copiedMessageId === message.id ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="9"
                        y="9"
                        width="13"
                        height="13"
                        rx="2"
                        ry="2"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path
                        d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </svg>
                  )}
                </button>

                <button
                  className={styles.actionButton}
                  onClick={() => handleRegenerateMessage(index)}
                  title="Gerar nova resposta"
                  aria-label="Gerar nova resposta"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M1 4v6h6M23 20v-6h-6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.messageList}>
      <div className={styles.messagesContainer}>
        {/* Welcome Message */}
        {messages.length === 0 && (
          <div className={styles.welcomeMessage}>
            <div className={styles.welcomeIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8 9h8M8 13h6m-7 8l-3-3h10a3 3 0 003-3V7a3 3 0 00-3-3H8a3 3 0 00-3 3v10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>Como posso ajudar você hoje?</h2>
            <p>Faça uma pergunta ou inicie uma conversa</p>
            
            <div className={styles.suggestions}>
              <div className={styles.suggestion}>
                💡 Explique um conceito
              </div>
              <div className={styles.suggestion}>
                ✏️ Ajude com escrita
              </div>
              <div className={styles.suggestion}>
                🔍 Faça uma pesquisa
              </div>
              <div className={styles.suggestion}>
                💭 Brainstorm ideias
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => renderMessage(message, index))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className={`${styles.messageWrapper} ${styles.assistantMessage}`}>
            <div className={styles.messageContent}>
              <div className={styles.avatar}>
                <div className={styles.assistantAvatar}>
                  <ProviderIcon provider={currentProvider} size={20} />
                </div>
              </div>
              <div className={styles.messageBody}>
                <div className={styles.messageHeader}>
                  <span className={styles.authorName}>Assistente</span>
                </div>
                
                {/* Reasoning em tempo real para modelos de raciocínio */}
                {(currentModel?.name?.toLowerCase().includes('reason') || 
                  currentModel?.model?.toLowerCase().includes('reason') ||
                  currentModel?.model?.toLowerCase().includes('o1')) && (
                  <div className={styles.reasoningSection}>
                    <div className={styles.reasoningDetails} open>
                      <div className={styles.reasoningSummary}>
                        <span>🧠 Raciocinando...</span>
                      </div>
                      <div className={styles.reasoningContent}>
                        <div className={styles.reasoningLive}>
                          <ReasoningProgress />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className={styles.loadingMessage}>
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}