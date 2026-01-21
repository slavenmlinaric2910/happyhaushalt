import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { HouseholdPage } from './HouseholdPage';

// --- Mocks -------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockHouseholdRepo = {
  getCurrentHousehold: vi.fn(),
};

const mockMemberRepo = {
  listMembersByHousehold: vi.fn(),
  leaveCurrentHousehold: vi.fn(),
};

// HouseholdPage uses these hooks from RepoProvider, so we mock them here
vi.mock('../../app/providers/RepoProvider', () => ({
  useHouseholdRepo: () => mockHouseholdRepo,
  useMemberRepo: () => mockMemberRepo,
}));

// --- Helpers -----------------------------------------------------------

function renderWithProviders() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // tests should fail fast
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HouseholdPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('HouseholdPage - Leave button', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Confirm dialog should allow leaving in this test
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // Mock household + members
    mockHouseholdRepo.getCurrentHousehold.mockResolvedValue({
      id: 'household-1',
      name: 'Test Household',
      joinCode: 'ABC123',
      createdBy: 'user-1',
    });

    mockMemberRepo.listMembersByHousehold.mockResolvedValue([
      {
        id: 'member-1',
        userId: 'user-1',
        displayName: 'Owner User',
        avatarId: 'broom-buddy',
      },
      {
        id: 'member-2',
        userId: 'user-2',
        displayName: 'Second User',
        avatarId: 'broom-buddy',
      },
    ]);

    mockMemberRepo.leaveCurrentHousehold.mockResolvedValue(undefined);
  });

  it('leaves the household and navigates to onboarding', async () => {
    renderWithProviders();

    // Wait until the real (non-loading) UI is visible
    expect(await screen.findByRole('button', { name: /invite/i })).toBeInTheDocument();

    const leaveButton = await screen.findByRole('button', { name: /leave/i });
    await userEvent.click(leaveButton);

    await waitFor(() => {
      expect(mockMemberRepo.leaveCurrentHousehold).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
    });
  });
});
