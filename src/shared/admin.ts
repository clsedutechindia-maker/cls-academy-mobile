export const adminCollectionName = "admins";

export type AdminRole = "admin" | "centre_incharge" | "regional_incharge";

export type AdminRecord = {
  email: string;
  role: AdminRole;
  active: boolean;
  regionId: string;
  regionName: string;
  centreId: string;
  centreName: string;
};

function normalizeAdminRole(value: unknown): AdminRole {
  if (value === "centre_incharge" || value === "regional_incharge") {
    return value;
  }

  return "admin";
}

export function normalizeAdminRecord(data: Partial<AdminRecord> | undefined) {
  return {
    email: data?.email?.trim() || "",
    role: normalizeAdminRole(data?.role),
    active: data?.active ?? false,
    regionId: data?.regionId?.trim() || "",
    regionName: data?.regionName?.trim() || "",
    centreId: data?.centreId?.trim() || "",
    centreName: data?.centreName?.trim() || "",
  } satisfies AdminRecord;
}

export function formatAdminRoleLabel(role: AdminRole) {
  if (role === "centre_incharge") {
    return "Centre Incharge";
  }

  if (role === "regional_incharge") {
    return "Regional Incharge";
  }

  return "Superadmin";
}
