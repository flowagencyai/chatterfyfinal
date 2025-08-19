'use client';

import { useEffect, useRef } from 'react';
import { Message } from '../contexts/ChatContext';
import styles from './MessageList.module.css';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path
                    d="M12 1v6m0 6v6m11-7h-6m-6 0H1m16.36-9.36l-4.24 4.24M7.76 7.76L3.51 3.51m13.13 13.13l-4.24 4.24m-4.64-4.64l-4.25 4.25"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
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

            {/* Message Text */}
            <div className={styles.messageText}>
              {message.content.split('\n').map((line, i) => (
                <p key={i}>{line || '\u00A0'}</p>
              ))}
            </div>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    <path
                      d="M12 1v6m0 6v6m11-7h-6m-6 0H1m16.36-9.36l-4.24 4.24M7.76 7.76L3.51 3.51m13.13 13.13l-4.24 4.24m-4.64-4.64l-4.25 4.25"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
              <div className={styles.messageBody}>
                <div className={styles.messageHeader}>
                  <span className={styles.authorName}>Assistente</span>
                </div>
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