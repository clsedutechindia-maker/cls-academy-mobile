import { firebaseAuth } from "./firebase";

// Origin of the serverless push sender (the Next.js /api/notify route deployed to
// Vercel Hobby — free). Unset in local dev without an endpoint → notifications are
// simply skipped, never an error.
const NOTIFY_URL = process.env.EXPO_PUBLIC_NOTIFY_URL?.replace(/\/$/, "") || "";

export type NotifyEvent =
  | "result.published"
  | "circular.posted"
  | "material.posted"
  | "doubt.answered"
  | "doubt.created"
  | "complaint.created"
  | "complaint.updated"
  | "leave.decided"
  | "leave.submitted"
  | "session.booked"
  | "session.decided"
  | "schedule.posted"
  | "plan.submitted"
  | "plan.decided"
  | "inquiry.created"
  | "staffLeave.submitted"
  | "announcement.submitted"
  | "enrollment.decided"
  | "signup.pending"
  | "attendance.absent";

// Fire-and-forget push trigger. Resolves recipients server-side; the client only
// declares the event + the IDs needed to look them up. NEVER blocks or throws into
// the caller — a failed/absent notification must not break the user's action.
export function notifyEvent(event: NotifyEvent, payload: Record<string, unknown> = {}): void {
  if (!NOTIFY_URL) return;

  void (async () => {
    try {
      const user = firebaseAuth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      await fetch(`${NOTIFY_URL}/api/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event, ...payload }),
      });
    } catch {
      // Best-effort — swallow network/auth errors.
    }
  })();
}
