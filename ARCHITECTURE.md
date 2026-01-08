
---

## Data model (conceptual)

Core entities:
- **User** (Supabase Auth): id (uuid), email, provider info
- **Household**: id, name, joinCode (unique), createdAt
- **Member**: id, householdId, userId (auth user), displayName, avatarId, createdAt
- **ChoreTemplate**: id, householdId, name, area, frequency, checklistItems?, rotationCursor, archived
- **TaskInstance**: id, householdId, choreTemplateId, dueDate, assignedMemberId, status, completedAt
- **OutboxOp**: id, type, payload, status (pending|syncing|failed|done), error?, createdAt

### Relationship summary
- Household 1..* Members
- Household 1..* ChoreTemplates
- Household 1..* TaskInstances
- Member belongs to exactly one Household in MVP
- Member is linked to exactly one Supabase User via userId

---

## Repository layer (contracts)

Repositories define stable APIs for features and hide storage details.

Typical interfaces:
- `AuthRepo`:
  - `signInWithGoogle()`, `signOut()`, `getSession()`, `onAuthStateChange()`
- `HouseholdRepo`:
  - `createHousehold(name)`, `joinByCode(code)`, `getCurrentHousehold()`
  - `getJoinCode()`, `listMembers()`
- `MemberRepo`:
  - `getCurrentMember()`, `ensureMemberExists()`, `updateProfile({displayName, avatarId})`
- `ChoreRepo`:
  - `listTemplates()`, `getTemplate(id)`, `createTemplate(dto)`, `updateTemplate(id,dto)`, `archiveTemplate(id)`
- `TaskRepo`:
  - `listTasks(filter)`, `completeTask(taskId)`, `regenerateIfNeeded()`

### Implementations
- Local implementations persist/read via Dexie (offline source of truth per device)
- Remote implementations call Supabase (used by sync and/or initial hydration)
- Feature code only depends on repo interfaces, never on Dexie/Supabase directly

---

## OfflineEngine (outbox + sync)

Purpose: enable offline writes with reliable later synchronization.

### States
- `pending`: queued locally
- `syncing`: being processed
- `failed`: needs retry (shows in UI)
- `done`: successfully synced

### Behavior
- When **offline**:
  - Apply local changes immediately (Dexie)
  - Enqueue `OutboxOp` as `pending`
- When **online**:
  - Process outbox sequentially
  - Execute remote operation (Supabase adapter)
  - Mark op `done` or `failed`
  - Expose engine state to UI

### UI integration
Global `OfflineBanner` shows:
- Offline mode
- Syncing…
- Sync failed + Retry button

---

## PWA strategy (installable + caching)
- `vite-plugin-pwa` generates service worker and manifest
- Cache strategy focuses on:
  - static assets (app shell, icons, illustrations, avatars)
  - navigation fallback for SPA routes
- Offline data lives in Dexie; service worker caching is for app shell and assets
- Update behavior: show a lightweight “Update available” hint if needed (optional)

---

## Feature isolation (parallel work)
- Each feature lives in `src/features/<feature>/`
- Features may create components/hooks but must only depend on:
  - `core/types`
  - `core/repos` (interfaces)
  - `core/ui`
- Changes to `src/core/**`, `src/app/**`, and config files require owner review (CODEOWNERS)

---

## UI design principles (summary)
- Card-based layout, large radius, subtle shadows
- Calm pastel tile backgrounds
- Minimal status indicators (dots/chips)
- No gamification visuals (no points/streaks)
- Illustrations used sparingly (home mood, areas, empty states)

---

## Extending backend later
This architecture supports swapping/expanding storage without rewriting UI:
- Keep repo method signatures stable
- Keep mapping logic inside `core/repos/*`
- Keep sync logic inside `core/offline/*`

---

## Non-goals
- Multi-household switching (MVP)
- Complex calendar scheduling
- Custom avatar uploads
- Advanced permissions beyond basic ownership
