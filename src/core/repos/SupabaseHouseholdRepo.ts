import { supabase } from '../../lib/supabase/client';
import { generateJoinCode } from '../../lib/joinCode';
import type { HouseholdRepo, MemberRepo } from './interfaces';
import type { Household, Member } from '../types';
import { mapMember } from './SupabaseMemberRepo';

/**
 * Supabase household row type.
 */
interface SupabaseHouseholdRow {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
  created_by?: string;
}

/**
 * Supabase household row with nested members.
 */
interface SupabaseHouseholdWithMembersRow extends SupabaseHouseholdRow {
  members: Array<{
    id: string;
    household_id: string;
    user_id: string;
    display_name: string;
    avatar_id: string;
  }>;
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
    createdBy: row.created_by,
  };
}

export class SupabaseHouseholdRepo implements HouseholdRepo {
  constructor(private memberRepo: MemberRepo) {}

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
   * Reads current member via MemberRepo, then fetches household by member.household_id.
   */
  async getCurrentHousehold(): Promise<Household | null> {
    const member = await this.memberRepo.getCurrentMember();
    
    if (!member) {
      return null;
    }

    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('id', member.householdId)
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
   * Delegates to MemberRepo for consistency.
   */
  async listMembers(householdId: string): Promise<Member[]> {
    return this.memberRepo.listMembersByHousehold(householdId);
  }

  /**
   * Gets the current household with all its members in a single query.
   * This eliminates the sequential waterfall of getCurrentHousehold + listMembers.
   * 
   * @param member - Optional member to use instead of fetching. If not provided, will fetch via memberRepo.
   */
  async getCurrentHouseholdWithMembers(member?: Member | null): Promise<{ household: Household | null; members: Member[] }> {
    // Use provided member or fetch if not provided
    const currentMember = member ?? await this.memberRepo.getCurrentMember();
    
    if (!currentMember) {
      return { household: null, members: [] };
    }

    // Single query with nested members using Supabase foreign key relationship
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select(`
        *,
        members (*)
      `)
      .eq('id', currentMember.householdId)
      .single();

    if (householdError) {
      if (householdError.code === 'PGRST116') {
        return { household: null, members: [] };
      }
      throw new Error(`Failed to get household: ${householdError.message}`);
    }

    if (!householdData) {
      return { household: null, members: [] };
    }

    const household = mapHousehold(householdData as SupabaseHouseholdRow);
    const members = ((householdData as SupabaseHouseholdWithMembersRow).members || []).map(mapMember);
    
    return { household, members };
  }
}

