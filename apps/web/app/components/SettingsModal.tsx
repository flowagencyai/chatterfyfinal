'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useChatContext } from '../contexts/ChatContext';
import { useUserProfile } from '../hooks/useUserProfile';
import ApiKeyModal from './ApiKeyModal';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useChatContext();
  const { profile, loading, error, updateProfile } = useUserProfile();
  
  // Estados locais para edição
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [language, setLanguage] = useState('pt-BR');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [improveAI, setImproveAI] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKeyModal, setApiKeyModal] = useState<{ isOpen: boolean; mode: 'create' | 'regenerate' }>({
    isOpen: false,
    mode: 'create'
  });

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleEditName = () => {
    setEditName(profile?.user.name || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    try {
      await updateProfile({ name: editName });
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating name:', error);
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditName('');
  };

  const handleUpgradeToPro = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/user/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planCode: 'PRO',
          email: session?.user?.email,
          name: profile?.user.name
        })
      });

      const data = await response.json();
      
      if (data.success && data.checkoutUrl) {
        // Redirecionar para Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        alert('Erro ao processar upgrade: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Erro ao processar upgrade. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManageBilling = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/user/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success && data.url) {
        // Redirecionar para portal de cobrança do Stripe
        window.location.href = data.url;
      } else if (data.action === 'upgrade_required') {
        // Usuário FREE - mostrar opção de upgrade
        const shouldUpgrade = confirm(
          `Você está no plano ${data.currentPlan || 'FREE'}.\n\n` +
          'Para acessar o portal de cobrança, você precisa ter uma assinatura ativa.\n\n' +
          'Deseja fazer upgrade para PRO agora?'
        );
        
        if (shouldUpgrade) {
          // Aqui você pode redirecionar para página de upgrade ou abrir modal
          console.log('User wants to upgrade to PRO');
          alert('Funcionalidade de upgrade será implementada. Redirecionando para página de planos...');
          // window.location.href = '/pricing'; // quando tiver página de preços
        }
      } else {
        alert('Erro ao acessar portal de cobrança: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Error accessing billing portal:', error);
      alert('Erro ao acessar portal de cobrança. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (isProcessing) return;
    
    const confirmCancel = confirm(
      'Tem certeza que deseja cancelar sua assinatura? Você manterá acesso até o final do período atual.'
    );
    
    if (!confirmCancel) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/user/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          when: 'end_of_cycle',
          reason: 'User requested cancellation via settings'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Assinatura cancelada com sucesso. Você manterá acesso até ' + 
              new Date(data.cancellation.accessUntil).toLocaleDateString('pt-BR'));
        // Recarregar perfil para mostrar status atualizado
        window.location.reload();
      } else {
        alert('Erro ao cancelar assinatura: ' + (data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Erro ao cancelar assinatura. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAccessBillingPortal = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/user/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success && data.url) {
        // Abrir portal em nova aba
        window.open(data.url, '_blank');
      } else {
        // Tratar diferentes tipos de erro
        if (data.action === 'upgrade_required') {
          alert(`${data.error}\n\nFaça upgrade para ${data.availablePlans?.join(' ou ')} para acessar o portal de cobrança.`);
        } else {
          alert('Erro ao acessar portal de cobrança: ' + (data.error || 'Erro desconhecido'));
        }
      }
    } catch (error) {
      console.error('Error accessing billing portal:', error);
      alert('Erro ao acessar portal de cobrança. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenApiKeyModal = (mode: 'create' | 'regenerate') => {
    setApiKeyModal({ isOpen: true, mode });
  };

  const handleCloseApiKeyModal = () => {
    setApiKeyModal({ isOpen: false, mode: 'create' });
  };

  const handleApiKeySuccess = () => {
    // Recarregar perfil para mostrar nova chave
    window.location.reload();
  };

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return (amount / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const calculateUsagePercentage = (): number => {
    if (!profile || profile.plan.code === 'PRO') return 0; // PRO tem uso ilimitado
    if (profile.plan.monthlyCreditsTokens === 0) return 100;
    
    const used = profile.usage.currentPeriod.totalTokens;
    const limit = profile.plan.monthlyCreditsTokens;
    return Math.min((used / limit) * 100, 100);
  };

  const getPlanBadgeColor = (planCode: string) => {
    switch (planCode) {
      case 'PRO': return '#22c55e';
      case 'FREE': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  if (loading) {
    return (
      <div className={styles.overlay} onClick={handleOverlayClick}>
        <div className={styles.modal}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.overlay} onClick={handleOverlayClick}>
        <div className={styles.modal}>
          <div className={styles.errorContainer}>
            <h3>Erro ao carregar configurações</h3>
            <p>{error}</p>
            <button onClick={onClose} className={styles.closeButton}>Fechar</button>
          </div>
        </div>
      </div>
    );
  }

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
                <div className={styles.settingValue}>{profile?.user.email}</div>
                {profile?.user.emailVerified && (
                  <div className={styles.verifiedBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Verificado
                  </div>
                )}
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Nome</label>
                {isEditingName ? (
                  <div className={styles.editContainer}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={styles.editInput}
                      placeholder="Seu nome"
                    />
                    <div className={styles.editButtons}>
                      <button onClick={handleSaveName} className={styles.saveButton}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button onClick={handleCancelEditName} className={styles.cancelButton}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.settingValue}>
                    {profile?.user.name || 'Não informado'}
                  </div>
                )}
              </div>
              {!isEditingName && (
                <button className={styles.editButton} onClick={handleEditName}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Editar
                </button>
              )}
            </div>
          </div>

          {/* Plan & Billing Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Plano e Cobrança</h3>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Plano Atual</label>
                <div 
                  className={styles.planBadge}
                  style={{ backgroundColor: getPlanBadgeColor(profile?.plan.code || '') }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
                  </svg>
                  {profile?.plan.name}
                </div>
                <div className={styles.settingDescription}>
                  {profile?.plan.code === 'FREE' 
                    ? `${formatTokens(profile.plan.monthlyCreditsTokens)} tokens/mês, ${profile.plan.storageLimitMB}MB de armazenamento`
                    : 'Tokens ilimitados, recursos premium inclusos, suporte prioritário'
                  }
                </div>
                <div className={styles.accountSince}>
                  Cliente desde {formatDate(profile?.usage.accountSince || new Date())}
                </div>
              </div>
              {profile?.plan.code === 'FREE' && (
                <button 
                  className={styles.upgradeButton}
                  onClick={handleUpgradeToPro}
                  disabled={isProcessing}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {isProcessing ? 'Processando...' : 'Fazer Upgrade para PRO'}
                </button>
              )}
            </div>
            
            {/* Usage Statistics */}
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>
                  Uso do Mês ({new Date(profile?.usage.currentPeriod.start || new Date()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})
                </label>
                
                <div className={styles.usageStats}>
                  <div className={styles.usageStat}>
                    <span className={styles.usageNumber}>
                      {formatTokens(profile?.usage.currentPeriod.totalTokens || 0)}
                    </span>
                    <span className={styles.usageLabel}>Tokens Usados</span>
                  </div>
                  <div className={styles.usageStat}>
                    <span className={styles.usageNumber}>
                      {profile?.usage.currentPeriod.totalRequests || 0}
                    </span>
                    <span className={styles.usageLabel}>Requisições</span>
                  </div>
                  <div className={styles.usageStat}>
                    <span className={styles.usageNumber}>
                      {profile?.usage.currentPeriod.threadsCreated || 0}
                    </span>
                    <span className={styles.usageLabel}>Conversas</span>
                  </div>
                </div>

                {profile?.plan.code === 'FREE' && (
                  <div className={styles.usageBar}>
                    <div className={styles.usageBarBackground}>
                      <div 
                        className={styles.usageBarFill} 
                        style={{ width: `${calculateUsagePercentage()}%` }}
                      />
                    </div>
                    <div className={styles.usageBarText}>
                      {formatTokens(profile.usage.currentPeriod.totalTokens)} de {formatTokens(profile.plan.monthlyCreditsTokens)} tokens ({calculateUsagePercentage().toFixed(1)}%)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Gerenciamento de Assinatura - Seção Moderna */}
            <div className={styles.subscriptionSection}>
              {profile?.plan?.code === 'free' ? (
                /* Usuário FREE - Interface de Upgrade */
                <div className={styles.upgradeCard}>
                  <div className={styles.upgradeHeader}>
                    <div className={styles.upgradeIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M12 4V20M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className={styles.upgradeTitle}>Desbloqueie Todo o Potencial</h4>
                      <p className={styles.upgradeDescription}>
                        Faça upgrade para PRO e tenha acesso ilimitado
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.upgradeFeatures}>
                    <div className={styles.upgradeFeature}>
                      <span className={styles.checkIcon}>✓</span>
                      <span>1M tokens por mês</span>
                    </div>
                    <div className={styles.upgradeFeature}>
                      <span className={styles.checkIcon}>✓</span>
                      <span>1GB de armazenamento</span>
                    </div>
                    <div className={styles.upgradeFeature}>
                      <span className={styles.checkIcon}>✓</span>
                      <span>Suporte prioritário</span>
                    </div>
                    <div className={styles.upgradeFeature}>
                      <span className={styles.checkIcon}>✓</span>
                      <span>Recursos avançados</span>
                    </div>
                  </div>

                  <div className={styles.upgradeAction}>
                    <button 
                      className={styles.upgradeButtonPrimary}
                      onClick={() => window.open('/pricing', '_blank')}
                      disabled={isProcessing}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {isProcessing ? 'Carregando...' : 'Upgrade para PRO'}
                    </button>
                    
                    <button 
                      className={styles.upgradeButtonSecondary}
                      onClick={() => window.open('/pricing', '_blank')}
                      disabled={isProcessing}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Ver Todos os Planos
                    </button>
                    
                    <p className={styles.upgradePrice}>R$ 49,90/mês • Cancele quando quiser</p>
                  </div>
                </div>
              ) : (
                /* Usuário PRO - Interface de Gerenciamento */
                <div className={styles.billingCard}>
                  <div className={styles.billingHeader}>
                    <div className={styles.billingIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="20" cy="16" r="2" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div>
                      <h4 className={styles.billingTitle}>Assinatura Ativa</h4>
                      <p className={styles.billingDescription}>
                        Sua assinatura {profile?.subscription?.plan?.name || profile?.subscription?.plan?.code?.toUpperCase() || 'ATUAL'} está ativa e funcionando
                      </p>
                    </div>
                  </div>

                  <div className={styles.billingDetails}>
                    {profile?.billing?.nextBilling && (
                      <div className={styles.billingDetail}>
                        <span className={styles.billingLabel}>Próxima Cobrança</span>
                        <span className={styles.billingValue}>
                          {formatDate(profile.billing.nextBilling)}
                        </span>
                      </div>
                    )}
                    
                    <div className={styles.billingDetail}>
                      <span className={styles.billingLabel}>Valor</span>
                      <span className={styles.billingValue}>
                        {formatCurrency(profile?.billing?.amount || 0)}/mês
                      </span>
                    </div>

                    {profile?.billing?.paymentMethod && (
                      <div className={styles.billingDetail}>
                        <span className={styles.billingLabel}>Método de Pagamento</span>
                        <span className={styles.billingValue}>
                          •••• •••• •••• {profile.billing.paymentMethod.last4} ({profile.billing.paymentMethod.brand.toUpperCase()})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={styles.billingActions}>
                    <button 
                      className={styles.manageButton}
                      onClick={handleAccessBillingPortal}
                      disabled={isProcessing}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      {isProcessing ? 'Carregando...' : 'Gerenciar Cobrança'}
                    </button>
                    
                    <button 
                      className={styles.cancelButton}
                      onClick={handleCancelSubscription}
                      disabled={isProcessing}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Cancelar Assinatura
                    </button>
                  </div>
                </div>
              )}
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

          {/* API Keys Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Chaves de API</h3>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Chave da API</label>
                <div className={styles.settingDescription}>
                  Use sua chave de API para integrar com aplicações externas
                </div>
                <div className={styles.settingValue} style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                  {profile?.organization?.apiKey ? 
                    `cha_${profile.organization.apiKey.substring(0, 8)}...${profile.organization.apiKey.slice(-4)}` : 
                    'Nenhuma chave gerada'
                  }
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {profile?.organization?.apiKey ? (
                  // Se existe chave, mostrar botões Copiar e Regenerar
                  <>
                    <button 
                      className={styles.apiButton}
                      onClick={() => {
                        navigator.clipboard.writeText(`cha_${profile.organization.apiKey}`);
                        alert('Chave copiada para a área de transferência!');
                      }}
                      disabled={isProcessing}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Copiar
                    </button>
                    <button 
                      className={styles.apiButton}
                      onClick={() => handleOpenApiKeyModal('regenerate')}
                      disabled={isProcessing}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <polyline points="23,4 23,10 17,10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Regenerar
                    </button>
                  </>
                ) : (
                  // Se não existe chave, mostrar botão Gerar
                  <button 
                    className={styles.upgradeButton}
                    onClick={() => handleOpenApiKeyModal('create')}
                    disabled={isProcessing}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Gerar Nova Chave
                  </button>
                )}
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Uso da API</label>
                <div className={styles.settingDescription}>
                  Requisições feitas via API este mês
                </div>
                <div className={styles.usageStats}>
                  <div className={styles.usageStat}>
                    <span className={styles.usageNumber}>
                      {profile?.usage.currentPeriod.apiRequests || 0}
                    </span>
                    <span className={styles.usageLabel}>Requisições API</span>
                  </div>
                  <div className={styles.usageStat}>
                    <span className={styles.usageNumber}>
                      {formatTokens(profile?.usage.currentPeriod.apiTokens || 0)}
                    </span>
                    <span className={styles.usageLabel}>Tokens via API</span>
                  </div>
                </div>
              </div>
              <button className={styles.securityButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Ver Documentação
              </button>
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
                <option value="deepseek-chat">DeepSeek Chat (Recomendado)</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="claude-3-haiku">Claude 3 Haiku</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
          </div>

          {/* Privacy & Preferences */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Privacidade e Preferências</h3>
            
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

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Notificações</label>
                <div className={styles.settingDescription}>
                  Configure como você quer ser notificado
                </div>
              </div>
              <div className={styles.privacyControls}>
                <label className={styles.toggleOption}>
                  <input 
                    type="checkbox" 
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                  />
                  <span className={styles.toggleSlider}></span>
                  Receber emails sobre novidades
                </label>
                <label className={styles.toggleOption}>
                  <input 
                    type="checkbox" 
                    checked={improveAI}
                    onChange={(e) => setImproveAI(e.target.checked)}
                  />
                  <span className={styles.toggleSlider}></span>
                  Melhorar IA com minhas conversas
                </label>
              </div>
            </div>
          </div>

          {/* Account Management Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Administração da Conta</h3>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Exportar Dados</label>
                <div className={styles.settingDescription}>
                  Baixe todas suas conversas e dados em formato JSON
                </div>
              </div>
              <button className={styles.exportButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Exportar Dados
              </button>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Limpar Conversas</label>
                <div className={styles.settingDescription}>
                  Remove todas as suas conversas permanentemente
                </div>
              </div>
              <button className={styles.actionButton}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                    fill="currentColor"
                  />
                </svg>
                Limpar Todas as Conversas
              </button>
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

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={apiKeyModal.isOpen}
        mode={apiKeyModal.mode}
        onClose={handleCloseApiKeyModal}
        onSuccess={handleApiKeySuccess}
      />
    </div>
  );
}