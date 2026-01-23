import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useConnectivity } from './useConnectivity';

type QueryKey = readonly unknown[];

export function useOfflineQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError> & {
    // Custom function to read from Dexie when offline
    readFromDexie: (key: QueryKey) => Promise<TData | null>;
    // Custom function to write to Dexie after fetching from Supabase
    writeToDexie: (data: TData, key: QueryKey) => Promise<void>;
  }
): UseQueryResult<TData, TError> {
  const { isOnline, status } = useConnectivity();
  const { queryKey, queryFn, readFromDexie, writeToDexie, ...restOptions } = options;

  return useQuery<TData, TError>({
    ...restOptions,
    queryKey,
    queryFn: async (context) => {
      // Offline or checking: read from Dexie
      // When status is 'checking', we prefer cached data to avoid race conditions
      // on page refresh where connectivity check hasn't completed yet
      if (!isOnline || status === 'checking') {
        const cached = await readFromDexie(queryKey);
        if (cached !== null) {
          return cached;
        }
        // If no cached data, throw error to let TanStack Query handle it
        throw new Error('No cached data available');
      }

      // Online: fetch from Supabase and cache
      if (!queryFn || typeof queryFn !== 'function') {
        throw new Error('queryFn is required when online');
      }
      
      // Call the original queryFn with the context from TanStack Query
      const data = await queryFn(context);
      
      // Write to Dexie for offline access
      await writeToDexie(data, queryKey);
      
      return data;
    },
    staleTime: isOnline 
      ? (restOptions.staleTime ?? 5 * 60 * 1000) // 5 minutes when online
      : Infinity, // Never stale when offline
    gcTime: Infinity, // Keep in cache forever (we have Dexie for persistence)
  });
}

