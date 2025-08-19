'use client';

import { useState } from 'react';
import styles from './pricing.module.css';
import '../globals.css';

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    description: 'Perfeito para testar nossa plataforma',
    features: [
      '3 mensagens por sessão',
      'Histórico temporário',
      'Suporte por email',
      'Modelos básicos'
    ],
    limitations: [
      'Limite de 3 mensagens',
      'Sem upload de arquivos',
      'Histórico não salvo'
    ],
    cta: 'Começar Grátis',
    ctaLink: '/',
    popular: false
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 'R$ 29',
    period: '/mês',
    description: 'Ideal para uso pessoal e pequenos projetos',
    features: [
      '100 mensagens por dia',
      'Histórico salvo',
      'Upload de arquivos (10MB)',
      'Todos os modelos',
      'Suporte prioritário'
    ],
    cta: 'Começar Teste Grátis',
    ctaLink: '/auth',
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 99',
    period: '/mês',
    description: 'Para profissionais e equipes pequenas',
    features: [
      'Mensagens ilimitadas',
      'Histórico ilimitado',
      'Upload de arquivos (100MB)',
      'Todos os modelos premium',
      'API access',
      'Suporte prioritário',
      'Integrações avançadas'
    ],
    cta: 'Começar Teste Grátis',
    ctaLink: '/auth',
    popular: false
  }
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
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
        {plans.map((plan) => (
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

              {plan.limitations && (
                <ul className={styles.limitations}>
                  {plan.limitations.map((limitation, index) => (
                    <li key={index}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M18 6L6 18M6 6l12 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {limitation}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.planFooter}>
              <a
                href={plan.ctaLink}
                className={`${styles.ctaButton} ${plan.popular ? styles.primary : styles.secondary}`}
              >
                {plan.cta}
              </a>
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
  );
}