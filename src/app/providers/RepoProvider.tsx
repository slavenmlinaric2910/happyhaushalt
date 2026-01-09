import { createContext, useContext, ReactNode } from 'react';
import { LocalDexieRepo } from '../../core/repos/LocalDexieRepo';
import { SupabaseAuthRepo } from '../../core/repos/SupabaseAuthRepo';
import { SupabaseHouseholdRepo } from '../../core/repos/SupabaseHouseholdRepo';
import { SupabaseMemberRepo } from '../../core/repos/SupabaseMemberRepo';
import type { AuthRepo, HouseholdRepo, MemberRepo } from '../../core/repos/interfaces';
import { useOfflineEngineContext } from './OfflineEngineProvider';

interface RepoContextValue {
  repo: LocalDexieRepo;
  authRepo: AuthRepo;
  householdRepo: HouseholdRepo;
  memberRepo: MemberRepo;
}

const RepoContext = createContext<RepoContextValue | null>(null);

export function RepoProvider({ children }: { children: ReactNode }) {
  const engine = useOfflineEngineContext();
  const repo = new LocalDexieRepo(engine);
  const authRepo = new SupabaseAuthRepo();
  const memberRepo = new SupabaseMemberRepo();
  const householdRepo = new SupabaseHouseholdRepo(memberRepo);

  return (
    <RepoContext.Provider value={{ repo, authRepo, householdRepo, memberRepo }}>
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

// eslint-disable-next-line react-refresh/only-export-components
export function useHouseholdRepo(): HouseholdRepo {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error('useHouseholdRepo must be used within RepoProvider');
  }
  return context.householdRepo;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMemberRepo(): MemberRepo {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error('useMemberRepo must be used within RepoProvider');
  }
  return context.memberRepo;
}

