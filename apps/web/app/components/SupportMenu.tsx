'use client';

import Link from 'next/link';
import styles from './UserMenu.module.css';

interface SupportMenuProps {
  onClose: () => void;
}

export default function SupportMenu({ onClose }: SupportMenuProps) {
  return (
    <div className={styles.dropdownMenu}>
      {/* Suporte via Link */}
      <Link 
        href="/support"
        className={styles.menuItem}
        onClick={onClose}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M14 9V5a3 3 0 00-6 0v4M3 9h18l-1 10H4L3 9z" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Suporte
      </Link>
    </div>
  );
}