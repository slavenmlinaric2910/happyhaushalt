import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { HouseholdPage } from './HouseholdPage';

// --- Mocks -------------------------------------------------------------

const signOutMock = vi.fn().mockResolvedValue(undefined);

vi.mock('../../app/providers/AuthProvider', async () => {
  const actual = await vi.importActual<typeof import('../../app/providers/AuthProvider')>(
    '../../app/providers/AuthProvider'
  );

  return {
    ...actual,
    useAuth: () => ({
      loading: false,
      session: null,
      user: { id: 'user-1' },
      signInWithGoogle: vi.fn(),
      signOut: signOutMock,
    }),
  };
});

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../core/offline/db', () => ({
  db: {
    members: {
      where: () => ({
        equals: () => ({
          first: vi.fn().mockResolvedValue(null),
          toArray: vi.fn().mockResolvedValue([]),
        }),
      }),
      put: vi.fn().mockResolvedValue(undefined),
      bulkPut: vi.fn().mockResolvedValue(undefined),
    },
    households: {
      toCollection: () => ({
        first: vi.fn().mockResolvedValue(null),
      }),
      put: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

const mockHouseholdRepo = {
  getCurrentHouseholdWithMembers: vi.fn(),
};

const mockMemberRepo = {
  getCurrentMember: vi.fn(),
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
      queries: { retry: false },
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

    mockMemberRepo.getCurrentMember.mockResolvedValue({
      id: 'member-1',
      userId: 'user-1',
      householdId: 'household-1',
      displayName: 'Owner User',
      avatarId: 'broom-buddy',
    });

    mockHouseholdRepo.getCurrentHouseholdWithMembers.mockResolvedValue({
      household: {
        id: 'household-1',
        name: 'Test Household',
        joinCode: 'ABC123',
        createdBy: 'user-1',
      },
      members: [
        {
          id: 'member-1',
          userId: 'user-1',
          householdId: 'household-1',
          displayName: 'Owner User',
          avatarId: 'broom-buddy',
        },
        {
          id: 'member-2',
          userId: 'user-2',
          householdId: 'household-1',
          displayName: 'Second User',
          avatarId: 'broom-buddy',
        },
      ],
    });

    mockMemberRepo.leaveCurrentHousehold.mockResolvedValue(undefined);
  });

  it('leaves the household and navigates to login', async () => {
    const user = userEvent.setup();
    renderWithProviders();

    // Wait until the real (non-loading) UI is visible
    expect(await screen.findByRole('button', { name: /invite/i })).toBeInTheDocument();

    // Click Leave -> opens dialog
    const leaveButton = await screen.findByRole('button', { name: /leave/i });
    await user.click(leaveButton);

    // Confirm inside dialog -> triggers mutation
    const dialog = await screen.findByRole('dialog');
    const confirmLeaveButton = within(dialog).getByRole('button', { name: /^leave$/i });
    await user.click(confirmLeaveButton);

    await waitFor(() => {
      expect(mockMemberRepo.leaveCurrentHousehold).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });
  });
});
