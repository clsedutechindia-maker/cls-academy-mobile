export const adminCollectionName = "admins";

// Single admin tier (superadmin). Centre/regional incharge tiers were retired;
// such records are deactivated by migration and any stray value normalizes to "admin".
export type AdminRole = "admin";

export type AdminRecord = {
  email: string;
  role: AdminRole;
  active: boolean;
  regionId: string;
  regionName: string;
  centreId: string;
  centreName: string;
};

function normalizeAdminRole(_value: unknown): AdminRole {
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

export function formatAdminRoleLabel(_role: AdminRole) {
  return "Admin";
}
