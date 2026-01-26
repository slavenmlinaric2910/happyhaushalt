import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Wifi, Shield } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import { Card } from '../../core/ui/Card';
import styles from './LearnMorePage.module.css';

export function LearnMorePage() {
  const navigate = useNavigate();
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
        <div className={styles.header}>
          <button onClick={() => navigate('/login')} className={styles.backButton}>
            <ArrowLeft size={20} />
          </button>
          <h1 className={styles.headerTitle}>Learn more</h1>
          <div className={styles.headerSpacer} />
        </div>

        <div className={styles.hero}>
          <div className={styles.illustrationWrapper}>
            <img
              src="/illustrations/house-welcome.png"
              alt="Welcome illustration"
              className={styles.illustration}
            />
          </div>
          <h2 className={styles.headline}>A calm way to run a household.</h2>
          <p className={styles.heroText}>
            HappyHaushalt helps everyone stay on the same page—tasks, chores, and rotation—without nagging.
          </p>
        </div>

        <div className={styles.sections}>
          <Card className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>How it works</h3>
            <ol className={styles.stepsList}>
              <li className={styles.stepItem}>
                <span className={styles.stepNumber}>1</span>
                <span className={styles.stepText}>Sign in with Google</span>
              </li>
              <li className={styles.stepItem}>
                <span className={styles.stepNumber}>2</span>
                <span className={styles.stepText}>Create or join a household with a 6-char code</span>
              </li>
              <li className={styles.stepItem}>
                <span className={styles.stepNumber}>3</span>
                <span className={styles.stepText}>Pick a name + avatar and start</span>
              </li>
            </ol>
          </Card>

          <Card className={styles.sectionCard}>
            <h3 className={styles.sectionTitle}>What you can do</h3>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureIcon} />
                <span className={styles.featureText}>Create one-time tasks</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureIcon} />
                <span className={styles.featureText}>Create recurring chores (templates)</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureIcon} />
                <span className={styles.featureText}>Assign tasks to members</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureIcon} />
                <span className={styles.featureText}>Mark tasks done → next task is generated + rotates</span>
              </li>
            </ul>
          </Card>

          <Card className={styles.sectionCard}>
            <div className={styles.iconRow}>
              <Wifi size={20} className={styles.sectionIcon} />
              <h3 className={styles.sectionTitle}>Offline-friendly</h3>
            </div>
            <p className={styles.sectionText}>
              Works without internet. Your changes are saved locally and synced when you're back online.
            </p>
          </Card>

          <Card className={styles.sectionCard}>
            <div className={styles.iconRow}>
              <Shield size={20} className={styles.sectionIcon} />
              <h3 className={styles.sectionTitle}>Privacy</h3>
            </div>
            <p className={styles.sectionText}>
              We store only what's needed: your sign-in ID, household membership, and your chores/tasks.
            </p>
          </Card>
        </div>

        <div className={styles.bottomSticky}>
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className={styles.googleButton}
          >
            <span className={styles.googleIconWrapper}>
              <svg className={styles.googleIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </span>
            <span className={styles.googleButtonText}>
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>
          <p className={styles.footerText}>
            By continuing, you agree to use the app responsibly in your household.
          </p>
        </div>
      </div>
    </div>
  );
}

