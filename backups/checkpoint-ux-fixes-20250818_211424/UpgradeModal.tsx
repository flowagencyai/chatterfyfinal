'use client';

import { useEffect } from 'react';
import styles from './UpgradeModal.module.css';

interface UpgradeModalProps {
  onClose: () => void;
}

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className={styles.closeButton} onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.icon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="currentColor"
              />
            </svg>
          </div>
          
          <h2>Upgrade para continuar</h2>
          <p>
            Você atingiu o limite de mensagens gratuitas. 
            Faça login ou upgrade para continuar conversando sem limites.
          </p>

          <div className={styles.benefits}>
            <div className={styles.benefit}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Mensagens ilimitadas</span>
            </div>
            <div className={styles.benefit}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Histórico de conversas salvo</span>
            </div>
            <div className={styles.benefit}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Upload de arquivos</span>
            </div>
            <div className={styles.benefit}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Acesso prioritário</span>
            </div>
          </div>

          <div className={styles.actions}>
            <a href="/auth" className={styles.primaryButton}>
              Fazer Login Grátis
            </a>
            <a href="/pricing" className={styles.secondaryButton}>
              Ver Planos Pagos
            </a>
          </div>

          <div className={styles.footer}>
            <p>
              Ou <button className={styles.resetButton} onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}>
                reinicie sua sessão
              </button> para obter mais 3 mensagens gratuitas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}