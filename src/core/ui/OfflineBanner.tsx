import { useEffect, useState } from 'react';
import { useConnectivity } from '../offline/connectivity';
import { useOfflineEngine } from '../../app/hooks/useOfflineEngine';
import styles from './OfflineBanner.module.css';
import { Button } from './Button';

export function OfflineBanner() {
  const isOnline = useConnectivity();
  const { queueState, syncNow } = useOfflineEngine();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline || queueState.failed > 0 || queueState.pending > 0) {
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [isOnline, queueState]);

  if (!showBanner) return null;

  return (
    <div className={styles.banner}>
      {!isOnline ? (
        <span>Offline mode</span>
      ) : queueState.syncing > 0 ? (
        <span>Syncing…</span>
      ) : queueState.failed > 0 ? (
        <>
          <span>Sync failed</span>
          <Button variant="ghost" onClick={syncNow} style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
            Retry
          </Button>
        </>
      ) : queueState.pending > 0 ? (
        <span>Syncing…</span>
      ) : null}
    </div>
  );
}

