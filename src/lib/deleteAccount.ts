import { firebaseAuth } from "./firebase";
import { isDemoMode } from "./demoMode";

// In-app account deletion. Mirrors enroll.ts: the request is processed server-side (Admin SDK) via
// the web app, authorized by the caller's Firebase ID token. The server records a verified deletion
// request, marks the profile pending, and disables the auth user — the caller is then signed out.
const WEB_BASE = (process.env.EXPO_PUBLIC_WEB_BASE_URL || process.env.EXPO_PUBLIC_NOTIFY_URL || "").replace(/\/$/, "");

export function isAccountDeletionAvailable(): boolean {
  return WEB_BASE.length > 0;
}

export async function requestAccountDeletion(): Promise<void> {
  // Demo mode has no real backend account to delete.
  if (isDemoMode()) return;

  if (!WEB_BASE) {
    throw new Error("Account deletion isn't set up yet. Set EXPO_PUBLIC_WEB_BASE_URL to the deployed website.");
  }

  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Please sign in again to delete your account.");
  const token = await user.getIdToken();

  const res = await fetch(`${WEB_BASE}/api/account/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });

  const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

  if (!res.ok || !data?.ok) {
    throw new Error(
      data?.error ? `Couldn't delete your account (${data.error}).` : "Couldn't delete your account. Try again.",
    );
  }
}
