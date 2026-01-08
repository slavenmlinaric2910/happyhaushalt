import { createContext, useContext, ReactNode } from 'react';
import { LocalDexieRepo } from '../../core/repos/LocalDexieRepo';
import { SupabaseAuthRepo } from '../../core/repos/SupabaseAuthRepo';
import type { AuthRepo } from '../../core/repos/interfaces';
import { useOfflineEngineContext } from './OfflineEngineProvider';

interface RepoContextValue {
  repo: LocalDexieRepo;
  authRepo: AuthRepo;
}

const RepoContext = createContext<RepoContextValue | null>(null);

export function RepoProvider({ children }: { children: ReactNode }) {
  const engine = useOfflineEngineContext();
  const repo = new LocalDexieRepo(engine);
  const authRepo = new SupabaseAuthRepo();

  return (
    <RepoContext.Provider value={{ repo, authRepo }}>
      {children}
    </RepoContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRepo(): LocalDexieRepo {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error('useRepo must be used within RepoProvider');
  }
  return context.repo;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthRepo(): AuthRepo {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error('useAuthRepo must be used within RepoProvider');
  }
  return context.authRepo;
}

