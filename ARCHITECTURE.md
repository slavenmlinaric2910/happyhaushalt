# ARCHITECTURE.md

## Goal
Build a calm, installable **offline-capable PWA** for household chores:
- Minimal UI (Home/Areas, Chores, Household)
- Offline-first (works without network; queues writes; syncs later)
- Clean separation of concerns so features can be built independently

## Tech stack
- React + TypeScript + Vite
- Routing: React Router
- Data caching: TanStack Query (where useful)
- Offline storage: Dexie (IndexedDB)
- PWA: vite-plugin-pwa (Workbox)
- Tests: Vitest + React Testing Library (+ Playwright smoke e2e)

## High-level architecture (layers)

**UI (screens/components)**
→ **Feature hooks / view-model**
→ **Repository interfaces (contract)**
→ **Local store (Dexie) + OfflineEngine (outbox)**
→ **Remote adapter** (stub now, real backend later)

### Key rule
**UI never talks directly to Dexie or remote APIs.**
All data access goes through repositories.

## Folder structure

src/
app/ # App shell, routing, providers, layout
core/
types/ # Domain types (Household, Member, ChoreTemplate, Task, OfflineOp)
repos/ # Repo interfaces + implementations
offline/ # Dexie schema, OfflineEngine, connectivity, outbox/sync
ui/ # Shared UI primitives (Card, Chip, IconButton, Fab)
features/
home/ # Home page (mood card + area tiles)
chores/ # Chore templates list + edit/create
household/ # Members + join code + settings
today/ # (optional) consolidated task list
assets/
illustrations/ # house mood + area illustrations (png/svg)


## Data model (conceptual)
Core entities:
- **Household**: id, name, joinCode
- **Member**: id, householdId, displayName
- **ChoreTemplate**: id, householdId, name, area, frequency, rotationCursor, archived
- **TaskInstance**: id, householdId, choreTemplateId, dueDate, assignedMemberId, status, completedAt
- **OutboxOp**: queued offline operation (type, payload, status, error)

## Repositories (contracts)
Repositories define the stable API for features.

Typical interfaces:
- `HouseholdRepo`: create/join/getCurrent/listMembers
- `ChoreRepo`: list/create/update/archive
- `TaskRepo`: listTasks(range), completeTask(id), regenerateTasksIfNeeded()

**LocalDexieRepo** implements these contracts using Dexie.
A **RemoteRepoAdapter** may exist (stub now), used by the OfflineEngine during sync.

## OfflineEngine (outbox + sync)
Purpose: support offline writes without breaking UX.

### Behavior
- When **offline**:
  - Apply optimistic change locally (Dexie)
  - Enqueue an `OutboxOp` (pending)
- When **online**:
  - Process outbox sequentially
  - Call remote adapter (stub/real)
  - Mark ops as done or failed
  - Expose queue state to the UI (OfflineBanner)

### UI integration
A global `OfflineBanner` shows:
- Offline mode
- Syncing…
- Sync failed (Retry)

## Feature isolation (how to work in parallel)
- Features live in `src/features/<feature>/`.
- Features may create their own components/hooks but must depend only on:
  - `core/types`
  - `core/repos` (interfaces)
  - `core/ui`
- Any change to `src/core/**` should be minimal and requires owner review.

## UI design principles (summary)
- Card-based layout, large radius, subtle shadows
- Calm pastel tile backgrounds
- Minimal chips/dots for status
- No gamification (no points, streaks, rewards)

## Extending the backend later
We can swap the RemoteRepoAdapter to Supabase/Firebase without rewriting UI:
- Keep repo method signatures stable
- Keep mapping logic inside `core/repos/*`
- Keep sync logic in `core/offline/*`

## Non-goals
- No complex gamification
- No full calendar scheduling engine in MVP
- No multi-household management unless required