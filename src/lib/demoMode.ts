import AsyncStorage from "@react-native-async-storage/async-storage";

export type DemoRole = "student" | "teacher" | "team" | "admin";

const VALID_ROLES: DemoRole[] = ["student", "teacher", "team", "admin"];
const ROLE_KEY = "cls:demo-role";

let _activeRole: DemoRole | null = null;

// Synchronous restore on web (runs at module import, before first React render)
if (typeof window !== "undefined" && window.localStorage) {
  const stored = window.localStorage.getItem(ROLE_KEY);
  if (stored && (VALID_ROLES as string[]).includes(stored)) {
    _activeRole = stored as DemoRole;
  }
}

export function setDemoRole(role: DemoRole | null) {
  _activeRole = role;
  if (typeof window !== "undefined" && window.localStorage) {
    if (role) window.localStorage.setItem(ROLE_KEY, role);
    else window.localStorage.removeItem(ROLE_KEY);
  }
  void AsyncStorage.setItem(ROLE_KEY, role ?? "").catch(() => {});
}

export function getDemoRole(): DemoRole | null {
  return _activeRole;
}

export function isDemoMode(): boolean {
  return _activeRole !== null;
}
