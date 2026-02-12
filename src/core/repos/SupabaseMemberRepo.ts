import { supabase } from '../../lib/supabase/client';
import type { MemberRepo } from './interfaces';
import type { Member } from '../types';
import type { AvatarId } from '../../features/onboarding/avatars';

/**
 * Supabase member row type.
 */
interface SupabaseMemberRow {
  id: string;
  household_id: string;
  user_id: string;
  display_name: string;
  avatar_id: string;
}

/**
 * Maps a Supabase member row to a domain Member object.
 */
export function mapMember(row: SupabaseMemberRow): Member {
  return {
    id: row.id,
    householdId: row.household_id,
    displayName: row.display_name,
    avatarId: row.avatar_id as AvatarId,
    userId: row.user_id,
  };
}

export class SupabaseMemberRepo implements MemberRepo {
  /**
   * Gets the current member for the authenticated user.
   * Returns null if no member exists.
   */
  async getCurrentMember(): Promise<Member | null> {
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

    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (memberError) {
      if (memberError.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to get current member: ${memberError.message}`);
    }

    if (!memberData) {
      return null;
    }

    return mapMember(memberData);
  }

    /**
   * Leaves the current household for the authenticated user.
   *
   * This removes the "member" record for the current user. After that,
   * getCurrentMember() will return null and the app will behave as "not in a household".
   *
   * Important:
   * - Supabase/PostgREST can return 204 even when 0 rows were deleted (e.g. RLS or no match).
   * - Therefore we request a return payload and validate that something was actually deleted.
   */
  async leaveCurrentHousehold(nextOwnerUserId?: string | null): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Failed to get session: ${sessionError.message}`);
  }
  if (!session?.user) {
    throw new Error('User must be authenticated to leave a household');
  }

  // Call the Postgres function (SECURITY DEFINER)
  const { error } = await supabase.rpc('leave_household', { p_next_owner: nextOwnerUserId ?? null });

  if (error) {
    throw new Error(`Failed to leave household: ${error.message}`);
  }
}


  /**
   * Lists all members of a household.
   */
  async listMembersByHousehold(householdId: string): Promise<Member[]> {
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

    return data.map(mapMember);
  }

  /**
   * Ensures a member exists for the current user in the given household.
   * If the member already exists (by user_id), returns it.
   * Otherwise, creates a new member record.
   * On unique violation, re-fetches and returns the existing member.
   */
  async ensureMemberExists(args: {
    householdId: string;
    displayName: string;
    avatarId: AvatarId;
  }): Promise<Member> {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }

    if (!session?.user) {
      throw new Error('User must be authenticated to ensure member exists');
    }

    const userId = session.user.id;

    // First, try to find existing member by user_id
    const { data: existingMember, error: selectError } = await supabase
      .from('members')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is fine - we'll create one
      throw new Error(`Failed to check for existing member: ${selectError.message}`);
    }

    if (existingMember) {
      return mapMember(existingMember);
    }

    // Member doesn't exist, create it
    const { data: newMember, error: insertError } = await supabase
      .from('members')
      .insert({
        user_id: userId,
        household_id: args.householdId,
        display_name: args.displayName,
        avatar_id: args.avatarId,
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a unique constraint violation on user_id
      if (insertError.code === '23505' && insertError.message.includes('user_id')) {
        // Another request created the member, re-fetch it
        const { data: fetchedMember, error: fetchError } = await supabase
          .from('members')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fetchError) {
          throw new Error(
            `Failed to fetch member after unique violation: ${fetchError.message}`
          );
        }

        if (!fetchedMember) {
          throw new Error('Member not found after unique violation');
        }

        return mapMember(fetchedMember);
      }

      throw new Error(`Failed to create member: ${insertError.message}`);
    }

    if (!newMember) {
      throw new Error('Failed to create member: no data returned');
    }

    return mapMember(newMember);
  }
}

