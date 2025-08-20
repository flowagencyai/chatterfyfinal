'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './page.module.css';

export default function TermsPage() {
  const { data: session } = useSession();
  const [selectedModel] = useState({ 
    provider: 'deepseek', 
    model: 'deepseek-chat', 
    name: 'DeepSeek Chat' 
  });

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
        <div className={styles.termsContent}>
          <div className={styles.header}>
            <h1 className={styles.title}>Termos de Uso e Políticas</h1>
            <p className={styles.subtitle}>
              Transparência e confiança em cada interação com nossa plataforma
            </p>
            <div className={styles.lastUpdated}>
              Última atualização: 20 de agosto de 2025
            </div>
          </div>

          <div className={styles.navigation}>
            <h2>Navegação Rápida</h2>
            <div className={styles.navGrid}>
              <a href="#termos-uso" className={styles.navItem}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Termos de Uso
              </a>
              <a href="#politica-privacidade" className={styles.navItem}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Privacidade
              </a>
              <a href="#cookies" className={styles.navItem}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="1" fill="currentColor"/>
                  <circle cx="8" cy="8" r="1" fill="currentColor"/>
                  <circle cx="16" cy="16" r="1" fill="currentColor"/>
                </svg>
                Cookies
              </a>
              <a href="#uso-responsavel" className={styles.navItem}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Uso Responsável
              </a>
            </div>
          </div>

          <div className={styles.sections}>
            {/* Termos de Uso */}
            <section id="termos-uso" className={styles.section}>
              <h2>1. Termos de Uso</h2>
              
              <div className={styles.subsection}>
                <h3>1.1 Aceitação dos Termos</h3>
                <p>
                  Ao acessar e usar a plataforma Chatterfy, você concorda em estar vinculado a estes Termos de Uso. 
                  Se você não concorda com qualquer parte destes termos, não deve usar nossos serviços.
                </p>
              </div>

              <div className={styles.subsection}>
                <h3>1.2 Descrição do Serviço</h3>
                <p>O Chatterfy é uma plataforma de inteligência artificial que oferece:</p>
                <ul>
                  <li>Conversas com múltiplos modelos de IA (GPT-4, Claude, Gemini, DeepSeek)</li>
                  <li>Upload e análise de documentos e imagens</li>
                  <li>Gerenciamento de conversas e histórico</li>
                  <li>Integração com APIs de terceiros</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3>1.3 Planos e Pagamentos</h3>
                <p>Oferecemos diferentes planos de serviço:</p>
                <ul>
                  <li><strong>Plano FREE:</strong> 2M tokens/mês, 200MB armazenamento</li>
                  <li><strong>Plano PRO:</strong> 10M tokens/mês, 2GB armazenamento</li>
                </ul>
                <p>
                  Os pagamentos são processados através do Stripe. Cancelamentos podem ser feitos a qualquer momento 
                  através do painel de configurações.
                </p>
              </div>

              <div className={styles.subsection}>
                <h3>1.4 Limitações de Uso</h3>
                <p>Você se compromete a NÃO usar a plataforma para:</p>
                <ul>
                  <li>Atividades ilegais ou não autorizadas</li>
                  <li>Gerar conteúdo ofensivo, discriminatório ou prejudicial</li>
                  <li>Violar direitos de propriedade intelectual</li>
                  <li>Tentar contornar limitações técnicas</li>
                  <li>Compartilhar credenciais de acesso</li>
                </ul>
              </div>
            </section>

            {/* Política de Privacidade */}
            <section id="politica-privacidade" className={styles.section}>
              <h2>2. Política de Privacidade</h2>
              
              <div className={styles.subsection}>
                <h3>2.1 Informações que Coletamos</h3>
                <p>Coletamos as seguintes informações:</p>
                <ul>
                  <li><strong>Dados de conta:</strong> Email, nome, preferências</li>
                  <li><strong>Dados de uso:</strong> Conversas, uploads, métricas de utilização</li>
                  <li><strong>Dados técnicos:</strong> IP, navegador, dispositivo</li>
                  <li><strong>Dados de pagamento:</strong> Processados pelo Stripe (não armazenamos)</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3>2.2 Como Usamos suas Informações</h3>
                <p>Utilizamos seus dados para:</p>
                <ul>
                  <li>Fornecer e melhorar nossos serviços</li>
                  <li>Personalizar sua experiência</li>
                  <li>Processar pagamentos e gerenciar assinaturas</li>
                  <li>Comunicar atualizações e suporte</li>
                  <li>Cumprir obrigações legais</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3>2.3 Seus Direitos</h3>
                <p>Você tem o direito de:</p>
                <ul>
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir informações imprecisas</li>
                  <li>Solicitar exclusão de sua conta</li>
                  <li>Exportar suas conversas</li>
                  <li>Restringir ou se opor ao processamento</li>
                </ul>
              </div>
            </section>

            {/* Política de Cookies */}
            <section id="cookies" className={styles.section}>
              <h2>3. Política de Cookies</h2>
              
              <div className={styles.subsection}>
                <h3>3.1 O que são Cookies</h3>
                <p>
                  Cookies são pequenos arquivos de texto armazenados em seu dispositivo quando você visita nosso site. 
                  Eles nos ajudam a melhorar sua experiência e fornecer serviços personalizados.
                </p>
              </div>

              <div className={styles.subsection}>
                <h3>3.2 Tipos de Cookies que Usamos</h3>
                <ul>
                  <li><strong>Essenciais:</strong> Necessários para funcionamento básico</li>
                  <li><strong>Funcionais:</strong> Lembram suas preferências</li>
                  <li><strong>Analíticos:</strong> Nos ajudam a entender como você usa o site</li>
                  <li><strong>Sessão anônima:</strong> Para usuários não cadastrados</li>
                </ul>
              </div>
            </section>

            {/* Uso Responsável da IA */}
            <section id="uso-responsavel" className={styles.section}>
              <h2>4. Diretrizes de Uso Responsável da IA</h2>
              
              <div className={styles.subsection}>
                <h3>4.1 Compromisso com IA Ética</h3>
                <p>Promovemos o uso ético e responsável da inteligência artificial. Nossos usuários devem:</p>
                <ul>
                  <li>Usar a IA para fins construtivos e benéficos</li>
                  <li>Verificar informações importantes geradas pela IA</li>
                  <li>Respeitar direitos autorais e propriedade intelectual</li>
                  <li>Não tentar gerar conteúdo prejudicial ou ilegal</li>
                </ul>
              </div>

              <div className={styles.subsection}>
                <h3>4.2 Limitações da IA</h3>
                <p>É importante entender que:</p>
                <ul>
                  <li>Respostas da IA podem conter imprecisões</li>
                  <li>A IA não substitui julgamento profissional</li>
                  <li>Informações podem estar desatualizadas</li>
                  <li>Sempre verifique informações críticas</li>
                </ul>
              </div>
            </section>

            {/* Contato */}
            <section className={styles.section}>
              <h2>5. Contato e Suporte</h2>
              
              <div className={styles.subsection}>
                <h3>5.1 Como Entrar em Contato</h3>
                <p>Para dúvidas sobre estes termos ou nossa plataforma:</p>
                <ul>
                  <li><strong>Email:</strong> legal@chatterfy.com</li>
                  <li><strong>Suporte:</strong> suporte@chatterfy.com</li>
                  <li><strong>Central de Ajuda:</strong> <Link href="/help">chatterfy.com/help</Link></li>
                  <li><strong>Formulário de Suporte:</strong> <Link href="/support">chatterfy.com/support</Link></li>
                </ul>
              </div>
            </section>
          </div>

          {/* Call to Action */}
          <div className={styles.cta}>
            <div className={styles.ctaCard}>
              <h2>Pronto para começar?</h2>
              <p>
                Agora que você conhece nossos termos e políticas, está pronto para explorar 
                todo o potencial da inteligência artificial com segurança e transparência.
              </p>
              <div className={styles.ctaActions}>
                <Link href="/auth" className={styles.ctaButton}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15 3h4a2 2 0 011 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Criar Conta Gratuita
                </Link>
                <Link href="/help" className={styles.ctaButtonSecondary}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9.09 9a3 3 0 515.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Consultar FAQ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}