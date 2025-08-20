'use client';

import { useState, useEffect } from 'react';
import styles from './ModelSelector.module.css';

interface ModelInfo {
  provider: string;
  model: string;
  name: string;
  description: string;
}

// Fallback models se a API falhar
const FALLBACK_MODELS: ModelInfo[] = [
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
  const [models, setModels] = useState<ModelInfo[]>(FALLBACK_MODELS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        setIsLoading(true);
        setError(null);
        
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787';
        const response = await fetch(`${apiBase}/v1/models`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.models && Array.isArray(data.models) && data.models.length > 0) {
          setModels(data.models);
          console.log(`✅ Modelos carregados: ${data.models.length} de ${Object.keys(data.providers || {}).length} providers`);
        } else {
          console.warn('⚠️ Nenhum modelo retornado da API, usando fallback');
          setModels(FALLBACK_MODELS);
        }
      } catch (err) {
        console.error('❌ Erro ao carregar modelos:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setModels(FALLBACK_MODELS);
      } finally {
        setIsLoading(false);
      }
    }

    fetchModels();
  }, []);

  const handleModelSelect = (model: ModelInfo) => {
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
              {isLoading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner} />
                  <span>Carregando modelos...</span>
                </div>
              ) : error ? (
                <div className={styles.errorState}>
                  <span>⚠️ Erro ao carregar modelos</span>
                  <small>{error}</small>
                  <small>Usando modelos padrão</small>
                </div>
              ) : null}
              {models.map((model) => (
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