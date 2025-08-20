'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import styles from './MessageRenderer.module.css';

interface MessageRendererProps {
  content: string;
  className?: string;
}

export default function MessageRenderer({ content, className = '' }: MessageRendererProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (codeContent: string) => {
    try {
      const cleanCode = String(codeContent).replace(/\n$/, '');
      await navigator.clipboard.writeText(cleanCode);
      setCopiedCode(cleanCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar código:', error);
    }
  };
  return (
    <div className={`${styles.messageRenderer} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Código inline
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            if (inline) {
              return (
                <code className={styles.inlineCode} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <div className={styles.codeBlockContainer}>
                <div className={styles.codeBlockHeader}>
                  <div className={styles.codeBlockDots}>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                    <span className={styles.dot}></span>
                  </div>
                  {language && (
                    <span className={styles.codeBlockLanguage}>{language}</span>
                  )}
                  <button
                    className={styles.codeBlockCopy}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopyCode(String(children));
                    }}
                    title="Copiar código"
                  >
                    {copiedCode === String(children).replace(/\n$/, '') ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <rect
                          x="9"
                          y="9"
                          width="13"
                          height="13"
                          rx="2"
                          ry="2"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                        />
                        <path
                          d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={language || 'text'}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    borderRadius: '0 0 8px 8px',
                    background: '#1e1e1e',
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            );
          },

          // Parágrafos
          p({ children }) {
            return <p className={styles.paragraph}>{children}</p>;
          },

          // Cabeçalhos
          h1({ children }) {
            return <h1 className={styles.heading1}>{children}</h1>;
          },
          h2({ children }) {
            return <h2 className={styles.heading2}>{children}</h2>;
          },
          h3({ children }) {
            return <h3 className={styles.heading3}>{children}</h3>;
          },
          h4({ children }) {
            return <h4 className={styles.heading4}>{children}</h4>;
          },

          // Listas
          ul({ children }) {
            return <ul className={styles.unorderedList}>{children}</ul>;
          },
          ol({ children }) {
            return <ol className={styles.orderedList}>{children}</ol>;
          },
          li({ children }) {
            return <li className={styles.listItem}>{children}</li>;
          },

          // Blockquote
          blockquote({ children }) {
            return <blockquote className={styles.blockquote}>{children}</blockquote>;
          },

          // Tabelas
          table({ children }) {
            return (
              <div className={styles.tableContainer}>
                <table className={styles.table}>{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className={styles.tableHead}>{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className={styles.tableBody}>{children}</tbody>;
          },
          tr({ children }) {
            return <tr className={styles.tableRow}>{children}</tr>;
          },
          th({ children }) {
            return <th className={styles.tableHeader}>{children}</th>;
          },
          td({ children }) {
            return <td className={styles.tableCell}>{children}</td>;
          },

          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={styles.externalIcon}>
                  <path
                    d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            );
          },

          // Separadores
          hr() {
            return <hr className={styles.separator} />;
          },

          // Texto forte/negrito
          strong({ children }) {
            return <strong className={styles.strong}>{children}</strong>;
          },

          // Texto em itálico
          em({ children }) {
            return <em className={styles.emphasis}>{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}