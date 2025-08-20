'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './page.module.css';

export default function HelpPage() {
  const { data: session } = useSession();
  const [selectedModel] = useState({ 
    provider: 'deepseek', 
    model: 'deepseek-chat', 
    name: 'DeepSeek Chat' 
  });

  const faqs = [
    {
      question: "Como começar a usar o Chatterfy?",
      answer: "Para começar, acesse nossa página principal e clique em 'Entrar' ou 'Cadastre-se gratuitamente'. Você receberá um link por email para acessar sua conta. Após o login, você pode começar a conversar com nossos modelos de IA imediatamente."
    },
    {
      question: "Posso usar o Chatterfy sem criar conta?",
      answer: "Sim! Você pode experimentar o Chatterfy anonimamente com até 5 mensagens gratuitas. Para uso ilimitado, recomendamos criar uma conta gratuita."
    },
    {
      question: "Quais modelos de IA estão disponíveis?",
      answer: "Oferecemos acesso a vários modelos de IA, incluindo GPT-4, DeepSeek, Claude (Anthropic), Gemini (Google) e modelos locais via Ollama. Você pode alternar entre eles usando o seletor de modelo no canto superior esquerdo."
    },
    {
      question: "Como funcionam os planos e limites?",
      answer: "O plano FREE inclui 2M tokens por mês e 200MB de armazenamento. O plano PRO oferece 10M tokens mensais, 2GB de armazenamento e recursos avançados por R$ 49,90/mês."
    },
    {
      question: "Posso fazer upload de arquivos?",
      answer: "Sim! Você pode fazer upload de documentos, imagens e outros arquivos para conversar sobre eles com a IA. Os limites de tamanho variam conforme seu plano."
    },
    {
      question: "Como gerencio minhas conversas?",
      answer: "Suas conversas ficam salvas no painel lateral esquerdo. Você pode criar novas conversas, renomear threads existentes, e organizar seu histórico de chats."
    },
    {
      question: "O que são tokens?",
      answer: "Tokens são unidades de medida para o processamento de texto pela IA. Aproximadamente 4 caracteres equivalem a 1 token. Cada mensagem enviada e resposta recebida consume tokens do seu limite mensal."
    },
    {
      question: "Como cancelar ou alterar meu plano?",
      answer: "Você pode gerenciar sua assinatura diretamente no painel de configurações. As alterações entram em vigor no próximo ciclo de cobrança."
    }
  ];

  const quickActions = [
    {
      title: "Criar Conta",
      description: "Cadastre-se gratuitamente para começar",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M15 3h4a2 2 0 011 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      href: "/auth"
    },
    {
      title: "Ver Planos",
      description: "Conheça nossos planos e preços",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      href: "/pricing"
    },
    {
      title: "Começar Chat",
      description: "Inicie uma conversa agora mesmo",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      href: "/"
    },
    {
      title: "Suporte",
      description: "Fale com nossa equipe de suporte",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M14 9V5a3 3 0 00-6 0v4M3 9h18l-1 10H4L3 9z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      href: "/support"
    }
  ];

  return (
    <div className={styles.pageWrapper}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>Chatterfy</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>Início</Link>
            <Link href="/pricing" className={styles.navLink}>Planos</Link>
            <Link href="/auth" className={styles.navButton}>Entrar</Link>
          </nav>
        </div>
      </header>
      
      <main className={styles.mainContent}>
        <div className={styles.helpContent}>
          <div className={styles.header}>
            <h1 className={styles.title}>Central de Ajuda</h1>
            <p className={styles.subtitle}>
              Encontre respostas para suas dúvidas e aprenda a usar melhor o Chatterfy
            </p>
          </div>

          <div className={styles.quickActions}>
            <h2>Começar Rapidamente</h2>
            <div className={styles.actionsGrid}>
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href} className={styles.actionCard}>
                  <div className={styles.actionIcon}>
                    {action.icon}
                  </div>
                  <div>
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className={styles.faq}>
            <h2>Perguntas Frequentes</h2>
            <div className={styles.faqList}>
              {faqs.map((faq, index) => (
                <details key={index} className={styles.faqItem}>
                  <summary className={styles.faqQuestion}>
                    {faq.question}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={styles.chevron}>
                      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </summary>
                  <div className={styles.faqAnswer}>
                    <p>{faq.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className={styles.contact}>
            <div className={styles.contactCard}>
              <h2>Ainda precisa de ajuda?</h2>
              <p>Nossa equipe está aqui para ajudá-lo com qualquer dúvida ou problema.</p>
              <div className={styles.contactActions}>
                <Link href="/support" className={styles.contactButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M14 9V5a3 3 0 00-6 0v4M3 9h18l-1 10H4L3 9z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Entrar em Contato
                </Link>
                <Link href="mailto:suporte@chatterfy.com" className={styles.contactButtonSecondary}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
                    <path d="m22 6-10 7L2 6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Enviar Email
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}