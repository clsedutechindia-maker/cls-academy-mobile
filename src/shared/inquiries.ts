// --- Admission inquiries (head-teacher logs walk-in / call leads; admin tracks) ---
// Distinct from `contactInquiries` (public website contact form). This is the
// front-desk lead pipeline: a prospective student visits a centre or calls, the
// head teacher logs it, and repeat contact (matched by phone) is appended as a
// follow-up rather than creating a duplicate lead.

export const admissionInquiriesCollectionName = "admissionInquiries";
export const inquiryFollowUpsSubcollectionName = "followUps";

export type InquiryStatus =
  | "new"
  | "contacted"
  | "demo_scheduled"
  | "demo_attended"
  | "enrolled"
  | "lost";

export type InquiryMode = "walk_in" | "phone" | "reference" | "online" | "other";

export type AdmissionInquiryRecord = {
  id: string;
  studentName: string;
  phone: string;
  phoneKey: string; // digits only, last 10 — dedup key within a centre
  email: string;
  course: string;
  mode: InquiryMode; // how the lead first came in
  status: InquiryStatus;
  remark: string; // latest remark (denormalized from newest follow-up)
  centreId: string;
  centreName: string;
  regionId: string;
  regionName: string;
  createdByUserId: string;
  createdByName: string;
  assignedToUserId: string;
  assignedToName: string;
  followUpCount: number;
  lastContactedAtIso: string;
  nextFollowUpDate: string; // YYYY-MM-DD or ""
  createdAtIso: string;
  updatedAtIso: string;
  updatedByUserId: string;
  updatedByName: string;
};

export type InquiryFollowUpRecord = {
  id: string;
  note: string;
  mode: InquiryMode; // how they contacted this time
  outcome: InquiryStatus; // status the lead was moved to at this contact
  nextFollowUpDate: string; // YYYY-MM-DD or ""
  byUserId: string;
  byName: string;
  createdAtIso: string;
};

export const INQUIRY_STATUS_META: Record<InquiryStatus, { label: string; fg: string; bg: string }> = {
  new: { label: "New", fg: "#1D4ED8", bg: "#DBEAFE" },
  contacted: { label: "Contacted", fg: "#7C3AED", bg: "#F3E8FF" },
  demo_scheduled: { label: "Demo Scheduled", fg: "#B45309", bg: "#FEF3C7" },
  demo_attended: { label: "Demo Attended", fg: "#0D9488", bg: "#CCFBF1" },
  enrolled: { label: "Enrolled", fg: "#166534", bg: "#DCFCE7" },
  lost: { label: "Lost", fg: "#B91C1C", bg: "#FEE2E2" },
};

// Ordered pipeline for filter chips / progression.
export const INQUIRY_STATUS_ORDER: InquiryStatus[] = [
  "new",
  "contacted",
  "demo_scheduled",
  "demo_attended",
  "enrolled",
  "lost",
];

export const INQUIRY_MODE_META: Record<InquiryMode, { label: string; icon: string }> = {
  walk_in: { label: "Office Visit", icon: "walk-outline" },
  phone: { label: "Phone Call", icon: "call-outline" },
  reference: { label: "Reference", icon: "people-outline" },
  online: { label: "Online", icon: "globe-outline" },
  other: { label: "Other", icon: "ellipsis-horizontal-outline" },
};

export const INQUIRY_MODE_ORDER: InquiryMode[] = ["walk_in", "phone", "reference", "online", "other"];

export function isTerminalInquiryStatus(status: InquiryStatus): boolean {
  return status === "enrolled" || status === "lost";
}

export function inquiryStatusLabel(status: InquiryStatus): string {
  return INQUIRY_STATUS_META[status]?.label ?? "New";
}

export function inquiryModeLabel(mode: InquiryMode): string {
  return INQUIRY_MODE_META[mode]?.label ?? "Other";
}

// Strip everything non-numeric, keep the last 10 digits as the dedup key.
export function normalizeInquiryPhoneKey(phone: string): string {
  return (phone || "").replace(/\D/g, "").slice(-10);
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeInquiryStatus(value: unknown): InquiryStatus {
  return value === "contacted"
    || value === "demo_scheduled"
    || value === "demo_attended"
    || value === "enrolled"
    || value === "lost"
    ? value
    : "new";
}

function normalizeInquiryMode(value: unknown): InquiryMode {
  return value === "walk_in"
    || value === "phone"
    || value === "reference"
    || value === "online"
    || value === "other"
    ? value
    : "other";
}

function normalizeDateValue(value: unknown): string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function normalizeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

export function normalizeAdmissionInquiryRecord(
  id: string,
  data: Partial<Omit<AdmissionInquiryRecord, "id">> | undefined,
): AdmissionInquiryRecord {
  const phone = normalizeString(data?.phone);
  return {
    id,
    studentName: normalizeString(data?.studentName),
    phone,
    phoneKey: normalizeString(data?.phoneKey) || normalizeInquiryPhoneKey(phone),
    email: normalizeString(data?.email),
    course: normalizeString(data?.course),
    mode: normalizeInquiryMode(data?.mode),
    status: normalizeInquiryStatus(data?.status),
    remark: normalizeString(data?.remark),
    centreId: normalizeString(data?.centreId),
    centreName: normalizeString(data?.centreName),
    regionId: normalizeString(data?.regionId),
    regionName: normalizeString(data?.regionName),
    createdByUserId: normalizeString(data?.createdByUserId),
    createdByName: normalizeString(data?.createdByName),
    assignedToUserId: normalizeString(data?.assignedToUserId),
    assignedToName: normalizeString(data?.assignedToName),
    followUpCount: normalizeCount(data?.followUpCount),
    lastContactedAtIso: normalizeString(data?.lastContactedAtIso),
    nextFollowUpDate: normalizeDateValue(data?.nextFollowUpDate),
    createdAtIso: normalizeString(data?.createdAtIso),
    updatedAtIso: normalizeString(data?.updatedAtIso),
    updatedByUserId: normalizeString(data?.updatedByUserId),
    updatedByName: normalizeString(data?.updatedByName),
  };
}

export function normalizeInquiryFollowUpRecord(
  id: string,
  data: Partial<Omit<InquiryFollowUpRecord, "id">> | undefined,
): InquiryFollowUpRecord {
  return {
    id,
    note: normalizeString(data?.note),
    mode: normalizeInquiryMode(data?.mode),
    outcome: normalizeInquiryStatus(data?.outcome),
    nextFollowUpDate: normalizeDateValue(data?.nextFollowUpDate),
    byUserId: normalizeString(data?.byUserId),
    byName: normalizeString(data?.byName),
    createdAtIso: normalizeString(data?.createdAtIso),
  };
}
