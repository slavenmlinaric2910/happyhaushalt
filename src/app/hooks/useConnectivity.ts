import { useState, useEffect } from 'react';
import { connectivityService, type ConnectivityStatus } from '../../core/offline/connectivity';

export function useConnectivity(): {
  status: ConnectivityStatus;
  isOnline: boolean;
} {
  const [status, setStatus] = useState<ConnectivityStatus>(
    () => connectivityService.getStatus()
  );

  useEffect(() => {
    const unsubscribe = connectivityService.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return {
    status,
    isOnline: status === 'online',
  };
}

