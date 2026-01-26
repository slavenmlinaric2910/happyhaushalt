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

/**
 * ChoreTemplate entity matching the database schema (chore_templates table).
 */
export interface ChoreTemplate {
  id: string;
  householdId: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  active: boolean;
  rotationMemberIds: string[]; // JSON array of member IDs for rotation/assignment
  dueDate: Date | null; // end date for the chore
  startDate?: Date | null; // optional start date
  area?: string; // optional area field
  createdAt: Date;
  updatedAt: Date;
}

export type CreateChoreInput = {
  name: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  rotationMemberIds: string[];
  dueDate: Date | null;
  startDate?: Date | null;
  area?: string;
};

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
  deletedAt: Date | null;
  deletedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTaskInput = Omit<Task, 'id' | 'completedAt' | 'completedByUserId' | 'deletedAt' | 'deletedByUserId' |'createdAt' | 'updatedAt'>;

export type OfflineOpType =
  | 'CREATE_TASK'
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

