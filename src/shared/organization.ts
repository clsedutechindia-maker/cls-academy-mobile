import type { AccountRole, TeacherRole } from "./education";

export const userProfilesCollectionName = "userProfiles";
export const classesCollectionName = "classes";
export const classSubjectsCollectionName = "class_subjects";
export const studentAttendanceCollectionName = "studentAttendance";
export const classTimetablesCollectionName = "classTimetables";
export const testSchedulesCollectionName = "testSchedules";
export const teachingPlansCollectionName = "teachingPlans";
export const sessionSlotsCollectionName = "sessionSlots";
export const studentAnnouncementsCollectionName = "studentAnnouncements";
export const studentComplaintsCollectionName = "studentComplaints";
export const studentResultsCollectionName = "studentResults";

export type RegionRecord = {
  id: string;
  name: string;
  active: boolean;
};

export type CentreRecord = {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  latitude: number | null;
  longitude: number | null;
  attendanceRadiusMeters: number;
  active: boolean;
};

export type ClassRecord = {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  centreId: string;
  centreName: string;
  teacherUserId: string;
  teacherId: string;
  teacherName: string;
  active: boolean;
};

export type SubjectRecord = {
  id: string;
  name: string;
  code: string;
  active: boolean;
};

export type ClassSubjectRecord = {
  id: string;
  classId: string;
  class_id: string;
  className: string;
  subjectId: string;
  subject_id: string;
  subjectName: string;
  teacherUserId: string;
  teacherId: string;
  teacher_id: string;
  teacherName: string;
  centreId: string;
  centreName: string;
  regionId: string;
  regionName: string;
  active: boolean;
};

export type UserProfileRecord = {
  userId: string;
  name: string;
  fullName: string;
  email: string;
  role: AccountRole;
  accountType: AccountRole;
  regionId: string;
  regionName: string;
  centreId: string;
  centreName: string;
  branch: string;
  teacherId: string;
  teacherRole: TeacherRole | "";
  teacher_role: TeacherRole | "";
  teacherClassIds: string[];
  teacherClassNames: string[];
  teacherSubjectIds: string[];
  teacherSubjectNames: string[];
  teacher_class_ids: string[];
  teacher_class_names: string[];
  teacher_subject_ids: string[];
  teacher_subject_names: string[];
  employeeId: string;
  employee_id: string;
  employeeType: string;
  employeeCompetitiveExam: string;
  employeeQualification: string;
  employeeSubject: string;
  studentId: string;
  rollNumber: string;
  classId: string;
  className: string;
  studentClass: string;
  age: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  address: string;
  passportPhotoDataUrl: string;
  passportPhotoName: string;
  parentOneName: string;
  parentOneAge: string;
  parentOneEmail: string;
  parentTwoName: string;
  parentTwoAge: string;
  parentTwoEmail: string;
  salaryAccountHolderName: string;
  salaryBankName: string;
  salaryAccountNumber: string;
  salaryIfscCode: string;
  salaryUpiId: string;
  baseSalary: number;
  passwordHash: string;
  password_hash: string;
  emailVerified: boolean;
  active: boolean;
};

function normalizeTeacherRole(value: unknown): TeacherRole | "" {
  if (value === "head_teacher" || value === "class_teacher" || value === "subject_teacher") {
    return value;
  }

  return "";
}

function normalizeAccountRole(value: unknown): AccountRole {
  if (value === "teacher") {
    return "teacher";
  }

  if (value === "team") {
    return "team";
  }

  // Legacy: dropped "employee" role maps to a plain teacher account (migration
  // converts these; this is the defensive fallback for un-migrated docs).
  if (value === "employee") {
    return "teacher";
  }

  return "student";
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function normalizeOptionalNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function formatDisplayName(value: string) {
  return value
    .trim()
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function normalizeRegionRecord(
  id: string,
  data: Partial<Omit<RegionRecord, "id">> | undefined,
): RegionRecord {
  return {
    id,
    name: data?.name?.trim() || id,
    active: data?.active ?? true,
  };
}

export function normalizeCentreRecord(
  id: string,
  data: Partial<Omit<CentreRecord, "id">> | undefined,
): CentreRecord {
  return {
    id,
    name: data?.name?.trim() || id,
    regionId: data?.regionId?.trim() || "",
    regionName: data?.regionName?.trim() || "",
    latitude: normalizeOptionalNumber(data?.latitude),
    longitude: normalizeOptionalNumber(data?.longitude),
    attendanceRadiusMeters:
      typeof data?.attendanceRadiusMeters === "number" && Number.isFinite(data.attendanceRadiusMeters)
        ? data.attendanceRadiusMeters
        : 2000,
    active: data?.active ?? true,
  };
}

export function normalizeClassRecord(
  id: string,
  data: Partial<Omit<ClassRecord, "id">> | undefined,
): ClassRecord {
  return {
    id,
    name: data?.name?.trim() || id,
    regionId: data?.regionId?.trim() || "",
    regionName: data?.regionName?.trim() || "",
    centreId: data?.centreId?.trim() || "",
    centreName: data?.centreName?.trim() || "",
    teacherUserId: data?.teacherUserId?.trim() || "",
    teacherId: data?.teacherId?.trim() || "",
    teacherName: data?.teacherName?.trim() || "",
    active: data?.active ?? true,
  };
}

export function normalizeSubjectRecord(
  id: string,
  data: Partial<Omit<SubjectRecord, "id">> | undefined,
): SubjectRecord {
  return {
    id,
    name: data?.name?.trim() || id,
    code: data?.code?.trim() || "",
    active: data?.active ?? true,
  };
}

export function normalizeClassSubjectRecord(
  id: string,
  data: Partial<Omit<ClassSubjectRecord, "id">> | undefined,
): ClassSubjectRecord {
  const classId = data?.classId?.trim() || data?.class_id?.trim() || "";
  const subjectId = data?.subjectId?.trim() || data?.subject_id?.trim() || "";
  const teacherId = data?.teacherId?.trim() || data?.teacher_id?.trim() || "";

  return {
    id,
    classId,
    class_id: classId,
    className: data?.className?.trim() || "",
    subjectId,
    subject_id: subjectId,
    subjectName: data?.subjectName?.trim() || "",
    teacherUserId: data?.teacherUserId?.trim() || "",
    teacherId,
    teacher_id: teacherId,
    teacherName: data?.teacherName?.trim() || "",
    centreId: data?.centreId?.trim() || "",
    centreName: data?.centreName?.trim() || "",
    regionId: data?.regionId?.trim() || "",
    regionName: data?.regionName?.trim() || "",
    active: data?.active ?? true,
  };
}

export function normalizeUserProfileRecord(
  userId: string,
  data: Partial<UserProfileRecord> | undefined,
  fallbackEmail = "",
): UserProfileRecord {
  const rawRole = normalizeAccountRole(data?.role || data?.accountType);
  // Legacy head teachers (role:"teacher" + teacherRole:"head_teacher") become "team".
  const legacyTeacherRole = normalizeTeacherRole(data?.teacherRole || data?.teacher_role);
  const role: AccountRole = rawRole === "teacher" && legacyTeacherRole === "head_teacher" ? "team" : rawRole;
  const isTeaching = role === "teacher" || role === "team";
  // teacherRole tier is retired; route off `role`. Always blank in normalized output.
  const teacherRole = "" as const;
  const teacherClassIds = isTeaching ? normalizeStringArray(data?.teacherClassIds || data?.teacher_class_ids) : [];
  const teacherClassNames = isTeaching ? normalizeStringArray(data?.teacherClassNames || data?.teacher_class_names) : [];
  const teacherSubjectIds = isTeaching ? normalizeStringArray(data?.teacherSubjectIds || data?.teacher_subject_ids) : [];
  const teacherSubjectNames = isTeaching ? normalizeStringArray(data?.teacherSubjectNames || data?.teacher_subject_names) : [];
  const fullName = formatDisplayName(data?.name || data?.fullName || "");
  const className = data?.className?.trim() || data?.studentClass?.trim() || "";
  const centreName = data?.centreName?.trim() || data?.branch?.trim() || "";
  const employeeId = data?.employeeId?.trim() || data?.employee_id?.trim() || "";
  const studentId = data?.studentId?.trim() || data?.rollNumber?.trim() || "";
  const passwordHash = data?.passwordHash?.trim() || data?.password_hash?.trim() || "managed-by-firebase-auth";

  return {
    userId: data?.userId?.trim() || userId,
    name: fullName,
    fullName,
    email: data?.email?.trim() || fallbackEmail.trim(),
    role,
    accountType: role,
    regionId: data?.regionId?.trim() || "",
    regionName: data?.regionName?.trim() || "",
    centreId: data?.centreId?.trim() || "",
    centreName,
    branch: centreName,
    teacherId: data?.teacherId?.trim() || "",
    teacherRole,
    teacher_role: teacherRole,
    teacherClassIds,
    teacherClassNames,
    teacherSubjectIds,
    teacherSubjectNames,
    teacher_class_ids: teacherClassIds,
    teacher_class_names: teacherClassNames,
    teacher_subject_ids: teacherSubjectIds,
    teacher_subject_names: teacherSubjectNames,
    employeeId,
    employee_id: employeeId,
    employeeType: data?.employeeType?.trim() || "",
    employeeCompetitiveExam: data?.employeeCompetitiveExam?.trim() || "",
    employeeQualification: data?.employeeQualification?.trim() || "",
    employeeSubject: data?.employeeSubject?.trim() || "",
    studentId,
    rollNumber: studentId,
    classId: data?.classId?.trim() || "",
    className,
    studentClass: className,
    age: data?.age?.trim() || "",
    dateOfBirth: data?.dateOfBirth?.trim() || "",
    gender: data?.gender?.trim() || "",
    phone: data?.phone?.trim() || "",
    address: data?.address?.trim() || "",
    passportPhotoDataUrl: data?.passportPhotoDataUrl?.trim() || "",
    passportPhotoName: data?.passportPhotoName?.trim() || "",
    parentOneName: data?.parentOneName?.trim() || "",
    parentOneAge: data?.parentOneAge?.trim() || "",
    parentOneEmail: data?.parentOneEmail?.trim() || "",
    parentTwoName: data?.parentTwoName?.trim() || "",
    parentTwoAge: data?.parentTwoAge?.trim() || "",
    parentTwoEmail: data?.parentTwoEmail?.trim() || "",
    salaryAccountHolderName: data?.salaryAccountHolderName?.trim() || "",
    salaryBankName: data?.salaryBankName?.trim() || "",
    salaryAccountNumber: data?.salaryAccountNumber?.trim() || "",
    salaryIfscCode: data?.salaryIfscCode?.trim().toUpperCase() || "",
    salaryUpiId: data?.salaryUpiId?.trim() || "",
    baseSalary: typeof data?.baseSalary === "number" ? data.baseSalary : Number(data?.baseSalary || 0),
    passwordHash,
    password_hash: passwordHash,
    emailVerified: typeof data?.emailVerified === "boolean" ? data.emailVerified : false,
    active: data?.active ?? true,
  };
}
