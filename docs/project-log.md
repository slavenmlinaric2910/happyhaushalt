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
