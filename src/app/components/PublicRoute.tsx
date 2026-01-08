import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

