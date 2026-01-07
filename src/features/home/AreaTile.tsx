import { Card } from '../../core/ui/Card';
import { Chip } from '../../core/ui/Chip';
import styles from './AreaTile.module.css';

export type AreaStatus = 'good' | 'due-today' | 'overdue';

interface AreaTileProps {
  name: string;
  illustration: string;
  status: AreaStatus;
  dueCount?: number;
  backgroundColor?: 'warm' | 'blue' | 'mint';
  onClick?: () => void;
}

export function AreaTile({
  name,
  illustration,
  status,
  dueCount,
  backgroundColor = 'warm',
  onClick,
}: AreaTileProps) {
  const statusDotColor = {
    good: '#10b981',
    'due-today': '#f59e0b',
    overdue: '#ef4444',
  }[status];

  return (
    <Card
      className={`${styles.areaTile} ${styles[`bg-${backgroundColor}`]}`}
      onClick={onClick}
    >
      <div
        className={styles.statusDot}
        style={{ backgroundColor: statusDotColor }}
      />
      <div className={styles.areaIllustration}>
        <img src={illustration} alt={name} className={styles.areaImage} />
      </div>
      <h3 className={styles.areaName}>{name}</h3>
      {dueCount !== undefined && dueCount > 0 && (
        <div className={styles.areaChip}>
          <span className={`${styles.chip} ${status === 'overdue' ? styles.chipOverdue : ''}`}>
            {dueCount} {status === 'due-today' ? 'Due today' : 'Overdue'}
          </span>
        </div>
      )}
    </Card>
  );
}

