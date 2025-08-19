'use client';
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import styles from './auth.module.css';
import '../globals.css';

export default function AuthPage() {
  const { data: session } = useSession();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      await signIn('email', { email, callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          {!session ? (
            <>
              <div className={styles.authHeader}>
                <h1>Entre na sua conta</h1>
                <p>Acesse suas conversas e configurações personalizadas</p>
              </div>

              <form className={styles.authForm} onSubmit={(e) => { e.preventDefault(); handleSignIn(); }}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Endereço de email</label>
                  <input 
                    type="email"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="seu@email.com"
                    className={styles.input}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={!email.trim() || isLoading}
                >
                  {isLoading ? 'Enviando...' : 'Receber link de acesso'}
                </button>
              </form>

              <div className={styles.note}>
                Enviaremos um link seguro para o seu email. Clique no link para acessar sua conta.
              </div>

              <div className={styles.features}>
                <div className={styles.featuresTitle}>Com sua conta você terá:</div>
                <ul className={styles.featuresList}>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Conversas ilimitadas
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Histórico salvo
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Upload de arquivos
                  </li>
                  <li>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Configurações personalizadas
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div className={styles.userInfo}>
              <div className={styles.userName}>Bem-vindo de volta!</div>
              <div className={styles.userEmail}>{session.user?.email}</div>
              
              <button 
                onClick={() => signOut({ callbackUrl: '/' })} 
                className={styles.logoutButton}
              >
                Sair da conta
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
