import { useEffect, useState, useRef, ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { useMemberRepo } from '../providers/RepoProvider';
import { LoadingView } from './LoadingView';
import type { Member } from '../../core/types';

interface BootstrapGuardProps {
  children: ReactNode;
}

type BootstrapState =
  | { status: 'loading-auth' }
  | { status: 'loading-member' }
  | { status: 'no-user' }
  | { status: 'no-member' }
  | { status: 'ready'; member: Member };

export function BootstrapGuard({ children }: BootstrapGuardProps) {
  const { loading: authLoading, user } = useAuth();
  const memberRepo = useMemberRepo();
  const location = useLocation();
  const [state, setState] = useState<BootstrapState>({ status: 'loading-auth' });
  const [memberFetched, setMemberFetched] = useState(false);
  const lastPathnameRef = useRef<string>(location.pathname);

  useEffect(() => {
    // Step 1: Wait for auth to load
    if (authLoading) {
      setState({ status: 'loading-auth' });
      return;
    }

    // Step 2: If no user, reset member fetch state and redirect to login
    if (!user) {
      setMemberFetched(false);
      setState({ status: 'no-user' });
      lastPathnameRef.current = location.pathname;
      return;
    }

    // Step 3: Fetch member
    // Re-fetch if:
    // - Never fetched before, OR
    // - Navigated away from onboarding (member might have been created)
    const navigatedAwayFromOnboarding =
      lastPathnameRef.current === '/onboarding' &&
      location.pathname !== '/onboarding';
    const shouldRefetch = !memberFetched || navigatedAwayFromOnboarding;

    if (shouldRefetch) {
      setState({ status: 'loading-member' });
      setMemberFetched(true);
      lastPathnameRef.current = location.pathname;

      memberRepo
        .getCurrentMember()
        .then((member) => {
          if (member) {
            setState({ status: 'ready', member });
          } else {
            setState({ status: 'no-member' });
          }
        })
        .catch((error) => {
          console.error('Failed to fetch member:', error);
          // On error, treat as no member to allow onboarding
          setState({ status: 'no-member' });
        });
      return;
    }

    // Update pathname ref even if not refetching
    lastPathnameRef.current = location.pathname;
  }, [authLoading, user, memberRepo, memberFetched, location.pathname]);

  // Show loading during auth check
  if (state.status === 'loading-auth') {
    return <LoadingView />;
  }

  // Redirect to login if no user
  if (state.status === 'no-user') {
    // Only redirect if not already on login page to avoid loops
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace />;
    }
    // If already on login, render children (login page)
    return <>{children}</>;
  }

  // Show loading while fetching member
  if (state.status === 'loading-member') {
    return <LoadingView />;
  }

  // If no member, redirect to onboarding (unless already there)
  if (state.status === 'no-member') {
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
    // If already on onboarding, render children
    return <>{children}</>;
  }

  // Member exists - allow app routes
  if (state.status === 'ready') {
    // If on login or onboarding page, redirect to home
    if (location.pathname === '/login' || location.pathname === '/onboarding') {
      return <Navigate to="/home" replace />;
    }
    // Allow all other routes
    return <>{children}</>;
  }

  // Fallback (shouldn't reach here)
  return <LoadingView />;
}

