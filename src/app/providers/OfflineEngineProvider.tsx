import { createContext, useContext, ReactNode } from 'react';
import { OfflineEngine } from '../../core/offline/OfflineEngine';
import { RemoteRepoStub } from '../../core/repos/RemoteRepoStub';

const OfflineEngineContext = createContext<OfflineEngine | null>(null);

export function OfflineEngineProvider({ children }: { children: ReactNode }) {
  const remoteRepo = new RemoteRepoStub();
  const engine = new OfflineEngine(remoteRepo);

  return (
    <OfflineEngineContext.Provider value={engine}>
      {children}
    </OfflineEngineContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOfflineEngineContext(): OfflineEngine {
  const context = useContext(OfflineEngineContext);
  if (!context) {
    throw new Error('useOfflineEngineContext must be used within OfflineEngineProvider');
  }
  return context;
}

