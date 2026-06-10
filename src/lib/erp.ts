import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestoreDb, firebaseStorage } from "./firebase";
import { formatDateTimeLabel, getTodayDateValue } from "./date";
import { isDemoMode, getDemoRole } from "./demoMode";
import {
  getDemoAnnouncements,
  getDemoStudentResults,
  getDemoStudentAttendance,
  getDemoStudentSchedules,
  getDemoMaterials,
  getDemoComplaints,
  getDemoDoubts,
  getDemoLeaveRequests,
  getDemoNotifications,
  getDemoAdminLeaveRequests,
  getDemoHTStudents,
  getDemoHTResults,
  getDemoHTDoubts,
  getDemoResultsForAssessment,
  getDemoStudentProfileById,
  getDemoStudentAttendanceById,
  getDemoStudentResultsById,
  getDemoClassSubjects,
  getDemoDoubtReplies,
  addDemoPendingLeave,
  addDemoPendingDoubt,
  addDemoPendingComplaint,
  setDemoStudentLeaveStatus,
  setDemoStaffLeaveStatus,
  getDemoAdminLeaveRequestsWithOverrides,
  hydrateDemoState,
} from "./demoData";
import {
  adminCollectionName,
  buildStudentAttendanceId,
  buildStudentResultId,
  classSubjectsCollectionName,
  classTimetablesCollectionName,
  classesCollectionName,
  normalizeClassRecord,
  normalizeClassSubjectRecord,
  normalizeClassTimetableRecord,
  normalizeStudentAnnouncementRecord,
  normalizeStudentAttendanceRecord,
  normalizeStudentResultRecord,
  normalizeTestScheduleRecord,
  normalizeUserProfileRecord,
  studentAnnouncementsCollectionName,
  studentAttendanceCollectionName,
  studentComplaintsCollectionName,
  studentResultsCollectionName,
  testSchedulesCollectionName,
  userProfilesCollectionName,
  type AdminRecord,
  type AttendanceStatus,
  type ClassSubjectRecord,
  type ClassTimetableRecord,
  type ResultAssessmentCategory,
  type StudentAnnouncementRecord,
  type StudentAttendanceRecord,
  type StudentResultRecord,
  type TestScheduleRecord,
  type UserProfileRecord,
} from "../shared";

const learningResourcesCollectionName = "learningResources";
const studentDoubtsCollectionName = "studentDoubts";
const studentLeaveRequestsCollectionName = "studentLeaveRequests";
const dashboardNotificationStatesCollectionName = "dashboardNotificationStates";

export type AttachmentMeta = {
  label: string;
  url: string;
  kind: "link" | "file";
};

export type StudentComplaintRecord = {
  id: string;
  studentUserId: string;
  studentName: string;
  classId: string;
  className: string;
  centreId: string;
  centreName: string;
  regionId: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "rejected";
  adminReply: string;
  createdAtIso: string;
  updatedAtIso: string;
  attachments: AttachmentMeta[];
};

export type LearningResourceRecord = {
  id: string;
  kind: "resource" | "learning_link";
  title: string;
  description: string;
  linkUrl: string;
  audienceScope: "all" | "region" | "centre" | "class";
  regionId: string;
  regionName: string;
  centreId: string;
  centreName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  status: "pending" | "approved" | "rejected";
  createdByUserId: string;
  createdByName: string;
  createdAtIso: string;
  updatedAtIso: string;
  attachments: AttachmentMeta[];
};

export type StudentDoubtRecord = {
  id: string;
  studentUserId: string;
  studentName: string;
  studentClassId: string;
  studentClassName: string;
  teacherUserId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classSubjectId: string;
  questionText: string;
  status: "open" | "replied" | "resolved";
  teacherSeen: boolean;
  studentSeen: boolean;
  createdAtIso: string;
  updatedAtIso: string;
  attachmentUrl: string;
  attachmentName: string;
};

export type StudentDoubtReplyRecord = {
  id: string;
  doubtId: string;
  authorUserId: string;
  authorName: string;
  authorRole: "student" | "teacher";
  replyText: string;
  createdAtIso: string;
};

export type StudentLeaveRequestRecord = {
  id: string;
  studentUserId: string;
  studentName: string;
  classId: string;
  className: string;
  centreId: string;
  centreName: string;
  regionId: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  adminReply: string;
  requestedAtIso: string;
  updatedAtIso: string;
};

export type StudentNotificationItem = {
  id: string;
  type: "circular" | "complaint" | "doubt" | "leave" | "result" | "material";
  title: string;
  message: string;
  createdAtIso: string;
  href: string;
};

export type StaffAttendanceRecord = {
  id: string;
  staffUserId: string;
  staffName: string;
  attendanceDate: string;
  status: "present" | "absent" | "leave";
  note: string;
  centreId: string;
  centreName: string;
  regionId: string;
};

export type StaffDiaryRecord = {
  id: string;
  staffUserId: string;
  staffName: string;
  title: string;
  summary: string;
  submittedForDate: string;
  status: "submitted" | "reviewed";
  centreId: string;
  regionId: string;
  createdAtIso: string;
};

export type SalaryRecord = {
  id: string;
  staffUserId: string;
  staffName: string;
  monthKey: string;
  grossAmount: number;
  netAmount: number;
  status: "draft" | "published" | "paid";
  centreId: string;
  regionId: string;
};

export type LeaveRequestRecord = {
  id: string;
  staffUserId: string;
  staffName: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: string;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  centreId: string;
  regionId: string;
  requestedAtIso: string;
};

const employeeAttendanceCollectionName = "employeeAttendance";
const employeeWorkUpdatesCollectionName = "employeeWorkUpdates";
const salaryRecordsCollectionName = "salaryRecords";
const employeeLeaveRequestsCollectionName = "employeeLeaveRequests";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeAttachments(value: unknown): AttachmentMeta[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): AttachmentMeta | null => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const url = normalizeString(raw.url || raw.linkUrl || raw.fileUrl);
      if (!url) return null;
      return {
        label: normalizeString(raw.label || raw.name || raw.title) || "Attachment",
        url,
        kind: raw.kind === "file" ? "file" : "link",
      };
    })
    .filter((item): item is AttachmentMeta => item !== null);
}

function normalizeComplaintStatus(value: unknown): StudentComplaintRecord["status"] {
  if (value === "in_progress" || value === "resolved" || value === "rejected") return value;
  if (value === "in_review") return "in_progress";
  return "open";
}

function normalizeComplaintRecord(id: string, data: Record<string, unknown>): StudentComplaintRecord {
  const str = normalizeString;
  return {
    id,
    studentUserId: str(data.studentUserId),
    studentName: str(data.studentName) || "Unknown Student",
    classId: str(data.classId),
    className: str(data.className),
    centreId: str(data.centreId),
    centreName: str(data.centreName),
    regionId: str(data.regionId),
    subject: str(data.subject) || "General",
    description: str(data.description) || str(data.message),
    status: normalizeComplaintStatus(data.status),
    adminReply: str(data.adminReply),
    createdAtIso: str(data.createdAtIso),
    updatedAtIso: str(data.updatedAtIso),
    attachments: normalizeAttachments(data.attachments),
  };
}

function normalizeLearningResourceRecord(id: string, data: Record<string, unknown>): LearningResourceRecord {
  const str = normalizeString;
  const scope = data.audienceScope;
  const status = data.status;
  return {
    id,
    kind: data.kind === "learning_link" ? "learning_link" : "resource",
    title: str(data.title) || "Untitled material",
    description: str(data.description),
    linkUrl: str(data.linkUrl),
    audienceScope: scope === "region" || scope === "centre" || scope === "class" ? scope : "all",
    regionId: str(data.regionId),
    regionName: str(data.regionName),
    centreId: str(data.centreId),
    centreName: str(data.centreName),
    classId: str(data.classId),
    className: str(data.className),
    subjectId: str(data.subjectId),
    subjectName: str(data.subjectName),
    status: status === "approved" || status === "rejected" ? status : "pending",
    createdByUserId: str(data.createdByUserId),
    createdByName: str(data.createdByName) || "CLS Academy",
    createdAtIso: str(data.createdAtIso),
    updatedAtIso: str(data.updatedAtIso),
    attachments: normalizeAttachments(data.attachments),
  };
}

function normalizeDoubtStatus(value: unknown): StudentDoubtRecord["status"] {
  if (value === "replied" || value === "resolved") return value;
  return "open";
}

function normalizeStudentDoubtRecord(id: string, data: Record<string, unknown>): StudentDoubtRecord {
  const str = normalizeString;
  return {
    id,
    studentUserId: str(data.studentUserId),
    studentName: str(data.studentName),
    studentClassId: str(data.studentClassId),
    studentClassName: str(data.studentClassName),
    teacherUserId: str(data.teacherUserId),
    teacherName: str(data.teacherName),
    subjectId: str(data.subjectId),
    subjectName: str(data.subjectName),
    classSubjectId: str(data.classSubjectId),
    questionText: str(data.questionText),
    status: normalizeDoubtStatus(data.status),
    teacherSeen: typeof data.teacherSeen === "boolean" ? data.teacherSeen : false,
    studentSeen: typeof data.studentSeen === "boolean" ? data.studentSeen : true,
    createdAtIso: str(data.createdAtIso),
    updatedAtIso: str(data.updatedAtIso) || str(data.createdAtIso),
    attachmentUrl: str(data.attachmentUrl || data.imageDataUrl),
    attachmentName: str(data.attachmentName || data.imageName),
  };
}

function normalizeStudentDoubtReplyRecord(id: string, data: Record<string, unknown>): StudentDoubtReplyRecord {
  const role = data.authorRole === "teacher" ? "teacher" : "student";
  return {
    id,
    doubtId: normalizeString(data.doubtId),
    authorUserId: normalizeString(data.authorUserId),
    authorName: normalizeString(data.authorName) || (role === "teacher" ? "Teacher" : "Student"),
    authorRole: role,
    replyText: normalizeString(data.replyText),
    createdAtIso: normalizeString(data.createdAtIso),
  };
}

function normalizeStudentLeaveRequestRecord(id: string, data: Record<string, unknown>): StudentLeaveRequestRecord {
  const status =
    data.status === "approved" ? "approved" :
    data.status === "rejected" ? "rejected" :
    "pending";
  return {
    id,
    studentUserId: normalizeString(data.studentUserId),
    studentName: normalizeString(data.studentName) || "Student",
    classId: normalizeString(data.classId),
    className: normalizeString(data.className),
    centreId: normalizeString(data.centreId),
    centreName: normalizeString(data.centreName),
    regionId: normalizeString(data.regionId),
    startDate: normalizeString(data.startDate),
    endDate: normalizeString(data.endDate),
    reason: normalizeString(data.reason),
    status,
    adminReply: normalizeString(data.adminReply),
    requestedAtIso: normalizeString(data.requestedAtIso) || normalizeString(data.createdAtIso),
    updatedAtIso: normalizeString(data.updatedAtIso),
  };
}

function normalizeStaffAttendanceStatus(value: unknown): StaffAttendanceRecord["status"] {
  if (value === "absent" || value === "leave") return value;
  return "present";
}

function normalizeStaffAttendanceRecord(id: string, data: Record<string, unknown>): StaffAttendanceRecord {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    id,
    staffUserId: str(data.staffUserId),
    staffName: str(data.staffName) || "Unknown Staff",
    attendanceDate: str(data.attendanceDate),
    status: normalizeStaffAttendanceStatus(data.status),
    note: str(data.note),
    centreId: str(data.centreId),
    centreName: str(data.centreName),
    regionId: str(data.regionId),
  };
}

function normalizeStaffDiaryRecord(id: string, data: Record<string, unknown>): StaffDiaryRecord {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    id,
    staffUserId: str(data.staffUserId),
    staffName: str(data.staffName) || "Unknown Staff",
    title: str(data.title) || "Work Update",
    summary: str(data.summary),
    submittedForDate: str(data.submittedForDate),
    status: data.status === "reviewed" ? "reviewed" : "submitted",
    centreId: str(data.centreId),
    regionId: str(data.regionId),
    createdAtIso: str(data.createdAtIso),
  };
}

function normalizeSalaryRecord(id: string, data: Record<string, unknown>): SalaryRecord {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const num = (v: unknown) => (typeof v === "number" ? v : 0);
  return {
    id,
    staffUserId: str(data.staffUserId),
    staffName: str(data.staffName) || "Unknown Staff",
    monthKey: str(data.monthKey),
    grossAmount: num(data.grossAmount),
    netAmount: num(data.netAmount),
    status: data.status === "paid" ? "paid" : data.status === "published" ? "published" : "draft",
    centreId: str(data.centreId),
    regionId: str(data.regionId),
  };
}

function normalizeLeaveRequestRecord(id: string, data: Record<string, unknown>): LeaveRequestRecord {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const statusVal = data.status;
  const status: LeaveRequestRecord["status"] =
    statusVal === "approved" ? "approved" :
    statusVal === "rejected" ? "rejected" :
    statusVal === "withdrawn" ? "withdrawn" :
    "pending";
  return {
    id,
    staffUserId: str(data.staffUserId),
    staffName: str(data.staffName) || "Unknown Staff",
    startDate: str(data.startDate),
    endDate: str(data.endDate),
    reason: str(data.reason),
    leaveType: str(data.leaveType),
    status,
    centreId: str(data.centreId),
    regionId: str(data.regionId),
    requestedAtIso: str(data.requestedAtIso) || str(data.createdAtIso),
  };
}

function dedupeById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

function isStudentAudienceMatch(record: StudentAnnouncementRecord, profile: UserProfileRecord) {
  if (record.status !== "approved") {
    return false;
  }

  if (record.audienceScope === "all") {
    return true;
  }

  if (record.audienceScope === "region") {
    return record.regionId === profile.regionId;
  }

  return record.centreId === profile.centreId;
}

async function loadAnnouncementSnapshots(profile: UserProfileRecord) {
  const announcementCollection = collection(firestoreDb, studentAnnouncementsCollectionName);
  const snapshots = await Promise.all([
    getDocs(query(announcementCollection, where("status", "==", "approved"), where("audienceScope", "==", "all"))),
    profile.regionId
      ? getDocs(
          query(
            announcementCollection,
            where("status", "==", "approved"),
            where("audienceScope", "==", "region"),
            where("regionId", "==", profile.regionId),
          ),
        )
      : Promise.resolve(null),
    profile.centreId
      ? getDocs(
          query(
            announcementCollection,
            where("status", "==", "approved"),
            where("audienceScope", "==", "centre"),
            where("centreId", "==", profile.centreId),
          ),
        )
      : Promise.resolve(null),
  ]);

  return snapshots
    .flatMap((snapshot) => snapshot?.docs ?? [])
    .map((item) => normalizeStudentAnnouncementRecord(item.id, item.data()));
}

export async function listAnnouncementsForProfile(profile: UserProfileRecord): Promise<StudentAnnouncementRecord[]> {
  if (isDemoMode()) return getDemoAnnouncements() as unknown as StudentAnnouncementRecord[];
  const records = await loadAnnouncementSnapshots(profile);
  return dedupeById(records)
    .filter((record) => isStudentAudienceMatch(record, profile))
    .sort((left, right) => right.createdAtIso.localeCompare(left.createdAtIso));
}

export async function listStudentResults(profile: UserProfileRecord) {
  if (isDemoMode()) return getDemoStudentResults();
  const snapshot = await getDocs(
    query(collection(firestoreDb, studentResultsCollectionName), where("studentUserId", "==", profile.userId)),
  );

  return snapshot.docs
    .map((item) => normalizeStudentResultRecord(item.id, item.data()))
    .sort((left, right) =>
      (right.assessmentDate || right.publishedAtIso || right.assessmentTitle).localeCompare(
        left.assessmentDate || left.publishedAtIso || left.assessmentTitle,
      ),
    );
}

export async function listStudentAttendance(profile: UserProfileRecord) {
  if (isDemoMode()) return getDemoStudentAttendance();
  const snapshot = await getDocs(
    query(collection(firestoreDb, studentAttendanceCollectionName), where("studentUserId", "==", profile.userId)),
  );

  return snapshot.docs
    .map((item) => normalizeStudentAttendanceRecord(item.id, item.data()))
    .sort((left, right) => right.attendanceDate.localeCompare(left.attendanceDate));
}

export async function listStudentSchedules(profile: UserProfileRecord) {
  if (isDemoMode()) return getDemoStudentSchedules();
  const [timetableSnapshot, testsSnapshot] = await Promise.all([
    getDocs(query(collection(firestoreDb, classTimetablesCollectionName), where("classId", "==", profile.classId))),
    getDocs(query(collection(firestoreDb, testSchedulesCollectionName), where("classId", "==", profile.classId))),
  ]);

  return {
    timetableEntries: timetableSnapshot.docs
      .map((item) => ({
        id: item.id,
        classId: typeof item.data().classId === "string" ? item.data().classId : "",
        className: typeof item.data().className === "string" ? item.data().className : "",
        centreId: typeof item.data().centreId === "string" ? item.data().centreId : "",
        centreName: typeof item.data().centreName === "string" ? item.data().centreName : "",
        regionId: typeof item.data().regionId === "string" ? item.data().regionId : "",
        regionName: typeof item.data().regionName === "string" ? item.data().regionName : "",
        dayKey:
          item.data().dayKey === "tuesday" ||
          item.data().dayKey === "wednesday" ||
          item.data().dayKey === "thursday" ||
          item.data().dayKey === "friday" ||
          item.data().dayKey === "saturday"
            ? item.data().dayKey
            : "monday",
        slotKey: typeof item.data().slotKey === "string" ? item.data().slotKey : "",
        slotLabel: typeof item.data().slotLabel === "string" ? item.data().slotLabel : "",
        startTime: typeof item.data().startTime === "string" ? item.data().startTime : "",
        endTime: typeof item.data().endTime === "string" ? item.data().endTime : "",
        subjectId: typeof item.data().subjectId === "string" ? item.data().subjectId : "",
        subjectName: typeof item.data().subjectName === "string" ? item.data().subjectName : "",
        teacherUserId: typeof item.data().teacherUserId === "string" ? item.data().teacherUserId : "",
        teacherName: typeof item.data().teacherName === "string" ? item.data().teacherName : "",
        notes: typeof item.data().notes === "string" ? item.data().notes : "",
        updatedByUserId: typeof item.data().updatedByUserId === "string" ? item.data().updatedByUserId : "",
        updatedByName: typeof item.data().updatedByName === "string" ? item.data().updatedByName : "",
      }))
      .sort((left, right) => `${left.dayKey}-${left.startTime}`.localeCompare(`${right.dayKey}-${right.startTime}`)),
    tests: testsSnapshot.docs
      .map((item) => normalizeTestScheduleRecord(item.id, item.data()))
      .sort((left, right) => `${right.scheduleDate}-${right.startTime}`.localeCompare(`${left.scheduleDate}-${left.startTime}`)),
  };
}

export async function listLearningResourcesForProfile(profile: UserProfileRecord) {
  if (isDemoMode()) return getDemoMaterials();
  const resourcesCollection = collection(firestoreDb, learningResourcesCollectionName);
  const classIds = profile.classId
    ? [profile.classId]
    : Array.from(new Set(profile.teacherClassIds ?? [])).filter(Boolean);
  const classQueries = classIds.map((cid) =>
    getDocs(
      query(
        resourcesCollection,
        where("status", "==", "approved"),
        where("audienceScope", "==", "class"),
        where("classId", "==", cid),
      ),
    ),
  );
  const snapshots = await Promise.all([
    getDocs(query(resourcesCollection, where("status", "==", "approved"), where("audienceScope", "==", "all"))),
    profile.regionId
      ? getDocs(
          query(
            resourcesCollection,
            where("status", "==", "approved"),
            where("audienceScope", "==", "region"),
            where("regionId", "==", profile.regionId),
          ),
        )
      : Promise.resolve(null),
    profile.centreId
      ? getDocs(
          query(
            resourcesCollection,
            where("status", "==", "approved"),
            where("audienceScope", "==", "centre"),
            where("centreId", "==", profile.centreId),
          ),
        )
      : Promise.resolve(null),
    ...classQueries,
  ]);

  return dedupeById(
    snapshots
      .flatMap((snapshot) => snapshot?.docs ?? [])
      .map((item) => normalizeLearningResourceRecord(item.id, item.data() as Record<string, unknown>)),
  ).sort((left, right) => (right.updatedAtIso || right.createdAtIso).localeCompare(left.updatedAtIso || left.createdAtIso));
}

export async function listStudentComplaints(profile: UserProfileRecord): Promise<StudentComplaintRecord[]> {
  if (isDemoMode()) { await hydrateDemoState(); return getDemoComplaints(); }
  const snapshot = await getDocs(
    query(collection(firestoreDb, studentComplaintsCollectionName), where("studentUserId", "==", profile.userId)),
  );

  return snapshot.docs
    .map((item) => normalizeComplaintRecord(item.id, item.data() as Record<string, unknown>))
    .sort((left, right) => (right.updatedAtIso || right.createdAtIso).localeCompare(left.updatedAtIso || left.createdAtIso));
}

export async function createStudentComplaint({
  profile,
  subject,
  description,
}: {
  profile: UserProfileRecord;
  subject: string;
  description: string;
}) {
  const nowIso = new Date().toISOString();
  if (isDemoMode()) {
    addDemoPendingComplaint({
      id: `demo-c-${Date.now()}`,
      studentUserId: profile.userId,
      studentName: profile.name || profile.fullName || "Student",
      classId: profile.classId,
      className: profile.className,
      centreId: profile.centreId,
      centreName: profile.centreName,
      regionId: profile.regionId,
      subject: subject.trim(),
      description: description.trim(),
      status: "open",
      adminReply: "",
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      attachments: [],
    });
    return;
  }
  await addDoc(collection(firestoreDb, studentComplaintsCollectionName), {
    studentUserId: profile.userId,
    studentName: profile.name || profile.fullName || "Student",
    studentEmail: profile.email,
    regionId: profile.regionId,
    regionName: profile.regionName,
    centreId: profile.centreId,
    centreName: profile.centreName,
    classId: profile.classId,
    className: profile.className,
    category: "general",
    subject: subject.trim(),
    message: description.trim(),
    description: description.trim(),
    status: "open",
    adminReply: "",
    reviewNote: "",
    adminSeen: false,
    studentSeen: true,
    attachments: [],
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    resolvedAtIso: "",
  });
}

export async function listClassSubjectsForStudent(profile: UserProfileRecord): Promise<ClassSubjectRecord[]> {
  if (isDemoMode()) return getDemoClassSubjects();
  if (!profile.classId) return [];
  const snapshot = await getDocs(
    query(collection(firestoreDb, classSubjectsCollectionName), where("classId", "==", profile.classId)),
  );

  return snapshot.docs
    .map((item) => normalizeClassSubjectRecord(item.id, item.data()))
    .filter((item) => item.active)
    .sort((left, right) => left.subjectName.localeCompare(right.subjectName));
}

export async function listStudentDoubts(profile: UserProfileRecord): Promise<StudentDoubtRecord[]> {
  if (isDemoMode()) { await hydrateDemoState(); return getDemoDoubts(); }
  const snapshot = await getDocs(
    query(collection(firestoreDb, studentDoubtsCollectionName), where("studentUserId", "==", profile.userId)),
  );

  return snapshot.docs
    .map((item) => normalizeStudentDoubtRecord(item.id, item.data() as Record<string, unknown>))
    .sort((left, right) => (right.updatedAtIso || right.createdAtIso).localeCompare(left.updatedAtIso || left.createdAtIso));
}

export async function createStudentDoubt({
  profile,
  mapping,
  questionText,
}: {
  profile: UserProfileRecord;
  mapping: ClassSubjectRecord;
  questionText: string;
}) {
  const nowIso = new Date().toISOString();
  if (isDemoMode()) {
    addDemoPendingDoubt({
      id: `demo-d-${Date.now()}`,
      studentUserId: profile.userId,
      studentName: profile.name || profile.fullName || "Student",
      studentClassId: profile.classId,
      studentClassName: profile.className,
      teacherUserId: mapping.teacherUserId,
      teacherName: mapping.teacherName,
      subjectId: mapping.subjectId,
      subjectName: mapping.subjectName,
      classSubjectId: mapping.id,
      questionText: questionText.trim(),
      attachmentUrl: "",
      attachmentName: "",
      status: "open",
      teacherSeen: false,
      studentSeen: true,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
    });
    return;
  }
  await addDoc(collection(firestoreDb, studentDoubtsCollectionName), {
    studentUserId: profile.userId,
    studentName: profile.name || profile.fullName || "Student",
    studentClassId: profile.classId,
    studentClassName: profile.className,
    teacherUserId: mapping.teacherUserId,
    teacherName: mapping.teacherName,
    subjectId: mapping.subjectId,
    subjectName: mapping.subjectName,
    classSubjectId: mapping.id,
    questionText: questionText.trim(),
    imageDataUrl: "",
    imageName: "",
    attachmentUrl: "",
    attachmentName: "",
    status: "open",
    teacherSeen: false,
    studentSeen: true,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  });
}

export async function listStudentDoubtReplies(doubtId: string): Promise<StudentDoubtReplyRecord[]> {
  if (!doubtId) return [];
  if (isDemoMode()) return getDemoDoubtReplies(doubtId);
  const snapshot = await getDocs(collection(firestoreDb, studentDoubtsCollectionName, doubtId, "replies"));
  return snapshot.docs
    .map((item) => normalizeStudentDoubtReplyRecord(item.id, item.data() as Record<string, unknown>))
    .sort((left, right) => left.createdAtIso.localeCompare(right.createdAtIso));
}

export async function createStudentDoubtReply({
  profile,
  doubtId,
  replyText,
}: {
  profile: UserProfileRecord;
  doubtId: string;
  replyText: string;
}) {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await addDoc(collection(firestoreDb, studentDoubtsCollectionName, doubtId, "replies"), {
    doubtId,
    authorUserId: profile.userId,
    authorName: profile.name || profile.fullName || "Student",
    authorRole: "student",
    replyText: replyText.trim(),
    createdAtIso: nowIso,
  });
  await updateDoc(doc(firestoreDb, studentDoubtsCollectionName, doubtId), {
    status: "open",
    teacherSeen: false,
    studentSeen: true,
    updatedAtIso: nowIso,
  });
}

export async function listStudentLeaveRequests(profile: UserProfileRecord): Promise<StudentLeaveRequestRecord[]> {
  if (isDemoMode()) { await hydrateDemoState(); return getDemoLeaveRequests(); }
  const snapshot = await getDocs(
    query(collection(firestoreDb, studentLeaveRequestsCollectionName), where("studentUserId", "==", profile.userId)),
  );

  return snapshot.docs
    .map((item) => normalizeStudentLeaveRequestRecord(item.id, item.data() as Record<string, unknown>))
    .sort((left, right) => (right.updatedAtIso || right.requestedAtIso).localeCompare(left.updatedAtIso || left.requestedAtIso));
}

export async function createStudentLeaveRequest({
  profile,
  startDate,
  endDate,
  reason,
}: {
  profile: UserProfileRecord;
  startDate: string;
  endDate: string;
  reason: string;
}) {
  const nowIso = new Date().toISOString();
  if (isDemoMode()) {
    addDemoPendingLeave({
      id: `demo-lr-${Date.now()}`,
      studentUserId: profile.userId,
      studentName: profile.name || profile.fullName || "Student",
      classId: profile.classId,
      className: profile.className,
      centreId: profile.centreId,
      centreName: profile.centreName,
      regionId: profile.regionId,
      startDate,
      endDate,
      reason: reason.trim(),
      status: "pending",
      adminReply: "",
      requestedAtIso: nowIso,
      updatedAtIso: nowIso,
    });
    return;
  }
  const requestId = `${profile.userId}__${startDate}__${endDate}`;
  await setDoc(doc(firestoreDb, studentLeaveRequestsCollectionName, requestId), {
    studentUserId: profile.userId,
    studentName: profile.name || profile.fullName || "Student",
    classId: profile.classId,
    className: profile.className,
    centreId: profile.centreId,
    centreName: profile.centreName,
    regionId: profile.regionId,
    startDate,
    endDate,
    reason: reason.trim(),
    status: "pending",
    adminReply: "",
    requestedAtIso: nowIso,
    updatedAtIso: nowIso,
  });
}

function datesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function listStudentLeaveRequestsForAdmin(admin: AdminRecord): Promise<StudentLeaveRequestRecord[]> {
  if (isDemoMode()) { await hydrateDemoState(); return getDemoLeaveRequests(); }
  const col = collection(firestoreDb, studentLeaveRequestsCollectionName);
  const snapshot =
    admin.role === "admin"
      ? await getDocs(query(col, where("status", "==", "pending")))
      : admin.role === "centre_incharge"
        ? await getDocs(query(col, where("centreId", "==", admin.centreId), where("status", "==", "pending")))
        : await getDocs(query(col, where("regionId", "==", admin.regionId), where("status", "==", "pending")));
  return snapshot.docs
    .map((item) => normalizeStudentLeaveRequestRecord(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => b.requestedAtIso.localeCompare(a.requestedAtIso));
}

export async function listStudentLeaveRequestsForTeacher(profile: UserProfileRecord): Promise<StudentLeaveRequestRecord[]> {
  if (isDemoMode()) { await hydrateDemoState(); return getDemoLeaveRequests().filter((r) => r.status === "pending" && r.studentUserId === "demo-student-001"); }
  const classIds = Array.from(new Set(profile.teacherClassIds ?? [])).filter(Boolean);
  if (classIds.length === 0) return [];
  const col = collection(firestoreDb, studentLeaveRequestsCollectionName);
  const results = await Promise.all(
    classIds.map((cid) => getDocs(query(col, where("classId", "==", cid), where("status", "==", "pending")))),
  );
  return results
    .flatMap((snap) => snap.docs.map((item) => normalizeStudentLeaveRequestRecord(item.id, item.data() as Record<string, unknown>)))
    .sort((a, b) => b.requestedAtIso.localeCompare(a.requestedAtIso));
}

export async function approveStudentLeaveRequest(
  req: StudentLeaveRequestRecord,
  reviewer: { name: string; userId: string },
): Promise<void> {
  if (isDemoMode()) { setDemoStudentLeaveStatus(req.id, "approved"); return; }
  const nowIso = new Date().toISOString();
  const dates = datesInRange(req.startDate, req.endDate);
  await Promise.all(
    dates.map((date) =>
      setDoc(doc(firestoreDb, studentAttendanceCollectionName, buildStudentAttendanceId(req.studentUserId, date)), {
        studentUserId: req.studentUserId,
        studentName: req.studentName,
        classId: req.classId,
        className: req.className,
        centreId: req.centreId,
        centreName: req.centreName,
        teacherUserId: reviewer.userId,
        teacherName: reviewer.name,
        attendanceDate: date,
        status: "leave",
      }),
    ),
  );
  await updateDoc(doc(firestoreDb, studentLeaveRequestsCollectionName, req.id), {
    status: "approved",
    reviewedAtIso: nowIso,
    updatedAtIso: nowIso,
  });
}

export async function rejectStudentLeaveRequest(requestId: string): Promise<void> {
  if (isDemoMode()) { setDemoStudentLeaveStatus(requestId, "rejected"); return; }
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, studentLeaveRequestsCollectionName, requestId), {
    status: "rejected",
    reviewedAtIso: nowIso,
    updatedAtIso: nowIso,
  });
}

export async function updateStudentProfileContact({
  profile,
  phone,
  email,
  address,
}: {
  profile: UserProfileRecord;
  phone: string;
  email: string;
  address: string;
}) {
  if (isDemoMode()) return;
  await updateDoc(doc(firestoreDb, userProfilesCollectionName, profile.userId), {
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    updatedAtIso: new Date().toISOString(),
  });
}

export async function markStudentNotificationsSeen(profile: UserProfileRecord) {
  if (isDemoMode()) return;
  await setDoc(doc(firestoreDb, dashboardNotificationStatesCollectionName, `${profile.userId}__student`), {
    ownerUserId: profile.userId,
    scopeKey: "student",
    clearedAtIso: new Date().toISOString(),
  });
}

export async function getStudentNotifications(profile: UserProfileRecord): Promise<StudentNotificationItem[]> {
  if (isDemoMode()) return getDemoNotifications();
  const [circulars, complaints, doubts, leaves, results, materials] = await Promise.all([
    listAnnouncementsForProfile(profile),
    listStudentComplaints(profile),
    listStudentDoubts(profile),
    listStudentLeaveRequests(profile),
    listStudentResults(profile),
    listLearningResourcesForProfile(profile),
  ]);

  return [
    ...circulars.slice(0, 8).map((item): StudentNotificationItem => ({
      id: `circular-${item.id}`,
      type: "circular",
      title: item.title,
      message: item.message || "New circular posted.",
      createdAtIso: item.updatedAtIso || item.createdAtIso,
      href: `/(student)/circular-detail?id=${encodeURIComponent(item.id)}`,
    })),
    ...complaints.filter((item) => item.adminReply || item.status !== "open").slice(0, 8).map((item): StudentNotificationItem => ({
      id: `complaint-${item.id}`,
      type: "complaint",
      title: `Complaint ${item.status === "resolved" ? "resolved" : "updated"}`,
      message: item.adminReply || item.subject,
      createdAtIso: item.updatedAtIso || item.createdAtIso,
      href: `/(student)/complaint-detail?id=${encodeURIComponent(item.id)}`,
    })),
    ...doubts.filter((item) => item.status !== "open" || !item.studentSeen).slice(0, 8).map((item): StudentNotificationItem => ({
      id: `doubt-${item.id}`,
      type: "doubt",
      title: item.status === "open" ? "Doubt pending" : "Doubt answered",
      message: `${item.subjectName} · ${item.teacherName || "Teacher"}`,
      createdAtIso: item.updatedAtIso || item.createdAtIso,
      href: `/(student)/doubt-detail?id=${encodeURIComponent(item.id)}`,
    })),
    ...leaves.filter((item) => item.status !== "pending").slice(0, 8).map((item): StudentNotificationItem => ({
      id: `leave-${item.id}`,
      type: "leave",
      title: `Leave ${item.status}`,
      message: `${item.startDate} to ${item.endDate}`,
      createdAtIso: item.updatedAtIso || item.requestedAtIso,
      href: "/(student)/attendance",
    })),
    ...results.slice(0, 5).map((item): StudentNotificationItem => ({
      id: `result-${item.id}`,
      type: "result",
      title: "Result published",
      message: `${item.subjectName} · ${item.assessmentTitle}`,
      createdAtIso: item.publishedAtIso || item.assessmentDate,
      href: `/(student)/result-detail?id=${encodeURIComponent(item.id)}`,
    })),
    ...materials.slice(0, 5).map((item): StudentNotificationItem => ({
      id: `material-${item.id}`,
      type: "material",
      title: "New material",
      message: item.title,
      createdAtIso: item.updatedAtIso || item.createdAtIso,
      href: `/(student)/material-detail?id=${encodeURIComponent(item.id)}`,
    })),
  ].sort((left, right) => right.createdAtIso.localeCompare(left.createdAtIso));
}

export async function listTeacherStudents(profile: UserProfileRecord) {
  if (isDemoMode()) return getDemoHTStudents();
  const classIds = Array.from(new Set(profile.teacherClassIds)).filter(Boolean);
  const snapshots = await Promise.all(
    classIds.map((classId) => getDocs(query(collection(firestoreDb, userProfilesCollectionName), where("classId", "==", classId)))),
  );

  const records = snapshots
    .flatMap((snapshot) => snapshot.docs)
    .map((item) => normalizeUserProfileRecord(item.id, item.data()))
    .filter((item) => item.role === "student");

  return Array.from(new Map(records.map((item) => [item.userId, item])).values()).sort((left, right) => left.name.localeCompare(right.name));
}

export async function listTeacherMappings(profile: UserProfileRecord) {
  if (isDemoMode()) return getDemoClassSubjects();
  const snapshot = await getDocs(
    query(collection(firestoreDb, classSubjectsCollectionName), where("teacherUserId", "==", profile.userId)),
  );

  return snapshot.docs
    .map((item) => normalizeClassSubjectRecord(item.id, item.data()))
    .sort((left, right) => `${left.className} ${left.subjectName}`.localeCompare(`${right.className} ${right.subjectName}`));
}

export async function listTeacherResults(profile: UserProfileRecord) {
  if (isDemoMode()) return getDemoHTResults();
  const snapshot = await getDocs(
    query(collection(firestoreDb, studentResultsCollectionName), where("teacherUserId", "==", profile.userId)),
  );

  return snapshot.docs
    .map((item) => normalizeStudentResultRecord(item.id, item.data()))
    .sort((left, right) => `${right.className} ${right.studentName}`.localeCompare(`${left.className} ${left.studentName}`));
}

export async function listTeacherAttendanceForClass(classId: string, date = getTodayDateValue()) {
  if (isDemoMode()) return [];
  const snapshot = await getDocs(
    query(
      collection(firestoreDb, studentAttendanceCollectionName),
      where("classId", "==", classId),
      where("attendanceDate", "==", date),
    ),
  );

  return snapshot.docs.map((item) => normalizeStudentAttendanceRecord(item.id, item.data()));
}

export async function saveTeacherAttendance({
  teacherProfile,
  studentProfile,
  status,
  attendanceDate,
}: {
  teacherProfile: UserProfileRecord;
  studentProfile: UserProfileRecord;
  status: AttendanceStatus;
  attendanceDate: string;
}) {
  if (isDemoMode()) return;
  const recordId = buildStudentAttendanceId(studentProfile.userId, attendanceDate);

  await setDoc(doc(firestoreDb, studentAttendanceCollectionName, recordId), {
    studentUserId: studentProfile.userId,
    teacherUserId: teacherProfile.userId,
    teacherName: teacherProfile.name,
    studentName: studentProfile.name,
    studentBranch: studentProfile.centreName,
    classId: studentProfile.classId,
    className: studentProfile.className,
    attendanceDate,
    status,
  });
}

function calculateGrade(score: number, maxScore: number) {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

export async function saveTeacherResult({
  teacherProfile,
  studentProfile,
  mapping,
  assessmentCategory,
  assessmentTitle,
  score,
  maxScore,
  remarks,
}: {
  teacherProfile: UserProfileRecord;
  studentProfile: UserProfileRecord;
  mapping: ClassSubjectRecord;
  assessmentCategory: ResultAssessmentCategory;
  assessmentTitle: string;
  score: number;
  maxScore: number;
  remarks: string;
}) {
  if (isDemoMode()) return;
  const recordId = buildStudentResultId(studentProfile.userId, mapping.id, assessmentCategory, assessmentTitle);

  await setDoc(doc(firestoreDb, studentResultsCollectionName, recordId), {
    studentUserId: studentProfile.userId,
    teacherUserId: teacherProfile.userId,
    teacherName: teacherProfile.name,
    studentName: studentProfile.name,
    classId: studentProfile.classId,
    className: studentProfile.className,
    subjectId: mapping.subjectId,
    subjectName: mapping.subjectName,
    subject: mapping.subjectName,
    classSubjectId: mapping.id,
    assessmentCategory,
    assessmentTitle,
    score,
    maxScore,
    grade: calculateGrade(score, maxScore),
    remarks: remarks.trim() || "No teacher feedback yet.",
  });
}

async function listScopedClasses(admin: AdminRecord) {
  if (isDemoMode()) return [];
  if (admin.role === "admin") {
    const snapshot = await getDocs(collection(firestoreDb, classesCollectionName));
    return snapshot.docs.map((item) => normalizeClassRecord(item.id, item.data()));
  }

  if (admin.role === "centre_incharge") {
    const snapshot = await getDocs(query(collection(firestoreDb, classesCollectionName), where("centreId", "==", admin.centreId)));
    return snapshot.docs.map((item) => normalizeClassRecord(item.id, item.data()));
  }

  const snapshot = await getDocs(query(collection(firestoreDb, classesCollectionName), where("regionId", "==", admin.regionId)));
  return snapshot.docs.map((item) => normalizeClassRecord(item.id, item.data()));
}

export async function listAdminAnnouncements(admin: AdminRecord): Promise<StudentAnnouncementRecord[]> {
  if (isDemoMode()) return getDemoAnnouncements() as unknown as StudentAnnouncementRecord[];
  const announcementCollection = collection(firestoreDb, studentAnnouncementsCollectionName);

  const snapshot =
    admin.role === "admin"
      ? await getDocs(announcementCollection)
      : admin.role === "centre_incharge"
        ? await getDocs(query(announcementCollection, where("centreId", "==", admin.centreId)))
        : await getDocs(query(announcementCollection, where("regionId", "==", admin.regionId)));

  return snapshot.docs
    .map((item) => normalizeStudentAnnouncementRecord(item.id, item.data()))
    .sort((left, right) => right.updatedAtIso.localeCompare(left.updatedAtIso));
}

export async function createAdminAnnouncement({
  admin,
  actorUserId,
  title,
  message,
  tag = "general",
}: {
  admin: AdminRecord;
  actorUserId: string;
  title: string;
  message: string;
  tag?: string;
}) {
  if (isDemoMode()) return;
  const nextDoc = doc(collection(firestoreDb, studentAnnouncementsCollectionName));
  const nowIso = new Date().toISOString();
  const status = admin.role === "admin" ? "approved" : "pending";

  await setDoc(nextDoc, {
    kind: "announcement",
    tag: tag.toLowerCase(),
    title: title.trim(),
    message: message.trim(),
    audienceScope: admin.role === "centre_incharge" ? "centre" : admin.role === "regional_incharge" ? "region" : "all",
    regionId: admin.regionId,
    regionName: admin.regionName,
    centreId: admin.centreId,
    centreName: admin.centreName,
    status,
    createdByUserId: actorUserId,
    createdByName: admin.email || "Management",
    createdByRole: admin.role,
    approvedByUserId: admin.role === "admin" ? actorUserId : "",
    approvedByName: admin.role === "admin" ? admin.email || "Management" : "",
    approvedAtIso: admin.role === "admin" ? nowIso : "",
    reviewNote: "",
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  });
}

export async function approveAnnouncement({
  announcementId,
  admin,
}: {
  announcementId: string;
  admin: AdminRecord;
}) {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, studentAnnouncementsCollectionName, announcementId), {
    status: "approved",
    approvedByUserId: admin.email,
    approvedByName: admin.email,
    approvedAtIso: nowIso,
    updatedAtIso: nowIso,
  });
}

export async function listAdminAttendanceOverview(admin: AdminRecord) {
  const classes = await listScopedClasses(admin);
  const snapshots = await Promise.all(
    classes.map((classRecord) =>
      getDocs(
        query(
          collection(firestoreDb, studentAttendanceCollectionName),
          where("classId", "==", classRecord.id),
          where("attendanceDate", "==", getTodayDateValue()),
        ),
      ),
    ),
  );

  return snapshots
    .flatMap((snapshot) => snapshot.docs)
    .map((item) => normalizeStudentAttendanceRecord(item.id, item.data()))
    .sort((left, right) => left.className.localeCompare(right.className) || left.studentName.localeCompare(right.studentName));
}

export async function listVisibleProfilesForAdmin(admin: AdminRecord) {
  if (isDemoMode()) return getDemoHTStudents();
  const snapshot =
    admin.role === "admin"
      ? await getDocs(collection(firestoreDb, userProfilesCollectionName))
      : admin.role === "centre_incharge"
        ? await getDocs(query(collection(firestoreDb, userProfilesCollectionName), where("centreId", "==", admin.centreId)))
        : await getDocs(query(collection(firestoreDb, userProfilesCollectionName), where("regionId", "==", admin.regionId)));

  return snapshot.docs
    .map((item) => normalizeUserProfileRecord(item.id, item.data()))
    .filter((item) => item.role === "student" || item.role === "teacher" || item.role === "employee")
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function getTeacherAttendanceSummary(classId: string) {
  const records = await listTeacherAttendanceForClass(classId);

  return {
    date: formatDateTimeLabel(`${getTodayDateValue()}T00:00:00`),
    records,
  };
}

export async function listAdminComplaints(admin: AdminRecord): Promise<StudentComplaintRecord[]> {
  if (isDemoMode()) { await hydrateDemoState(); return getDemoComplaints(); }
  const complaintsCol = collection(firestoreDb, studentComplaintsCollectionName);
  const snapshot =
    admin.role === "admin"
      ? await getDocs(complaintsCol)
      : admin.role === "centre_incharge"
        ? await getDocs(query(complaintsCol, where("centreId", "==", admin.centreId)))
        : await getDocs(query(complaintsCol, where("regionId", "==", admin.regionId)));

  return snapshot.docs
    .map((item) => normalizeComplaintRecord(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
}

export async function listAdminClasses(admin: AdminRecord) {
  return listScopedClasses(admin);
}

export async function listStudentAttendanceById(userId: string): Promise<StudentAttendanceRecord[]> {
  if (isDemoMode()) return getDemoStudentAttendanceById(userId);
  const snapshot = await getDocs(
    query(collection(firestoreDb, studentAttendanceCollectionName), where("studentUserId", "==", userId)),
  );
  return snapshot.docs
    .map((item) => normalizeStudentAttendanceRecord(item.id, item.data()))
    .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
}

export async function listStudentResultsById(userId: string): Promise<StudentResultRecord[]> {
  if (isDemoMode()) return getDemoStudentResultsById(userId);
  const snapshot = await getDocs(
    query(collection(firestoreDb, studentResultsCollectionName), where("studentUserId", "==", userId)),
  );
  return snapshot.docs
    .map((item) => normalizeStudentResultRecord(item.id, item.data()))
    .sort((a, b) => b.assessmentTitle.localeCompare(a.assessmentTitle));
}

export async function resolveComplaint(complaintId: string, adminReply: string): Promise<void> {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, studentComplaintsCollectionName, complaintId), {
    status: "resolved",
    adminReply: adminReply.trim(),
    updatedAtIso: nowIso,
  });
}

export async function markComplaintInReview(complaintId: string): Promise<void> {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, studentComplaintsCollectionName, complaintId), {
    status: "in_progress",
    updatedAtIso: nowIso,
  });
}

export async function rejectComplaint(complaintId: string, adminReply: string): Promise<void> {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, studentComplaintsCollectionName, complaintId), {
    status: "rejected",
    adminReply: adminReply.trim(),
    updatedAtIso: nowIso,
  });
}

export async function listStaffAttendanceForAdmin(admin: AdminRecord): Promise<StaffAttendanceRecord[]> {
  if (isDemoMode()) return [];
  const col = collection(firestoreDb, employeeAttendanceCollectionName);
  const snapshot =
    admin.role === "admin"
      ? await getDocs(col)
      : admin.role === "centre_incharge"
        ? await getDocs(query(col, where("centreId", "==", admin.centreId)))
        : await getDocs(query(col, where("regionId", "==", admin.regionId)));
  return snapshot.docs
    .map((item) => normalizeStaffAttendanceRecord(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate) || a.staffName.localeCompare(b.staffName));
}

export async function listStaffAttendanceForUser(userId: string): Promise<StaffAttendanceRecord[]> {
  if (isDemoMode()) return [];
  const snapshot = await getDocs(
    query(collection(firestoreDb, employeeAttendanceCollectionName), where("staffUserId", "==", userId)),
  );
  return snapshot.docs
    .map((item) => normalizeStaffAttendanceRecord(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate));
}

export async function listStaffDiaryForUser(userId: string): Promise<StaffDiaryRecord[]> {
  if (isDemoMode()) return [];
  const snapshot = await getDocs(
    query(collection(firestoreDb, employeeWorkUpdatesCollectionName), where("staffUserId", "==", userId)),
  );
  return snapshot.docs
    .map((item) => normalizeStaffDiaryRecord(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => b.submittedForDate.localeCompare(a.submittedForDate));
}

export async function listStaffDiaryForAdmin(admin: AdminRecord): Promise<StaffDiaryRecord[]> {
  if (isDemoMode()) return [];
  const col = collection(firestoreDb, employeeWorkUpdatesCollectionName);
  const snapshot =
    admin.role === "admin"
      ? await getDocs(col)
      : admin.role === "centre_incharge"
        ? await getDocs(query(col, where("centreId", "==", admin.centreId)))
        : await getDocs(query(col, where("regionId", "==", admin.regionId)));
  return snapshot.docs
    .map((item) => normalizeStaffDiaryRecord(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => b.submittedForDate.localeCompare(a.submittedForDate));
}

export async function listSalaryRecordsForUser(userId: string): Promise<SalaryRecord[]> {
  if (isDemoMode()) return [];
  const snapshot = await getDocs(
    query(collection(firestoreDb, salaryRecordsCollectionName), where("staffUserId", "==", userId)),
  );
  return snapshot.docs
    .map((item) => normalizeSalaryRecord(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

export async function listPendingLeaveRequests(admin: AdminRecord): Promise<LeaveRequestRecord[]> {
  if (isDemoMode()) return getDemoAdminLeaveRequests();
  const col = collection(firestoreDb, employeeLeaveRequestsCollectionName);
  const snapshot =
    admin.role === "admin"
      ? await getDocs(query(col, where("status", "==", "pending")))
      : admin.role === "centre_incharge"
        ? await getDocs(query(col, where("centreId", "==", admin.centreId), where("status", "==", "pending")))
        : await getDocs(query(col, where("regionId", "==", admin.regionId), where("status", "==", "pending")));
  return snapshot.docs
    .map((item) => normalizeLeaveRequestRecord(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => b.requestedAtIso.localeCompare(a.requestedAtIso));
}

export async function approveLeaveRequest(requestId: string): Promise<void> {
  if (isDemoMode()) { setDemoStaffLeaveStatus(requestId, "approved"); return; }
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, employeeLeaveRequestsCollectionName, requestId), {
    status: "approved",
    reviewedAtIso: nowIso,
    updatedAtIso: nowIso,
  });
}

export async function rejectLeaveRequest(requestId: string): Promise<void> {
  if (isDemoMode()) { setDemoStaffLeaveStatus(requestId, "rejected"); return; }
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, employeeLeaveRequestsCollectionName, requestId), {
    status: "rejected",
    reviewedAtIso: nowIso,
    updatedAtIso: nowIso,
  });
}

export async function listAdminSchedule(admin: AdminRecord): Promise<{ timetableEntries: ClassTimetableRecord[]; tests: TestScheduleRecord[] }> {
  const classes = await listScopedClasses(admin);

  if (classes.length === 0) {
    return { timetableEntries: [], tests: [] };
  }

  const classIds = classes.map((c) => c.id);
  const chunks: string[][] = [];
  for (let i = 0; i < classIds.length; i += 30) {
    chunks.push(classIds.slice(i, i + 30));
  }

  const [timetableSnapshots, testSnapshots] = await Promise.all([
    Promise.all(chunks.map((chunk) => getDocs(query(collection(firestoreDb, classTimetablesCollectionName), where("classId", "in", chunk))))),
    Promise.all(chunks.map((chunk) => getDocs(query(collection(firestoreDb, testSchedulesCollectionName), where("classId", "in", chunk))))),
  ]);

  const timetableEntries = timetableSnapshots
    .flatMap((s) => s.docs)
    .map((item) => normalizeClassTimetableRecord(item.id, item.data()))
    .sort((a, b) => `${a.dayKey}-${a.startTime}`.localeCompare(`${b.dayKey}-${b.startTime}`));

  const tests = testSnapshots
    .flatMap((s) => s.docs)
    .map((item) => normalizeTestScheduleRecord(item.id, item.data()))
    .sort((a, b) => `${b.scheduleDate}-${b.startTime}`.localeCompare(`${a.scheduleDate}-${a.startTime}`));

  return { timetableEntries, tests };
}

export type MobileNotificationItem = {
  id: string;
  type: "announcement" | "complaint" | "leave_request" | "diary";
  title: string;
  description: string;
  timestamp: number;
  dateLabel: string;
  urgency: "high" | "normal";
};

export async function listAdminNotifications(admin: AdminRecord): Promise<MobileNotificationItem[]> {
  const [announcements, complaints, leaveRequests, diaryEntries, studentLeaves] = await Promise.all([
    listAdminAnnouncements(admin),
    listAdminComplaints(admin),
    listPendingLeaveRequests(admin),
    listStaffDiaryForAdmin(admin),
    listStudentLeaveRequestsForAdmin(admin),
  ]);

  const items: MobileNotificationItem[] = [];

  for (const a of announcements.filter((a) => a.status === "pending")) {
    items.push({
      id: `announcement-${a.id}`,
      type: "announcement",
      title: "Announcement Awaiting Approval",
      description: `"${a.title}" — submitted by ${a.createdByName || "Staff"}`,
      timestamp: a.createdAtIso ? new Date(a.createdAtIso).getTime() : 0,
      dateLabel: formatDateTimeLabel(a.createdAtIso),
      urgency: "normal",
    });
  }

  for (const c of complaints.filter((c) => c.status === "open" || c.status === "in_progress")) {
    items.push({
      id: `complaint-${c.id}`,
      type: "complaint",
      title: c.status === "open" ? "New Complaint" : "Complaint In Review",
      description: `${c.subject} — ${c.studentName}${c.className ? ` (${c.className})` : ""}`,
      timestamp: c.updatedAtIso ? new Date(c.updatedAtIso).getTime() : 0,
      dateLabel: formatDateTimeLabel(c.updatedAtIso),
      urgency: c.status === "open" ? "high" : "normal",
    });
  }

  for (const lr of leaveRequests) {
    items.push({
      id: `leave-${lr.id}`,
      type: "leave_request",
      title: "Leave Request Pending",
      description: `${lr.staffName}: ${lr.startDate}${lr.endDate !== lr.startDate ? ` – ${lr.endDate}` : ""}`,
      timestamp: lr.requestedAtIso ? new Date(lr.requestedAtIso).getTime() : 0,
      dateLabel: formatDateTimeLabel(lr.requestedAtIso),
      urgency: "normal",
    });
  }

  for (const sl of studentLeaves.filter((sl) => sl.status === "pending")) {
    items.push({
      id: `student-leave-${sl.id}`,
      type: "leave_request",
      title: "Student Leave Pending",
      description: `${sl.studentName} (${sl.className}): ${sl.startDate}${sl.endDate !== sl.startDate ? ` – ${sl.endDate}` : ""}`,
      timestamp: sl.requestedAtIso ? new Date(sl.requestedAtIso).getTime() : 0,
      dateLabel: formatDateTimeLabel(sl.requestedAtIso),
      urgency: "normal",
    });
  }

  for (const d of diaryEntries.filter((d) => d.status === "submitted")) {
    items.push({
      id: `diary-${d.id}`,
      type: "diary",
      title: "Diary Entry Unreviewed",
      description: `${d.staffName}: "${d.title}" for ${d.submittedForDate}`,
      timestamp: d.createdAtIso ? new Date(d.createdAtIso).getTime() : 0,
      dateLabel: formatDateTimeLabel(d.createdAtIso),
      urgency: "normal",
    });
  }

  return items.sort((a, b) => b.timestamp - a.timestamp);
}

export async function listDoubtsForTeacher(profile: UserProfileRecord): Promise<StudentDoubtRecord[]> {
  if (isDemoMode()) return getDemoHTDoubts();
  const snapshot = await getDocs(
    query(collection(firestoreDb, studentDoubtsCollectionName), where("teacherUserId", "==", profile.userId)),
  );
  return snapshot.docs
    .map((item) => normalizeStudentDoubtRecord(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => (b.updatedAtIso || b.createdAtIso).localeCompare(a.updatedAtIso || a.createdAtIso));
}

export async function replyToDoubtAsTeacher({
  profile,
  doubtId,
  replyText,
}: {
  profile: UserProfileRecord;
  doubtId: string;
  replyText: string;
}) {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await addDoc(collection(firestoreDb, studentDoubtsCollectionName, doubtId, "replies"), {
    doubtId,
    authorUserId: profile.userId,
    authorName: profile.name || "Teacher",
    authorRole: "teacher",
    replyText: replyText.trim(),
    createdAtIso: nowIso,
  });
  await updateDoc(doc(firestoreDb, studentDoubtsCollectionName, doubtId), {
    status: "replied",
    teacherSeen: true,
    studentSeen: false,
    updatedAtIso: nowIso,
  });
}

export async function listResultsForAssessment(assessmentTitle: string, classId: string, subjectId?: string): Promise<StudentResultRecord[]> {
  if (isDemoMode()) return getDemoResultsForAssessment(assessmentTitle, classId);
  const constraints = [
    where("assessmentTitle", "==", assessmentTitle),
    where("classId", "==", classId),
    ...(subjectId ? [where("subjectId", "==", subjectId)] : []),
  ];
  const snapshot = await getDocs(query(collection(firestoreDb, studentResultsCollectionName), ...constraints));
  return snapshot.docs
    .map((item) => normalizeStudentResultRecord(item.id, item.data()))
    .sort((a, b) => b.score - a.score);
}

export async function getStudentProfile(userId: string): Promise<UserProfileRecord | null> {
  if (isDemoMode()) return getDemoStudentProfileById(userId);
  const snapshot = await getDoc(doc(firestoreDb, userProfilesCollectionName, userId));
  if (!snapshot.exists()) return null;
  return normalizeUserProfileRecord(snapshot.id, snapshot.data());
}

export async function listStudentAttendanceByIdWithDemo(userId: string): Promise<StudentAttendanceRecord[]> {
  if (isDemoMode()) return getDemoStudentAttendanceById(userId);
  return listStudentAttendanceById(userId);
}

export async function listStudentResultsByIdWithDemo(userId: string): Promise<StudentResultRecord[]> {
  if (isDemoMode()) return getDemoStudentResultsById(userId);
  return listStudentResultsById(userId);
}

const DEMO_PENDING_STUDENTS: UserProfileRecord[] = [
  normalizeUserProfileRecord("demo-pending-1", { name: "Rahul Mehta", email: "rahul.mehta@demo.test", role: "student", classId: "cls-neet-11b", className: "NEET 11-B", centreId: "centre-raipur", centreName: "Raipur", regionId: "region-cg", regionName: "Chhattisgarh", active: false, studentId: "STU-2026-081" }),
  normalizeUserProfileRecord("demo-pending-2", { name: "Priya Nair", email: "priya.nair@demo.test", role: "student", classId: "cls-neet-11b", className: "NEET 11-B", centreId: "centre-raipur", centreName: "Raipur", regionId: "region-cg", regionName: "Chhattisgarh", active: false, studentId: "STU-2026-082" }),
];

export async function listPendingStudentsForTeacher(profile: UserProfileRecord) {
  if (isDemoMode()) return DEMO_PENDING_STUDENTS;
  const classIds = Array.from(new Set(profile.teacherClassIds)).filter(Boolean);
  if (classIds.length === 0) return [];
  const snapshots = await Promise.all(
    classIds.map((classId) =>
      getDocs(
        query(
          collection(firestoreDb, userProfilesCollectionName),
          where("classId", "==", classId),
          where("active", "==", false),
        ),
      ),
    ),
  );
  return snapshots
    .flatMap((s) => s.docs)
    .map((d) => normalizeUserProfileRecord(d.id, d.data()))
    .filter((r) => r.role === "student")
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function approveStudentEnrollment(userId: string) {
  if (isDemoMode()) return;
  await updateDoc(doc(firestoreDb, userProfilesCollectionName, userId), { active: true });
}

export async function uploadMaterialFile(
  file: { uri: string; name: string; mimeType?: string },
  teacherUid: string,
): Promise<string> {
  const resp = await fetch(file.uri);
  const blob = await resp.blob();
  const storageRef = ref(firebaseStorage, `materials/${teacherUid}/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, blob, { contentType: file.mimeType ?? `application/octet-stream` });
  return getDownloadURL(storageRef);
}

export async function createMaterialRecord({
  profile,
  classId,
  className,
  subjectId,
  subjectName,
  title,
  description,
  type,
  fileUrl,
  fileName,
}: {
  profile: UserProfileRecord;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  title: string;
  description: string;
  type: string;
  fileUrl: string;
  fileName: string;
}): Promise<void> {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await addDoc(collection(firestoreDb, learningResourcesCollectionName), {
    title: title.trim(),
    description: description.trim(),
    resourceType: type,
    classId,
    className,
    subjectId,
    subjectName,
    centreId: profile.centreId || "",
    regionId: profile.regionId || "",
    uploadedByUserId: profile.userId,
    uploadedByName: profile.name || "Teacher",
    fileUrl,
    fileName,
    attachments: [{ url: fileUrl, name: fileName, type: "file" }],
    createdAtIso: nowIso,
  });
}

export async function createCircular({
  profile,
  title,
  body,
  tag,
  audience,
}: {
  profile: UserProfileRecord;
  title: string;
  body: string;
  tag: string;
  audience: string;
}): Promise<void> {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await addDoc(collection(firestoreDb, studentAnnouncementsCollectionName), {
    title: title.trim(),
    body: body.trim(),
    tag,
    audience,
    centreId: profile.centreId || "",
    regionId: profile.regionId || "",
    createdByUserId: profile.userId,
    createdByName: profile.name || "Teacher",
    status: "published",
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  });
}

export async function listLeaveRequestsForHT(profile: UserProfileRecord): Promise<LeaveRequestRecord[]> {
  if (isDemoMode()) { await hydrateDemoState(); return getDemoAdminLeaveRequestsWithOverrides(); }
  if (!profile.centreId) return [];
  const snapshot = await getDocs(
    query(collection(firestoreDb, employeeLeaveRequestsCollectionName), where("centreId", "==", profile.centreId)),
  );
  return snapshot.docs
    .map((item) => normalizeLeaveRequestRecord(item.id, item.data() as Record<string, unknown>))
    .sort((a, b) => b.requestedAtIso.localeCompare(a.requestedAtIso));
}

export async function submitTeacherLeaveRequest({
  profile,
  startDate,
  endDate,
  reason,
  leaveType,
}: {
  profile: UserProfileRecord;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: string;
}): Promise<void> {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await addDoc(collection(firestoreDb, employeeLeaveRequestsCollectionName), {
    staffUserId: profile.userId,
    staffName: profile.name || "Teacher",
    centreId: profile.centreId || "",
    regionId: profile.regionId || "",
    startDate,
    endDate,
    reason: reason.trim(),
    leaveType,
    status: "pending",
    requestedAtIso: nowIso,
    updatedAtIso: nowIso,
  });
}

export async function removeStudentFromCentre(userId: string): Promise<void> {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, userProfilesCollectionName, userId), {
    active: false,
    removedAtIso: nowIso,
  });
}

export async function rejectStudentEnrollment(userId: string): Promise<void> {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, userProfilesCollectionName, userId), {
    enrollmentStatus: "rejected",
    active: false,
    rejectedAtIso: nowIso,
  });
}

export async function listTeacherTimetable(profile: UserProfileRecord): Promise<{ timetableEntries: ClassTimetableRecord[]; tests: TestScheduleRecord[] }> {
  if (isDemoMode()) {
    return { timetableEntries: [], tests: [] };
  }
  const classIds = Array.from(new Set(profile.teacherClassIds ?? [])).filter(Boolean);
  const timetableSnap = await getDocs(
    query(collection(firestoreDb, classTimetablesCollectionName), where("teacherUserId", "==", profile.userId)),
  );
  const timetableEntries = timetableSnap.docs
    .map((item) => normalizeClassTimetableRecord(item.id, item.data()))
    .sort((a, b) => `${a.dayKey}-${a.startTime}`.localeCompare(`${b.dayKey}-${b.startTime}`));

  if (classIds.length === 0) return { timetableEntries, tests: [] };
  const chunks: string[][] = [];
  for (let i = 0; i < classIds.length; i += 30) chunks.push(classIds.slice(i, i + 30));
  const testSnapshots = await Promise.all(
    chunks.map((chunk) => getDocs(query(collection(firestoreDb, testSchedulesCollectionName), where("classId", "in", chunk)))),
  );
  const tests = testSnapshots
    .flatMap((s) => s.docs)
    .map((item) => normalizeTestScheduleRecord(item.id, item.data()))
    .sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));
  return { timetableEntries, tests };
}

export async function updateTeacherProfileContact(userId: string, fields: { phone?: string; email?: string }): Promise<void> {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  const update: Record<string, string> = { updatedAtIso: nowIso };
  if (fields.phone !== undefined) update.phone = fields.phone;
  if (fields.email !== undefined) update.email = fields.email;
  await updateDoc(doc(firestoreDb, userProfilesCollectionName, userId), update);
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  if (!userId || !token) return;
  await updateDoc(doc(firestoreDb, userProfilesCollectionName, userId), {
    expoPushToken: token,
    pushTokenUpdatedAt: new Date().toISOString(),
  });
}
