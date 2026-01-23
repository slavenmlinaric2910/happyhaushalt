import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../core/ui/Card';
import styles from './AboutPage.module.css';

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <ArrowLeft size={20} />
        </button>
        <h1 className={styles.title}>About</h1>
        <Card className={styles.card}>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>
              <span className={styles.bullet}>•</span>
              <span className={styles.bulletText}>
                Share household chores with your family or roommates
              </span>
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.bullet}>•</span>
              <span className={styles.bulletText}>
                Works offline and syncs when you're back online
              </span>
            </li>
            <li className={styles.bulletItem}>
              <span className={styles.bullet}>•</span>
              <span className={styles.bulletText}>
                Join a household with a simple code
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

