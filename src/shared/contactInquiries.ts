// Web marketing leads — submitted by the public site contact form into the
// `contactInquiries` Firestore collection. Distinct from `admissionInquiries`
// (staff-logged walk-in/call leads). Web leads carry NO centreId, so they are
// global: every authorized viewer sees the full list.

export type ContactLeadStatus = "new" | "contacted" | "converted" | "lost";

export const CONTACT_LEAD_STATUS_ORDER: ContactLeadStatus[] = [
  "new",
  "contacted",
  "converted",
  "lost",
];

export const CONTACT_LEAD_STATUS_META: Record<
  ContactLeadStatus,
  { label: string; fg: string; bg: string }
> = {
  new: { label: "New", fg: "#1D4ED8", bg: "#DBEAFE" },
  contacted: { label: "Contacted", fg: "#B45309", bg: "#FEF3C7" },
  converted: { label: "Converted", fg: "#166534", bg: "#DCFCE7" },
  lost: { label: "Lost", fg: "#9F1239", bg: "#FFE4E6" },
};

export type ContactLeadRecord = {
  id: string;
  name: string;
  phone: string;
  course: string;
  message: string;
  status: ContactLeadStatus;
  createdAtIso: string;
};

function isLeadStatus(value: unknown): value is ContactLeadStatus {
  return value === "new" || value === "contacted" || value === "converted" || value === "lost";
}

// Map a raw Firestore doc into a ContactLeadRecord. The web form writes
// `submittedAt` as a Firestore Timestamp; convert it to an ISO string.
export function normalizeContactLeadRecord(id: string, data: any): ContactLeadRecord {
  const submittedIso =
    data?.submittedAt?.toDate?.()?.toISOString?.() ??
    (typeof data?.submittedAt === "string" ? data.submittedAt : "");
  return {
    id,
    name: typeof data?.name === "string" ? data.name : "",
    phone: typeof data?.phone === "string" ? data.phone : "",
    course: typeof data?.course === "string" ? data.course : "",
    message: typeof data?.message === "string" ? data.message : "",
    status: isLeadStatus(data?.status) ? data.status : "new",
    createdAtIso: submittedIso,
  };
}
