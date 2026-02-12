import { supabase } from '../../lib/supabase/client';
import type { TaskRepo } from './interfaces';
import type { Task, TaskInstance, CreateTaskInput } from '../types';

/**
 * Supabase task row type matching the database schema.
 */
interface SupabaseTaskRow {
  id: string;
  household_id: string;
  template_id: string | null;
  title: string;
  due_date: string;
  assigned_user_id: string;
  area_id: string | null;
  status: 'open' | 'done' | 'skipped';
  completed_at: string | null;
  completed_by_user_id: string | null;
  deleted_at: string | null;
  deleted_by_user_id: string | null;
  created_at: string;
  updated_at: string;
}

function formatDateLocalYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalYYYYMMDD(value: string): Date {
  const [y, m, d] = value.split('-').map((x) => Number(x));
  return new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
}

/**
 * Maps a Supabase task row to a domain Task object.
 */
function mapTask(row: SupabaseTaskRow): Task {
  return {
    id: row.id,
    householdId: row.household_id,
    templateId: row.template_id,
    title: row.title,
    dueDate: parseLocalYYYYMMDD(row.due_date),
    assignedUserId: row.assigned_user_id,
    areaId: row.area_id ?? undefined,
    status: row.status,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    completedByUserId: row.completed_by_user_id,
    deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    deletedByUserId: row.deleted_by_user_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseTaskRepo implements TaskRepo {
  /**
   * Creates a new task in the database (primary supabase pathway).
   */
  async createTask(input: CreateTaskInput): Promise<Task>;
  /**
   * Legacy signature kept for interface compatibility; not supported in Supabase implementation.
   */
  async createTask(data: {
    name: string;
    area: string;
    dueDate: Date;
    assignedMemberId: string;
    householdId: string;
  }): Promise<TaskInstance>;
  async createTask(
    input:
      | CreateTaskInput
      | {
          name: string;
          area: string;
          dueDate: Date;
          assignedMemberId: string;
          householdId: string;
        }
  ): Promise<Task | TaskInstance> {
    // Enforce using the Supabase-specific input; legacy path is unsupported here
    if (!('assignedUserId' in input)) {
      throw new Error('Legacy createTask signature is not supported in SupabaseTaskRepo');
    }

    const supabaseInput = input as CreateTaskInput;
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        household_id: supabaseInput.householdId,
        template_id: supabaseInput.templateId,
        title: supabaseInput.title,
        due_date: formatDateLocalYYYYMMDD(supabaseInput.dueDate),
        assigned_user_id: supabaseInput.assignedUserId,
        area_id: supabaseInput.areaId ?? null,
        status: supabaseInput.status,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create task: no data returned');
    }

    return mapTask(data);
  }

  /**
   * Lists tasks for a household within a date range.
   * Note: This returns TaskInstance for compatibility with existing interfaces.
   */
  async listTasks(
    householdId: string,
    range: { start: Date; end: Date }
  ): Promise<TaskInstance[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('household_id', householdId)
      .is('deleted_at', null)
      .gte('due_date', range.start.toISOString().split('T')[0])
      .lte('due_date', range.end.toISOString().split('T')[0])
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(`Failed to list tasks: ${error.message}`);
    }

    // Map to TaskInstance for compatibility
    return (data || []).map((row: SupabaseTaskRow) => ({
      id: row.id,
      householdId: row.household_id,
      choreTemplateId: row.template_id || '',
      title: row.title,
      dueDate: new Date(row.due_date),
      assignedMemberId: row.assigned_user_id,
      status: row.status === 'open' ? 'pending' : 'completed',
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    }));
  }

  /**
   * Marks a task as completed.
   */
  async completeTask(taskId: string): Promise<void> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        completed_by_user_id: session?.user?.id || null,
      })
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to complete task: ${error.message}`);
    }
  }

  /**
   * Lists deleted tasks by deleted_at range (history view).
   */
  async listDeletedTasks(
    householdId: string,
    range: { start: Date; end: Date }
  ): Promise<{ id: string; title: string; dueDate: Date; deletedAt: Date }[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, due_date, deleted_at')
      .eq('household_id', householdId)
      .not('deleted_at', 'is', null)
      .gte('deleted_at', range.start.toISOString())
      .lte('deleted_at', range.end.toISOString())
      .order('deleted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list deleted tasks: ${error.message}`);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      dueDate: new Date(row.due_date),
      deletedAt: new Date(row.deleted_at),
    }));
  }

  /**
   * Marks a task as deleted.
   */
  async deleteTask(taskId: string): Promise<void> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    const { error } = await supabase
      .from('tasks')
      .update({
        // NICHT: status: 'deleted'
        // optional: status: 'skipped',
        deleted_at: new Date().toISOString(),
        deleted_by_user_id: session?.user?.id || null,
      })
      .eq('id', taskId);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

   /**
    * HARD delete: entfernt alle erledigten Tasks dauerhaft (nicht rückgängig).
    */
  async hardDeleteAllCompletedTasks(householdId: string): Promise<number> {
    const { error, count } = await supabase
      .from('tasks')
      .delete({ count: 'exact' })
      .eq('household_id', householdId)
      .eq('status', 'done');

    if (error) {
      throw new Error(`Failed to hard delete completed tasks: ${error.message}`);
    }

    return count ?? 0;
  }

   /**
    * HARD delete: entfernt alle gelöschten Tasks (deleted_at gesetzt) dauerhaft.
    */
  async hardDeleteAllDeletedTasks(householdId: string): Promise<number> {
    const { error, count } = await supabase
      .from('tasks')
      .delete({ count: 'exact' })
      .eq('household_id', householdId)
      .not('deleted_at', 'is', null);

    if (error) {
      throw new Error(`Failed to hard delete deleted tasks: ${error.message}`);
    }

    return count ?? 0;
  }


  async regenerateTasksIfNeeded(householdId?: string): Promise<void> {
      // Falls keine ID übergeben wurde, einfach abbrechen (nichts tun)
      if (!householdId) return;

      try {
        // 1. Fetch all active chore templates for this household
        const { data: chores, error: choreError } = await supabase
          .from('chore_templates')
          .select('*')
          .eq('household_id', householdId)
          .eq('active', true);

        if (choreError || !chores) return;

        // We want to make sure tasks exist at least until tomorrow
        const generationLimit = new Date();
        generationLimit.setDate(generationLimit.getDate() + 1);
        generationLimit.setHours(0, 0, 0, 0);

        for (const chore of chores) {
          // 2. Find the most recent task for this chore template
          const { data: lastTask } = await supabase
            .from('tasks')
            .select('due_date')
            .eq('template_id', chore.id)
            .order('due_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          let nextDue: Date;

          if (!lastTask) {
            // If no task exists yet, start with the chore's start_date
            nextDue = chore.start_date ? new Date(chore.start_date) : new Date();
          } else {
            // Otherwise, calculate the next instance after the last existing one
            nextDue = this.calculateNextDueDate(new Date(lastTask.due_date), chore.frequency);
          }

          // 3. Create tasks until we've covered our generation limit (today + tomorrow)
          while (nextDue <= generationLimit) {
            // Check if chore end_date has passed
            if (chore.end_date && nextDue > new Date(chore.end_date)) break;

            await this.createTask({
              householdId: householdId,
              templateId: chore.id,
              title: chore.name,
              dueDate: new Date(nextDue),
              assignedUserId: this.determineAssignee(chore),
              areaId: chore.area_id,
              status: 'open',
            });

            // Move to the next instance for the next iteration of the while-loop
            nextDue = this.calculateNextDueDate(nextDue, chore.frequency);
          }
        }
      } catch (error) {
        // "Einfach nichts tun" bei Fehlern
        console.error("Task regeneration failed:", error);
      }
    }

  private calculateNextDueDate(lastDate: Date, frequency: string): Date {
    const d = new Date(lastDate);
    if (frequency === 'daily') d.setDate(d.getDate() + 1);
    else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
    else if (frequency === 'biweekly') d.setDate(d.getDate() + 14);
    else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
    return d;
  }

  private determineAssignee(chore: any): string {
    // Simple logic: pick the first person in the rotation for now
    // You can expand this to rotate based on the last task's assignee
    return chore.rotation_member_ids?.[0] || '';
  }
}
