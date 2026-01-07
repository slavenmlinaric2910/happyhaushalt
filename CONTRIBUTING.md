# CONTRIBUTING.md

Thanks for contributing! This project is a team-based, offline-capable PWA for household chores.
We keep it simple, consistent, and always merge through Merge Requests.

## Quick Start

```bash
npm install
npm run dev
Useful scripts:

npm run lint

npm run typecheck

npm test

npm run build

Workflow (GitLab)
1) Issues first
Create an Issue for each piece of work (small scope).

Add labels:

Status: Open → Sprint → Active → Done (or Impediment/Rejected/Closed)

Type: Feature / Bug / Refactor / Doc / Test

Priority (MoSCoW): Must / Should / Could / Won’t

Size: 1 / 2 / 3 / 5 / 8

2) Branch naming
Create branches from main:

feat/<short-description>

fix/<short-description>

refactor/<short-description>

docs/<short-description>

test/<short-description>

Examples:

feat/home-area-tiles

fix/offline-banner-state

refactor/task-repo-contract

3) Merge Requests (MRs) only
No direct pushes to main.

Open an MR early (Draft is fine).

Link the Issue (e.g., “Closes #123”).

Keep MRs small and focused.

4) Required before merge
Your MR must:

Pass CI (lint/typecheck/test/build)

Have at least 1 approval (Owner for core paths)

Resolve all MR discussions

Not introduce new TODOs without an Issue

Code Style & Conventions
Language & file names
Use English for code, comments, and file names.

Avoid special characters in file names (no umlauts).

Formatting
Run Prettier/ESLint (CI enforces this).

Do not reformat unrelated files in feature PRs.

Types & error handling
Prefer explicit types at boundaries (repo interfaces, DTOs).

No any unless justified.

Handle offline/failed states with user-friendly messaging.

Architecture rules (important)
No direct DB access from UI

React components must not talk directly to Dexie, localStorage, or remote APIs.
Use repos + hooks only.

✅ Allowed:

useTasksQuery() → calls taskRepo.listTasks()

❌ Not allowed:

Dexie queries inside a page/component

Folder ownership

src/core/**, src/app/**, config files = core/platform (Owner review required)

New features go into src/features/<featureName>/**

Testing expectations

Add unit tests for logic-heavy code (rotation, due-date rules, offline queue).

Add at least 1 smoke e2e test (Playwright) that checks the app loads.

MR checklist (copy into MR description)

 Linked Issue

 npm run lint passes

 npm run typecheck passes

 npm test passes

 npm run build passes

 Screenshots for UI changes (if applicable)

 No direct DB/network calls from UI