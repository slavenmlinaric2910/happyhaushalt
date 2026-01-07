import { createContext, useContext, ReactNode } from 'react';
import { LocalDexieRepo } from '../../core/repos/LocalDexieRepo';
import { useOfflineEngineContext } from './OfflineEngineProvider';

const RepoContext = createContext<LocalDexieRepo | null>(null);

export function RepoProvider({ children }: { children: ReactNode }) {
  const engine = useOfflineEngineContext();
  const repo = new LocalDexieRepo(engine);

  return <RepoContext.Provider value={repo}>{children}</RepoContext.Provider>;
}

export function useRepo(): LocalDexieRepo {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error('useRepo must be used within RepoProvider');
  }
  return context;
}

