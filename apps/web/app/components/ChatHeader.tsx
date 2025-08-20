'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ModelSelector from './ModelSelector';
import UserMenu from './UserMenu';
import styles from './ChatHeader.module.css';

interface ChatHeaderProps {
  selectedModel: { provider: string; model: string; name: string };
  onModelChange: (model: { provider: string; model: string; name: string }) => void;
  threadTitle?: string;
  onClearChat?: () => void;
}

export default function ChatHeader({ selectedModel, onModelChange, threadTitle, onClearChat }: ChatHeaderProps) {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuToggle = () => {
    setShowMenu(!showMenu);
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <ModelSelector 
          selectedModel={selectedModel} 
          onModelChange={onModelChange} 
        />
      </div>
      
      <div className={styles.center}>
        {threadTitle && (
          <h1 className={styles.threadTitle}>{threadTitle}</h1>
        )}
      </div>
      
      <div className={styles.right}>
        {/* Menu para usuários não logados */}
        <UserMenu />
        
        {/* Botões para usuários logados */}
        {session?.user && (
          <>
            <button className={styles.shareButton} aria-label="Compartilhar conversa">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 8a3 3 0 11-6 0 3 3 0 016 0zM12 16a3 3 0 11-6 0 3 3 0 016 0zM6 8a3 3 0 11-6 0 3 3 0 016 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            
            <div className={styles.menuContainer} ref={menuRef}>
              <button 
                className={styles.moreButton} 
                onClick={handleMenuToggle}
                aria-label="Mais opções"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
              
              {showMenu && (
                <div className={styles.dropdownMenu}>
                  {onClearChat && (
                    <button 
                      className={styles.menuItem}
                      onClick={() => {
                        onClearChat();
                        setShowMenu(false);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Limpar conversa
                    </button>
                  )}
                  <button 
                    className={styles.menuItem}
                    onClick={() => setShowMenu(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L8 6h8l-4-4zm0 20l4-4H8l4 4z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Exportar conversa
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}