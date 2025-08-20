import styles from './empty-state.module.css';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  suggestion?: string;
  compact?: boolean;
}

export default function EmptyState({ icon, title, description, suggestion, compact = false }: EmptyStateProps) {
  return (
    <div className={`${styles.emptyState} ${compact ? styles.compact : ''}`}>
      <div className={styles.iconContainer}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {suggestion && (
        <div className={styles.suggestion}>
          <span className={styles.suggestionIcon}>💡</span>
          <span className={styles.suggestionText}>{suggestion}</span>
        </div>
      )}
    </div>
  );
}