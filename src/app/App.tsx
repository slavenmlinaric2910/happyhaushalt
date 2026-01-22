import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { OfflineEngineProvider } from './providers/OfflineEngineProvider';
import { RepoProvider } from './providers/RepoProvider';
import { AuthProvider } from './providers/AuthProvider';
import { BootstrapGuard } from './components/BootstrapGuard';
import { AppLayout } from './layout/AppLayout';
import { LoadingView } from './components/LoadingView';

// Lazy load routes for code splitting
const HomePage = lazy(() => import('../features/home/HomePage').then(module => ({ default: module.HomePage })));
const HouseholdPage = lazy(() => import('../features/household/HouseholdPage').then(module => ({ default: module.HouseholdPage })));
const OnboardingPage = lazy(() => import('../features/onboarding/OnboardingPage').then(module => ({ default: module.OnboardingPage })));
const LoginPage = lazy(() => import('../features/auth/LoginPage').then(module => ({ default: module.LoginPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  return (
    <BootstrapGuard>
      <Suspense fallback={<LoadingView />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route
            path="/"
            element={<AppLayout />}
          >
            <Route index element={<Navigate to="/tasks" replace />} />
            <Route path="tasks" element={<HomePage />} />
            <Route path="household" element={<HouseholdPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BootstrapGuard>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineEngineProvider>
        <RepoProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </RepoProvider>
      </OfflineEngineProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

