import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { Card } from '../../core/ui/Card';
import { Button } from '../../core/ui/Button';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <Card className={styles.card}>
          <h1 className={styles.title}>Home Chores</h1>
          <p className={styles.text}>
            Manage your household chores together. Simple, calm, and always available.
          </p>
          <Button
            variant="primary"
            onClick={handleSignIn}
            disabled={isLoading}
            className={styles.button}
          >
            {isLoading ? 'Signing in...' : 'Continue with Google'}
          </Button>
          <Link to="/onboarding" className={styles.tempLink}>
            (Temp: Go to Onboarding)
          </Link>
        </Card>
      </div>
    </div>
  );
}

