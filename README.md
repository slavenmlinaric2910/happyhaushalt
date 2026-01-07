<<<<<<< HEAD
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
3. **Complete a task**: Go to "Today" tab, click a task checkbox
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
    home/            # Home/Areas screen
    today/           # Today task list
    chores/          # Chore templates list + detail
    household/       # Household/members management
  lib/               # Utilities (dates, ids, logging, seed data)
  assets/            # Static assets
```

## Architecture

### Repository Pattern

The app uses a repository pattern to abstract data access:

- **Interfaces**: `HouseholdRepo`, `ChoreRepo`, `TaskRepo`
- **LocalDexieRepo**: Offline-first implementation using Dexie
- **RemoteRepoStub**: Placeholder for future backend integration

### Offline Engine

The `OfflineEngine` manages offline operations:

- Tracks online/offline status
- Maintains an outbox queue in IndexedDB
- Processes operations sequentially when online
- Provides sync status via `getQueueState()`

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

=======
# HappyHaushalt



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [ ] [Create](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#create-a-file) or [upload](https://docs.gitlab.com/ee/user/project/repository/web_editor.html#upload-a-file) files
- [ ] [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.arsnova.eu/ownzie/happyhaushalt.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [ ] [Set up project integrations](https://gitlab.arsnova.eu/ownzie/happyhaushalt/-/settings/integrations)

## Collaborate with your team

- [ ] [Invite team members and collaborators](https://docs.gitlab.com/ee/user/project/members/)
- [ ] [Create a new merge request](https://docs.gitlab.com/ee/user/project/merge_requests/creating_merge_requests.html)
- [ ] [Automatically close issues from merge requests](https://docs.gitlab.com/ee/user/project/issues/managing_issues.html#closing-issues-automatically)
- [ ] [Enable merge request approvals](https://docs.gitlab.com/ee/user/project/merge_requests/approvals/)
- [ ] [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [ ] [Get started with GitLab CI/CD](https://docs.gitlab.com/ee/ci/quick_start/)
- [ ] [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/ee/user/application_security/sast/)
- [ ] [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/ee/topics/autodevops/requirements.html)
- [ ] [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/ee/user/clusters/agent/)
- [ ] [Set up protected environments](https://docs.gitlab.com/ee/ci/environments/protected_environments.html)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
>>>>>>> 8c5a87a80031a829d22a2d0641f65cce501a6904
