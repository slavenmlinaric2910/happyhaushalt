import { useEffect, useRef, ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { useMemberRepo } from '../providers/RepoProvider';
import { LoadingView } from './LoadingView';

interface BootstrapGuardProps {
  children: ReactNode;
}

export function BootstrapGuard({ children }: BootstrapGuardProps) {
  const { loading: authLoading, user } = useAuth();
  const memberRepo = useMemberRepo();
  const queryClient = useQueryClient();
  const location = useLocation();
  const userId = user?.id || '';
  const lastPathnameRef = useRef<string>(location.pathname);

  // Fetch member via React Query (cached for reuse by other components)
  const { data: member, isLoading: memberLoading, error: memberError } = useQuery({
    queryKey: ['member', userId],
    queryFn: () => memberRepo.getCurrentMember(),
    enabled: !!user, // Only fetch when user exists
    staleTime: 1000 * 60 * 5, // 5 minutes (member doesn't change often)
    refetchOnWindowFocus: false,
  });

  // Handle navigation away from onboarding (member might have been created)
  useEffect(() => {
    const navigatedAwayFromOnboarding =
      lastPathnameRef.current === '/onboarding' &&
      location.pathname !== '/onboarding';
    
    if (navigatedAwayFromOnboarding && user) {
      // Invalidate member query to refetch after onboarding completes
      queryClient.invalidateQueries({ queryKey: ['member', userId] });
    }
    
    lastPathnameRef.current = location.pathname;
  }, [location.pathname, user, userId, queryClient]);

  // Show loading during auth check
  if (authLoading) {
    return <LoadingView />;
  }

  // Redirect to login if no user
  if (!user) {
    // Only redirect if not already on login page to avoid loops
    if (location.pathname !== '/login') {
      return <Navigate to="/login" replace />;
    }
    // If already on login, render children (login page)
    return <>{children}</>;
  }

  // Show loading while fetching member
  if (memberLoading) {
    return <LoadingView />;
  }

  // If no member (null or error), redirect to onboarding (unless already there)
  if (!member || memberError) {
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }
    // If already on onboarding, render children
    return <>{children}</>;
  }

  // Member exists - allow app routes
  // If on login or onboarding page, redirect to home
  if (location.pathname === '/login' || location.pathname === '/onboarding') {
    return <Navigate to="/home" replace />;
  }
  // Allow all other routes
  return <>{children}</>;
}

