'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
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

  // Se estiver logado, não mostrar o menu (mantém comportamento atual)
  if (session?.user) {
    return null;
  }

  // Se ainda estiver carregando e não temos certeza se está logado, não mostrar
  if (status === 'loading') {
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
          <Link 
            href="/auth"
            className={styles.menuItem}
            onClick={() => setShowMenu(false)}
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
          </Link>

          {/* Cadastre-se gratuitamente */}
          <Link 
            href="/auth"
            className={styles.menuItem}
            onClick={() => setShowMenu(false)}
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
          </Link>

          <div className={styles.menuDivider}></div>

          {/* Confira planos e preços */}
          <Link 
            href="/pricing"
            className={styles.menuItem}
            onClick={() => setShowMenu(false)}
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
          </Link>

          {/* Central de ajuda */}
          <Link 
            href="/help"
            className={styles.menuItem}
            onClick={() => setShowMenu(false)}
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
          </Link>

          <div className={styles.menuDivider}></div>

          {/* Termos e políticas */}
          <Link 
            href="/terms"
            className={styles.menuItem}
            onClick={() => setShowMenu(false)}
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
          </Link>
        </div>
      )}
    </div>
  );
}