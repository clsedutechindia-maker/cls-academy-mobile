export type AccountRole = "student" | "teacher" | "team" | "employee";
// Legacy only: pre-refactor profiles may still carry teacherRole. New code routes
// off AccountRole ("team" replaces the old head_teacher tier). Kept for back-compat
// normalization until migration clears the field.
export type TeacherRole = "head_teacher" | "class_teacher" | "subject_teacher";
export type ResultAssessmentCategory = "class_test" | "quarterly_exam" | "midterm" | "final";
export type AttendanceStatus = "present" | "absent" | "leave";

export type StudentResultRecord = {
  id: string;
  studentUserId: string;
  teacherUserId: string;
  teacherName: string;
  uploadedByEmployeeId?: string;
  studentName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  subject: string;
  classSubjectId: string;
  assessmentCategory: ResultAssessmentCategory;
  assessmentTitle: string;
  score: number;
  maxScore: number;
  grade: string;
  remarks: string;
  assessmentDate: string;
  publishedAtIso: string;
  classAveragePercent: number | null;
};

export type StudentAttendanceRecord = {
  id: string;
  studentUserId: string;
  teacherUserId: string;
  teacherName: string;
  studentName: string;
  studentBranch: string;
  classId: string;
  className: string;
  attendanceDate: string;
  status: AttendanceStatus;
};

function normalizeResultAssessmentCategory(value: string | undefined) {
  if (value === "quarterly_exam") {
    return "quarterly_exam";
  }

  if (value === "midterm") {
    return "midterm";
  }

  if (value === "final") {
    return "final";
  }

  return "class_test";
}

export function normalizeAssessmentTitleKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "assessment";
}

export function buildStudentResultId(
  studentUserId: string,
  classSubjectId: string,
  assessmentCategory: ResultAssessmentCategory,
  assessmentTitle: string,
) {
  return [
    studentUserId.trim(),
    classSubjectId.trim(),
    assessmentCategory,
    normalizeAssessmentTitleKey(assessmentTitle),
  ].join("__");
}

export function buildStudentAttendanceId(studentUserId: string, attendanceDate: string) {
  return `${studentUserId.trim()}__${attendanceDate.trim()}`;
}

export function isHeadTeacherRole(role: TeacherRole | "") {
  return role === "head_teacher";
}

export function formatAccountRoleLabel(role: AccountRole) {
  if (role === "teacher") {
    return "Teacher";
  }

  if (role === "team") {
    return "Team";
  }

  return "Student / Parent";
}

export function formatTeacherRoleLabel(role: TeacherRole | "") {
  if (role === "head_teacher") {
    return "Head Teacher";
  }

  if (role === "class_teacher") {
    return "Class Teacher";
  }

  if (role === "subject_teacher") {
    return "Subject Teacher";
  }

  return "Teacher";
}

export function normalizeStudentResultRecord(
  id: string,
  data: Partial<Omit<StudentResultRecord, "id">> | undefined,
): StudentResultRecord {
  const subjectName = data?.subjectName?.trim() || data?.subject?.trim() || "General";
  const assessmentCategory = normalizeResultAssessmentCategory(data?.assessmentCategory?.trim());

  return {
    id,
    studentUserId: data?.studentUserId?.trim() || "",
    teacherUserId: data?.teacherUserId?.trim() || "",
    teacherName: data?.teacherName?.trim() || "Teacher",
    studentName: data?.studentName?.trim() || "Student",
    classId: data?.classId?.trim() || "",
    className: data?.className?.trim() || "",
    subjectId: data?.subjectId?.trim() || "",
    subjectName,
    subject: subjectName,
    classSubjectId: data?.classSubjectId?.trim() || "",
    assessmentCategory,
    assessmentTitle: data?.assessmentTitle?.trim() || "Assessment",
    score: typeof data?.score === "number" ? data.score : 0,
    maxScore: typeof data?.maxScore === "number" ? data.maxScore : 100,
    grade: data?.grade?.trim() || "N/A",
    remarks: data?.remarks?.trim() || "No teacher feedback yet.",
    assessmentDate: data?.assessmentDate?.trim() || data?.publishedAtIso?.trim()?.slice(0, 10) || "",
    publishedAtIso: data?.publishedAtIso?.trim() || "",
    classAveragePercent: typeof data?.classAveragePercent === "number" ? data.classAveragePercent : null,
  };
}

export function normalizeStudentAttendanceRecord(
  id: string,
  data: Partial<Omit<StudentAttendanceRecord, "id">> | undefined,
): StudentAttendanceRecord {
  return {
    id,
    studentUserId: data?.studentUserId?.trim() || "",
    teacherUserId: data?.teacherUserId?.trim() || "",
    teacherName: data?.teacherName?.trim() || "Teacher",
    studentName: data?.studentName?.trim() || "Student",
    studentBranch: data?.studentBranch?.trim() || "",
    classId: data?.classId?.trim() || "",
    className: data?.className?.trim() || "",
    attendanceDate: data?.attendanceDate?.trim() || "",
    status: data?.status === "absent" ? "absent" : data?.status === "leave" ? "leave" : "present",
  };
}
