import { useCallback, useEffect, useState } from "react";

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
