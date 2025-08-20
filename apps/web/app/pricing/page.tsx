'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from './pricing.module.css';
import '../globals.css';
import { StripeProvider } from '../components/StripeProvider';

// Plans serão carregados dinamicamente da API

export default function PricingPage() {
  const { data: session } = useSession();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    if (session?.user) {
      fetchCurrentPlan();
    }
  }, [session]);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/v1/plans`);
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPlan = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/v1/user/plan`, {
        headers: {
          'X-Org-Id': session.user.id,
          'X-User-Id': session.user.id
        }
      });
      
      const data = await response.json();
      if (data.plan) {
        setCurrentPlan(data.plan.code);
      }
    } catch (error) {
      console.error('Error fetching current plan:', error);
    }
  };

  const handleUpgrade = async (planCode: string) => {
    const isFreePlan = planCode.toLowerCase() === 'free';
    
    // Para usuários anônimos - redirecionar para cadastro sem alerts
    if (!session?.user?.email) {
      if (isFreePlan) {
        localStorage.setItem('pending_upgrade', 'free');
      }
      window.location.href = '/auth';
      return;
    }

    // Para plano FREE de usuário logado - processar silenciosamente
    if (isFreePlan) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/v1/user/upgrade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Org-Id': session.user.id || '',
            'X-User-Id': session.user.id || ''
          },
          body: JSON.stringify({
            planCode,
            email: session.user.email,
            name: session.user.name
          })
        });

        const data = await response.json();

        if (data.success) {
          // Redirecionar para dashboard sem alert
          window.location.href = '/';
        } else {
          console.error('Free plan upgrade failed:', data.error);
        }
      } catch (error) {
        console.error('Free plan upgrade error:', error);
      }
      return;
    }

    // Para planos pagos - usar Stripe
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/v1/user/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': session.user.id || '',
          'X-User-Id': session.user.id || ''
        },
        body: JSON.stringify({
          planCode,
          email: session.user.email,
          name: session.user.name
        })
      });

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.error || 'Failed to process upgrade');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    }
  };

  const formatPlanForDisplay = (plan: any) => {
    const isCurrentPlan = currentPlan === plan.code;
    const isFree = plan.code.toLowerCase() === 'free';
    const isPro = plan.code.toLowerCase() === 'pro';
    const isLoggedIn = !!session?.user?.email;
    
    // Lógica inteligente para CTA
    let cta = 'Começar';
    let ctaDisabled = false;
    let ctaStyle = 'primary';
    
    if (isCurrentPlan) {
      cta = 'Plano Atual';
      ctaDisabled = true;
      ctaStyle = 'current';
    } else if (isFree) {
      if (isLoggedIn) {
        // Usuário logado pode fazer downgrade para FREE
        cta = 'Mudar para Grátis';
        ctaStyle = 'secondary';
      } else {
        // Usuário anônimo
        cta = 'Começar Grátis';
        ctaStyle = 'secondary';
      }
    } else if (isPro) {
      if (isLoggedIn) {
        cta = 'Fazer Upgrade';
        ctaStyle = 'primary';
      } else {
        cta = 'Assinar Pro';
        ctaStyle = 'primary';
      }
    }
    
    // Gerar features dinamicamente baseado nos dados reais do plano
    const generateDynamicFeatures = () => {
      const features = [
        `${(plan.monthlyCreditsTokens / 1000000).toFixed(0)}M tokens por mês`,
        `${plan.storageLimitMB >= 1000 ? (plan.storageLimitMB / 1000).toFixed(0) + 'GB' : plan.storageLimitMB + 'MB'} de armazenamento`,
        `Upload até ${plan.maxFileSizeMB}MB por arquivo`
      ];
      
      // Adicionar features baseadas no objeto features do plano
      if (plan.features.rag) features.push('RAG (Retrieval Augmented Generation)');
      if (plan.features.s3) features.push('Armazenamento na nuvem');
      if (plan.features.customModels) features.push('Modelos customizados');
      if (plan.features.prioritySupport) features.push('Suporte prioritário');
      
      // Features padrão baseadas no tipo de plano
      if (isFree) {
        features.push('5 mensagens anônimas');
        features.push('Modelos básicos de IA');
        features.push('Suporte por email');
      } else {
        features.push('Modelos premium');
        features.push('Histórico completo');
        features.push('API de integração');
        if (!plan.features.prioritySupport) features.push('Suporte por email');
      }
      
      return features;
    };

    return {
      id: plan.code.toLowerCase(),
      name: plan.name,
      price: isFree ? 'R$ 0' : 'R$ 49,90',
      period: '/mês',
      description: isFree ? 
        'Perfeito para testar nossa plataforma' : 
        'Para profissionais e empresas',
      features: generateDynamicFeatures(),
      cta: cta,
      ctaDisabled: ctaDisabled,
      ctaStyle: ctaStyle,
      popular: isPro,
      planCode: plan.code,
      isCurrentPlan: isCurrentPlan
    };
  };

  if (loading) {
    return (
      <div className={styles.pricingPage}>
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</div>
          <p>Carregando planos...</p>
        </div>
      </div>
    );
  }

  const displayPlans = plans.map(formatPlanForDisplay);

  return (
    <StripeProvider>
      <div className={styles.pricingPage}>
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
        
        <nav className={styles.nav}>
          <a href="/auth">Login</a>
        </nav>
      </div>

      {/* Hero Section */}
      <div className={styles.hero}>
        <h1>Escolha o plano ideal para você</h1>
        <p>
          Comece grátis e faça upgrade conforme suas necessidades crescem. 
          Todos os planos incluem 7 dias de teste grátis.
        </p>

        {/* Billing Toggle */}
        <div className={styles.billingToggle}>
          <button
            className={billingPeriod === 'monthly' ? styles.active : ''}
            onClick={() => setBillingPeriod('monthly')}
          >
            Mensal
          </button>
          <button
            className={billingPeriod === 'yearly' ? styles.active : ''}
            onClick={() => setBillingPeriod('yearly')}
          >
            Anual
            <span className={styles.discount}>-20%</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className={styles.plansGrid}>
        {displayPlans.map((plan) => (
          <div
            key={plan.id}
            className={`${styles.planCard} ${plan.popular ? styles.popular : ''}`}
          >
            {plan.popular && <div className={styles.popularBadge}>Mais Popular</div>}
            
            <div className={styles.planHeader}>
              <h3>{plan.name}</h3>
              <div className={styles.price}>
                <span className={styles.priceAmount}>
                  {billingPeriod === 'yearly' && plan.id !== 'free'
                    ? `R$ ${Math.floor(parseInt(plan.price.replace('R$ ', '')) * 0.8)}`
                    : plan.price
                  }
                </span>
                <span className={styles.pricePeriod}>
                  {billingPeriod === 'yearly' && plan.id !== 'free' ? '/ano' : plan.period}
                </span>
              </div>
              <p className={styles.description}>{plan.description}</p>
            </div>

            <div className={styles.planBody}>
              <ul className={styles.features}>
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

            </div>

            <div className={styles.planFooter}>
              <button
                onClick={() => plan.ctaDisabled ? null : handleUpgrade(plan.planCode)}
                disabled={plan.ctaDisabled}
                className={`${styles.ctaButton} ${
                  plan.ctaStyle === 'current' ? styles.current : 
                  plan.ctaStyle === 'primary' ? styles.primary : 
                  styles.secondary
                }`}
                style={{ 
                  opacity: plan.ctaDisabled ? 0.7 : 1,
                  cursor: plan.ctaDisabled ? 'default' : 'pointer',
                  // Estilo especial para plano atual
                  ...(plan.isCurrentPlan ? {
                    background: '#f3f4f6',
                    color: '#6b7280',
                    border: '2px solid #d1d5db'
                  } : {})
                }}
              >
                {plan.isCurrentPlan && (
                  <span style={{ marginRight: '8px' }}>✓</span>
                )}
                {plan.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className={styles.faq}>
        <h2>Perguntas Frequentes</h2>
        
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3>Como funciona o teste gratuito?</h3>
            <p>
              Todos os planos pagos incluem 7 dias de teste gratuito. 
              Você pode cancelar a qualquer momento durante o período de teste.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3>Posso fazer upgrade a qualquer momento?</h3>
            <p>
              Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
              As mudanças serão aplicadas no próximo ciclo de cobrança.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3>Os dados são mantidos seguros?</h3>
            <p>
              Sim, utilizamos criptografia de ponta e seguimos as melhores práticas de segurança. 
              Seus dados nunca são compartilhados com terceiros.
            </p>
          </div>
          
          <div className={styles.faqItem}>
            <h3>Existe desconto para estudantes?</h3>
            <p>
              Sim! Oferecemos 50% de desconto em todos os planos para estudantes e educadores. 
              Entre em contato para mais informações.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>
          Tem dúvidas? <a href="mailto:suporte@chatgpt-clone.com">Entre em contato</a>
        </p>
      </div>
      </div>
    </StripeProvider>
  );
}