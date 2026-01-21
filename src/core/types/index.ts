export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Household {
  id: string;
  name: string;
  joinCode: string;
  createdAt: Date;
  createdBy?: string; // user_id of the creator
}

export interface Member {
  id: string;
  householdId: string;
  displayName: string;
  avatarId: import('../../features/onboarding/avatars').AvatarId;
  userId?: string; // user_id from Supabase, used to identify owner
}

export interface ChoreTemplate {
  id: string;
  householdId: string;
  name: string;
  area: string;
  frequencyType: FrequencyType;
  frequencyValue: number; // e.g., every N days/weeks/months
  rotationCursor: number; // index for round-robin assignment
  isArchived: boolean;
  checklistItems?: string[];
}

export interface TaskInstance {
  id: string;
  householdId: string;
  choreTemplateId: string;
  dueDate: Date;
  assignedMemberId: string | null;
  status: 'pending' | 'completed';
  completedAt: Date | null;
}

/**
 * Task entity matching the database schema (tasks table).
 * Different from TaskInstance which is generated from ChoreTemplates.
 */
export interface Task {
  id: string;
  householdId: string;
  templateId: string | null;
  title: string;
  dueDate: Date;
  assignedUserId: string;
  status: 'open' | 'done' | 'skipped';
  completedAt: Date | null;
  completedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTaskInput = Omit<Task, 'id' | 'completedAt' | 'completedByUserId' | 'createdAt' | 'updatedAt'>;

export type OfflineOpType =
  | 'COMPLETE_TASK'
  | 'CREATE_TASK'
  | 'CREATE_CHORE'
  | 'UPDATE_CHORE'
  | 'ARCHIVE_CHORE'
  | 'CREATE_HOUSEHOLD'
  | 'JOIN_HOUSEHOLD';

export interface OfflineOp {
  id: string;
  createdAt: Date;
  type: OfflineOpType;
  payload: Record<string, unknown>;
  status: 'pending' | 'syncing' | 'failed' | 'done';
  error?: string;
}

