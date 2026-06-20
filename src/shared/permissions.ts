// Granular per-user capability system.
//
// Each staff profile carries an explicit `permissions: string[]` list. Capabilities
// gate the staff-facing write paths in firestore.rules and the corresponding UI.
// Admins are NEVER gated by capabilities (they retain full access via admin rules).
//
// Legacy profiles that predate this field have NO `permissions` key; both the rules
// and the app fall back to the role-default bundle for those, so capability gating is
// non-breaking until profiles are backfilled / re-saved.
//
// Circulars are NOT capability-gated — all staff roles can read circulars inherently.

export type Capability =
  // Results & Attendance
  | "upload_results"
  | "attendance"
  // Students
  | "register_students"
  | "inquiries"
  // Content
  | "materials"
  // Scheduling
  | "schedules"
  | "teaching_plans"
  // Student Support
  | "doubts"
  | "sessions"
  // Finance
  | "fees"
  | "fee_plans"
  // HR
  | "leave";

// Canonical order — used for rendering checkboxes and for any UI that lists all
// capabilities. Keep in sync with CAPABILITY_LABELS.
export const ALL_CAPABILITIES: Capability[] = [
  "upload_results",
  "attendance",
  "register_students",
  "inquiries",
  "materials",
  "schedules",
  "teaching_plans",
  "doubts",
  "sessions",
  "fees",
  "fee_plans",
  "leave",
];

export const CAPABILITY_LABELS: Record<Capability, string> = {
  upload_results: "Upload Results",
  attendance: "Attendance",
  register_students: "Register Students",
  inquiries: "Inquiries",
  materials: "Materials",
  schedules: "Schedules",
  teaching_plans: "Teaching Plans",
  doubts: "Doubts",
  sessions: "Sessions",
  fees: "Fees",
  fee_plans: "Fee Plans",
  leave: "Leave Requests",
};

// Grouped for the admin permissions UI.
export const CAPABILITY_GROUPS: { label: string; caps: Capability[] }[] = [
  { label: "Results & Attendance", caps: ["upload_results", "attendance"] },
  { label: "Students", caps: ["register_students", "inquiries"] },
  { label: "Content", caps: ["materials"] },
  { label: "Scheduling", caps: ["schedules", "teaching_plans"] },
  { label: "Student Support", caps: ["doubts", "sessions"] },
  { label: "Finance", caps: ["fees", "fee_plans"] },
  { label: "HR", caps: ["leave"] },
];

// Role-default bundles applied to profiles that have no explicit permissions field.
// Students and admins get no capabilities (admins are ungated; students never write
// staff-scoped data).
export const DEFAULT_CAPABILITIES_BY_ROLE: Record<string, Capability[]> = {
  teacher: ["materials", "doubts", "schedules", "teaching_plans", "leave"],
  team: ["materials", "doubts", "schedules", "teaching_plans", "leave", "inquiries", "sessions"],
  employee: ["attendance", "inquiries", "upload_results", "schedules", "sessions", "fees", "fee_plans"],
  student: [],
};

const CAPABILITY_SET = new Set<string>(ALL_CAPABILITIES);

export function isCapability(value: unknown): value is Capability {
  return typeof value === "string" && CAPABILITY_SET.has(value);
}

// Filter an unknown value (e.g. raw Firestore data) down to valid, de-duplicated
// capability keys in canonical order.
export function normalizeCapabilities(value: unknown): Capability[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const present = new Set<string>();
  for (const item of value) {
    if (isCapability(item)) {
      present.add(item);
    }
  }

  return ALL_CAPABILITIES.filter((cap) => present.has(cap));
}
