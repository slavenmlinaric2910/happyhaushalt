import { createContext, useContext, ReactNode } from 'react';
import { LocalDexieRepo } from '../../core/repos/LocalDexieRepo';
import { SupabaseAuthRepo } from '../../core/repos/SupabaseAuthRepo';
import { SupabaseHouseholdRepo } from '../../core/repos/SupabaseHouseholdRepo';
import { SupabaseMemberRepo } from '../../core/repos/SupabaseMemberRepo';
import { SupabaseChoreRepo } from '../../core/repos/SupabaseChoreRepo';
import { SupabaseAreaRepo } from '../../core/repos/SupabaseAreaRepo';
import type { AuthRepo, HouseholdRepo, MemberRepo, ChoreRepo, AreaRepo } from '../../core/repos/interfaces';
import { useOfflineEngineContext } from './OfflineEngineProvider';

interface RepoContextValue {
  repo: LocalDexieRepo;
  authRepo: AuthRepo;
  householdRepo: HouseholdRepo;
  memberRepo: MemberRepo;
  choreRepo: ChoreRepo;
  areaRepo: AreaRepo;
}

const RepoContext = createContext<RepoContextValue | null>(null);

export function RepoProvider({ children }: { children: ReactNode }) {
  const engine = useOfflineEngineContext();
  const repo = new LocalDexieRepo(engine);
  const authRepo = new SupabaseAuthRepo();
  const memberRepo = new SupabaseMemberRepo();
  const householdRepo = new SupabaseHouseholdRepo(memberRepo);
  const choreRepo = new SupabaseChoreRepo();
  const areaRepo = new SupabaseAreaRepo();

  return (
    <RepoContext.Provider value={{ repo, authRepo, householdRepo, memberRepo, choreRepo, areaRepo }}>
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

// eslint-disable-next-line react-refresh/only-export-components
export function useChoreRepo(): ChoreRepo {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error('useChoreRepo must be used within RepoProvider');
  }
  return context.choreRepo;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAreaRepo(): AreaRepo {
  const context = useContext(RepoContext);
  if (!context) {
    throw new Error('useAreaRepo must be used within RepoProvider');
  }
  return context.areaRepo;
}