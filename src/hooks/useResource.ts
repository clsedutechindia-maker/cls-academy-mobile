import { useCallback, useEffect, useRef, useState } from "react";
import { readCache, writeCache } from "../lib/cache";

export function useResource<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextData = await loader();
      setData(nextData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load data.");
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload };
}

// Stale-while-revalidate variant: paints cached data instantly (stale=true), then
// revalidates in the background and persists the fresh result. `loading` is only true
// when there is nothing cached to show. Pass a stable, per-user cacheKey.
export function useCachedResource<T>(
  cacheKey: string,
  loader: () => Promise<T>,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards against a slow revalidate from a previous key overwriting newer data.
  const genRef = useRef(0);

  const revalidate = useCallback(async () => {
    const gen = ++genRef.current;
    try {
      const fresh = await loader();
      if (gen !== genRef.current) return;
      setData(fresh);
      setStale(false);
      setError(null);
      void writeCache(cacheKey, fresh);
    } catch (loadError) {
      if (gen !== genRef.current) return;
      // Keep showing stale data if we have it; only surface the error otherwise.
      setError(loadError instanceof Error ? loadError.message : "Unable to load data.");
    } finally {
      if (gen === genRef.current) setLoading(false);
    }
  }, [cacheKey, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pull-to-refresh: force a network revalidate without clearing current data.
  const reload = useCallback(async () => {
    setLoading(true);
    await revalidate();
  }, [revalidate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStale(false);

    void (async () => {
      const cached = await readCache<T>(cacheKey);
      if (!cancelled && cached) {
        setData(cached.data);
        setStale(true);
        setLoading(false);
      }
      if (!cancelled) await revalidate();
    })();

    return () => {
      cancelled = true;
    };
  }, [revalidate, cacheKey]);

  return { data, loading, stale, error, reload };
}
