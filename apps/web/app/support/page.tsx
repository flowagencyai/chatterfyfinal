'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './page.module.css';

export default function SupportPage() {
  const { data: session } = useSession();
  const [selectedModel] = useState({ 
    provider: 'deepseek', 
    model: 'deepseek-chat', 
    name: 'DeepSeek Chat' 
  });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'geral',
    priority: 'normal',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simular envio (implementar com API real posteriormente)
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: 'geral',
        priority: 'normal',
        message: ''
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const supportOptions = [
    {
      title: "Chat ao Vivo",
      description: "Fale conosco em tempo real",
      available: "Seg-Sex: 9h-18h",
      action: "Iniciar Chat",
      href: "#",
      status: "online"
    },
    {
      title: "Email",
      description: "Envie sua dúvida por email",
      available: "Resposta em até 24h",
      action: "Enviar Email",
      href: "mailto:suporte@chatterfy.com",
      status: "available"
    },
    {
      title: "Central de Ajuda",
      description: "Encontre respostas rápidas",
      available: "Disponível 24/7",
      action: "Acessar FAQ",
      href: "/help",
      status: "available"
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
            <Link href="/help" className={styles.navLink}>Ajuda</Link>
            <Link href="/auth" className={styles.navButton}>Entrar</Link>
          </nav>
        </div>
      </header>
      
      <main className={styles.mainContent}>
        <div className={styles.supportContent}>
          <div className={styles.header}>
            <h1 className={styles.title}>Suporte Chatterfy</h1>
            <p className={styles.subtitle}>
              Como podemos ajudá-lo hoje? Nossa equipe está pronta para resolver suas dúvidas.
            </p>
          </div>

          {/* Opções de Suporte */}
          <div className={styles.supportOptions}>
            <h2>Escolha como prefere falar conosco</h2>
            <div className={styles.optionsGrid}>
              {supportOptions.map((option, index) => (
                <div key={index} className={styles.optionCard}>
                  <div className={styles.optionHeader}>
                    <div className={`${styles.status} ${styles[option.status]}`}>
                      {option.status === 'online' ? 'Online' : 'Disponível'}
                    </div>
                  </div>
                  
                  <h3>{option.title}</h3>
                  <p>{option.description}</p>
                  <div className={styles.availability}>{option.available}</div>
                  
                  {option.href === "#" ? (
                    <button className={styles.optionButton} disabled>
                      {option.action}
                    </button>
                  ) : (
                    <Link href={option.href} className={styles.optionButton}>
                      {option.action}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Formulário de Contato */}
          <div className={styles.contactForm}>
            <div className={styles.formHeader}>
              <h2>Envie sua mensagem</h2>
              <p>Preencha o formulário abaixo e nossa equipe retornará em breve</p>
            </div>

            {submitStatus === 'success' && (
              <div className={styles.successMessage}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
                  <path d="m9 11 3 3L22 4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <div>
                  <h3>Mensagem enviada com sucesso!</h3>
                  <p>Recebemos sua solicitação e retornaremos em até 24 horas.</p>
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className={styles.errorMessage}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                  <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <div>
                  <h3>Erro ao enviar mensagem</h3>
                  <p>Tente novamente ou use uma das outras opções de contato.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Nome completo *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Seu nome"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="category">Categoria</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="geral">Questão Geral</option>
                    <option value="tecnico">Suporte Técnico</option>
                    <option value="faturamento">Faturamento</option>
                    <option value="funcionalidade">Nova Funcionalidade</option>
                    <option value="bug">Reportar Bug</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="priority">Prioridade</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject">Assunto *</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  placeholder="Descreva brevemente sua solicitação"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message">Mensagem *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  placeholder="Descreva detalhadamente sua dúvida ou problema..."
                />
              </div>

              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className={styles.spinner}></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="m22 2-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Enviar Mensagem
                    </>
                  )}
                </button>
                
                <Link href="/help" className={styles.helpButton}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Consultar FAQ
                </Link>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}