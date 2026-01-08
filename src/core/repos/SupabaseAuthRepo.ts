import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client';
import type { AuthRepo } from './interfaces';

export class SupabaseAuthRepo implements AuthRepo {
  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      throw new Error(`Failed to sign in with Google: ${error.message}`);
    }
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(`Failed to sign out: ${error.message}`);
    }
  }

  async getSession(): Promise<Session | null> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(`Failed to get session: ${error.message}`);
    }

    return session;
  }

  onAuthStateChange(handler: (session: Session | null) => void): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handler(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }
}

