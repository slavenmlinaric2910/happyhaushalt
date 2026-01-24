import { supabase } from '../../lib/supabase/client';
import type { AreaRepo } from './interfaces';
import type { Area } from '../types';

export class SupabaseAreaRepo implements AreaRepo {
  async listAreas(): Promise<Area[]> {
    const { data, error } = await supabase
      .from('areas')
      .select('id, key, name')
      .eq('is_active', true)
      .order('sort_order');

    if (error) {
      throw new Error(`Failed to fetch areas: ${error.message}`);
    }

    return data ?? [];
  }
}
