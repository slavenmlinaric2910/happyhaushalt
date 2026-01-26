import { supabase } from '../../lib/supabase/client';

export type ConnectivityStatus = 'online' | 'offline' | 'checking';

class ConnectivityService {
  private status: ConnectivityStatus = 'checking';
  private listeners = new Set<(status: ConnectivityStatus) => void>();
  private checkInterval: number | null = null;

  constructor() {
    // Set initial status synchronously based on navigator.onLine
    // This ensures we have a status immediately on page load
    // If navigator.onLine is false, we're definitely offline
    if (!navigator.onLine) {
      this.status = 'offline';
    }
    
    // Listen to browser online/offline events
    window.addEventListener('online', () => this.checkBackend());
    window.addEventListener('offline', () => this.setStatus('offline'));
    
    // Initial check (will update status if navigator.onLine is true)
    this.checkBackend();
    
    // Periodic check every 30 seconds when online
    this.checkInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.checkBackend();
      }
    }, 30000);
  }

  private async checkBackend(): Promise<void> {
    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    this.setStatus('checking');
    
    try {
      // Lightweight Supabase health check (auth.getSession is fast)
      const { error } = await supabase.auth.getSession();
      this.setStatus(error ? 'offline' : 'online');
    } catch {
      this.setStatus('offline');
    }
  }

  private setStatus(status: ConnectivityStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.listeners.forEach(listener => listener(status));
    }
  }

  getStatus(): ConnectivityStatus {
    return this.status;
  }

  isOnline(): boolean {
    return this.status === 'online';
  }

  subscribe(listener: (status: ConnectivityStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
    }
    this.listeners.clear();
  }
}

export const connectivityService = new ConnectivityService();
