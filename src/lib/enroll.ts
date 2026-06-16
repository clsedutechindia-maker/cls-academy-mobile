import { firebaseAuth } from "./firebase";

// Issues a real student login on the spot by calling the web app's server route (Admin SDK). Mirrors
// payu.ts / demoRepair.ts: the password is generated and the account created server-side, so it never
// lives on the device. The staff member's Firebase ID token authorizes the call.
const WEB_BASE = (process.env.EXPO_PUBLIC_WEB_BASE_URL || process.env.EXPO_PUBLIC_NOTIFY_URL || "").replace(/\/$/, "");

export type IssuedCredentials = { userId: string; rollNumber: string; password: string };

export function isStudentEnrollmentAvailable(): boolean {
  return WEB_BASE.length > 0;
}

export async function enrollStudent(input: {
  studentName: string;
  classId: string;
  phone?: string;
  email?: string;
  parentName?: string;
  remark?: string;
  staffName?: string;
}): Promise<IssuedCredentials> {
  if (!WEB_BASE) {
    throw new Error("Student enrollment isn't set up yet. Set EXPO_PUBLIC_WEB_BASE_URL to the deployed website.");
  }

  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Please sign in again to register a student.");
  const token = await user.getIdToken();

  const res = await fetch(`${WEB_BASE}/api/enroll/student`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      studentName: input.studentName,
      classId: input.classId,
      phone: input.phone || "",
      email: input.email || "",
      parentName: input.parentName || "",
      remark: input.remark || "",
      staffName: input.staffName || "",
    }),
  });

  const data = (await res.json().catch(() => null)) as
    | { ok?: boolean; error?: string; userId?: string; rollNumber?: string; password?: string }
    | null;

  if (!res.ok || !data?.ok || !data.rollNumber || !data.password) {
    throw new Error(
      data?.error ? `Couldn't create the account (${data.error}).` : "Couldn't create the account. Try again.",
    );
  }

  return { userId: data.userId || "", rollNumber: data.rollNumber, password: data.password };
}
