import type {
  Household,
  Member,
  ChoreTemplate,
  TaskInstance,
  Task,
  CreateTaskInput,
  CreateChoreInput,
  Area,
} from '../types';
import type { Session } from '@supabase/supabase-js';

export interface AuthRepo {
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
  getSession(): Promise<Session | null>;
  onAuthStateChange(handler: (session: Session | null) => void): () => void;
}

export interface HouseholdRepo {
  createHousehold(name: string): Promise<Household>;
  findByJoinCode(code: string): Promise<Household | null>;
  joinByCode(code: string): Promise<Household>;
  getCurrentHousehold(): Promise<Household | null>;
  listMembers(householdId: string): Promise<Member[]>;
  getCurrentHouseholdWithMembers(member?: Member | null): Promise<{ household: Household | null; members: Member[] }>;
}

export interface ChoreRepo {
  listChores(householdId: string): Promise<ChoreTemplate[]>;
  createChore(householdId: string, data: CreateChoreInput): Promise<ChoreTemplate>;
  updateChore(id: string, data: Partial<ChoreTemplate>): Promise<ChoreTemplate>;
  archiveChore(id: string): Promise<void>;
}

export interface TaskRepo {
  listTasks(householdId: string, range: { start: Date; end: Date }): Promise<TaskInstance[]>;
  createTask(data: {
    name: string;
    area: string;
    dueDate: Date;
    assignedMemberId: string;
    householdId: string;
  }): Promise<TaskInstance>;
  createTask(input: CreateTaskInput): Promise<Task>;
  completeTask(taskId: string): Promise<void>;
  regenerateTasksIfNeeded(): Promise<void>;
}

export interface MemberRepo {
  getCurrentMember(): Promise<Member | null>;
  listMembersByHousehold(householdId: string): Promise<Member[]>;
  ensureMemberExists(args: {
    householdId: string;
    displayName: string;
    avatarId: import('../../features/onboarding/avatars').AvatarId;
  }): Promise<Member>;
  leaveCurrentHousehold(nextOwnerUserId?: string | null): Promise<void>;
}


export interface AreaRepo {
  listAreas(): Promise<Area[]>;
}

