'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './SettingsModal.module.css';

interface Plan {
  id: string;
  code: string;
  name: string;
  monthlyCreditsTokens: number;
  dailyTokenLimit: number;
  storageLimitMB: number;
  maxFileSizeMB: number;
  features: Record<string, any>;
}

interface SubscriptionDetails {
  currentPlan: Plan;
  subscription: {
    id: string;
    status: string;
    active: boolean;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    daysUntilPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
    cancelledAt?: string;
    cancellationReason?: string;
    canReactivate: boolean;
    retentionOffersCount: number;
    canOfferRetention: boolean;
  } | null;
  billingInfo: {
    nextBillingDate?: string;
    lastPaymentDate: string;
    amount: number;
    currency: string;
  } | null;
  actions: {
    canCancel: boolean;
    canReactivate: boolean;
    canUpgrade: boolean;
    canDowngrade: boolean;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onShowCancellation?: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';

export default function SubscriptionManagementModal({ isOpen, onClose, onShowCancellation }: Props) {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (isOpen && session?.user) {
      fetchSubscriptionDetails();
    }
  }, [isOpen, session]);

  const fetchSubscriptionDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch detailed subscription info
      const subResponse = await fetch(`${API_BASE}/v1/user/subscription-detailed`, {
        headers: {
          'X-Org-Id': session?.user?.email || 'anonymous',
          'X-User-Id': session?.user?.email || 'anonymous'
        }
      });
      
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }

      // Fetch available plans
      const plansResponse = await fetch(`${API_BASE}/v1/plans`);
      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setPlans(plansData.plans);
      }

    } catch (error) {
      console.error('Error fetching subscription details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`${API_BASE}/v1/user/reactivate-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': session?.user?.email || 'anonymous',
          'X-User-Id': session?.user?.email || 'anonymous'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Assinatura reativada com sucesso!');
        fetchSubscriptionDetails(); // Refresh data
      } else {
        alert(`❌ Erro ao reativar: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Erro: ${error}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const getStatusColor = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) return '#dc3545';
    if (status === 'active') return '#28a745';
    if (status === 'past_due') return '#ffc107';
    return '#6c757d';
  };

  const getStatusText = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) return '🚫 Cancelada (ativa até fim do período)';
    if (status === 'active') return '✅ Ativa';
    if (status === 'past_due') return '⚠️ Pagamento pendente';
    return '❓ Status desconhecido';
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} style={{ maxWidth: '600px', width: '90vw' }}>
        <div className={styles.header}>
          <h2>💳 Gerenciar Assinatura</h2>
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
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>Carregando...</div>
            </div>
          ) : subscription ? (
            <>
              {/* Current Plan Section */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>📊 Plano Atual</h3>
                
                <div style={{ 
                  padding: '20px', 
                  border: '2px solid #e9ecef', 
                  borderRadius: '8px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#333' }}>{subscription.currentPlan.name}</h4>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {subscription.billingInfo ? formatCurrency(subscription.billingInfo.amount) : 'Gratuito'}
                        {subscription.billingInfo && '/mês'}
                      </div>
                    </div>
                    
                    {subscription.subscription && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          color: getStatusColor(subscription.subscription.status, subscription.subscription.cancelAtPeriodEnd),
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {getStatusText(subscription.subscription.status, subscription.subscription.cancelAtPeriodEnd)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Plan Features */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                    <div>📊 {subscription.currentPlan.monthlyCreditsTokens.toLocaleString()} tokens/mês</div>
                    <div>⚡ {subscription.currentPlan.dailyTokenLimit.toLocaleString()} tokens/dia</div>
                    <div>💾 {subscription.currentPlan.storageLimitMB}MB armazenamento</div>
                    <div>📎 Arquivos até {subscription.currentPlan.maxFileSizeMB}MB</div>
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              {subscription.billingInfo && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>💰 Informações de Cobrança</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <strong>Próxima cobrança:</strong><br />
                      <span style={{ color: subscription.subscription?.cancelAtPeriodEnd ? '#dc3545' : '#666' }}>
                        {subscription.subscription?.cancelAtPeriodEnd 
                          ? 'Cancelada - sem cobrança futura'
                          : subscription.billingInfo.nextBillingDate 
                            ? new Date(subscription.billingInfo.nextBillingDate).toLocaleDateString('pt-BR')
                            : 'N/A'
                        }
                      </span>
                    </div>
                    
                    <div>
                      <strong>Último pagamento:</strong><br />
                      <span style={{ color: '#666' }}>
                        {new Date(subscription.billingInfo.lastPaymentDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {subscription.subscription?.cancelAtPeriodEnd && (
                    <div style={{ 
                      marginTop: '15px', 
                      padding: '15px', 
                      backgroundColor: '#fff3cd', 
                      borderRadius: '6px',
                      border: '1px solid #ffeaa7'
                    }}>
                      <strong>⚠️ Assinatura cancelada</strong>
                      <div style={{ fontSize: '14px', marginTop: '5px' }}>
                        Acesso mantido até: <strong>{new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}</strong>
                        {subscription.subscription.daysUntilPeriodEnd > 0 && (
                          <span> ({subscription.subscription.daysUntilPeriodEnd} dias restantes)</span>
                        )}
                      </div>
                      {subscription.subscription.cancellationReason && (
                        <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                          Motivo: {subscription.subscription.cancellationReason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>⚙️ Ações</h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {subscription.actions.canReactivate && (
                    <button
                      onClick={handleReactivate}
                      disabled={actionLoading}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      {actionLoading ? '⏳ Processando...' : '✅ Reativar Assinatura'}
                    </button>
                  )}

                  {subscription.actions.canCancel && (
                    <button
                      onClick={() => {
                        onClose();
                        onShowCancellation?.();
                      }}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      🚫 Cancelar Assinatura
                    </button>
                  )}

                  {subscription.actions.canUpgrade && subscription.currentPlan.code === 'free' && (
                    <button
                      style={{
                        padding: '12px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      ⬆️ Fazer Upgrade
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    style={{
                      padding: '12px 20px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    📋 Histórico de Cobrança
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>❌ Erro ao carregar informações da assinatura</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}