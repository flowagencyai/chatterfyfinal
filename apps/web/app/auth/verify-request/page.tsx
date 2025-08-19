'use client';

import styles from '../auth.module.css';
import '../../globals.css';

export default function VerifyRequestPage() {
  return (
    <div className={styles.authPage}>
      {/* Header */}
      <div className={styles.header}>
        <a href="/" className={styles.backButton}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Voltar ao Chat
        </a>
      </div>

      {/* Main Content */}
      <div className={styles.container}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <h1>Verifique seu email</h1>
            <p>Enviamos um link mágico para o seu email</p>
          </div>

          <div className={styles.verifyContent}>
            <div className={styles.emailIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="22,6 12,13 2,6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className={styles.instructions}>
              <h3>Como proceder:</h3>
              <ol>
                <li>Verifique sua caixa de entrada</li>
                <li>Procure por um email de "no-reply"</li>
                <li>Clique no link "Sign in to..."</li>
                <li>Você será automaticamente logado</li>
              </ol>
            </div>

            <div className={styles.note}>
              <strong>Não recebeu o email?</strong>
              <br />
              • Verifique a pasta de spam
              • Aguarde até 2 minutos
              • Tente fazer login novamente
            </div>

            <div className={styles.actionsContainer}>
              <a href="/auth" className={styles.secondaryButton}>
                Tentar novamente
              </a>
              
              <a href="/" className={styles.primaryButton}>
                Continuar sem login
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}