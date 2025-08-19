'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useChatContext } from '../contexts/ChatContext';
import SettingsModal from './SettingsModal';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { data: session, status } = useSession();
  const {
    threads,
    currentThread,
    createThread,
    startNewConversation,
    selectThread,
    deleteThread,
    theme,
    toggleTheme,
    isAnonymous,
    conversationCount,
    anonymousConversationLimit
  } = useChatContext();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hoveredThread, setHoveredThread] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  const handleNewChat = () => {
    startNewConversation();
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const threadDate = new Date(date);
    
    // Compare only dates, ignoring time
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threadDateStart = new Date(threadDate.getFullYear(), threadDate.getMonth(), threadDate.getDate());
    const diffTime = todayStart.getTime() - threadDateStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays <= 7) return `${diffDays} dias atrás`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    return threadDate.toLocaleDateString('pt-BR');
  };

  const groupThreadsByDate = () => {
    const groups: { [key: string]: typeof threads } = {
      'Hoje': [],
      'Ontem': [],
      'Últimos 7 dias': [],
      'Últimos 30 dias': [],
      'Mais antigo': []
    };

    threads.forEach(thread => {
      const date = formatDate(thread.updatedAt);
      if (date === 'Hoje') groups['Hoje'].push(thread);
      else if (date === 'Ontem') groups['Ontem'].push(thread);
      else if (date.includes('dias')) groups['Últimos 7 dias'].push(thread);
      else if (date.includes('semanas')) groups['Últimos 30 dias'].push(thread);
      else groups['Mais antigo'].push(thread);
    });

    return Object.entries(groups).filter(([_, threads]) => threads.length > 0);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        className={styles.toggleButton}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.closed : ''}`}>
        <div className={styles.sidebarContent}>
          {/* New Chat Button */}
          <button className={styles.newChatButton} onClick={handleNewChat}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14m-7-7h14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Nova conversa
          </button>

          {/* Threads List */}
          <div className={styles.threadsList}>
            {groupThreadsByDate().map(([dateGroup, groupThreads]) => (
              <div key={dateGroup} className={styles.threadGroup}>
                <div className={styles.threadGroupTitle}>{dateGroup}</div>
                {groupThreads.map(thread => (
                  <div
                    key={thread.id}
                    className={`${styles.threadItem} ${
                      currentThread?.id === thread.id ? styles.active : ''
                    }`}
                    onClick={() => selectThread(thread.id)}
                    onMouseEnter={() => setHoveredThread(thread.id)}
                    onMouseLeave={() => setHoveredThread(null)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M8 9h8M8 13h6m-7 8l-3-3h10a3 3 0 003-3V7a3 3 0 00-3-3H8a3 3 0 00-3 3v10"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className={styles.threadTitle}>{thread.title}</span>
                    {hoveredThread === thread.id && (
                      <button
                        className={styles.deleteButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteThread(thread.id);
                        }}
                        aria-label="Delete thread"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* User Section */}
          <div className={styles.userSection}>
            {/* Anonymous Usage Indicator */}
            {isAnonymous && (
              <div className={styles.usageIndicator}>
                <div className={styles.usageText}>
                  {conversationCount} / {anonymousConversationLimit} conversas gratuitas
                </div>
                <div className={styles.usageBar}>
                  <div 
                    className={styles.usageProgress}
                    style={{ 
                      width: `${(conversationCount / anonymousConversationLimit) * 100}%`,
                      backgroundColor: conversationCount >= anonymousConversationLimit ? 'var(--accent-danger)' : 'var(--accent-primary)'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <button className={styles.themeToggle} onClick={toggleTheme}>
              {theme === 'light' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                  <path
                    d="M12 1v6m0 6v6m11-7h-6m-6 0H1m16.36-9.36l-4.24 4.24M7.76 7.76L3.51 3.51m13.13 13.13l-4.24 4.24m-4.64-4.64l-4.25 4.25"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <span>{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
            </button>

            {/* User Info */}
            {status === 'authenticated' && session?.user ? (
              <div className={styles.userSection} ref={userMenuRef}>
                <button 
                  className={styles.userProfile}
                  onClick={() => setShowUserMenu(prev => !prev)}
                >
                  <div className={styles.userAvatar}>
                    {session.user.name?.[0] || session.user.email?.[0] || 'U'}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>
                      {session.user.name || session.user.email?.split('@')[0]}
                    </div>
                    <div className={styles.userEmail}>
                      {session.user.email}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.chevron}>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className={styles.userMenu}>
                    <button 
                      className={styles.menuItem}
                      onClick={() => {
                        setShowSettingsModal(true);
                        setShowUserMenu(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Configurações
                    </button>
                    
                    <div className={styles.menuDivider}></div>
                    
                    <button 
                      className={styles.menuItem}
                      onClick={() => signOut({ callbackUrl: '/' })}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a href="/auth" className={styles.signInButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Fazer login
              </a>
            )}

            {/* Upgrade Button for Anonymous Users */}
            {isAnonymous && conversationCount >= anonymousConversationLimit && (
              <a href="/pricing" className={styles.upgradeButton}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                    fill="currentColor"
                  />
                </svg>
                Fazer upgrade
              </a>
            )}
          </div>
        </div>
      </aside>
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
    </>
  );
}