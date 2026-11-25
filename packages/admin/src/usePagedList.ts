import { useEffect, useRef, useState } from "react";

import { ApiError } from "./api";

export const PAGE_SIZE = 50;

export type PagedList<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

/**
 * Loads one page of an admin list. A change to `filterKey` goes back to the
 * first page. A 401 calls `onUnauthorized`.
 */
export function usePagedList<T>({
  load,
  filterKey,
  onUnauthorized,
  errorMessage,
}: {
  load: (page: { limit: number; offset: number }) => Promise<PagedList<T>>;
  filterKey: string;
  onUnauthorized: () => void;
  errorMessage: string;
}) {
  const [offset, setOffset] = useState(0);
  const [loadedKey, setLoadedKey] = useState(filterKey);
  const [data, setData] = useState<PagedList<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Reset the page during render, so the old offset is never loaded with new filters.
  if (loadedKey !== filterKey) {
    setLoadedKey(filterKey);
    setOffset(0);
  }

  // The caller makes a new `load` on each render. The filters are in filterKey.
  const loadRef = useRef(load);
  loadRef.current = load;
  const messageRef = useRef(errorMessage);
  messageRef.current = errorMessage;

  // biome-ignore lint/correctness/useExhaustiveDependencies: filterKey changes when load must run again.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadRef
      .current({ limit: PAGE_SIZE, offset })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return;
        }
        setError(messageRef.current);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filterKey, offset, onUnauthorized]);

  return {
    data,
    error,
    loading,
    offset,
    previousPage: () => setOffset(Math.max(0, offset - PAGE_SIZE)),
    nextPage: () => setOffset(offset + PAGE_SIZE),
  };
}
