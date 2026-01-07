import { ReactNode } from 'react';
import styles from './Chip.module.css';

interface ChipProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ children, active = false, onClick, className = '' }: ChipProps) {
  return (
    <button
      className={`${styles.chip} ${active ? styles.active : ''} ${className}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

