# Offline Support Implementation Plan for Home Chores PWA

## Executive Summary

This document analyzes the provided Angular-based offline support guide and adapts it to our **React + Vite + Dexie + TanStack Query + Supabase** stack. It provides a critical assessment of what works, what doesn't, and a specific implementation roadmap.

---

## Part I: Critical Analysis of the Guide

### ✅ What Works for Our Project

1. **Outbox Pattern**: The guide's operation queue concept aligns perfectly with our existing `OfflineEngine` implementation. We already have:
   - `OfflineOp` type with status tracking
   - Sequential processing
   - Error handling

2. **IndexedDB for Structured Data**: Using Dexie (which wraps IndexedDB) is the right choice, just like the guide recommends IndexedDB.

3. **Service Worker for Assets**: The guide's Service Worker caching strategy applies, though we use Workbox (via `vite-plugin-pwa`) instead of Angular Service Worker.

4. **Offline-First Philosophy**: The guide's "offline-first" approach matches our architecture goals.

### ❌ What Doesn't Work (Tech Stack Mismatches)

1. **RxJS Observables → React Hooks + TanStack Query**
   - **Guide uses**: `refreshWhenReachable(offline$, online$)` returning observables
   - **We need**: React hooks that work with TanStack Query's `useQuery`
   - **Why**: TanStack Query already handles caching, refetching, and state management. We need to integrate offline reads into its query system, not replace it.

2. **Angular Service Worker → Workbox**
   - **Guide uses**: `ngsw-config.json` with Angular-specific configuration
   - **We have**: `vite-plugin-pwa` with Workbox configuration in `vite.config.ts`
   - **Why**: Workbox is more flexible and framework-agnostic. Our current config is basic and needs enhancement.

3. **Custom HTTP Service → Supabase Client**
   - **Guide uses**: Custom `HttpClient` with manual request/response handling
   - **We use**: Supabase JS client with built-in real-time subscriptions
   - **Why**: Supabase handles auth, real-time, and has its own caching. We need to wrap Supabase calls, not replace them.

4. **Custom IndexedDB Abstraction → Dexie**
   - **Guide uses**: Custom `DataService` with RxJS observables
   - **We use**: Dexie with promise-based API
   - **Why**: Dexie is simpler, well-tested, and already integrated. No need for custom abstraction.

5. **Manual State Management → TanStack Query**
   - **Guide uses**: Manual observables for data loading and merging
   - **We use**: TanStack Query for automatic caching, refetching, and state management
   - **Why**: TanStack Query already handles most of what the guide's state services do. We need to enhance it for offline, not rebuild it.

### 🔍 Critical Gaps in Current Implementation

1. **Connectivity Detection**: We only check `navigator.onLine`, which is unreliable. Need backend health checks.

2. **Offline-First Reads**: We don't have a pattern for "load from Dexie when offline, fetch from Supabase when online" like the guide's `refreshWhenReachable`.

3. **React Query Offline Integration**: TanStack Query doesn't know about our Dexie cache. We need to bridge them.

4. **Service Worker API Caching**: Our Workbox config only caches static assets. We need to cache Supabase API responses.

5. **Sync Retry Logic**: Our `OfflineEngine` has basic retry but no exponential backoff or max retry limits.

6. **UI Indicators**: We don't show offline state, pending operations, or sync status in the UI.

---

## Part II: Technology-Specific Implementation Strategy

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
│  (useQuery, useMutation, UI)                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              TanStack Query Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Query        │  │ Mutation     │  │ Offline      │     │
│  │ Cache        │  │ Queue        │  │ Adapter      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────────┐         ┌───────────────────┐
│   Workbox SW      │         │    Dexie (IDB)    │
│   (Asset Cache)   │         │  (Data Storage)   │
│                   │         │                   │
│ - Static files    │         │ - Households      │
│ - API responses   │         │ - Members         │
│ - Images          │         │ - Chores          │
│                   │         │ - Tasks           │
│                   │         │ - Outbox          │
└───────────────────┘         └───────────────────┘
        │                               │
        └───────────────┬───────────────┘
                        ▼
              ┌───────────────────┐
              │   Supabase API    │
              │   (Remote Source) │
              └───────────────────┘
```

### Key Design Decisions

#### 1. Why TanStack Query + Dexie (Not Just One)?

**Decision**: Use TanStack Query for query management and Dexie for persistent storage.

**Rationale**:
- **TanStack Query**: Handles caching, refetching, background updates, optimistic updates, and error states. It's the React standard for data fetching.
- **Dexie**: Provides persistent storage that survives browser restarts. TanStack Query's in-memory cache is lost on refresh.
- **Separation**: TanStack Query manages the "what to fetch" and "when to refetch" logic. Dexie provides the "where to store" and "what's available offline" layer.

**How it works**:
1. When online: TanStack Query fetches from Supabase → caches in memory → also writes to Dexie
2. When offline: TanStack Query's `queryFn` checks Dexie first, returns cached data
3. On reconnect: TanStack Query automatically refetches and updates both caches

**Trade-off**: More complexity, but leverages best-in-class tools for each concern.

#### 2. Why Workbox (Not Manual Service Worker)?

**Decision**: Use `vite-plugin-pwa` with Workbox for Service Worker management.

**Rationale**:
- **Framework Integration**: Automatically generates and registers Service Worker during build
- **Production Ready**: Workbox is battle-tested, handles updates, and provides multiple caching strategies
- **Less Code**: No manual Service Worker code needed for basic caching
- **Development Support**: `devOptions.enabled: true` allows testing in development

**How it works**:
- `vite-plugin-pwa` generates a Service Worker using Workbox during build
- Workbox intercepts network requests and applies caching strategies
- We configure strategies per URL pattern (static assets vs API calls)

**Trade-off**: Less control than manual Service Worker, but much less code and better maintenance.

#### 3. Why Enhance Connectivity Detection?

**Decision**: Check both `navigator.onLine` and actual backend reachability.

**Rationale**:
- **`navigator.onLine` is unreliable**: Can be `true` when WiFi is connected but internet is down
- **Backend might be down**: Even with internet, Supabase could be unreachable
- **Better UX**: Users see accurate offline state, not false positives

**How it works**:
1. Monitor `navigator.onLine` for immediate feedback
2. Periodically ping Supabase health endpoint (or lightweight query)
3. Combine both signals: offline = `!navigator.onLine || !backendReachable`
4. Cache connectivity state in Dexie to know state on app startup

**Trade-off**: More network requests, but accurate offline detection.

#### 4. Why Offline-First Query Pattern?

**Decision**: Create a custom `useOfflineQuery` hook that wraps `useQuery` with Dexie fallback.

**Rationale**:
- **Immediate Feedback**: Users see cached data instantly, even when offline
- **Automatic Updates**: When online, fresh data replaces cached data
- **Transparent**: Components don't need to know about offline state
- **Reuses TanStack Query**: Leverages existing caching, refetching, and error handling

**How it works**:
```typescript
// Pseudo-code
function useOfflineQuery(key, queryFn) {
  const isOnline = useConnectivity();
  
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      if (isOnline) {
        const data = await queryFn(); // Fetch from Supabase
        await writeToDexie(data);      // Cache for offline
        return data;
      } else {
        return await readFromDexie(key); // Return cached data
      }
    },
    staleTime: isOnline ? 5 * 60 * 1000 : Infinity, // Never stale when offline
  });
}
```

**Trade-off**: Slightly more complex than standard `useQuery`, but provides offline support transparently.

#### 5. Why Keep Outbox Pattern (Not Optimistic Updates Only)?

**Decision**: Continue using `OfflineEngine` outbox for write operations.

**Rationale**:
- **Reliability**: Operations are persisted and won't be lost on browser crash
- **Retry Logic**: Failed operations can be retried automatically
- **Conflict Prevention**: Sequential processing prevents race conditions
- **Audit Trail**: Can see what operations are pending/failed

**How it works**:
1. User performs write (e.g., complete task)
2. Write to Dexie immediately (optimistic UI update)
3. Enqueue operation in outbox
4. When online, process outbox sequentially
5. On success, mark operation as `done` and remove
6. On failure, mark as `failed` and retry later

**Trade-off**: More complex than simple optimistic updates, but more reliable.

---

## Part III: Step-by-Step Implementation Plan

### Phase 1: Enhanced Connectivity Detection

**Goal**: Accurately detect when backend is reachable.

**Files to Create/Modify**:
- `src/core/offline/connectivity.ts` (enhance existing)
- `src/app/hooks/useConnectivity.ts` (new)

**Implementation**:

```typescript
// src/core/offline/connectivity.ts
import { supabase } from '../../lib/supabase/client';

export type ConnectivityStatus = 'online' | 'offline' | 'checking';

class ConnectivityService {
  private status: ConnectivityStatus = 'checking';
  private listeners = new Set<(status: ConnectivityStatus) => void>();
  private checkInterval: number | null = null;

  constructor() {
    // Listen to browser online/offline events
    window.addEventListener('online', () => this.checkBackend());
    window.addEventListener('offline', () => this.setStatus('offline'));
    
    // Initial check
    this.checkBackend();
    
    // Periodic check every 30 seconds when online
    this.checkInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.checkBackend();
      }
    }, 30000);
  }

  private async checkBackend(): Promise<void> {
    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    this.setStatus('checking');
    
    try {
      // Lightweight Supabase health check (auth.getSession is fast)
      const { error } = await supabase.auth.getSession();
      this.setStatus(error ? 'offline' : 'online');
    } catch {
      this.setStatus('offline');
    }
  }

  private setStatus(status: ConnectivityStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.listeners.forEach(listener => listener(status));
    }
  }

  getStatus(): ConnectivityStatus {
    return this.status;
  }

  isOnline(): boolean {
    return this.status === 'online';
  }

  subscribe(listener: (status: ConnectivityStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  destroy(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
    }
    this.listeners.clear();
  }
}

export const connectivityService = new ConnectivityService();
```

```typescript
// src/app/hooks/useConnectivity.ts
import { useState, useEffect } from 'react';
import { connectivityService, type ConnectivityStatus } from '../../core/offline/connectivity';

export function useConnectivity(): {
  status: ConnectivityStatus;
  isOnline: boolean;
} {
  const [status, setStatus] = useState<ConnectivityStatus>(
    () => connectivityService.getStatus()
  );

  useEffect(() => {
    const unsubscribe = connectivityService.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return {
    status,
    isOnline: status === 'online',
  };
}
```

**Why This Approach**:
- **Lightweight Check**: `getSession()` is fast and doesn't require auth
- **Periodic Updates**: Checks every 30 seconds to catch network changes
- **Reactive**: Components can subscribe and update UI automatically
- **Browser Events**: Still uses `navigator.onLine` for immediate feedback

**Testing**:
- Chrome DevTools → Network → Throttling → Offline
- Verify status changes to 'offline'
- Verify status changes back to 'online' when reconnected

---

### Phase 2: Offline-First Query Hook

**Goal**: Create `useOfflineQuery` that loads from Dexie when offline, Supabase when online.

**Files to Create/Modify**:
- `src/app/hooks/useOfflineQuery.ts` (new)
- Update existing queries to use this hook

**Implementation**:

```typescript
// src/app/hooks/useOfflineQuery.ts
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useConnectivity } from './useConnectivity';
import { db } from '../../core/offline/db';
import type { Household, Member, ChoreTemplate, TaskInstance } from '../../core/types';

type QueryKey = readonly unknown[];

// Helper to get Dexie table from query key
function getDexieTable(key: QueryKey) {
  const [entityType] = key;
  if (typeof entityType !== 'string') return null;
  
  switch (entityType) {
    case 'household':
      return db.households;
    case 'member':
      return db.members;
    case 'chores':
      return db.choreTemplates;
    case 'tasks':
      return db.tasks;
    default:
      return null;
  }
}

// Helper to extract filter from query key
function getFilter(key: QueryKey): Record<string, unknown> | null {
  // Example: ['tasks', householdId, dateRange] -> { householdId, ...dateRange }
  if (key.length < 2) return null;
  return key.slice(1).reduce((acc, val, idx) => {
    if (typeof val === 'object' && val !== null) {
      return { ...acc, ...val };
    }
    return acc;
  }, {});
}

export function useOfflineQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    // Custom function to read from Dexie
    readFromDexie?: (key: QueryKey) => Promise<TData | null>;
    // Custom function to write to Dexie after fetch
    writeToDexie?: (data: TData, key: QueryKey) => Promise<void>;
  }
): UseQueryResult<TData, TError> {
  const { isOnline } = useConnectivity();
  const { queryKey, queryFn, readFromDexie, writeToDexie, ...restOptions } = options;

  return useQuery<TData, TError>({
    ...restOptions,
    queryKey,
    queryFn: async () => {
      // Offline: read from Dexie
      if (!isOnline) {
        if (readFromDexie) {
          const cached = await readFromDexie(queryKey);
          if (cached !== null) return cached;
        } else {
          // Default Dexie read logic
          const table = getDexieTable(queryKey);
          if (table) {
            const filter = getFilter(queryKey);
            if (filter && 'householdId' in filter) {
              const results = await table.where('householdId').equals(filter.householdId).toArray();
              return results as TData;
            }
            // Fallback: get all
            const results = await table.toArray();
            return (results.length === 1 ? results[0] : results) as TData;
          }
        }
        throw new Error('No cached data available');
      }

      // Online: fetch from Supabase and cache
      if (!queryFn) {
        throw new Error('queryFn is required when online');
      }
      
      const data = await queryFn();
      
      // Write to Dexie for offline access
      if (writeToDexie) {
        await writeToDexie(data, queryKey);
      } else {
        // Default Dexie write logic
        const table = getDexieTable(queryKey);
        if (table && Array.isArray(data)) {
          await table.bulkPut(data);
        } else if (table && typeof data === 'object') {
          await table.put(data as any);
        }
      }
      
      return data;
    },
    staleTime: isOnline 
      ? (restOptions.staleTime ?? 5 * 60 * 1000) // 5 minutes when online
      : Infinity, // Never stale when offline
    gcTime: Infinity, // Keep in cache forever (we have Dexie for persistence)
  });
}
```

**Usage Example**:

```typescript
// Before (src/features/home/HomePage.tsx)
const { data: tasks = [] } = useQuery({
  queryKey: ['tasks', household?.id, today.toISOString()],
  queryFn: async () => {
    if (!household) return [];
    await repo.regenerateTasksIfNeeded(household.id);
    return repo.listTasks(household.id, { start: today, end: tomorrow });
  },
  enabled: !!household,
});

// After
const { data: tasks = [] } = useOfflineQuery({
  queryKey: ['tasks', household?.id, { start: today, end: tomorrow }],
  queryFn: async () => {
    if (!household) return [];
    await repo.regenerateTasksIfNeeded(household.id);
    return repo.listTasks(household.id, { start: today, end: tomorrow });
  },
  enabled: !!household,
  readFromDexie: async (key) => {
    const [, householdId, range] = key;
    if (!householdId || !range) return null;
    return db.tasks
      .where('householdId')
      .equals(householdId)
      .filter(task => {
        const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
        return dueDate >= range.start && dueDate <= range.end;
      })
      .toArray();
  },
  writeToDexie: async (data, key) => {
    if (Array.isArray(data)) {
      await db.tasks.bulkPut(data);
    }
  },
});
```

**Why This Approach**:
- **Reuses TanStack Query**: All existing features (caching, refetching, error handling) still work
- **Transparent**: Components don't need to change much
- **Flexible**: Custom `readFromDexie`/`writeToDexie` for complex queries
- **Automatic**: When online, data is cached to Dexie automatically

**Trade-off**: More complex than standard `useQuery`, but provides offline support without rewriting components.

---

### Phase 3: Enhanced Service Worker Configuration

**Goal**: Cache Supabase API responses for offline access.

**Files to Modify**:
- `vite.config.ts`

**Implementation**:

```typescript
// vite.config.ts (update existing VitePWA config)
VitePWA({
  // ... existing config ...
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
    runtimeCaching: [
      // Cache Supabase API responses
      {
        urlPattern: ({ url }) => {
          // Match Supabase API calls
          return url.hostname.includes('supabase.co') || 
                 url.hostname.includes('supabase.io');
        },
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api-cache',
          networkTimeoutSeconds: 3,
          cacheableResponse: {
            statuses: [0, 200], // Cache successful responses and network errors (for offline)
          },
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      // Cache static assets aggressively
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|webp|ico)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-images',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
    ],
  },
})
```

**Why This Approach**:
- **NetworkFirst**: Tries network first, falls back to cache when offline
- **3-second timeout**: Fast fallback if network is slow
- **Status 0 caching**: Caches network errors (allows offline access to previously cached data)
- **7-day expiration**: Balances freshness with offline capability

**Trade-off**: May show stale data, but enables offline access to previously loaded data.

---

### Phase 4: Enhanced OfflineEngine with Retry Logic

**Goal**: Add exponential backoff and max retry limits to sync operations.

**Files to Modify**:
- `src/core/offline/OfflineEngine.ts`

**Implementation**:

```typescript
// Add to OfflineEngine class
private readonly MAX_RETRIES = 3;
private readonly RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

private async processOperation(op: OfflineOp): Promise<void> {
  // Check retry limit
  const retryCount = op.retryCount || 0;
  if (retryCount >= this.MAX_RETRIES) {
    await db.outbox.update(op.id, {
      status: 'failed',
      error: 'Max retries exceeded',
    });
    logger.error('Operation failed after max retries', op.id);
    return;
  }

  try {
    await db.outbox.update(op.id, { status: 'syncing' });
    this.notifyListeners();

    await this.executeOperation(op);

    // Success: mark as done and remove
    await db.outbox.delete(op.id);
    logger.log('Synced operation', op.type, op.id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Increment retry count
    await db.outbox.update(op.id, {
      status: 'failed',
      error: errorMessage,
      retryCount: retryCount + 1,
    });
    
    logger.error('Failed to sync operation', op.id, error);
    
    // Schedule retry with exponential backoff
    const delay = this.RETRY_DELAYS[Math.min(retryCount, this.RETRY_DELAYS.length - 1)];
    setTimeout(() => {
      if (navigator.onLine) {
        this.syncNow().catch(err => logger.error('Retry sync failed', err));
      }
    }, delay);
  }
}

private async executeOperation(op: OfflineOp): Promise<void> {
  // Existing processOperation logic, renamed
  switch (op.type) {
    case 'COMPLETE_TASK':
      await this.remoteRepo.completeTask(op.payload.taskId as string);
      break;
    // ... other cases
  }
}
```

**Why This Approach**:
- **Exponential Backoff**: Gives network time to recover, prevents server overload
- **Max Retries**: Prevents infinite retry loops
- **Automatic Retry**: Retries failed operations when connection restored
- **Error Tracking**: Stores error message for UI display

**Trade-off**: May delay sync, but prevents server overload and infinite retries.

---

### Phase 5: UI Indicators for Offline State

**Goal**: Show offline status, pending operations, and sync progress in UI.

**Files to Create**:
- `src/core/ui/OfflineBanner.tsx`
- `src/core/ui/OfflineBanner.module.css`

**Implementation**:

```typescript
// src/core/ui/OfflineBanner.tsx
import { useConnectivity } from '../../app/hooks/useConnectivity';
import { useOfflineEngine } from '../../app/hooks/useOfflineEngine';
import styles from './OfflineBanner.module.css';

export function OfflineBanner() {
  const { status, isOnline } = useConnectivity();
  const { queueState, syncNow, isSyncing } = useOfflineEngine();

  // Don't show when online and no pending operations
  if (isOnline && queueState.pending === 0 && queueState.failed === 0) {
    return null;
  }

  return (
    <div className={styles.banner} data-status={status}>
      {!isOnline && (
        <div className={styles.message}>
          <span className={styles.icon}>📡</span>
          <span>You're offline. Changes will sync when you're back online.</span>
        </div>
      )}
      
      {isOnline && isSyncing && (
        <div className={styles.message}>
          <span className={styles.icon}>🔄</span>
          <span>Syncing changes...</span>
        </div>
      )}
      
      {isOnline && !isSyncing && queueState.pending > 0 && (
        <div className={styles.message}>
          <span className={styles.icon}>⏳</span>
          <span>{queueState.pending} change{queueState.pending !== 1 ? 's' : ''} pending</span>
          <button onClick={syncNow} className={styles.retryButton}>
            Sync now
          </button>
        </div>
      )}
      
      {queueState.failed > 0 && (
        <div className={styles.message} data-error>
          <span className={styles.icon}>⚠️</span>
          <span>{queueState.failed} change{queueState.failed !== 1 ? 's' : ''} failed to sync</span>
          <button onClick={syncNow} className={styles.retryButton}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
```

```css
/* src/core/ui/OfflineBanner.module.css */
.banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #fff3cd;
  border-bottom: 1px solid #ffc107;
  padding: 12px 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner[data-status="offline"] {
  background: #f8d7da;
  border-bottom-color: #dc3545;
}

.message {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #856404;
}

.banner[data-status="offline"] .message {
  color: #721c24;
}

.icon {
  font-size: 16px;
}

.retryButton {
  margin-left: 12px;
  padding: 4px 12px;
  background: #ffc107;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.retryButton:hover {
  background: #ffb300;
}
```

**Add to App Layout**:

```typescript
// src/app/layout/AppLayout.tsx
import { OfflineBanner } from '../../core/ui/OfflineBanner';

export function AppLayout() {
  return (
    <>
      <OfflineBanner />
      {/* ... rest of layout */}
    </>
  );
}
```

**Why This Approach**:
- **Non-Intrusive**: Only shows when relevant (offline or pending operations)
- **Actionable**: Provides "Sync now" button for user control
- **Clear Status**: Different styles for offline vs. pending vs. failed
- **Fixed Position**: Always visible at top of screen

**Trade-off**: Takes up screen space, but provides essential feedback.

---

## Part IV: Testing Strategy

### Unit Tests

**Test Connectivity Service**:
```typescript
// src/core/offline/connectivity.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { connectivityService } from './connectivity';

describe('ConnectivityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect offline when navigator.onLine is false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    // ... test implementation
  });
});
```

**Test Offline Query Hook**:
```typescript
// src/app/hooks/useOfflineQuery.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOfflineQuery } from './useOfflineQuery';

describe('useOfflineQuery', () => {
  it('should read from Dexie when offline', async () => {
    // Mock navigator.onLine = false
    // Mock Dexie to return data
    // Verify hook returns cached data
  });
});
```

### Integration Tests

**Test Offline Workflow**:
```typescript
// tests/e2e/offline.spec.ts
import { test, expect } from '@playwright/test';

test('should work offline end-to-end', async ({ page, context }) => {
  // 1. Load app online
  await page.goto('/');
  await page.waitForSelector('[data-testid="task-list"]');
  
  // 2. Go offline
  await context.setOffline(true);
  
  // 3. Complete a task
  await page.click('[data-testid="complete-task-button"]');
  
  // 4. Verify task shows as completed
  await expect(page.locator('[data-testid="task-completed"]')).toBeVisible();
  
  // 5. Verify offline banner appears
  await expect(page.locator('[data-testid="offline-banner"]')).toBeVisible();
  
  // 6. Go online
  await context.setOffline(false);
  
  // 7. Wait for sync
  await page.waitForSelector('[data-testid="offline-banner"]', { state: 'hidden' });
  
  // 8. Verify task is still completed (synced)
  await expect(page.locator('[data-testid="task-completed"]')).toBeVisible();
});
```

### Manual Testing Checklist

- [ ] Go offline → verify offline banner appears
- [ ] Complete task offline → verify it's saved locally
- [ ] Go online → verify sync happens automatically
- [ ] Check DevTools → Application → IndexedDB → verify data is stored
- [ ] Check DevTools → Application → Service Workers → verify SW is registered
- [ ] Check DevTools → Network → verify API calls are cached
- [ ] Refresh page offline → verify app still works
- [ ] Create multiple operations offline → verify they sync in order

---

## Part V: Migration Path

### Step 1: Implement Connectivity Detection (Low Risk)
- Add `ConnectivityService` and `useConnectivity` hook
- Test in isolation
- No breaking changes

### Step 2: Add Offline Query Hook (Medium Risk)
- Create `useOfflineQuery` hook
- Migrate one query at a time (start with `tasks` query)
- Test each migration before moving to next

### Step 3: Enhance Service Worker (Low Risk)
- Update `vite.config.ts` Workbox config
- Test in production build (SW doesn't work in dev mode)
- Verify API responses are cached

### Step 4: Enhance OfflineEngine (Medium Risk)
- Add retry logic to `OfflineEngine`
- Test with network throttling
- Verify failed operations are retried

### Step 5: Add UI Indicators (Low Risk)
- Create `OfflineBanner` component
- Add to layout
- Test visibility in different states

---

## Part VI: Future Enhancements

### 1. Conflict Resolution
- **Current**: Last write wins (simple but may lose data)
- **Future**: Implement version vectors or timestamps
- **Why**: Multiple users editing same data can cause conflicts

### 2. Operation Deduplication
- **Current**: Same operation could be queued multiple times
- **Future**: Add content hash checking to detect duplicates
- **Why**: Prevents duplicate operations from being synced

### 3. Partial Sync
- **Current**: All-or-nothing per operation
- **Future**: Transaction groups for related operations
- **Why**: Some operations depend on others (e.g., create task requires chore to exist)

### 4. Background Sync API
- **Current**: Manual sync on reconnect
- **Future**: Use Background Sync API for automatic sync even when app is closed
- **Why**: Better user experience, syncs even when app isn't open

### 5. Real-time Sync
- **Current**: Poll-based sync
- **Future**: Use Supabase real-time subscriptions for instant updates
- **Why**: See changes from other users immediately

---

## Conclusion

This implementation plan adapts the Angular-based offline support guide to our React + Vite + Dexie + TanStack Query stack. Key adaptations:

1. **RxJS → React Hooks**: Replaced observables with hooks and TanStack Query
2. **Angular SW → Workbox**: Enhanced existing Workbox config instead of replacing it
3. **Custom HTTP → Supabase**: Wrapped Supabase calls instead of replacing them
4. **Custom IDB → Dexie**: Enhanced existing Dexie usage instead of replacing it
5. **Manual State → TanStack Query**: Integrated offline support into TanStack Query instead of replacing it

The plan is **incremental** (can be implemented phase by phase), **testable** (includes testing strategy), and **maintainable** (uses existing tools and patterns).

---

*Document Version: 1.0*  
*Last Updated: 2024*  
*For: Home Chores PWA Offline Support Implementation*

