import React from 'react';

interface ProviderIconProps {
  provider: string;
  size?: number;
  className?: string;
}

export default function ProviderIcon({ provider, size = 20, className = '' }: ProviderIconProps) {
  const iconProps = {
    width: size,
    height: size,
    className: className,
    style: { flexShrink: 0 }
  };

  switch (provider.toLowerCase()) {
    case 'deepseek':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="none">
          {/* Logo inspirado no DeepSeek - design moderno com gradiente */}
          <defs>
            <linearGradient id="deepseekGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill="url(#deepseekGradient)" />
          <path
            d="M8 9h8M8 13h6M8 17h4"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="16" cy="8" r="2" fill="white" opacity="0.8" />
        </svg>
      );

    case 'openai':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="none">
          {/* Logo inspirado no OpenAI */}
          <defs>
            <linearGradient id="openaiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#10a37f', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#1a7f64', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill="url(#openaiGradient)" />
          <path
            d="M8 8l8 8M16 8l-8 8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" fill="none" />
        </svg>
      );

    case 'anthropic':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="none">
          {/* Logo inspirado no Anthropic */}
          <defs>
            <linearGradient id="anthropicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#d97706', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#ea580c', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill="url(#anthropicGradient)" />
          <path
            d="M12 6l4 12M12 6l-4 12M8 16h8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'google':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="none">
          {/* Logo inspirado no Google */}
          <circle cx="12" cy="12" r="10" fill="#4285f4" />
          <path
            d="M12 8v8M8 12h8"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="10" cy="10" r="1.5" fill="white" />
          <circle cx="14" cy="14" r="1.5" fill="white" />
        </svg>
      );

    case 'ollama':
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="none">
          {/* Logo inspirado no Ollama */}
          <defs>
            <linearGradient id="ollamaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#0f172a', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#334155', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="10" fill="url(#ollamaGradient)" />
          <rect x="8" y="8" width="8" height="8" rx="2" stroke="white" strokeWidth="1.5" fill="none" />
          <circle cx="10" cy="10" r="1" fill="white" />
          <circle cx="14" cy="14" r="1" fill="white" />
        </svg>
      );

    default:
      // Ícone genérico para providers desconhecidos
      return (
        <svg {...iconProps} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#6b7280" />
          <path
            d="M12 6v6l4 2"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}