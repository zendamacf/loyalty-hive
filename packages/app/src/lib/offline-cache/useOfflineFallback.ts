import { useEffect, useRef, useState } from "react";

type QueryLike<T> = {
  data: T | undefined;
  isSuccess: boolean;
  isError: boolean;
};

type CacheAdapter<T> = {
  /** Identifies the cached slot (e.g. the sort mode). */
  key: string;
  load: () => Promise<T | null>;
  save: (value: T) => Promise<void>;
};

/**
 * Persists each successful fetch and serves the saved copy until fresh data
 * arrives (or when the fetch fails, e.g. no network). The cache is never
 * cleared here; only a real sign out clears it.
 */
export function useOfflineFallback<T>(
  query: QueryLike<T>,
  cache: CacheAdapter<T>,
  enabled = true,
) {
  const [cached, setCached] = useState<{ key: string; value: T | null } | null>(
    null,
  );
  const cacheRef = useRef(cache);
  cacheRef.current = cache;
  const { key } = cache;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    cacheRef.current
      .load()
      .then((value) => !cancelled && setCached({ key, value }))
      .catch(() => !cancelled && setCached({ key, value: null }));
    return () => {
      cancelled = true;
    };
  }, [key, enabled]);

  const { data: fresh, isSuccess } = query;
  // `key` re-runs the save when the slot changes but the data is identical.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  useEffect(() => {
    if (enabled && isSuccess && fresh !== undefined) {
      cacheRef.current.save(fresh).catch(() => {});
    }
  }, [fresh, isSuccess, enabled, key]);

  const cachedValue = cached?.key === key ? cached.value : null;
  const data = fresh ?? cachedValue ?? undefined;

  return {
    data,
    /** The fetch failed but saved data is being shown. */
    isOffline: query.isError && data !== undefined,
  };
}
