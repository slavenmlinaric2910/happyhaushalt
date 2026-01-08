# Requirements Catalog — HappyHaushalt (Offline PWA)

This document defines the functional and non-functional requirements for the project prototype.
It is intentionally **small and realistic** to fit the semester scope and enable a working prototype.  
(Requirement catalog: functional + non-functional is required by the assignment.)

## 1. Scope / Goal

HappyHaushalt is a mobile-first **installable Progressive Web App (PWA)** for small households/WGs to manage recurring chores with a calm UI and **offline-first** behavior.

Primary goals:
- Keep chores organized by area (kitchen, bathroom, living room, general)
- Make it easy to see what’s due and complete tasks
- Work reliably even without internet (offline queue + later sync)
- Provide **very simple login** (Google OAuth) so every household member can use the app on their own phone
- Provide a **one-time onboarding** (create/join household) and then go straight to Home on future app opens
- Allow light personalization via member profile (name + pre-made avatar)

## 2. Personas (minimal)

- **Member**: does chores, completes tasks, wants quick overview (“what’s due for me?”)
- **Household Creator (light admin)**: creates household, shares join code/pin

## 3. Assumptions

- Prototype scope: **one household, multiple users, multiple devices** (each member logs in on their own phone and joins the same household via a join code/pin).
- Authentication uses **Supabase Auth with Google OAuth** (simple sign-in; no passwords managed by us).
- On first login, a **Member is auto-created with defaults** (displayName + avatarId), then the user can optionally complete profile.
- **No multiple households per user** for MVP (a user belongs to at most one household).
- Household join code/pin must be **unique** within the system (unique enough for the prototype).
- After successful join/create, the app persists the user’s household membership so users **do not need to enter the code again** on future launches.
- Offline data is stored locally per device (Dexie) and syncs when the device is online.

## 4. Out of Scope (explicit)

- No gamification (points, streaks, leaderboards)
- No complex calendar engine (simple due dates only)
- No payments, inventory, chat, or advanced role management
- No complex RBAC/roles (beyond basic household ownership needs)
- No multi-household switching for MVP
- No custom avatar upload/cropping (only pre-made avatars)

---

## 5. Functional Requirements (FR)

Format:
- **FR-XX** — Requirement statement (with MoSCoW)
- **Done when** — measurable acceptance criteria

### Authentication & Onboarding

**FR-01 (Must Have)** — Sign in / sign out (Google OAuth via Supabase Auth)  
**Done when:** A user can sign in and sign out using Google OAuth and the app shows logged-in vs logged-out state.

**FR-02 (Must Have)** — Persist session across app restarts  
**Done when:** After refreshing or reopening the app, the user remains signed in until they sign out.

**FR-03 (Must Have)** — First-time onboarding: Create or Join Household  
**Done when:** After login, if the user has no household membership, they are shown a simple screen with two actions:
- Create Household
- Join Household (enter code)

**FR-04 (Must Have)** — Auto-create Member on first login (with defaults)  
**Done when:** On first successful login, if no Member exists for this user identity, the system creates a Member record automatically with:
- default displayName (from Google profile or fallback)
- default avatarId (e.g., avatar-01)

**FR-05 (Should Have)** — One-time Member profile setup (name + avatar)  
**Done when:** After first login (or if profile incomplete), the user can:
- edit their displayName
- choose 1 of 10 pre-made avatars  
The screen is shown only once and does not reappear after completion (unless user resets profile).

**FR-06 (Must Have)** — Remember household membership (no repeated code entry)  
**Done when:** After a user creates/joins a household once, reopening the app takes them directly to Home (no code prompt again), unless they sign out.

**FR-07 (Should Have)** — Offline-friendly auth UX  
**Done when:** If the user is offline, the app shows a clear message that sign-in requires connectivity, while already signed-in users can still use offline features.

### Household & Members

**FR-08 (Must Have)** — Create household with unique join code/pin  
**Done when:** A logged-in user can create a household and the system generates a join code/pin that is unique (for the prototype). The join code is visible in the Household page.

**FR-09 (Must Have)** — Join household by code (verification)  
**Done when:** A logged-in user can enter a join code, the code is verified, and on success the user is linked to the household and redirected to Home.

**FR-10 (Must Have)** — View household members  
**Done when:** The Household page lists members (at least displayName + avatar) loaded via the repository layer.

**FR-11 (Should Have)** — Copy join code  
**Done when:** A “Copy” action exists for the join code and shows success feedback (toast/snackbar or inline message).

**FR-12 (Could Have)** — Edit member profile later  
**Done when:** A user can change displayName and avatar from the Household/settings page.

### Chore Templates

**FR-13 (Must Have)** — Create a chore template  
**Done when:** A user can create a template with:
- name (required)
- area (required: kitchen/bathroom/living-room/general)
- frequency (required: weekly OR every X days)
- optional checklist items  
and it persists via repository (no direct DB call in UI).

**FR-14 (Must Have)** — Edit an existing chore template  
**Done when:** Template detail page loads an existing template, edits can be saved, and list reflects changes.

**FR-15 (Could Have)** — Archive a chore template  
**Done when:** A template can be marked archived/inactive and no longer appears in the default list.

### Tasks & Rotation

**FR-16 (Must Have)** — Generate tasks from templates  
**Done when:** For each template, task instances exist with a due date computed from frequency.

**FR-17 (Must Have)** — Complete a task  
**Done when:** Completing a task sets status/completedAt, updates UI immediately, and persists through repositories.

**FR-18 (Must Have)** — Rotation assignment (round-robin)  
**Done when:** When a task is completed, the next task assignment rotates to the next member in order, and a unit test covers the rotation logic.

**FR-19 (Should Have)** — Filter tasks: All vs Mine  
**Done when:** A toggle exists to show all tasks or only tasks assigned to the currently logged-in member.

### Home / Overview

**FR-20 (Must Have)** — Home overview by areas  
**Done when:** Home shows area tiles (kitchen, bathroom, living-room, general) and each tile reflects basic status (e.g., due/overdue/ok).

**FR-21 (Could Have)** — Empty state  
**Done when:** If there are no tasks/templates, the user sees a friendly empty state illustration and CTA (e.g., “Create first chore”).

### Offline-first

**FR-22 (Must Have)** — Work offline (read + write)  
**Done when:** With network disabled:
- user can open app and view existing data
- user can complete a task
- changes are stored locally and not lost after refresh

**FR-23 (Must Have)** — Outbox + sync on reconnect  
**Done when:** When network returns:
- queued operations are processed
- success changes outbox state to “done”
- failures are shown as “failed” with a retry action

---

## 6. Non-Functional Requirements (NFR)

### Offline & Data Safety

**NFR-01 (Must Have)** — Offline-first behavior  
The app must remain usable without internet connection.  
**Done when:** A test/demo script can show: open app → go offline → complete task → reload → still completed → go online → sync processes outbox.

**NFR-02 (Must Have)** — No data loss on refresh  
**Done when:** Data persists via IndexedDB/Dexie and survives browser refresh and reopen.

### Performance

**NFR-03 (Should Have)** — Fast initial load  
**Done when:** On a typical laptop/phone, the Home screen becomes interactive quickly (target: ~<2s in dev, ~<1s in prod build; best-effort).

### Usability

**NFR-04 (Must Have)** — Mobile-first UI  
**Done when:** Tap targets are comfortable, layout works at small widths, and navigation is possible one-handed.

**NFR-05 (Should Have)** — Calm, consistent design  
**Done when:** App uses consistent spacing, card layout, and the same icon style across pages.

### Reliability & Maintainability

**NFR-06 (Must Have)** — Clear separation of concerns  
**Done when:** UI does not access the DB or remote APIs directly; all access goes through repository interfaces.

**NFR-07 (Must Have)** — Tests and quality gates  
**Done when:** CI runs lint + typecheck + tests + build, and at least:
- 1 unit test for rotation logic
- 1 e2e smoke test (app loads and basic navigation)

### Security & Privacy (prototype-level)

**NFR-08 (Must Have)** — Secure authentication  
**Done when:** Authentication is handled by Supabase Auth; the app does not store passwords itself.

**NFR-09 (Should Have)** — Session handling is safe  
**Done when:** Auth tokens/session are managed by the Supabase client libraries and are not logged or exposed in UI.

**NFR-10 (Must Have)** — Privacy by minimal data  
**Done when:** Stored user data is limited to what’s needed for chores (no sensitive personal data beyond what is required for login).

**NFR-11 (Could Have)** — Basic input validation  
**Done when:** Required fields are validated client-side (e.g., template name, frequency, join code format).

---

## 7. Traceability (light)

- FR-01–07 → Auth + onboarding flow, session persistence, offline messaging
- FR-08–12 → Household (create/join, join code, members, member profile)
- FR-13–15 → Chores pages (templates list + detail)
- FR-16–19 → Today/Tasks + rotation logic
- FR-20–21 → Home overview + empty state
- FR-22–23 → OfflineEngine + outbox

## 8. Open Questions (for later decisions)

- Should the join code be numeric only (PIN) or alphanumeric?
- Do we allow profile setup “Skip” or require it once?
- Minimum viable server data model for membership + sync (tables + RLS) vs keep sync stub for now
