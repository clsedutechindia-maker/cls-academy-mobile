import AsyncStorage from "@react-native-async-storage/async-storage";

// Bump this when a cached record shape changes — invalidates every cached key at once.
const CACHE_VERSION = "v1";
const KEY_PREFIX = `clsq:${CACHE_VERSION}:`;

type CacheEnvelope<T> = {
  data: T;
  ts: number;
};

function fullKey(key: string) {
  return `${KEY_PREFIX}${key}`;
}

// Read a cached value. Returns null on miss, parse error, or any storage failure.
export async function readCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(fullKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed.ts !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

// Persist a value. Swallows errors — caching is best-effort, never blocks the UI.
export async function writeCache<T>(key: string, data: T): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = { data, ts: Date.now() };
    await AsyncStorage.setItem(fullKey(key), JSON.stringify(envelope));
  } catch {
    // ignore — value simply won't be cached this time
  }
}

// Clear cached keys. With no prefix, clears all of our namespace (e.g. on sign-out).
// With a prefix, clears only matching keys (e.g. one user's cache). Never touches
// non-namespaced AsyncStorage keys (auth, settings, etc.).
export async function clearCache(prefix?: string): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const match = prefix ? fullKey(prefix) : KEY_PREFIX;
    const toRemove = allKeys.filter((k) => k.startsWith(match));
    if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  } catch {
    // ignore
  }
}

// Split an array into fixed-size chunks. Used for Firestore "in" queries (max 10 values).
export function chunk<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}
