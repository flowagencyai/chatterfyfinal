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

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';

export default function UpgradePlanModal({ isOpen, onClose, onUpgradeSuccess }: UpgradePlanModalProps) {
  const { data: session } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && session?.user) {
      fetchPlansAndUserPlan();
    }
  }, [isOpen, session]);

  const fetchPlansAndUserPlan = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar planos disponíveis
      const plansResponse = await fetch(`${API_BASE}/v1/plans`);
      if (!plansResponse.ok) throw new Error('Failed to fetch plans');
      const plansData = await plansResponse.json();

      // Buscar plano atual do usuário
      const userInfo = await fetch('/api/user/session').then(r => r.json());
      if (userInfo.user) {
        const userPlanResponse = await fetch(`${API_BASE}/v1/user/plan`, {
          headers: {
            'X-Org-Id': userInfo.user.orgId,
            'X-User-Id': userInfo.user.id,
          }
        });
        
        if (userPlanResponse.ok) {
          const userPlanData = await userPlanResponse.json();
          setCurrentPlan(userPlanData.currentPlan);
        }
      }

      setPlans(plansData.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Erro ao carregar planos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planCode: string) => {
    if (!session?.user) return;
    
    try {
      setUpgrading(true);
      setError(null);

      const userInfo = await fetch('/api/user/session').then(r => r.json());
      if (!userInfo.user) throw new Error('User info not found');

      const response = await fetch(`${API_BASE}/v1/user/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': userInfo.user.orgId,
          'X-User-Id': userInfo.user.id,
        },
        body: JSON.stringify({ planCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade plan');
      }

      // Upgrade realizado com sucesso
      alert(`✅ Upgrade realizado com sucesso!\n\nVocê agora está no plano ${data.subscription.plan.name}.\nVálido até: ${new Date(data.subscription.periodEnd).toLocaleDateString('pt-BR')}`);
      
      onUpgradeSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      setError(error.message || 'Erro ao fazer upgrade. Tente novamente.');
    } finally {
      setUpgrading(false);
    }
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(0)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
    return tokens.toString();
  };

  const formatStorage = (mb: number) => {
    if (mb >= 1000) return `${(mb / 1000).toFixed(0)}GB`;
    return `${mb}MB`;
  };

  const getPlanPrice = (code: string) => {
    switch (code) {
      case 'free': return 'Grátis';
      case 'pro': return 'R$ 49,90/mês';
      default: return 'Sob consulta';
    }
  };

  const canUpgrade = (planCode: string) => {
    if (!currentPlan) return true;
    if (currentPlan.code === 'free' && planCode === 'pro') return true;
    return currentPlan.code !== planCode;
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className={styles.header}>
          <h2>Escolher Plano</h2>
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

        <div className={styles.content} style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>Carregando planos...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#dc2626' }}>
              <div>{error}</div>
              <button 
                onClick={fetchPlansAndUserPlan}
                style={{ 
                  marginTop: '16px', 
                  padding: '8px 16px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <>
              {currentPlan && (
                <div style={{ 
                  marginBottom: '24px', 
                  padding: '16px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '2px solid #e9ecef'
                }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>Plano Atual</h3>
                  <div style={{ fontWeight: 'bold', color: '#28a745' }}>
                    {currentPlan.name} - {getPlanPrice(currentPlan.code)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6c757d', marginTop: '4px' }}>
                    {formatTokens(currentPlan.monthlyCreditsTokens)} tokens/mês • {formatStorage(currentPlan.storageLimitMB)} storage
                  </div>
                </div>
              )}

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: plans.length > 1 ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
                gap: '24px' 
              }}>
                {plans.map(plan => (
                  <div 
                    key={plan.id} 
                    style={{
                      border: currentPlan?.code === plan.code ? '2px solid #28a745' : '1px solid #dee2e6',
                      borderRadius: '12px',
                      padding: '24px',
                      backgroundColor: currentPlan?.code === plan.code ? '#f8fff8' : 'white',
                      position: 'relative'
                    }}
                  >
                    {currentPlan?.code === plan.code && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        ATUAL
                      </div>
                    )}

                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{plan.name}</h3>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: plan.code === 'free' ? '#28a745' : '#007bff', marginBottom: '16px' }}>
                      {getPlanPrice(plan.code)}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>📊 {formatTokens(plan.monthlyCreditsTokens)}</strong> tokens por mês
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>⚡ {formatTokens(plan.dailyTokenLimit)}</strong> tokens por dia
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>💾 {formatStorage(plan.storageLimitMB)}</strong> de armazenamento
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>📎 {plan.maxFileSizeMB}MB</strong> por arquivo
                      </div>
                      
                      {plan.features.rag && (
                        <div style={{ marginBottom: '8px', color: '#28a745' }}>
                          ✅ RAG (Recuperação de informações)
                        </div>
                      )}
                      {plan.features.s3 && (
                        <div style={{ marginBottom: '8px', color: '#28a745' }}>
                          ✅ Armazenamento na nuvem
                        </div>
                      )}
                      {plan.code === 'pro' && (
                        <div style={{ marginBottom: '8px', color: '#28a745' }}>
                          ✅ Suporte prioritário
                        </div>
                      )}
                    </div>

                    {canUpgrade(plan.code) ? (
                      <button
                        onClick={() => handleUpgrade(plan.code)}
                        disabled={upgrading}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: plan.code === 'free' ? '#6c757d' : '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          cursor: upgrading ? 'not-allowed' : 'pointer',
                          opacity: upgrading ? 0.7 : 1
                        }}
                      >
                        {upgrading ? 'Processando...' : 
                         plan.code === 'free' ? 'Usar Plano Grátis' : 
                         `Fazer Upgrade - ${getPlanPrice(plan.code)}`}
                      </button>
                    ) : (
                      <div style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        textAlign: 'center',
                        borderRadius: '6px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        Plano Atual
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  backgroundColor: '#f8d7da', 
                  color: '#721c24', 
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}