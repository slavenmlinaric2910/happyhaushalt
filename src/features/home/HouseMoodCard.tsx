import { Card } from '../../core/ui/Card';
import styles from './HouseMoodCard.module.css';

interface HouseMoodCardProps {
  status: 'good' | 'needs-attention' | 'many-due';
  dueToday: number;
  overdue: number;
}

export function HouseMoodCard({ status, dueToday, overdue }: HouseMoodCardProps) {
  const getMoodText = () => {
    if (status === 'good') return '😊 House is happy 😊';
    if (status === 'needs-attention') return '😐 House needs attention';
    return '😟 House is unhappy';
  };

  const getSubtitle = () => {
    const parts: string[] = [];
    if (dueToday > 0) parts.push(`${dueToday} task${dueToday !== 1 ? 's' : ''} due today`);
    if (overdue > 0) parts.push(`${overdue} overdue`);
    if (parts.length === 0) return 'All good — nothing overdue.';
    return parts.join(' • ');
  };

  return (
    <Card className={styles.houseMoodCard}>
      <div className={styles.houseMoodContent}>
        <div className={styles.houseMoodText}>
          <h2 className={styles.houseMoodTitle}>{getMoodText()}</h2>
          <p className={styles.houseMoodMessage}>{getSubtitle()}</p>
        </div>
        <div className={styles.houseIllustration}>
          <img
            src="/illustrations/house-with-background-illustration.png"
            alt="House mood"
            className={styles.houseImage}
          />
        </div>
      </div>
    </Card>
  );
}

