# Offline System Documentation

## Overview

This document explains how the offline-first data synchronization system works in the Home Chores PWA. The system enables pages to load data from local IndexedDB (via Dexie) when offline, and automatically syncs data from Supabase to IndexedDB when online.

## Architecture Overview

The offline system consists of three main layers:

1. **Connectivity Layer**: Detects online/offline status and backend reachability
2. **Query Layer**: React hooks that bridge TanStack Query with Dexie storage
3. **Storage Layer**: IndexedDB (via Dexie) for persistent offline data

```
┌─────────────────────────────────────────────────────────────┐
│                    React Components                          │
│  (HouseholdPage, BootstrapGuard, etc.)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              useOfflineQuery Hook                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Connectivity │  │ TanStack     │  │ Dexie        │     │
│  │ Detection    │  │ Query        │  │ Read/Write   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────┬─────────────────────────────────────┘
        │               │               │
        ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Connectivity │  │ Supabase     │  │ IndexedDB    │
│ Service      │  │ API          │  │ (via Dexie)  │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Data Flow

### Online Flow (First Load)

```
1. Component calls useOfflineQuery
   ↓
2. useOfflineQuery checks connectivity (isOnline = true)
   ↓
3. Executes queryFn (fetches from Supabase via repo)
   ↓
4. Data returned from Supabase
   ↓
5. writeToDexie function called → data saved to IndexedDB
   ↓
6. Data returned to component → UI renders
```

### Offline Flow

```
1. Component calls useOfflineQuery
   ↓
2. useOfflineQuery checks connectivity (isOnline = false)
   ↓
3. readFromDexie function called → reads from IndexedDB
   ↓
4. Cached data found in IndexedDB
   ↓
5. Data returned to component → UI renders (offline)
```

### Reconnection Flow

```
1. User goes offline → data served from IndexedDB
   ↓
2. Connectivity service detects network restored
   ↓
3. useOfflineQuery detects isOnline = true
   ↓
4. TanStack Query automatically refetches (staleTime expired)
   ↓
5. Fresh data fetched from Supabase
   ↓
6. writeToDexie updates IndexedDB
   ↓
7. Component re-renders with fresh data
```

## Component Communication

### Connectivity Service → Components

The `ConnectivityService` is a singleton that:
- Monitors browser `online`/`offline` events
- Periodically checks Supabase backend reachability (every 30 seconds)
- Notifies subscribers when connectivity status changes

**Communication Pattern:**
```
ConnectivityService (singleton)
    ↓ (subscribe)
useConnectivity hook
    ↓ (returns { status, isOnline })
useOfflineQuery hook
    ↓ (uses isOnline to decide data source)
React Components
```

### TanStack Query → Dexie

`useOfflineQuery` acts as a bridge:
- Wraps TanStack Query's `useQuery`
- Intercepts the `queryFn` to add offline logic
- Manages Dexie read/write operations

**Communication Pattern:**
```
Component
    ↓ (calls useOfflineQuery)
useOfflineQuery
    ↓ (if online) queryFn → Supabase
    ↓ (if offline) readFromDexie → IndexedDB
    ↓ (after fetch) writeToDexie → IndexedDB
TanStack Query (manages cache, refetching, errors)
    ↓ (returns data)
Component
```

## File-by-File Code Explanation

### 1. Connectivity Service (`src/core/offline/connectivity.ts`)

**Purpose:** Detects network connectivity and Supabase backend reachability.

**Key Components:**

```typescript
class ConnectivityService {
  private status: ConnectivityStatus = 'checking';
  private listeners = new Set<(status: ConnectivityStatus) => void>();
  private checkInterval: number | null = null;
```

- **`status`**: Current connectivity state ('online', 'offline', or 'checking')
- **`listeners`**: Set of callback functions that get notified on status changes
- **`checkInterval`**: Timer ID for periodic backend checks

**Constructor Logic:**

```typescript
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
```

**Why this approach:**
- Browser events provide immediate feedback when network state changes
- Periodic checks catch cases where `navigator.onLine` is true but backend is unreachable
- 30-second interval balances responsiveness with battery/network usage

**Backend Check Logic:**

```typescript
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
```

**Why `getSession()`:**
- Fast operation (doesn't require full auth flow)
- Tests actual Supabase API connectivity
- Doesn't require user to be authenticated
- Lightweight compared to full API calls

**Subscription Pattern:**

```typescript
subscribe(listener: (status: ConnectivityStatus) => void): () => void {
  this.listeners.add(listener);
  return () => this.listeners.delete(listener);
}
```

- Components subscribe to get notified of status changes
- Returns unsubscribe function for cleanup
- Uses Set for O(1) add/remove operations

---

### 2. useConnectivity Hook (`src/app/hooks/useConnectivity.ts`)

**Purpose:** React hook that provides reactive connectivity status to components.

**Implementation:**

```typescript
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

**How it works:**
1. **Initial State**: Gets current status synchronously (avoids flash of wrong state)
2. **Subscription**: Subscribes to ConnectivityService on mount
3. **Cleanup**: Unsubscribes on unmount (prevents memory leaks)
4. **Reactive**: Component re-renders when status changes

**Why a hook:**
- Encapsulates subscription logic
- Provides React-friendly API
- Handles cleanup automatically
- Can be used in any component

---

### 3. useOfflineQuery Hook (`src/app/hooks/useOfflineQuery.ts`)

**Purpose:** Wraps TanStack Query's `useQuery` to add offline support via Dexie.

**Type Signature:**

```typescript
export function useOfflineQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    readFromDexie: (key: QueryKey) => Promise<TData | null>;
    writeToDexie: (data: TData, key: QueryKey) => Promise<void>;
  }
): UseQueryResult<TData, TError>
```

**Required Options:**
- **`readFromDexie`**: Function to read cached data from IndexedDB
- **`writeToDexie`**: Function to save data to IndexedDB after fetching

**Core Logic:**

```typescript
return useQuery<TData, TError>({
  ...restOptions,
  queryKey,
  queryFn: async () => {
    // Offline: read from Dexie
    if (!isOnline) {
      const cached = await readFromDexie(queryKey);
      if (cached !== null) {
        return cached;
      }
      throw new Error('No cached data available');
    }

    // Online: fetch from Supabase and cache
    if (!queryFn) {
      throw new Error('queryFn is required when online');
    }
    
    const data = await queryFn();
    
    // Write to Dexie for offline access
    await writeToDexie(data, queryKey);
    
    return data;
  },
  staleTime: isOnline 
    ? (restOptions.staleTime ?? 5 * 60 * 1000) // 5 minutes when online
    : Infinity, // Never stale when offline
  gcTime: Infinity, // Keep in cache forever (we have Dexie for persistence)
});
```

**Key Decisions:**

1. **Offline Behavior:**
   - If offline and cached data exists → return it immediately
   - If offline and no cached data → throw error (TanStack Query handles it)
   - Never attempts network request when offline

2. **Online Behavior:**
   - Always fetches from Supabase (via `queryFn`)
   - Always writes to Dexie after successful fetch
   - Uses normal `staleTime` (5 minutes default)

3. **Stale Time:**
   - **Online**: 5 minutes (allows refetching for fresh data)
   - **Offline**: Infinity (never refetch when offline, always use cache)

4. **Garbage Collection Time:**
   - Infinity (keep in TanStack Query cache forever)
   - Rationale: Dexie is the source of truth for persistence, TanStack Query cache is just for reactivity

**Why this design:**
- Reuses all TanStack Query features (caching, refetching, error handling)
- Transparent to components (same API as `useQuery`)
- Flexible (each query defines its own read/write logic)
- Automatic (no manual cache management needed)

---

### 4. BootstrapGuard (`src/app/components/BootstrapGuard.tsx`)

**Purpose:** Guards app routes and ensures user has a member profile. Migrated to support offline.

**Before (Online Only):**

```typescript
const { data: member } = useQuery({
  queryKey: ['member', userId],
  queryFn: () => memberRepo.getCurrentMember(),
  enabled: !!user,
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
});
```

**After (Offline Support):**

```typescript
const { data: member } = useOfflineQuery({
  queryKey: ['member', userId],
  queryFn: () => memberRepo.getCurrentMember(),
  enabled: !!user,
  staleTime: 1000 * 60 * 5,
  refetchOnWindowFocus: false,
  readFromDexie: async (key) => {
    const [, userIdFromKey] = key;
    if (!userIdFromKey || typeof userIdFromKey !== 'string') {
      return null;
    }
    const member = await db.members.where('userId').equals(userIdFromKey).first();
    return member || null;
  },
  writeToDexie: async (data, _key) => {
    if (data) {
      await db.members.put(data);
    }
  },
});
```

**Read Logic Explanation:**

```typescript
readFromDexie: async (key) => {
  const [, userIdFromKey] = key;  // Extract userId from query key
  if (!userIdFromKey || typeof userIdFromKey !== 'string') {
    return null;  // Invalid key, no cached data
  }
  // Query Dexie members table by userId index
  const member = await db.members.where('userId').equals(userIdFromKey).first();
  return member || null;  // Return member or null if not found
}
```

- Extracts `userId` from query key `['member', userId]`
- Queries Dexie using the `userId` field (not indexed, but works for small datasets)
- Returns `null` if not found (component handles this gracefully)

**Write Logic Explanation:**

```typescript
writeToDexie: async (data, _key) => {
  if (data) {
    await db.members.put(data);  // Upsert: insert or update
  }
}
```

- Uses `put()` for upsert (insert if new, update if exists)
- Only writes if data exists (handles null case)
- Single member object, so no bulk operation needed

**Why this is critical:**
- App initialization depends on member data
- Without offline support, app breaks when offline
- Now app can start even when offline (if member was previously loaded)

---

### 5. HouseholdPage (`src/features/household/HouseholdPage.tsx`)

**Purpose:** Displays household information and members list. Migrated to support offline.

#### Member Query Migration

**Before:**

```typescript
const { data: member } = useQuery({
  queryKey: ['member', userId],
  queryFn: () => memberRepo.getCurrentMember(),
  staleTime: 1000 * 60 * 5,
});
```

**After:**

```typescript
const { data: member } = useOfflineQuery({
  queryKey: ['member', userId],
  queryFn: () => memberRepo.getCurrentMember(),
  staleTime: 1000 * 60 * 5,
  readFromDexie: async (key) => {
    const [, userIdFromKey] = key;
    if (!userIdFromKey || typeof userIdFromKey !== 'string') {
      return null;
    }
    const member = await db.members.where('userId').equals(userIdFromKey).first();
    return member || null;
  },
  writeToDexie: async (data, _key) => {
    if (data) {
      await db.members.put(data);
    }
  },
});
```

**Same pattern as BootstrapGuard** - ensures consistency across the app.

#### Household-with-Members Query Migration

**Before:**

```typescript
const {
  data: householdData,
  isLoading,
  error: householdError,
} = useQuery({
  queryKey: ['household-with-members', userId],
  queryFn: async () => {
    const result = await householdRepo.getCurrentHouseholdWithMembers(member);
    return result;
  },
  enabled: member !== undefined,
  refetchOnMount: 'always',
  staleTime: 1000 * 60,
});
```

**After:**

```typescript
const {
  data: householdData,
  isLoading,
  error: householdError,
} = useOfflineQuery<{ household: Household | null; members: Member[] }>({
  queryKey: ['household-with-members', userId],
  queryFn: async () => {
    const result = await householdRepo.getCurrentHouseholdWithMembers(member);
    return result;
  },
  enabled: member !== undefined,
  refetchOnMount: 'always',
  staleTime: 1000 * 60,
  readFromDexie: async (_key) => {
    // Read first household from Dexie
    const household = await db.households.toCollection().first();
    if (!household) {
      return { household: null, members: [] };
    }
    // Read members for this household
    const members = await db.members.where('householdId').equals(household.id).toArray();
    return { household, members };
  },
  writeToDexie: async (data, _key) => {
    if (data.household) {
      await db.households.put(data.household);
    }
    if (data.members.length > 0) {
      await db.members.bulkPut(data.members);
    }
  },
});
```

**Read Logic Explanation:**

```typescript
readFromDexie: async (_key) => {
  // Read first household from Dexie
  const household = await db.households.toCollection().first();
  if (!household) {
    return { household: null, members: [] };  // No household found
  }
  // Read members for this household using householdId index
  const members = await db.members.where('householdId').equals(household.id).toArray();
  return { household, members };  // Return combined result
}
```

- Gets first household (app supports single household in MVP)
- Queries members by `householdId` (uses indexed field for performance)
- Returns combined result matching the query return type

**Write Logic Explanation:**

```typescript
writeToDexie: async (data, _key) => {
  if (data.household) {
    await db.households.put(data.household);  // Upsert household
  }
  if (data.members.length > 0) {
    await db.members.bulkPut(data.members);  // Bulk upsert members
  }
}
```

- Uses `put()` for single household (upsert)
- Uses `bulkPut()` for members array (more efficient than individual puts)
- Only writes if data exists (handles null/empty cases)

**Why bulkPut for members:**
- More efficient than multiple `put()` calls
- Atomic operation (all or nothing)
- Better performance for arrays

---

## Data Synchronization Flow

### Initial Load (Online)

```
1. User opens app
   ↓
2. BootstrapGuard loads
   ↓
3. useOfflineQuery(['member', userId])
   ↓
4. isOnline = true → queryFn executes
   ↓
5. memberRepo.getCurrentMember() → Supabase API call
   ↓
6. Member data returned
   ↓
7. writeToDexie() → db.members.put(member)
   ↓
8. Member data in IndexedDB + returned to component
   ↓
9. HouseholdPage loads
   ↓
10. useOfflineQuery(['household-with-members', userId])
   ↓
11. isOnline = true → queryFn executes
   ↓
12. householdRepo.getCurrentHouseholdWithMembers() → Supabase API call
   ↓
13. { household, members } returned
   ↓
14. writeToDexie() → 
    - db.households.put(household)
    - db.members.bulkPut(members)
   ↓
15. Data in IndexedDB + returned to component
```

### Subsequent Load (Offline)

```
1. User opens app (offline)
   ↓
2. BootstrapGuard loads
   ↓
3. useOfflineQuery(['member', userId])
   ↓
4. isOnline = false → readFromDexie() executes
   ↓
5. db.members.where('userId').equals(userId).first()
   ↓
6. Cached member found in IndexedDB
   ↓
7. Member data returned immediately (no network call)
   ↓
8. HouseholdPage loads
   ↓
9. useOfflineQuery(['household-with-members', userId])
   ↓
10. isOnline = false → readFromDexie() executes
   ↓
11. db.households.toCollection().first()
   ↓
12. db.members.where('householdId').equals(householdId).toArray()
   ↓
13. Cached data found in IndexedDB
   ↓
14. { household, members } returned immediately (no network call)
```

### Reconnection (Offline → Online)

```
1. User is offline → viewing cached data
   ↓
2. ConnectivityService detects network restored
   ↓
3. checkBackend() → Supabase reachable
   ↓
4. setStatus('online') → notifies all subscribers
   ↓
5. useOfflineQuery hooks detect isOnline = true
   ↓
6. TanStack Query checks staleTime
   ↓
7. If stale (or refetchOnMount: 'always') → refetches
   ↓
8. queryFn executes → fresh data from Supabase
   ↓
9. writeToDexie() → updates IndexedDB
   ↓
10. Component re-renders with fresh data
```

## IndexedDB Schema

The system uses the following Dexie tables:

```typescript
export class ChoresDatabase extends Dexie {
  households!: Table<Household, string>;
  members!: Table<Member, string>;
  choreTemplates!: Table<ChoreTemplate, string>;
  tasks!: Table<TaskInstance, string>;
  outbox!: Table<OfflineOp, string>;

  constructor() {
    super('ChoresDB');
    this.version(1).stores({
      households: 'id, joinCode',
      members: 'id, householdId',
      choreTemplates: 'id, householdId, isArchived',
      tasks: 'id, householdId, choreTemplateId, dueDate, status',
      outbox: 'id, createdAt, status',
    });
  }
}
```

**Indexes Used for Offline Reads:**

- **`members.userId`**: Used to find member by user ID (not indexed, but works for small datasets)
- **`members.householdId`**: Used to find all members of a household (indexed)
- **`households.id`**: Primary key for household lookup

## Error Handling

### No Cached Data (Offline)

When offline and no cached data exists:

```typescript
// In useOfflineQuery
if (!isOnline) {
  const cached = await readFromDexie(queryKey);
  if (cached !== null) {
    return cached;
  }
  throw new Error('No cached data available');
}
```

**Result:**
- TanStack Query catches the error
- Component receives `error` state
- Component can show error UI or fallback

### Network Error (Online)

When online but Supabase is unreachable:

```typescript
// In ConnectivityService
try {
  const { error } = await supabase.auth.getSession();
  this.setStatus(error ? 'offline' : 'online');
} catch {
  this.setStatus('offline');
}
```

**Result:**
- Connectivity status changes to 'offline'
- Next query attempt will use cached data
- User sees offline state

### Partial Data

If some data exists but not all:

```typescript
// Example: household exists but no members
readFromDexie: async (_key) => {
  const household = await db.households.toCollection().first();
  if (!household) {
    return { household: null, members: [] };
  }
  const members = await db.members.where('householdId').equals(household.id).toArray();
  return { household, members };  // members might be empty array
}
```

**Result:**
- Component receives partial data
- Component can handle empty arrays gracefully
- Better UX than showing error

## Performance Considerations

### Query Key Design

Query keys include all dependencies:

```typescript
['member', userId]  // Depends on userId
['household-with-members', userId]  // Depends on userId
```

**Why:**
- TanStack Query uses keys for caching
- Different users get different cache entries
- Keys change when dependencies change → automatic refetch

### Stale Time Strategy

```typescript
staleTime: isOnline 
  ? (restOptions.staleTime ?? 5 * 60 * 1000)  // 5 minutes when online
  : Infinity  // Never stale when offline
```

**Rationale:**
- **Online**: Allow refetching for fresh data (5 minutes is reasonable)
- **Offline**: Never refetch (would fail anyway, waste resources)

### Bulk Operations

```typescript
// Efficient for arrays
await db.members.bulkPut(data.members);

// vs. inefficient
for (const member of data.members) {
  await db.members.put(member);
}
```

**Why bulkPut:**
- Single transaction (faster)
- Atomic (all or nothing)
- Better IndexedDB performance

## Testing Scenarios

### Scenario 1: First Load (Online)

1. Clear IndexedDB
2. Load app online
3. **Expected**: Data loads from Supabase, saved to IndexedDB
4. **Verify**: Check DevTools → Application → IndexedDB → data exists

### Scenario 2: Offline Load (With Cache)

1. Load app online (creates cache)
2. Go offline
3. Refresh page
4. **Expected**: Data loads from IndexedDB, no network calls
5. **Verify**: Check Network tab → no Supabase requests

### Scenario 3: Offline Load (No Cache)

1. Clear IndexedDB
2. Go offline
3. Load app
4. **Expected**: Error state or empty data
5. **Verify**: Component shows appropriate error/empty UI

### Scenario 4: Reconnection

1. Load app offline (with cache)
2. View cached data
3. Go online
4. **Expected**: Data automatically refetches, IndexedDB updated
5. **Verify**: Check Network tab → Supabase requests, IndexedDB updated

### Scenario 5: Slow Network

1. Throttle network to "Slow 3G"
2. Load app
3. **Expected**: Connectivity might show 'checking', then 'online' or 'offline'
4. **Verify**: Appropriate behavior based on actual connectivity

## Future Enhancements

### Potential Improvements

1. **Indexed Queries**: Add `userId` index to `members` table for faster lookups
2. **Background Sync**: Use Background Sync API to sync when app is closed
3. **Conflict Resolution**: Handle conflicts when data changes on multiple devices
4. **Optimistic Updates**: Show UI changes immediately, sync in background
5. **Real-time Sync**: Use Supabase real-time subscriptions for instant updates

### Migration Path for Other Pages

When ready to migrate HomePage/Tasks page:

1. Replace `useQuery` with `useOfflineQuery`
2. Add `readFromDexie` function (query Dexie by query key)
3. Add `writeToDexie` function (save to appropriate Dexie table)
4. Test offline behavior
5. Verify data consistency

---

*Last Updated: 2024*  
*For: Home Chores PWA Offline System*

