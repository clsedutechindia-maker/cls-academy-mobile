import type { AdminRole } from "./admin";

export type AnnouncementAudienceScope = "all" | "region" | "centre";
export type AnnouncementStatus = "pending" | "approved" | "rejected";
export type AnnouncementKind = "announcement" | "circular";

export type AttachmentRecord = {
  label: string;
  url: string;
  kind: "link" | "file";
};

export type StudentAnnouncementRecord = {
  id: string;
  kind: AnnouncementKind;
  title: string;
  message: string;
  audienceScope: AnnouncementAudienceScope;
  regionId: string;
  regionName: string;
  centreId: string;
  centreName: string;
  status: AnnouncementStatus;
  createdByUserId: string;
  createdByName: string;
  createdByRole: AdminRole;
  approvedByUserId: string;
  approvedByName: string;
  approvedAtIso: string;
  reviewNote: string;
  createdAtIso: string;
  updatedAtIso: string;
  attachments: AttachmentRecord[];
};

function normalizeAnnouncementAudienceScope(value: unknown): AnnouncementAudienceScope {
  if (value === "region" || value === "centre") {
    return value;
  }

  return "all";
}

function normalizeAnnouncementStatus(value: unknown): AnnouncementStatus {
  if (value === "approved" || value === "rejected") {
    return value;
  }

  return "pending";
}

function normalizeAnnouncementKind(value: unknown): AnnouncementKind {
  if (value === "circular") {
    return "circular";
  }

  return "announcement";
}

function normalizeAdminRole(value: unknown): AdminRole {
  if (value === "centre_incharge" || value === "regional_incharge") {
    return value;
  }

  return "admin";
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAttachments(value: unknown): AttachmentRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): AttachmentRecord | null => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const raw = item as Record<string, unknown>;
      const url = normalizeString(raw.url || raw.linkUrl || raw.fileUrl);
      if (!url) {
        return null;
      }
      return {
        label: normalizeString(raw.label || raw.name || raw.title) || "Attachment",
        url,
        kind: raw.kind === "file" ? "file" : "link",
      };
    })
    .filter((item): item is AttachmentRecord => item !== null);
}

export function normalizeStudentAnnouncementRecord(
  id: string,
  data: Partial<Omit<StudentAnnouncementRecord, "id">> | undefined,
): StudentAnnouncementRecord {
  return {
    id,
    kind: normalizeAnnouncementKind(data?.kind),
    title: normalizeString(data?.title) || "Untitled announcement",
    message: normalizeString(data?.message),
    audienceScope: normalizeAnnouncementAudienceScope(data?.audienceScope),
    regionId: normalizeString(data?.regionId),
    regionName: normalizeString(data?.regionName),
    centreId: normalizeString(data?.centreId),
    centreName: normalizeString(data?.centreName),
    status: normalizeAnnouncementStatus(data?.status),
    createdByUserId: normalizeString(data?.createdByUserId),
    createdByName: normalizeString(data?.createdByName) || "Management",
    createdByRole: normalizeAdminRole(data?.createdByRole),
    approvedByUserId: normalizeString(data?.approvedByUserId),
    approvedByName: normalizeString(data?.approvedByName),
    approvedAtIso: normalizeString(data?.approvedAtIso),
    reviewNote: normalizeString(data?.reviewNote),
    createdAtIso: normalizeString(data?.createdAtIso),
    updatedAtIso: normalizeString(data?.updatedAtIso),
    attachments: normalizeAttachments(data?.attachments),
  };
}
