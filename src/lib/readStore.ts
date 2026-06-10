import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "cls:circular-read-ids";

// In-memory store — shared across all renders, survives navigation within session
const _readIds = new Set<string>();
let _loaded = false;

async function ensureLoaded() {
  if (_loaded) return;
  _loaded = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      for (const id of ids) _readIds.add(id);
    }
  } catch {
    // ignore storage errors
  }
}

export async function markCircularRead(id: string): Promise<void> {
  await ensureLoaded();
  if (_readIds.has(id)) return;
  _readIds.add(id);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(_readIds)));
  } catch {
    // ignore storage errors
  }
}

export async function getReadCircularIds(): Promise<Set<string>> {
  await ensureLoaded();
  return new Set(_readIds);
}

export function isCircularRead(id: string): boolean {
  return _readIds.has(id);
}
