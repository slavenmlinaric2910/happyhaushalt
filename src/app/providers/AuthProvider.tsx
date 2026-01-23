import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useAuthRepo } from './RepoProvider';

interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const authRepo = useAuthRepo();
  const [loading, setLoading] = useState<boolean>(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const initialSession = await authRepo.getSession();
        if (!mounted) return;

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        if (!mounted) return;
        console.error('Failed to get initial session:', error);
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const unsubscribe = authRepo.onAuthStateChange((newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [authRepo]);

  const signInWithGoogle = useCallback(async () => {
    await authRepo.signInWithGoogle();
  }, [authRepo]);

  const signOut = useCallback(async () => {
    await authRepo.signOut();
  }, [authRepo]);

  const value: AuthContextValue = {
    loading,
    session,
    user,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    // During Vite React Refresh, modules/providers can be transiently reloaded,
    // and consumers may render for a moment before the provider is re-mounted.
    // Returning a safe fallback avoids dev-time crashes without changing prod behavior.
    if (import.meta.hot) {
      return {
        loading: true,
        session: null,
        user: null,
        signInWithGoogle: async () => {},
        signOut: async () => {},
      };
    }
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

