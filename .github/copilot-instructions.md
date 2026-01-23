# AI Agent Instructions — HappyHaushalt

## Project Overview
**HappyHaushalt** is an offline-first PWA for managing household chores with real-time sync. The codebase emphasizes clean architecture, repository pattern for data access, and graceful offline functionality.

**Key Tech Stack:** React 18, TypeScript, Vite, React Router v6, TanStack Query, Dexie (IndexedDB), Supabase Auth, Vitest, Playwright.

---

## Architecture Essentials

### Provider Nesting Order (Critical!)
The app initializes with a strict provider order in `src/app/App.tsx`:
```
QueryClientProvider
  → OfflineEngineProvider (must come before RepoProvider!)
    → RepoProvider (injects repos + offline engine)
      → AuthProvider (manages session state)
        → BrowserRouter
          → BootstrapGuard (auth/member routing logic)
            → Routes
```

**Why this order matters:**
- `OfflineEngineProvider` creates the offline engine instance; `RepoProvider` depends on it.
- `AuthProvider` subscribes to Supabase auth state changes.
- `BootstrapGuard` orchestrates redirect logic based on auth + member state.

### Data Layer: Repository Pattern
All data access happens through repositories (`src/core/repos/interfaces.ts`):
- `AuthRepo`: Sign-in, sign-out, session management (impl: `SupabaseAuthRepo`)
- `HouseholdRepo`: Create/join households (impl: `SupabaseHouseholdRepo`)
- `MemberRepo`: Current member, profile updates (impl: `SupabaseMemberRepo`)
- `TaskRepo` / `ChoreRepo`: Task/chore CRUD and rotation logic (impl: `LocalDexieRepo`)

**Key usage pattern:**
```tsx
const repo = useRepo(); // LocalDexieRepo (offline + remote sync)
const memberRepo = useMemberRepo(); // SupabaseMemberRepo (remote only)
```

Features only interact with repo interfaces, never directly with Dexie or Supabase.

### Offline Engine & Outbox
`src/core/offline/OfflineEngine.ts` implements the outbox pattern:
- When **offline**: writes go to Dexie immediately; an `OutboxOp` is queued as `pending`.
- When **online**: outbox processes ops sequentially; UI shows "Syncing…" banner.
- Remote operations via `RemoteRepoStub` (placeholder; real sync not yet implemented).

**UI component:** `OfflineBanner` displays offline mode, syncing status, and retry button.

### Bootstrap & Auth Flow
`BootstrapGuard` (`src/app/components/BootstrapGuard.tsx`) enforces a strict routing gate:
1. Wait for auth to initialize (`AuthProvider`).
2. If no user → redirect to `/login` (unless already there).
3. If user exists → fetch current member.
4. If no member → redirect to `/onboarding` (unless already there).
5. Otherwise → allow app routes (tasks, household).

This prevents race conditions and ensures the UI never displays data before auth & member are ready.

---

## UI Conventions & Design Rules

### Styling Approach
- **CSS Modules** (`.module.css`) with BEM-like naming: `.navItem`, `.navItem:hover`, `.active`.
- **Colors:** Off-white background (#F6F3EF), white cards, soft pastels for accents only.
- **No Tailwind:** Write plain CSS; follow the warm, minimal aesthetic (see `.cursor/rules/design-ui-style.mdc`).
- **Mobile-first:** Max content width 420px; consistent 20px padding.

### Component Structure
- **UI Primitives** in `src/core/ui/`: `Button`, `Card`, `Chip`, `IconButton`, `OfflineBanner`, `CreateModal`.
- **Feature Pages** in `src/features/`: auth, home (tasks), household, onboarding.
- **Hooks** for providers: `useAuth()`, `useRepo()`, `useHouseholdRepo()`, `useMemberRepo()`, `useOfflineEngineContext()`.

### Navigation (Navbar)
Bottom navbar shows:
- **Tasks** (icon: ListTodo) → Tasks page
- **+ Button** (centered, floats above navbar) → Opens `CreateModal` with "Create Task" / "Create Chore" options
- **Household** (icon: Users) → Household/members page

Updated in Week 2: removed "Today" and "Chores" pages (functionality merged into Tasks page).

---

## Common Workflows

### Adding a New Feature Page
1. Create `src/features/{feature}/{FeaturePage}.tsx`.
2. Create accompanying `.module.css` with feature-specific styles.
3. Add route in `src/app/App.tsx`.
4. Update navbar if needed (edit `src/app/layout/AppLayout.tsx`).
5. Use repo hooks to fetch data: `useRepo()`, `useHouseholdRepo()`, etc.
6. Wrap data fetching in `useQuery` from TanStack Query.

### Adding a UI Component
1. Create `src/core/ui/{ComponentName}.tsx` + `.module.css`.
2. Keep minimal and reusable (no business logic).
3. Accept `className` prop for composition.
4. Use lucide-react for icons (import as: `import { IconName } from 'lucide-react'`).

### Implementing an Offline Operation
1. Add operation type to `OfflineOpType` in `src/core/types/index.ts`.
2. Update `LocalDexieRepo` to queue the op + apply local state.
3. Update `RemoteRepoStub` with the remote handler (currently a placeholder).
4. Test offline by opening DevTools → Network tab → "Offline" mode.

### Modifying Routes
- Routes defined in `src/app/App.tsx` under `AppRoutes()`.
- Protected routes use `BootstrapGuard`; public routes (login, onboarding) are inside it.
- Redirects handled by `BootstrapGuard` logic, not individual route guards.

---

## Testing & Validation

### Post-Change Checklist (ALWAYS DO AFTER CODE EDITS!)
After any code changes:
1. **Lint Check:** Run `npm run lint` — must pass with 0 warnings/errors
2. **TypeScript Check:** Run `npm run typecheck` — must pass with 0 errors
3. **Unit Tests:** Run `npm test` — should pass or show only expected test failures
4. **E2E Tests:** Run `npm run test:e2e` — smoke tests must pass
5. **Manual Dev Check:** Run `npm run dev` and test in browser if UI/flow changed

**Fail fast:** Stop and fix issues immediately if any test fails; don't proceed with further changes.

### Commands
```bash
npm run dev           # Start dev server (Vite)
npm run build         # TypeScript check + build
npm run lint          # ESLint (must pass)
npm run format        # Prettier (auto-format src/)
npm test              # Vitest (unit tests)
npm run test:e2e      # Playwright (E2E tests)
npm run typecheck     # TypeScript only (fast check)
```

### E2E Tests
Located in `tests/e2e/smoke.spec.ts`. Tests check:
- App loads and shows login page.
- Navigation tabs render correctly.

Tests run against dev build; ensure `npm run build` and `npm run dev` pass first.

### Common Issues
- **"Page not found":** Routes must be defined in `src/app/App.tsx`.
- **"Module not found":** Check imports; use `src/` paths or `@/` alias.
- **Auth loop:** Verify `BootstrapGuard` logic and provider order.
- **Offline tests:** Use DevTools offline mode, not just disabling network.
- **E2E timeout waiting for locator:** Element doesn't exist; check if page/component was deleted or renamed
- **Test expects wrong text:** Update test assertions when page titles or UI text change
- **Playwright browser not found:** Run `npx playwright install chromium` to download browsers

---

## File Structure Cheat Sheet

```
src/
  app/
    App.tsx                      # Route definitions + provider nesting
    layout/AppLayout.tsx         # Navbar + modal
    components/
      BootstrapGuard.tsx         # Auth/member routing gate
      ProtectedRoute.tsx         # Unused (BootstrapGuard does this)
      PublicRoute.tsx            # Unused
    providers/
      AuthProvider.tsx           # Auth context + session state
      RepoProvider.tsx           # Repo injection
      OfflineEngineProvider.tsx  # Offline engine creation
  core/
    types/index.ts               # Domain types (Household, Member, TaskInstance, etc.)
    repos/
      interfaces.ts              # Repo interfaces
      LocalDexieRepo.ts          # Offline data store
      SupabaseAuthRepo.ts        # Remote auth
      Supabase*.ts               # Remote repos (household, member)
      RemoteRepoStub.ts          # Sync placeholder
    offline/
      OfflineEngine.ts           # Outbox + sync orchestration
      db.ts                      # Dexie schema
      connectivity.ts            # Online/offline detection
    ui/
      {Button, Card, etc.}.tsx   # UI primitives + CSS modules
  features/
    auth/LoginPage.tsx
    home/HomePage.tsx            # Tasks page (post-Week 2)
    household/HouseholdPage.tsx
    onboarding/OnboardingPage.tsx
  lib/
    utils.ts, seed.ts, joinCode.ts, logger.ts
    supabase/client.ts           # Supabase JS client
  index.css                       # Global styles
  main.tsx                        # Entry point
docs/
  project-log.md                 # Weekly progress log
  ARCHITECTURE.md                # High-level design
```

---

## Key Decisions & Constraints

1. **One Household per User (MVP):** No household switching; simplifies auth logic.
2. **No Gamification:** Calm, minimal UI by design.
3. **Offline-First:** All reads from Dexie; writes queue if offline.
4. **Repository Pattern:** Prevents tight coupling to Dexie/Supabase.
5. **TypeScript Strict:** No `any`; keep errors tight.
6. **Mobile-First CSS:** Assume 420px width max; test on mobile.

---

## Recent Changes (Week 2 — Navbar Redesign)

- Removed `Today` and `Chores` feature pages.
- Navbar now shows: **Tasks** (center, home) + **+ Button** + **Household**.
- Tasks page integrates today's task tiles + mood card + areas.
- Added `CreateModal` component for task/chore creation (handlers: TODOs).
- Updated E2E tests to match new navigation.

---

## How to Get Unstuck

1. **"Where is this data stored?"** → Check `src/core/repos/` and `OfflineEngine`.
2. **"How do I fetch data?"** → Use `useQuery` + repo hooks + `TanStack Query`.
3. **"Why is my component not rendering?"** → Likely in `BootstrapGuard` or missing provider.
4. **"How do I handle offline?"** → Write to repo normally; `OfflineEngine` queues ops.
5. **"How do I style a component?"** → Create `.module.css` next to `.tsx`; use BEM naming.

---

## Next Steps (from project-log.md)

- Add testing coverage for task completion flow.
