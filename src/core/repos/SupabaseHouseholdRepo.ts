import { supabase } from '../../lib/supabase/client';
import { generateJoinCode } from '../../lib/joinCode';
import type { HouseholdRepo } from './interfaces';
import type { Household, Member } from '../types';

/**
 * Supabase household row type.
 */
interface SupabaseHouseholdRow {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
}

/**
 * Maps a Supabase household row to a domain Household object.
 */
function mapHousehold(row: SupabaseHouseholdRow): Household {
  return {
    id: row.id,
    name: row.name,
    joinCode: row.join_code,
    createdAt: new Date(row.created_at),
  };
}

export class SupabaseHouseholdRepo implements HouseholdRepo {
  /**
   * Creates a new household with a generated join code.
   * Retries up to 3 times if the join code collides with an existing one.
   */
  async createHousehold(name: string): Promise<Household> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    if (!session?.user) {
      throw new Error('User must be authenticated to create a household');
    }

    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const joinCode = generateJoinCode(6);

      const { data, error } = await supabase
        .from('households')
        .insert({
          name,
          join_code: joinCode,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (error) {
        // Check if it's a unique constraint violation on join_code
        if (error.code === '23505' && error.message.includes('join_code')) {
          if (attempt === maxAttempts) {
            throw new Error(
              'Failed to generate a unique join code after multiple attempts. Please try again.'
            );
          }
          // Retry with a new code
          continue;
        }
        throw new Error(`Failed to create household: ${error.message}`);
      }

      if (!data) {
        throw new Error('Failed to create household: no data returned');
      }

      return mapHousehold(data);
    }

    throw new Error('Failed to create household: unexpected error');
  }

  /**
   * Finds a household by its join code.
   */
  async findByJoinCode(code: string): Promise<Household | null> {
    const { data, error } = await supabase
      .from('households')
      .select('*')
      .eq('join_code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to find household by join code: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return mapHousehold(data);
  }

  /**
   * Joins a household by its join code.
   * Throws a friendly error if the household is not found.
   */
  async joinByCode(code: string): Promise<Household> {
    const household = await this.findByJoinCode(code);

    if (!household) {
      throw new Error(`No household found with join code "${code}". Please check the code and try again.`);
    }

    return household;
  }

  /**
   * Gets the current household for the authenticated user.
   * For now, returns the first household the user is a member of.
   */
  async getCurrentHousehold(): Promise<Household | null> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    if (!session?.user) {
      return null;
    }

    // Get household through members table
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('household_id')
      .eq('user_id', session.user.id)
      .limit(1)
      .single();

    if (memberError) {
      if (memberError.code === 'PGRST116') {
        // No member record found
        return null;
      }
      throw new Error(`Failed to get current household: ${memberError.message}`);
    }

    if (!memberData) {
      return null;
    }

    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('id', memberData.household_id)
      .single();

    if (householdError) {
      if (householdError.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to get household: ${householdError.message}`);
    }

    if (!householdData) {
      return null;
    }

    return mapHousehold(householdData);
  }

  /**
   * Lists all members of a household.
   */
  async listMembers(householdId: string): Promise<Member[]> {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('household_id', householdId);

    if (error) {
      throw new Error(`Failed to list members: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      householdId: row.household_id,
      displayName: row.display_name,
    }));
  }
}

