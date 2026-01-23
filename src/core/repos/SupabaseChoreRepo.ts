import { supabase } from '../../lib/supabase/client';
import type { ChoreTemplate, CreateChoreInput } from '../types';
import type { ChoreRepo } from './interfaces';

interface ChoreTemplateRow {
  id: string;
  household_id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  active: boolean;
  rotation_member_ids: string[];
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToChoreTemplate(row: ChoreTemplateRow): ChoreTemplate {
  return {
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    frequency: row.frequency,
    active: row.active,
    rotationMemberIds: row.rotation_member_ids || [],
    dueDate: row.due_date ? new Date(row.due_date) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseChoreRepo implements ChoreRepo {
  async listChores(householdId: string): Promise<ChoreTemplate[]> {
    const { data, error } = await supabase
      .from('chore_templates')
      .select('*')
      .eq('household_id', householdId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error listing chores:', error);
      throw new Error(`Failed to list chores: ${error.message}`);
    }

    return (data || []).map(mapRowToChoreTemplate);
  }

  async createChore(householdId: string, input: CreateChoreInput): Promise<ChoreTemplate> {
    const { data, error } = await supabase
      .from('chore_templates')
      .insert({
        household_id: householdId,
        name: input.name,
        frequency: input.frequency,
        rotation_member_ids: input.rotationMemberIds,
        due_date: input.dueDate ? input.dueDate.toISOString().split('T')[0] : null,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chore:', error);
      throw new Error(`Failed to create chore: ${error.message}`);
    }

    return mapRowToChoreTemplate(data);
  }

  async updateChore(id: string, data: Partial<ChoreTemplate>): Promise<ChoreTemplate> {
    const updateData: Record<string, unknown> = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.rotationMemberIds !== undefined) updateData.rotation_member_ids = data.rotationMemberIds;
    if (data.dueDate !== undefined) {
      updateData.due_date = data.dueDate ? data.dueDate.toISOString().split('T')[0] : null;
    }

    const { data: result, error } = await supabase
      .from('chore_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating chore:', error);
      throw new Error(`Failed to update chore: ${error.message}`);
    }

    return mapRowToChoreTemplate(result);
  }

  async archiveChore(id: string): Promise<void> {
    const { error } = await supabase
      .from('chore_templates')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      console.error('Error archiving chore:', error);
      throw new Error(`Failed to archive chore: ${error.message}`);
    }
  }
}
