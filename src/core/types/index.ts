export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Household {
  id: string;
  name: string;
  joinCode: string;
  createdAt: Date;
}

export interface Member {
  id: string;
  householdId: string;
  displayName: string;
  avatarId: import('../../features/onboarding/avatars').AvatarId;
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

export type OfflineOpType =
  | 'COMPLETE_TASK'
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

