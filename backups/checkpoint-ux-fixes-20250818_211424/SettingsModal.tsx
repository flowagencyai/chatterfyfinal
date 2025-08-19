'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useChatContext } from '../contexts/ChatContext';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data: session } = useSession();
  const { theme, toggleTheme, threads } = useChatContext();
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [language, setLanguage] = useState('pt-BR');
  
  // Calcular dados reais da conta
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Filtrar threads do mês atual
  const thisMonthThreads = threads.filter(thread => {
    const threadDate = new Date(thread.createdAt);
    return threadDate.getMonth() === currentMonth && threadDate.getFullYear() === currentYear;
  });
  
  // Contar mensagens totais do usuário neste mês
  const thisMonthMessages = thisMonthThreads.reduce((total, thread) => {
    return total + thread.messages.filter(msg => msg.role === 'user').length;
  }, 0);
  
  // Dados da conta Pro
  const accountData = {
    plan: 'Pro',
    monthlyMessages: thisMonthMessages,
    totalThreads: threads.length,
    accountSince: session?.user?.email ? new Date(2024, 10, 15) : new Date(), // Novembro 2024
    nextBilling: new Date(2025, 8, 18), // 18 de Setembro 2025
    monthlyPrice: 'R$ 49,90'
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Configurações</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {/* Account Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Conta</h3>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Email</label>
                <div className={styles.settingValue}>{session?.user?.email}</div>
              </div>
            </div>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Nome</label>
                <div className={styles.settingValue}>
                  {session?.user?.name || session?.user?.email?.split('@')[0]}
                </div>
              </div>
              <button className={styles.editButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Editar
              </button>
            </div>
          </div>

          {/* Plan & Billing Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Plano e Cobrança</h3>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Plano Atual</label>
                <div className={styles.planBadge}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                  </svg>
                  Plano {accountData.plan}
                </div>
                <div className={styles.settingDescription}>
                  Conversas ilimitadas, API Keys personalizadas, suporte prioritário e análises avançadas
                </div>
                <div className={styles.accountSince}>
                  Cliente desde {accountData.accountSince?.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </div>
              </div>
              <button className={styles.upgradeButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Fazer Upgrade para Enterprise
              </button>
            </div>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Uso do Mês (Agosto 2025)</label>
                <div className={styles.usageStats}>
                  <div className={styles.usageStat}>
                    <span className={styles.usageNumber}>{accountData.monthlyMessages.toLocaleString('pt-BR')}</span>
                    <span className={styles.usageLabel}>Mensagens</span>
                  </div>
                  <div className={styles.usageStat}>
                    <span className={styles.usageNumber}>{accountData.totalThreads}</span>
                    <span className={styles.usageLabel}>Conversas</span>
                  </div>
                  <div className={styles.usageStat}>
                    <span className={styles.usageNumber}>∞</span>
                    <span className={styles.usageLabel}>Disponível</span>
                  </div>
                </div>
                <div className={styles.usageDescription}>
                  Plano Pro: uso ilimitado de mensagens e modelos premium inclusos
                </div>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Próxima Cobrança</label>
                <div className={styles.settingValue}>
                  {accountData.nextBilling?.toLocaleDateString('pt-BR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </div>
                <div className={styles.settingDescription}>
                  {accountData.monthlyPrice}/mês • Cancelar a qualquer momento
                </div>
                <div className={styles.billingHistory}>
                  <small>💳 Método: •••• •••• •••• 4532 (Visa)</small>
                </div>
              </div>
              <button className={styles.manageButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Gerenciar Cobrança
              </button>
            </div>
          </div>

          {/* Appearance Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Aparência</h3>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Tema</label>
                <div className={styles.settingDescription}>
                  Escolha como o chat deve aparecer para você
                </div>
              </div>
              <div className={styles.themeSelector}>
                <button
                  className={`${styles.themeOption} ${theme === 'light' ? styles.selected : ''}`}
                  onClick={() => theme === 'dark' && toggleTheme()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                    <path
                      d="M12 1v6m0 6v6m11-7h-6m-6 0H1m16.36-9.36l-4.24 4.24M7.76 7.76L3.51 3.51m13.13 13.13l-4.24 4.24m-4.64-4.64l-4.25 4.25"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  Claro
                </button>
                <button
                  className={`${styles.themeOption} ${theme === 'dark' ? styles.selected : ''}`}
                  onClick={() => theme === 'light' && toggleTheme()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Escuro
                </button>
              </div>
            </div>
          </div>

          {/* AI Model Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Modelo de IA</h3>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Modelo padrão</label>
                <div className={styles.settingDescription}>
                  O modelo de IA que será usado nas conversas
                </div>
              </div>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={styles.select}
              >
                <option value="gpt-4o-mini">GPT-4o Mini (Recomendado)</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
          </div>

          {/* Language Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Idioma e região</h3>
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Idioma</label>
                <div className={styles.settingDescription}>
                  Idioma preferido para as respostas da IA
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={styles.select}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
                <option value="fr-FR">Français</option>
              </select>
            </div>
          </div>

          {/* Account Management Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Administração da Conta</h3>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Segurança</label>
                <div className={styles.settingDescription}>
                  Gerencie suas configurações de segurança e acesso
                </div>
              </div>
              <button className={styles.securityButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Configurações de Segurança
              </button>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>API Keys</label>
                <div className={styles.settingDescription}>
                  Configure suas chaves de API pessoais para os modelos de IA
                </div>
              </div>
              <button className={styles.apiButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Gerenciar API Keys
              </button>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Exportar Dados</label>
                <div className={styles.settingDescription}>
                  Baixe todos os seus dados em formato JSON
                </div>
              </div>
              <button className={styles.exportButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Exportar Dados
              </button>
            </div>
          </div>

          {/* Data Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Dados e Privacidade</h3>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Histórico de conversas</label>
                <div className={styles.settingDescription}>
                  Suas conversas são salvas para melhorar sua experiência
                </div>
              </div>
              <button className={styles.actionButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                    fill="currentColor"
                  />
                </svg>
                Limpar todas as conversas
              </button>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Privacidade</label>
                <div className={styles.settingDescription}>
                  Configure como seus dados são utilizados
                </div>
              </div>
              <div className={styles.privacyControls}>
                <label className={styles.toggleOption}>
                  <input type="checkbox" defaultChecked />
                  <span className={styles.toggleSlider}></span>
                  Melhorar IA com minhas conversas
                </label>
                <label className={styles.toggleOption}>
                  <input type="checkbox" defaultChecked />
                  <span className={styles.toggleSlider}></span>
                  Receber emails de produto
                </label>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle} style={{color: 'var(--accent-danger)'}}>Zona de Perigo</h3>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Deletar Conta</label>
                <div className={styles.settingDescription}>
                  Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.
                </div>
              </div>
              <button className={styles.dangerButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Deletar Conta Permanentemente
              </button>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.saveButton} onClick={onClose}>
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}