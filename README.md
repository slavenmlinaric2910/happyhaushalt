# Home Chores - Offline-Capable PWA

A Progressive Web App for managing household chores with offline-first architecture.

## Features

- ✅ **Installable PWA** - Install on any device
- ✅ **Offline-First** - Works without internet connection
- ✅ **Sync Queue** - Operations queued offline sync when connection is restored
- ✅ **Clean Architecture** - Repository pattern with clear boundaries
- ✅ **Type-Safe** - Full TypeScript coverage

## Tech Stack

- **Vite** + **React** + **TypeScript**
- **React Router** for routing
- **@tanstack/react-query** for data fetching/caching
- **Dexie** (IndexedDB) for offline storage
- **Supabase Auth** for Google OAuth (session gating)
- **vite-plugin-pwa** (Workbox) for PWA features
- **Vitest** + **React Testing Library** for unit tests
- **Playwright** for E2E tests

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting & Formatting

```bash
npm run lint
npm run format
```

### Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

## Offline Demo

To test offline functionality:

1. **Start the app**: `npm run dev`
2. **Open DevTools** → Network tab → Enable "Offline" mode (or use airplane mode on mobile)
3. **Complete a task**: Go to the Tasks page, check off a task
4. **Check the offline banner**: You should see "Offline mode" at the top
5. **Go back online**: Disable offline mode in DevTools
6. **Watch sync happen**: The banner should show "Syncing…" then disappear when done

The app uses an outbox pattern: all write operations are queued locally when offline, then synced sequentially when connection is restored.

## Project Structure

```
src/
  app/               # App shell, routing, providers, layout
  core/
    types/           # Shared domain types
    repos/           # Repository interfaces + implementations
    offline/         # OfflineEngine, connectivity, Dexie schema
    ui/              # Shared UI primitives
  features/
    home/            # Tasks page (integrated view)
    tasks/           # Create task flow
    household/       # Household/members management
  lib/               # Utilities (dates, ids, logging, seed data)
  assets/            # Static assets
```

## Architecture

### Provider Order (critical)

QueryClientProvider → OfflineEngineProvider → RepoProvider → AuthProvider → BrowserRouter → BootstrapGuard → Routes

This order ensures the offline engine exists before repositories, and that the auth state is ready before routing.

### Repository Pattern

The app uses a repository pattern to abstract data access:

- **Interfaces**: `AuthRepo`, `HouseholdRepo`, `MemberRepo`, `TaskRepo`, `ChoreRepo`
- **LocalDexieRepo**: Offline-first implementation using Dexie
- **RemoteRepoStub**: Placeholder for future backend integration
 - **Supabase* repos**: Remote-only repos (auth, household, member)

### Offline Engine

The `OfflineEngine` manages offline operations:

- Tracks online/offline status
- Maintains an outbox queue in IndexedDB
- Processes operations sequentially when online
- Provides sync status via UI `OfflineBanner`

### Data Model

- **Households**: `id`, `name`, `joinCode`, `createdAt`
- **Members**: `id`, `householdId`, `displayName`
- **ChoreTemplates**: `id`, `householdId`, `name`, `area`, `frequencyType`, `frequencyValue`, `rotationCursor`, `isArchived`, `checklistItems`
- **Tasks**: `id`, `householdId`, `choreTemplateId`, `dueDate`, `assignedMemberId`, `status`, `completedAt`
- **Outbox**: `id`, `createdAt`, `type`, `payload`, `status`, `error`

## Seed Data

On first load, the app automatically seeds demo data:
- 1 household ("Demo Household")
- 3 members (Alice, Bob, Charlie)
- 3 chore templates (Dishes, Vacuum, Bathroom Clean)
- Tasks for today

Seed data is idempotent - it only runs once (tracked in localStorage).

## PWA Features

- **Manifest**: Configured for installability
- **Service Worker**: Caches app shell and assets
- **Offline Support**: Full functionality without network
- **Update Detection**: Service worker updates handled automatically

## Future Enhancements

- Real backend integration (replace `RemoteRepoStub`)
- User authentication
- Push notifications
- Task assignment algorithms
- Recurring task generation
- Multi-household support

## License

MIT

