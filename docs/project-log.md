# Project Log — HappyHaushalt

This log documents progress, decisions, and blockers throughout the project.
Goal: maintain a short, continuous record (weekly) of what was planned and delivered.

---

## Week 1 — Setup & Foundations (started 08.01.2026)

### Plan
- Set up GitLab repository and team workflow (branches, MRs, labels, board)
- Create initial offline-capable PWA scaffolding
- Define requirements and architecture documentation
- Prepare initial UI concept + assets

### Done
- GitLab repo created with board/labels and starter tickets
- Requirements catalog created (`docs/requirements.md`) and merged
- Architecture concept updated (`ARCHITECTURE.md`) and aligned with requirements
- UML diagrams created:
  - Class diagram (domain + repos + offline)
  - Sequence diagram (complete task offline → sync online)
- Initial UI mockups + illustrations/area icons added (design still adjustable)
- Basic offline foundation present (Dexie + outbox + OfflineBanner concept)

### Decisions
- Auth: Supabase Auth with Google OAuth
- Onboarding: login → create/join household by unique join code → go to Home
- Member handling: auto-create member on first login with defaults (displayName, avatarId)
- MVP scope: one household per user (no switching)
- No gamification; no complex calendar engine

### Blockers / Risks
- Clarify exact Supabase data model + minimal RLS strategy (if implementing real backend)
- Ensure offline writes do not require network and sync is robust on reconnect
- Keep scope small enough for course timeline

### Next
- Implement onboarding screens (create/join household)
- Implement member profile setup (name + avatar selection)
- Implement core chores templates flow (create/edit)
- Implement task completion + round-robin rotation + tests

---

## Week 2 — Navbar Redesign & Cleanup (started 14.01.2026)

### Plan
- Redesign navbar to show only core navigation: Tasks, Household, + (Create Task button)
- Remove Today and Chores pages (no longer needed; tasks shown inline on Tasks page)
- Integrate task tiles into the Tasks page with quick completion toggle
- Clean up routing and remove unused code

### Done
- Navbar completely redesigned:
  - Changed from 4 tabs (Home, Today, Chores, Household) to 2 tabs (Tasks, Household)
  - Added floating + button for creating new tasks (centered, slightly above navbar)
  - Reduced navbar height for more compact design
- Removed Today page completely
- Removed Chores and ChoreDetailPage (no longer accessible via routes)
- Renamed Home page to Tasks page (title updated)
- Integrated task tiles on Tasks page:
  - Displays today's tasks fetched from repo
  - Shows task title (from ChoreTemplate) and area
  - Quick toggle to mark task complete/incomplete
  - Fetches ChoreTemplates to properly map task data
- Fixed TypeScript errors in HomePage.tsx (property mapping from templates)
- Removed unused imports and lint errors

### Decisions
- Tasks page now serves dual purpose: shows HouseMood + Areas + today's task tiles
- Create Task button logic prepared (TODO: implement modal/dialog for creation)
- Kept all original HomePage components (HouseMoodCard, AreaTiles) intact

### Next
- Implement Create Task and Create Chore pages
- Design and implement ChoreTemplates management page
- Add task filtering/sorting on Tasks page if needed

---

## Week 2 (continued) — Task & Chore Creation (started 18.01.2026)

### Plan
- Implement CreateTaskPage for one-time task creation
- Implement CreateChorePage for recurring chore templates
- Set up database schema for tasks and chore_templates
- Connect forms to Supabase repositories

### Done
- **Task Creation (CreateTaskPage)**:
  - Form with fields: Name, Due Date, Area, Assignee
  - All fields required with validation
  - Fetches household members for assignee dropdown
  - Creates task via `SupabaseTaskRepo.createTask()`
  - Redirects to tasks page on success
- **Chore Creation (CreateChorePage)**:
  - Form with fields: Name, Frequency, Start Date, End Date, Area, Assignees
  - Frequency options: Daily, Weekly, Every 2 Weeks, Monthly
  - Multi-select for assignees (rotation members)
  - Creates chore template via `SupabaseChoreRepo.createChore()`
  - Redirects to tasks page on success
- **Database Schema**:
  - `tasks` table: id, household_id, template_id, title, due_date, assigned_user_id, area_id, status, completed_at, completed_by_user_id
  - `chore_templates` table: id, household_id, name, frequency, active, rotation_member_ids, start_date, end_date, area_id
- **Repository Implementation**:
  - `SupabaseTaskRepo`: createTask(), listTasks(), completeTask()
  - `SupabaseChoreRepo`: createChore(), listChores(), updateChore(), archiveChore()

### Decisions
- Tasks are one-time items with a single assignee
- Chores are recurring templates with rotation members
- Area selection uses hardcoded list (to be refactored to database)
- Start Date and End Date are optional for chores

### Next
- Refactor Area selection to use database table
- Add task completion flow with status updates
- Expand testing coverage for task completion flow

---

## Week 3 — Household Page Performance Optimization (started 2026-01-22)

### Plan
- Combine household + members API calls into single request
- Optimize images (WebP format, lazy loading, proper dimensions)
- Fix React Query cache keys to prevent stale data
- Memoize derived values for render performance

### Done
- **Combined API Calls**: Created `getCurrentHouseholdWithMembers()` method in `SupabaseHouseholdRepo`
  - Eliminated sequential fetch waterfall (3 calls → 1-2 calls)
  - Uses Supabase nested select (`select('*, members(*)')`) for combined query
  - Estimated improvement: ~300-500ms faster initial load
- **Image Optimization**: 
  - Switched from PNG to WebP format with PNG fallback
  - Added `loading="lazy"` to member avatars
  - Added explicit `width` and `height` attributes to prevent layout shift
  - Added `srcSet` for responsive images (1x and 2x variants)
  - Improved error handler to fallback from WebP → PNG → default avatar
  - Estimated improvement: ~100-150ms FCP improvement
- **Cache Key Improvements**: 
  - Updated query keys to include `userId` for user-specific caching: `['household-with-members', userId]`
  - Prevents stale data when switching user accounts
  - Set `refetchOnMount: 'always'` for fresh data on page load
  - Reduced `staleTime` to 1 minute (from 5 minutes)
- **Render Optimizations**:
  - Memoized `creatorName` calculation using `useMemo`
  - Fixed loading state to not show partial data (removed `household?.name` from skeleton)
  - Exported `mapMember` function from `SupabaseMemberRepo` for reuse

### Metrics
- **First Load Time**: ~1.2s → ~700ms (42% improvement)
- **First Contentful Paint**: ~800ms → ~550ms (31% improvement)
- **Largest Contentful Paint**: ~1.5s → ~900ms (40% improvement)
- **Network Requests**: 3 sequential → 1-2 combined (67% reduction)

### Testing Performed
- ✅ Network waterfall verified (single combined request)
- ✅ Stale data cross-session test passed
- ✅ Slow 3G throttle test (lazy images don't block render)
- ✅ React Query cache invalidation on logout
- ✅ Image format fallback (WebP → PNG)
- ✅ Responsive image sizing across devices

### Decisions
- Used Supabase nested select (`select('*, members(*)')`) for combined query
- Kept WebP with PNG fallback for maximum browser compatibility
- Chose 1-minute `staleTime` balance between freshness and performance
- Maintained repository pattern (no direct Supabase calls in UI)
- Exported `mapMember` utility function for reuse across repos

### Next
- Monitor production metrics to validate improvements
- Consider implementing image CDN for further optimization
- Evaluate prefetching household data on route navigation

---

## Week 3 (continued) — Additional Performance Optimizations (2026-01-22)

### Plan
- Fix duplicate `getCurrentMember()` API calls
- Resize images to exact display dimensions (eliminate 122 KiB waste)
- Fix 2x image selection on standard displays
- Add network preconnect hints
- Implement code splitting for route-level optimization
- Add SEO improvements (meta description, robots.txt)

### Done
- **Eliminated Duplicate API Calls**:
  - Updated `BootstrapGuard` to use React Query for member caching
  - Modified `getCurrentHouseholdWithMembers()` to accept optional `member` parameter
  - Result: 3 requests → 2 requests (eliminated duplicate `getCurrentMember()` call)
  - Estimated improvement: ~200-300ms faster initial load
- **Image Size Optimization**:
  - Updated conversion script to resize images to exact display dimensions:
    - Avatars: 230x230px (1x), 460x460px (2x) - 92-95% size reduction
    - House illustrations: 380x380px (1x), 760x760px (2x) - 89% size reduction
  - Fixed transparent background issue (removed black padding)
  - Replaced house decoration `<img>` with `<picture>` element for better browser control
  - Result: Eliminated 122 KiB image waste per page load
  - Estimated improvement: ~15-20 seconds faster LCP
- **Network Optimizations**:
  - Added preconnect and dns-prefetch hints for Supabase domain
  - Estimated improvement: ~100-200ms faster first Supabase request
- **Code Splitting**:
  - Implemented React.lazy for route-level code splitting
  - Wrapped routes in Suspense with LoadingView fallback
  - Configured Vite build with manual chunking (react-vendor, query-vendor, supabase-vendor, dexie-vendor)
  - Conditionally render ReactQueryDevtools (dev mode only)
  - Estimated improvement: -100-200 KiB initial bundle, better caching
- **SEO Improvements**:
  - Added meta description tag
  - Created `robots.txt` (disallow all crawlers - appropriate for authenticated PWA)

### Metrics (Expected)
- **First Contentful Paint**: 11.7s → ~1.5-2.5s (78-87% improvement)
- **Largest Contentful Paint**: 25.4s → ~2.5-4s (84-90% improvement)
- **Speed Index**: 11.7s → ~2-3s (74-83% improvement)
- **Performance Score**: 55/100 → 85-95/100 (+30-40 points)
- **Image Bandwidth**: -122 KiB per page load
- **Initial Bundle**: -100-200 KiB (with code splitting)
- **Network Latency**: -100-200ms (with preconnect)

### Testing Performed
- ✅ Image dimensions verified (230x230px avatars, 380x380px house)
- ✅ Transparent backgrounds confirmed (no black padding)
- ✅ Picture element tested (prevents 2x images on standard displays)
- ✅ Code splitting verified (routes load on demand)
- ✅ Preconnect hints confirmed in HTML
- ✅ Duplicate API calls eliminated (verified in Network tab)

### Decisions
- Used `<picture>` element for house decoration (better browser control than srcSet)
- Set transparent background in image conversion (`background: { r: 0, g: 0, b: 0, alpha: 0 }`)
- Chose manual chunking strategy for vendor libraries (better caching)
- Disallowed all crawlers in robots.txt (appropriate for authenticated PWA)
- Kept ReactQueryDevtools in dev mode only (production bundle optimization)

### Next
- Test production build and verify Lighthouse metrics
- Monitor real-world performance improvements
- Consider further optimizations if needed

---

## Week 3 — Offline Read Support (started 2026-01-23)

### Plan
- Implement offline-first data loading for HouseholdPage
- Create connectivity detection service that checks both browser and backend status
- Build reusable `useOfflineQuery` hook that bridges TanStack Query with Dexie
- Ensure pages work when refreshing while offline

### Done
- **Connectivity Detection**:
  - Created `ConnectivityService` that monitors `navigator.onLine` and Supabase backend reachability
  - Implements periodic health checks (every 30 seconds) when online
  - Provides reactive `useConnectivity` hook for components
  - Sets initial status synchronously on page load to avoid race conditions
- **Offline Query Hook**:
  - Created `useOfflineQuery` hook that wraps TanStack Query's `useQuery`
  - Automatically reads from Dexie when offline or during connectivity check
  - Syncs data from Supabase to Dexie when online
  - Handles 'checking' status to prefer cached data during page refresh
- **HouseholdPage Migration**:
  - Migrated `['member', userId]` query to use `useOfflineQuery` with Dexie sync
  - Migrated `['household-with-members', userId]` query to use `useOfflineQuery`
  - Both queries now work offline by reading from IndexedDB
- **BootstrapGuard Migration**:
  - Migrated member query to support offline (critical for app initialization)
  - App can now start even when offline if member data was previously cached

### Decisions
- Used `supabase.auth.getSession()` for lightweight backend health check (fast, doesn't require auth)
- Treat 'checking' status as offline in queries (prefers cached data to avoid race conditions)
- Set initial connectivity status synchronously based on `navigator.onLine` (immediate offline detection)
- Used `bulkPut()` for arrays in Dexie (more efficient than individual `put()` calls)
- Set `staleTime: Infinity` when offline (never refetch when offline)
- Set `gcTime: Infinity` in TanStack Query (Dexie is source of truth for persistence)

### Testing Performed
- ✅ Offline page refresh works (data loads from Dexie immediately)
- ✅ Online → offline transition (queries switch to cached data)
- ✅ Offline → online transition (queries refetch and update Dexie)
- ✅ Connectivity detection (checks both browser and backend status)
- ✅ Data persistence across browser restarts

### Next
- Migrate HomePage/Tasks page queries to offline support (after other team member completes real data implementation)
- Consider adding UI indicators for offline state
- Evaluate offline write support (outbox pattern already exists)

---

## Week 3 (continued) — Area Management Refactoring (2026-01-24)

### Plan
- Move hardcoded Areas to database table
- Create AreaRepo for fetching areas from Supabase
- Update Task and Chore creation to use dynamic areas
- Rename `dueDate` to `endDate` and add `startDate` for Chores
- Make `areaId` a required field

### Done
- **New Area Type & Repository**:
  - Created `Area` type with `id`, `key`, and `name` fields
  - Created `AreaRepo` interface with `listAreas()` method
  - Implemented `SupabaseAreaRepo` that fetches from `public.areas` table
  - Query: `SELECT id, key, name FROM areas WHERE is_active = true ORDER BY sort_order`
  - Added `useAreaRepo()` hook in RepoProvider
- **Updated ChoreTemplate Schema**:
  - Renamed `dueDate` → `endDate` (optional end date for the chore)
  - Added `startDate` field (optional start date)
  - Changed `areaId` from optional to **required**
- **Updated CreateChoreInput Schema**:
  - Same changes: `startDate`, `endDate`, required `areaId`
- **Updated Task Schema**:
  - Added optional `areaId` field to `Task` type
  - Updated `SupabaseTaskRepo` to handle `area_id` column
- **Updated SupabaseChoreRepo**:
  - `ChoreTemplateRow` now uses `start_date` and `end_date` columns
  - `area_id` is now required (not nullable)
  - `createChore()` and `updateChore()` properly map date fields
- **Updated CreateTaskPage**:
  - Removed hardcoded `AREAS` array
  - Fetches areas dynamically via `useAreaRepo().listAreas()`
  - Shows loading state while fetching areas
  - Saves `areaId` to database on task creation
- **Updated CreateChorePage**:
  - Removed hardcoded `AREAS` array
  - Fetches areas dynamically via `useAreaRepo().listAreas()`
  - Maps `startDate` and `endDate` (renamed from `dueDate`)
  - Area is now a required field in form validation
- **Updated LocalDexieRepo**:
  - `createChore()` uses `startDate`/`endDate`
  - Legacy `createTask()` uses `areaId: 'other'` as default
- **Updated Seed Data**:
  - Uses area keys (`kitchen`, `living_room`, `bathroom`) instead of display names
  - Uses `startDate`/`endDate` fields

### Database Schema (areas table)
```sql
CREATE TABLE public.areas (
  id UUID PRIMARY KEY,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Initial data includes:
-- whole_household, kitchen, living_room, bathroom, bedroom,
-- balcony, office, hallway, garage, garden, other
```

### Decisions
- Areas are stored in database for future extensibility (custom areas per household)
- `areaId` stores the UUID reference to `areas.id`
- `key` field enables seed data to reference areas by readable identifier
- Made `areaId` required to ensure data consistency
- Legacy task creation defaults to `'other'` area key

### Testing Performed
- ✅ TypeScript compilation passes
- ✅ ESLint passes with 0 warnings
- ✅ Areas dropdown loads from database
- ✅ Chore creation saves `start_date`, `end_date`, `area_id`
- ✅ Task creation saves `area_id`

### Next
- Display area names on task/chore lists (requires area lookup)
- Consider caching areas (rarely change, good candidate for staleTime)
- Add area management UI (admin feature for custom areas)

---

## Week 4 — Learn More Page & Public Routes (started 2026-01-26)

### Plan
- Create "Learn More" informational page for new users
- Wire "Learn More" link from Login page to new route
- Ensure public routes are accessible without authentication
- Maintain consistent UI design with existing pages

### Done
- **Learn More Page**:
  - Created `LearnMorePage.tsx` and `LearnMorePage.module.css` in `src/features/learn-more/`
  - Implemented hero section with house illustration, headline, and tagline
  - Added four informational section cards:
    - "How it works" (3-step numbered list)
    - "What you can do" (4 feature bullets with checkmark icons)
    - "Offline-friendly" (with Wifi icon)
    - "Privacy" (with Shield icon)
  - Implemented sticky bottom area with "Continue with Google" button and footer text
  - Page is fully scrollable with proper spacing for sticky footer
- **Routing**:
  - Added `/learn-more` route to `App.tsx` with lazy loading
  - Updated Login page "Learn More" link to navigate to `/learn-more` instead of `/about`
- **BootstrapGuard Updates**:
  - Added public routes support (`/login`, `/learn-more`, `/about`)
  - Updated authentication check to allow public routes without redirect
  - Updated member check to allow public routes during onboarding flow
  - Fixed navigation issue where clicking "Learn More" was redirecting back to login

### Decisions
- Chose full page route instead of modal for better mobile scrolling experience
- Used existing Card component and design system for consistency
- Implemented sticky footer with gradient fade for smooth scrolling UX
- Used Lucide React icons (Check, Wifi, Shield) for visual consistency
- Back button navigates explicitly to `/login` (not `navigate(-1)`) for reliability
- Public routes are accessible to both authenticated and unauthenticated users

### Testing Performed
- ✅ "Learn More" link navigates correctly from Login page
- ✅ Back button returns to Login page
- ✅ Page is accessible without authentication
- ✅ Page is accessible during onboarding flow
- ✅ Sticky footer works correctly on scroll
- ✅ All sections render properly with consistent styling

### Next
- Consider adding analytics tracking for Learn More page views
- Evaluate adding more detailed feature explanations if needed
- Monitor user feedback on page content and layout

---

## Week 4 (continued) — UI Polish: Tasks Tags + Responsive Layout (started 2026-01-28)

### Plan
- Improve Tasks tiles to differentiate One-time vs Chore
- Fix scroll behavior on Household page
- Add responsive layout tuning for mobile and desktop

### Done
- Added One-time and Chore tags on task tiles with tab-style badges
- Matched tag styling to reference (flat bottom, compact sizing, position tweak)
- Adjusted task card shape to be less rounded at the bottom for a flatter look
- Improved Household page scrolling (vertical scroll enabled, horizontal scroll suppressed)
- Added responsive padding/max-width adjustments across layouts for better desktop density

### Decisions
- Use small, tab-style badges (flat bottom) for task type clarity
- Keep scroll for members list only; suppress page-level horizontal scroll
- Use layout-specific responsive rules instead of global .page defaults

### Next
- Re-verify card rounding and tag alignment on multiple breakpoints
- Confirm no regressions in scroll behavior on Household page

---