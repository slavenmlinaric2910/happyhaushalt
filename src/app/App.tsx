import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfflineEngineProvider } from './providers/OfflineEngineProvider';
import { RepoProvider } from './providers/RepoProvider';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from '../features/home/HomePage';
import { TodayPage } from '../features/today/TodayPage';
import { ChoresPage } from '../features/chores/ChoresPage';
import { ChoreDetailPage } from '../features/chores/ChoreDetailPage';
import { HouseholdPage } from '../features/household/HouseholdPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <OfflineEngineProvider>
        <RepoProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="home" element={<HomePage />} />
                <Route path="today" element={<TodayPage />} />
                <Route path="chores" element={<ChoresPage />} />
                <Route path="chores/:id" element={<ChoreDetailPage />} />
                <Route path="household" element={<HouseholdPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </RepoProvider>
      </OfflineEngineProvider>
    </QueryClientProvider>
  );
}

