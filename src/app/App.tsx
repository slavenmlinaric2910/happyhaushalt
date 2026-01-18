import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfflineEngineProvider } from './providers/OfflineEngineProvider';
import { RepoProvider } from './providers/RepoProvider';
import { AuthProvider } from './providers/AuthProvider';
import { BootstrapGuard } from './components/BootstrapGuard';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from '../features/home/HomePage';
import { ChoresPage } from '../features/chores/ChoresPage';
import { ChoreDetailPage } from '../features/chores/ChoreDetailPage';
import { HouseholdPage } from '../features/household/HouseholdPage';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { LoginPage } from '../features/auth/LoginPage';

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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route
          path="/"
          element={<AppLayout />}
        >
          <Route index element={<Navigate to="/tasks" replace />} />
          <Route path="tasks" element={<HomePage />} />
          <Route path="chores" element={<ChoresPage />} />
          <Route path="chores/:id" element={<ChoreDetailPage />} />
          <Route path="household" element={<HouseholdPage />} />
        </Route>
      </Routes>
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
    </QueryClientProvider>
  );
}

