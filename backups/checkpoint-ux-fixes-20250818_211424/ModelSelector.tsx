'use client';

import { useState } from 'react';
import styles from './ModelSelector.module.css';

const MODELS = [
  {
    provider: 'deepseek',
    model: 'deepseek-chat',
    name: 'DeepSeek Chat',
    description: 'Modelo rápido e eficiente'
  },
  {
    provider: 'deepseek', 
    model: 'deepseek-coder',
    name: 'DeepSeek Coder',
    description: 'Especialista em programação'
  },
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Modelo compacto da OpenAI'
  },
  {
    provider: 'openai',
    model: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Modelo premium da OpenAI'
  }
];

interface ModelSelectorProps {
  selectedModel: { provider: string; model: string; name: string };
  onModelChange: (model: { provider: string; model: string; name: string }) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleModelSelect = (model: typeof MODELS[0]) => {
    onModelChange({
      provider: model.provider,
      model: model.model,
      name: model.name
    });
    setIsOpen(false);
  };

  return (
    <div className={styles.modelSelector}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.trigger}
        aria-label="Selecionar modelo"
      >
        <span className={styles.modelName}>{selectedModel.name}</span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none"
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown}>
            <div className={styles.header}>
              <h3>Selecione o modelo</h3>
            </div>
            <div className={styles.modelList}>
              {MODELS.map((model) => (
                <button
                  key={`${model.provider}-${model.model}`}
                  onClick={() => handleModelSelect(model)}
                  className={`${styles.modelItem} ${
                    selectedModel.model === model.model && selectedModel.provider === model.provider
                      ? styles.selected
                      : ''
                  }`}
                >
                  <div className={styles.modelInfo}>
                    <div className={styles.modelTitle}>{model.name}</div>
                    <div className={styles.modelDescription}>{model.description}</div>
                  </div>
                  {selectedModel.model === model.model && selectedModel.provider === model.provider && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}