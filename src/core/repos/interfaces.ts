import type {
  Household,
  Member,
  ChoreTemplate,
  TaskInstance,
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
}

export interface ChoreRepo {
  listChores(householdId: string): Promise<ChoreTemplate[]>;
  createChore(data: Omit<ChoreTemplate, 'id' | 'householdId' | 'rotationCursor' | 'isArchived'>): Promise<ChoreTemplate>;
  updateChore(id: string, data: Partial<ChoreTemplate>): Promise<ChoreTemplate>;
  archiveChore(id: string): Promise<void>;
}

export interface TaskRepo {
  listTasks(householdId: string, range: { start: Date; end: Date }): Promise<TaskInstance[]>;
  completeTask(taskId: string): Promise<void>;
  regenerateTasksIfNeeded(householdId: string): Promise<void>;
}

