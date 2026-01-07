import { useEffect, useState } from 'react';
import { useOfflineEngineContext } from '../providers/OfflineEngineProvider';
import type { QueueState } from '../../core/offline/OfflineEngine';

export function useOfflineEngine() {
  const engine = useOfflineEngineContext();
  const [queueState, setQueueState] = useState<QueueState>({ pending: 0, failed: 0, syncing: 0 });

  useEffect(() => {
    const updateState = async () => {
      const state = await engine.getQueueState();
      setQueueState(state);
    };

    updateState();
    const unsubscribe = engine.subscribe(updateState);

    // Poll periodically
    const interval = setInterval(updateState, 2000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [engine]);

  return {
    queueState,
    syncNow: () => engine.syncNow(),
    isSyncing: engine.getIsSyncing(),
  };
}

