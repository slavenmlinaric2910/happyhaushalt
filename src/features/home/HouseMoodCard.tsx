import { Card } from '../../core/ui/Card';
import styles from './HouseMoodCard.module.css';

interface HouseMoodCardProps {
  status: 'good' | 'needs-attention' | 'many-due';
  message: string;
}

export function HouseMoodCard({ status, message }: HouseMoodCardProps) {
  return (
    <Card className={styles.houseMoodCard}>
      <div className={styles.houseMoodContent}>
        <div className={styles.houseIllustration}>
          <img
            src="/illustrations/house_happy_illustration.png"
            alt="House mood"
            className={styles.houseImage}
          />
        </div>
        <div className={styles.houseMoodText}>
          <h2 className={styles.houseMoodTitle}>House mood</h2>
          <p className={styles.houseMoodMessage}>
            <span className={styles.statusDot} data-status={status}></span>
            {message}
          </p>
        </div>
      </div>
    </Card>
  );
}

