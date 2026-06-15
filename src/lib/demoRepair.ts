import { doc, getDoc } from "firebase/firestore";
import { firebaseAuth, firestoreDb } from "./firebase";
import { userProfilesCollectionName } from "../shared";

const DEMO_REPAIR_BASE = (process.env.EXPO_PUBLIC_WEB_BASE_URL || process.env.EXPO_PUBLIC_NOTIFY_URL || "").replace(/\/$/, "");
const DEMO_EMPLOYEE_EMAIL = "demo.employee@clsacademy.test";
const DEMO_EMPLOYEE_CENTRE_ID = "mowa-centre";
const REQUIRED_EMPLOYEE_PERMISSIONS = ["fees", "fee_plans"];

async function hasUsableDemoEmployeeProfile(userId: string): Promise<boolean> {
  const snapshot = await getDoc(doc(firestoreDb, userProfilesCollectionName, userId));
  if (!snapshot.exists()) return false;

  const data = snapshot.data() as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const role = typeof data.role === "string" ? data.role : typeof data.accountType === "string" ? data.accountType : "";
  const centreId = typeof data.centreId === "string" ? data.centreId : "";
  const permissions = Array.isArray(data.permissions) ? data.permissions : [];

  return (
    email === DEMO_EMPLOYEE_EMAIL
    && role === "employee"
    && centreId === DEMO_EMPLOYEE_CENTRE_ID
    && REQUIRED_EMPLOYEE_PERMISSIONS.every((permission) => permissions.includes(permission))
  );
}

export async function repairDemoEmployeeProfile(email: string): Promise<void> {
  const user = firebaseAuth.currentUser;
  if (!user) {
    throw new Error("Demo sign-in did not create a Firebase session.");
  }

  if ((user.email || "").trim().toLowerCase() !== email.trim().toLowerCase()) {
    throw new Error("Demo session email did not match the selected account.");
  }

  if (await hasUsableDemoEmployeeProfile(user.uid).catch(() => false)) {
    return;
  }

  if (!DEMO_REPAIR_BASE) {
    throw new Error("Demo employee profile is missing fee permissions. Re-seed demo data or set EXPO_PUBLIC_WEB_BASE_URL to the deployed website so the switcher can repair it.");
  }

  const token = await user.getIdToken(true);
  const response = await fetch(`${DEMO_REPAIR_BASE}/api/demo/repair-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ? `Demo profile repair failed (${data.error}).` : "Demo profile repair failed.");
  }
}
