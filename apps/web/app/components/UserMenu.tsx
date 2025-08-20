'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './UserMenu.module.css';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
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

  // Se estiver carregando, não mostrar nada
  if (status === 'loading') {
    return null;
  }

  // Se estiver logado, não mostrar o menu (mantém comportamento atual)
  if (session?.user) {
    return null;
  }

  // Menu apenas para usuários NÃO LOGADOS
  return (
    <div className={styles.userMenuContainer} ref={menuRef}>
      <button 
        className={styles.menuButton}
        onClick={() => setShowMenu(!showMenu)}
        aria-label="Menu do usuário"
      >
        <div className={styles.userAvatar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="7"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <svg 
          className={`${styles.chevron} ${showMenu ? styles.chevronOpen : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {showMenu && (
        <div className={styles.dropdownMenu}>
          {/* Entrar */}
          <button 
            className={styles.menuItem}
            onClick={() => {
              window.location.href = '/auth';
              setShowMenu(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Entrar
          </button>

          {/* Cadastre-se gratuitamente */}
          <button 
            className={styles.menuItem}
            onClick={() => {
              window.location.href = '/auth';
              setShowMenu(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M22 11l-3-3m0 0-3 3m3-3v12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Cadastre-se gratuitamente
          </button>

          <div className={styles.menuDivider}></div>

          {/* Confira planos e preços */}
          <button 
            className={styles.menuItem}
            onClick={() => {
              window.location.href = '/pricing';
              setShowMenu(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Confira planos e preços
          </button>

          {/* Central de ajuda */}
          <button 
            className={styles.menuItem}
            onClick={() => {
              window.open('mailto:suporte@chatterfy.com?subject=Ajuda com Chatterfy', '_blank');
              setShowMenu(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="17" r="1" fill="currentColor" />
            </svg>
            Central de ajuda
          </button>

          {/* Configurações (mesmo para não logados - configurações básicas) */}
          <button 
            className={styles.menuItem}
            onClick={() => {
              // Pode abrir um modal de configurações básicas (tema, idioma, etc)
              alert('Configurações básicas - a implementar');
              setShowMenu(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.1a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Configurações
          </button>

          <div className={styles.menuDivider}></div>

          {/* Notas de versão */}
          <button 
            className={styles.menuItem}
            onClick={() => {
              window.open('https://github.com/flowagencyai/chatterfy/releases', '_blank');
              setShowMenu(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Notas de versão
          </button>

          {/* Termos e políticas */}
          <button 
            className={styles.menuItem}
            onClick={() => {
              window.open('/terms', '_blank');
              setShowMenu(false);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 2v6h6M9 13h6M9 17h3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Termos e políticas
          </button>
        </div>
      )}
    </div>
  );
}