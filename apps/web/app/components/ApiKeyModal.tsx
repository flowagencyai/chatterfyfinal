'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ApiKeyModal.module.css';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'regenerate';
}

export default function ApiKeyModal({ isOpen, onClose, onSuccess, mode }: ApiKeyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['chat', 'files']);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const permissions = [
    { id: 'chat', label: 'Chat Completions', description: 'Enviar mensagens e obter respostas da IA' },
    { id: 'files', label: 'File Management', description: 'Upload e download de arquivos' },
    { id: 'embeddings', label: 'Embeddings', description: 'Gerar embeddings de texto' },
    { id: 'admin', label: 'Admin Access', description: 'Acesso a funcionalidades administrativas' }
  ];

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId) 
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      // Primeiro verificar o status da API key
      const statusResponse = await fetch('/api/user/api-key-status');
      const statusData = await statusResponse.json();
      
      if (!statusData.success) {
        throw new Error('Não foi possível verificar o status da API key');
      }

      // Se já existe uma chave, mostrar ela
      if (statusData.hasApiKey && mode === 'create') {
        // Buscar a chave atual do backend
        const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787'}/v1/user/generate-api-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Org-Id': statusData.orgId,
            'X-User-Id': 'web-user'
          },
          body: JSON.stringify({
            permissions: selectedPermissions
          })
        });

        const backendData = await backendResponse.json();
        
        if (backendData.success) {
          setGeneratedKey(backendData.apiKey);
        } else {
          throw new Error(backendData.error || 'Falha ao obter chave');
        }
      } else {
        // Gerar nova chave via backend
        const endpoint = mode === 'create' ? 'generate-api-key' : 'regenerate-api-key';
        const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8787'}/v1/user/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Org-Id': statusData.orgId,
            'X-User-Id': 'web-user'
          },
          body: JSON.stringify({
            permissions: selectedPermissions
          })
        });

        const backendData = await backendResponse.json();
        
        if (backendData.success) {
          setGeneratedKey(backendData.apiKey);
        } else {
          throw new Error(backendData.error || 'Falha ao gerar chave');
        }
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      alert('Erro ao gerar chave de API. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
    setGeneratedKey(null);
    setCopied(false);
  };

  const modalContent = (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{mode === 'create' ? 'Gerar Nova Chave de API' : 'Regenerar Chave de API'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {!generatedKey ? (
            <>
              <div className={styles.section}>
                <h3>Configurar Permissões</h3>
                <p className={styles.description}>
                  Selecione as permissões que esta chave de API deve ter. Você pode alterar isso mais tarde.
                </p>
                
                <div className={styles.permissions}>
                  {permissions.map(permission => (
                    <label key={permission.id} className={styles.permissionItem}>
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handlePermissionToggle(permission.id)}
                        className={styles.checkbox}
                      />
                      <div className={styles.permissionInfo}>
                        <span className={styles.permissionLabel}>{permission.label}</span>
                        <span className={styles.permissionDescription}>{permission.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {mode === 'regenerate' && (
                <div className={styles.warning}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9v4M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <strong>Atenção:</strong> Regenerar invalidará a chave atual e pode quebrar integrações existentes.
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.section}>
              <h3>Sua Nova Chave de API</h3>
              <p className={styles.description}>
                ⚠️ <strong>Esta é a única vez que você verá esta chave.</strong> Copie e armazene em local seguro.
              </p>
              
              <div className={styles.keyContainer}>
                <code className={styles.generatedKey}>{generatedKey}</code>
                <button 
                  className={styles.copyButton}
                  onClick={handleCopy}
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Copiado!
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Copiar
                    </>
                  )}
                </button>
              </div>

              <div className={styles.permissionsSummary}>
                <h4>Permissões configuradas:</h4>
                <div className={styles.permissionTags}>
                  {selectedPermissions.map(permId => {
                    const perm = permissions.find(p => p.id === permId);
                    return (
                      <span key={permId} className={styles.permissionTag}>
                        {perm?.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancelar
          </button>
          {!generatedKey ? (
            <button 
              className={styles.generateButton} 
              onClick={handleGenerate}
              disabled={isLoading || selectedPermissions.length === 0}
            >
              {isLoading ? (
                <>
                  <div className={styles.spinner}></div>
                  Gerando...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {mode === 'create' ? 'Gerar Chave' : 'Regenerar Chave'}
                </>
              )}
            </button>
          ) : (
            <button className={styles.finishButton} onClick={handleFinish}>
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}