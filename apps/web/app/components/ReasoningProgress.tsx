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

  return (
    <div className={styles.reasoningProgress}>
      {displayedSteps.map((step, index) => (
        <div 
          key={index} 
          className={`${styles.reasoningStep} ${
            index === displayedSteps.length - 1 ? styles.current : styles.completed
          }`}
        >
          <div className={styles.stepIndicator}>
            {index === displayedSteps.length - 1 ? (
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
      ))}
    </div>
  );
}