/* eslint-disable @typescript-eslint/no-unused-vars */

import { db } from '../offline/db';
import type {
  Household,
  Member,
  ChoreTemplate,
  TaskInstance,
  Task,
  CreateTaskInput,
  CreateChoreInput,
} from '../types';
import { generateId } from '../../lib/utils';
import type { HouseholdRepo, ChoreRepo, TaskRepo } from './interfaces';
import type { OfflineEngine } from '../offline/OfflineEngine';

export class LocalDexieRepo implements HouseholdRepo, ChoreRepo, TaskRepo {
  constructor(private offlineEngine: OfflineEngine) {}

  // HouseholdRepo
  async createHousehold(name: string): Promise<Household> {
    const household: Household = {
      id: generateId(),
      name,
      joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date(),
    };

    await db.households.add(household);
    await this.offlineEngine.enqueue('CREATE_HOUSEHOLD', household as unknown as Record<string, unknown>);
    return household;
  }

  async findByJoinCode(code: string): Promise<Household | null> {
    const household = await db.households.where('joinCode').equals(code).first();
    return household || null;
  }

  async joinByCode(code: string): Promise<Household> {
    const household = await this.findByJoinCode(code);
    if (!household) {
      throw new Error(`No household found with join code "${code}". Please check the code and try again.`);
    }
    await this.offlineEngine.enqueue('JOIN_HOUSEHOLD', { joinCode: code });
    return household;
  }

  async getCurrentHousehold(): Promise<Household | null> {
    // For now, return the first household (single household support)
    const household = await db.households.toCollection().first();
    return household || null;
  }

  async listMembers(householdId: string): Promise<Member[]> {
    return db.members.where('householdId').equals(householdId).toArray();
  }

  async getCurrentHouseholdWithMembers(_member?: Member | null): Promise<{ household: Household | null; members: Member[] }> {
    // LocalDexieRepo doesn't need member parameter, but accepts it for interface compatibility
    // It can get household directly without needing member.householdId
    // Parameter prefixed with _ to indicate intentionally unused
    void _member; // Explicitly mark as used to satisfy linter
    const household = await this.getCurrentHousehold();
    if (!household) {
      return { household: null, members: [] };
    }
    const members = await this.listMembers(household.id);
    return { household, members };
  }

  // ChoreRepo
  async listChores(householdId: string): Promise<ChoreTemplate[]> {
    return db.choreTemplates
      .where('householdId')
      .equals(householdId)
      .and((chore) => chore.active)
      .toArray();
  }

  async createChore(
    householdId: string,
    data: CreateChoreInput
  ): Promise<ChoreTemplate> {
    const now = new Date();
    const chore: ChoreTemplate = {
      id: generateId(),
      householdId,
      name: data.name,
      frequency: data.frequency,
      active: true,
      rotationMemberIds: data.rotationMemberIds,
      startDate: data.startDate,
      endDate: data.endDate,
      areaId: data.areaId,
      createdAt: now,
      updatedAt: now,
    };

    await db.choreTemplates.add(chore);
    await this.offlineEngine.enqueue('CREATE_CHORE', chore as unknown as Record<string, unknown>);
    return chore;
  }

  async updateChore(id: string, data: Partial<ChoreTemplate>): Promise<ChoreTemplate> {
    const existing = await db.choreTemplates.get(id);
    if (!existing) {
      throw new Error('Chore not found');
    }

    const updated = { ...existing, ...data };
    await db.choreTemplates.update(id, updated);
    await this.offlineEngine.enqueue('UPDATE_CHORE', { id, ...data });
    return updated;
  }

  async archiveChore(id: string): Promise<void> {
    await db.choreTemplates.update(id, { active: false });
    await this.offlineEngine.enqueue('ARCHIVE_CHORE', { id });
  }

  // TaskRepo
  async listTasks(householdId: string, range: { start: Date; end: Date }): Promise<TaskInstance[]> {
    return db.tasks
      .where('householdId')
      .equals(householdId)
      .filter((task) => {
        const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
        return dueDate >= range.start && dueDate <= range.end;
      })
      .toArray();
  }

  // TaskRepo interface implementation (Supabase-style)
  async createTask(input: CreateTaskInput): Promise<Task>;
  async createTask(data: {
    name: string;
    area: string;
    dueDate: Date;
    assignedMemberId: string;
    householdId: string;
  }): Promise<TaskInstance>;
  async createTask(
    _input:
      | CreateTaskInput
      | {
          name: string;
          area: string;
          dueDate: Date;
          assignedMemberId: string;
          householdId: string;
        }
  ): Promise<Task | TaskInstance> {
    // Local Dexie path is deprecated; direct callers to SupabaseTaskRepo
    throw new Error('createTask not implemented in LocalDexieRepo. Use SupabaseTaskRepo instead.');
  }

  // Legacy method - kept for backward compatibility
  async createManualTask(data: {
    name: string;
    area: string;
    dueDate: Date;
    assignedMemberId: string;
    householdId: string;
  }): Promise<TaskInstance> {
    // Create a virtual chore template for one-time tasks
    const choreTemplateId = `manual-${generateId()}`;
    const now = new Date();
    
    const task: TaskInstance = {
      id: generateId(),
      householdId: data.householdId,
      choreTemplateId,
      dueDate: data.dueDate,
      assignedMemberId: data.assignedMemberId,
      status: 'pending',
      completedAt: null,
      deletedAt: null,
    };

    // Store the task name and area in the chore template for display
    const choreTemplate: ChoreTemplate = {
      id: choreTemplateId,
      householdId: data.householdId,
      name: data.name,
      frequency: 'daily', // Default for one-time task
      active: true,
      rotationMemberIds: [data.assignedMemberId],
      startDate: null,
      endDate: data.dueDate,
      areaId: 'other', // Default area key for legacy task creation
      createdAt: now,
      updatedAt: now,
    };

    await db.choreTemplates.add(choreTemplate);
    await db.tasks.add(task);
    await this.offlineEngine.enqueue('CREATE_TASK', {
      task: task as unknown as Record<string, unknown>,
      choreTemplate: choreTemplate as unknown as Record<string, unknown>,
    });

    return task;
  }

  async completeTask(taskId: string): Promise<void> {
    await db.tasks.update(taskId, {
      status: 'completed',
      completedAt: new Date(),
    });
    await this.offlineEngine.enqueue('COMPLETE_TASK', { taskId });
  }

  async regenerateTasksIfNeeded(householdId?: string): Promise<void> {
    if (!householdId) return;
    // Simple implementation: check if tasks exist for the next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const existingTasks = await this.listTasks(householdId, { start: today, end: nextWeek });
    const chores = await this.listChores(householdId);
    const members = await this.listMembers(householdId);

    if (members.length === 0) return;

    // Generate tasks for each chore
    for (const chore of chores) {
      const tasksForChore = existingTasks.filter((t) => t.choreTemplateId === chore.id);
      if (tasksForChore.length === 0) {
        // Generate a task for today using rotationMemberIds
        const rotationMembers = chore.rotationMemberIds || [];
        const assignedMemberId = rotationMembers.length > 0 
          ? rotationMembers[0] 
          : members[0]?.id;
        
        if (!assignedMemberId) continue;

        const task: TaskInstance = {
          id: generateId(),
          householdId,
          choreTemplateId: chore.id,
          dueDate: today,
          assignedMemberId,
          status: 'pending',
          completedAt: null,
          deletedAt: null,
        };
        await db.tasks.add(task);
      }
    }
  }
}

