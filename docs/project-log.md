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

## Week 2 — Navbar Redesign & Cleanup (started 18.01.2026)

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
- Implement Create Task modal (add new chore/task from + button)
- Design and implement ChoreTemplates management page
- Add task filtering/sorting on Tasks page if needed
- Expand testing coverage for task completion flow
