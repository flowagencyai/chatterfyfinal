'use client';

import { useState, useEffect } from 'react';
import styles from './ReasoningProgress.module.css';

const reasoningSteps = [
  "Analisando a solicitação do usuário...",
  "Identificando os requisitos principais...",
  "Considerando diferentes abordagens...",
  "Estruturando a melhor solução...",
  "Validando a resposta...",
  "Preparando resposta detalhada...",
  "Finalizando formatação..."
];

export default function ReasoningProgress() {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayedSteps, setDisplayedSteps] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        if (next < reasoningSteps.length) {
          setDisplayedSteps(current => [...current, reasoningSteps[next - 1]]);
          return next;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1200); // Nova etapa a cada 1.2 segundos

    // Primeira etapa imediata
    setDisplayedSteps([reasoningSteps[0]]);

    return () => clearInterval(interval);
  }, []);

  // Controlar quantos steps mostrar
  const visibleSteps = isExpanded ? displayedSteps : displayedSteps.slice(-3);
  const hasHiddenSteps = displayedSteps.length > 3 && !isExpanded;

  return (
    <div className={styles.reasoningProgress}>
      {/* Botão de expansão quando há passos ocultos */}
      {hasHiddenSteps && (
        <button 
          className={styles.expandButton}
          onClick={() => setIsExpanded(true)}
          title="Ver todos os passos"
        >
          <span className={styles.hiddenCount}>+{displayedSteps.length - 3} passos anteriores</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 15l-6-6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* Botão de recolher quando expandido */}
      {isExpanded && displayedSteps.length > 3 && (
        <button 
          className={styles.collapseButton}
          onClick={() => setIsExpanded(false)}
          title="Mostrar apenas últimos 3 passos"
        >
          <span>Recolher</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* Steps do raciocínio */}
      {visibleSteps.map((step, visibleIndex) => {
        // Calcular index real baseado no array original
        const realIndex = isExpanded ? visibleIndex : (displayedSteps.length - 3 + visibleIndex);
        const isCurrentStep = realIndex === displayedSteps.length - 1;
        
        return (
          <div 
            key={realIndex} 
            className={`${styles.reasoningStep} ${
              isCurrentStep ? styles.current : styles.completed
            }`}
          >
            <div className={styles.stepIndicator}>
              {isCurrentStep ? (
                <div className={styles.thinkingIndicator}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className={styles.stepText}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}