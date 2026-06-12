import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
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
  getDemoSessionSlots,
  addDemoSessionSlot,
  updateDemoSessionSlot,
  deleteDemoSessionSlot,
  getDemoInquiries,
  getDemoInquiryFollowUps,
  addDemoInquiry,
  addDemoInquiryFollowUp,
  getDemoAttendanceForClass,
  setDemoAttendance,
  isDemoAttendanceLocked,
  lockDemoAttendance,
  setDemoStudentLeaveStatus,
  setDemoStaffLeaveStatus,
  setDemoComplaintResolution,
  getDemoAdminLeaveRequestsWithOverrides,
  hydrateDemoState,
} from "./demoData";
import {
  adminCollectionName,
  buildClassTimetableId,
  buildStudentAttendanceId,
  buildStudentResultId,
  buildTestScheduleId,
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
  sessionSlotsCollectionName,
  studentResultsCollectionName,
  teachingPlansCollectionName,
  testSchedulesCollectionName,
  userProfilesCollectionName,
  buildTeachingPlanId,
  normalizeSessionSlotRecord,
  normalizeTeachingPlanRecord,
  admissionInquiriesCollectionName,
  inquiryFollowUpsSubcollectionName,
  normalizeAdmissionInquiryRecord,
  normalizeInquiryFollowUpRecord,
  normalizeInquiryPhoneKey,
  type AdmissionInquiryRecord,
  type InquiryFollowUpRecord,
  type InquiryMode,
  type InquiryStatus,
  type AdminRecord,
  type AttendanceStatus,
  type ClassRecord,
  type ClassSubjectRecord,
  type ClassTimetableRecord,
  type ResultAssessmentCategory,
  type ScheduleDayKey,
  type StudentAnnouncementRecord,
  type StudentAttendanceRecord,
  type SessionSlotRecord,
  type SessionType,
  type StudentResultRecord,
  type TeachingPlanRecord,
  type TeachingPlanRow,
  type TeachingPlanStatus,
  type TestScheduleRecord,
  type UserProfileRecord,
} from "../shared";

const learningResourcesCollectionName = "learningResources";
const studentDoubtsCollectionName = "studentDoubts";
const studentLeaveRequestsCollectionName = "studentLeaveRequests";
const dashboardNotificationStatesCollectionName = "dashboardNotificationStates";
const attendanceLocksCollectionName = "attendanceLocks";

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

// --- Schedule editing (admins + head teachers) ---

export type ScheduleActor = { userId: string; name: string };

export async function listClassSubjectsForClass(classId: string): Promise<ClassSubjectRecord[]> {
  if (isDemoMode()) return getDemoClassSubjects();
  if (!classId) return [];
  const snapshot = await getDocs(
    query(collection(firestoreDb, classSubjectsCollectionName), where("classId", "==", classId)),
  );

  return snapshot.docs
    .map((item) => normalizeClassSubjectRecord(item.id, item.data()))
    .filter((item) => item.active)
    .sort((left, right) => left.subjectName.localeCompare(right.subjectName));
}

export async function listAdminScopedClasses(admin: AdminRecord): Promise<ClassRecord[]> {
  return listScopedClasses(admin);
}

export async function getClassById(classId: string): Promise<ClassRecord | null> {
  if (!classId || isDemoMode()) return null;
  const snapshot = await getDoc(doc(firestoreDb, classesCollectionName, classId));
  return snapshot.exists() ? normalizeClassRecord(snapshot.id, snapshot.data() ?? {}) : null;
}

export async function getClassTimetableEntryById(id: string): Promise<ClassTimetableRecord | null> {
  if (!id || isDemoMode()) return null;
  const snapshot = await getDoc(doc(firestoreDb, classTimetablesCollectionName, id));
  return snapshot.exists() ? normalizeClassTimetableRecord(snapshot.id, snapshot.data() ?? {}) : null;
}

export async function getTestScheduleById(id: string): Promise<TestScheduleRecord | null> {
  if (!id || isDemoMode()) return null;
  const snapshot = await getDoc(doc(firestoreDb, testSchedulesCollectionName, id));
  return snapshot.exists() ? normalizeTestScheduleRecord(snapshot.id, snapshot.data() ?? {}) : null;
}

export async function listHeadTeacherClasses(profile: UserProfileRecord): Promise<ClassRecord[]> {
  if (isDemoMode()) return [];
  const classIds = Array.from(new Set(profile.teacherClassIds ?? [])).filter(Boolean);
  if (classIds.length === 0) return [];
  const snapshots = await Promise.all(
    classIds.map((classId) => getDoc(doc(firestoreDb, classesCollectionName, classId))),
  );

  return snapshots
    .filter((snapshot) => snapshot.exists())
    .map((snapshot) => normalizeClassRecord(snapshot.id, snapshot.data() ?? {}))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export async function saveClassTimetableEntry(input: {
  classRecord: ClassRecord;
  dayKey: ScheduleDayKey;
  slotLabel: string;
  startTime: string;
  endTime: string;
  mapping: ClassSubjectRecord;
  notes: string;
  actor: ScheduleActor;
}): Promise<string> {
  const id = buildClassTimetableId(input.classRecord.id, input.dayKey, input.slotLabel);
  if (isDemoMode()) return id;
  await setDoc(
    doc(firestoreDb, classTimetablesCollectionName, id),
    {
      classId: input.classRecord.id,
      className: input.classRecord.name,
      centreId: input.classRecord.centreId,
      centreName: input.classRecord.centreName,
      regionId: input.classRecord.regionId,
      regionName: input.classRecord.regionName,
      dayKey: input.dayKey,
      slotKey: id.split("__")[2] ?? "",
      slotLabel: input.slotLabel.trim(),
      startTime: input.startTime,
      endTime: input.endTime,
      subjectId: input.mapping.subjectId,
      subjectName: input.mapping.subjectName,
      teacherUserId: input.mapping.teacherUserId,
      teacherName: input.mapping.teacherName,
      notes: input.notes.trim(),
      updatedByUserId: input.actor.userId,
      updatedByName: input.actor.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return id;
}

export async function deleteClassTimetableEntry(id: string) {
  if (isDemoMode()) return;
  await deleteDoc(doc(firestoreDb, classTimetablesCollectionName, id));
}

export async function saveTestSchedule(input: {
  classRecord: ClassRecord;
  mapping: ClassSubjectRecord;
  assessmentCategory: ResultAssessmentCategory;
  assessmentTitle: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  notes: string;
  actor: ScheduleActor;
}): Promise<string> {
  const id = buildTestScheduleId(input.mapping.id, input.assessmentCategory, input.scheduleDate, input.assessmentTitle);
  if (isDemoMode()) return id;
  await setDoc(
    doc(firestoreDb, testSchedulesCollectionName, id),
    {
      classId: input.classRecord.id,
      className: input.classRecord.name,
      classSubjectId: input.mapping.id,
      subjectId: input.mapping.subjectId,
      subjectName: input.mapping.subjectName,
      teacherUserId: input.mapping.teacherUserId,
      teacherName: input.mapping.teacherName,
      centreId: input.classRecord.centreId,
      centreName: input.classRecord.centreName,
      regionId: input.classRecord.regionId,
      regionName: input.classRecord.regionName,
      assessmentCategory: input.assessmentCategory,
      assessmentTitle: input.assessmentTitle.trim(),
      scheduleDate: input.scheduleDate,
      startTime: input.startTime,
      endTime: input.endTime,
      notes: input.notes.trim(),
      updatedByUserId: input.actor.userId,
      updatedByName: input.actor.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return id;
}

export async function deleteTestSchedule(id: string) {
  if (isDemoMode()) return;
  await deleteDoc(doc(firestoreDb, testSchedulesCollectionName, id));
}

// --- Teaching plans (weekly, subject-teacher authored, admin approved) ---

export type TeachingPlanInput = {
  classId: string;
  className: string;
  classSubjectId: string;
  subjectId: string;
  subjectName: string;
  teacherUserId: string;
  teacherName: string;
  centreId: string;
  centreName: string;
  regionId: string;
  regionName: string;
  weekStartDate: string;
  weekEndDate: string;
  monthKey: string;
  unitName: string;
  classTime: string;
  rows: TeachingPlanRow[];
  status: TeachingPlanStatus;
  reviewNote?: string;
  submittedAtIso?: string;
  approvedByUserId?: string;
  approvedByName?: string;
  approvedAtIso?: string;
  createdAtIso?: string;
};

export async function saveTeachingPlan(input: TeachingPlanInput, actor: ScheduleActor): Promise<string> {
  const id = buildTeachingPlanId(input.classSubjectId, input.weekStartDate);
  if (isDemoMode()) return id;
  const nowIso = new Date().toISOString();
  await setDoc(
    doc(firestoreDb, teachingPlansCollectionName, id),
    {
      classId: input.classId,
      className: input.className,
      classSubjectId: input.classSubjectId,
      subjectId: input.subjectId,
      subjectName: input.subjectName,
      teacherUserId: input.teacherUserId,
      teacherName: input.teacherName,
      centreId: input.centreId,
      centreName: input.centreName,
      regionId: input.regionId,
      regionName: input.regionName,
      weekStartDate: input.weekStartDate,
      weekEndDate: input.weekEndDate,
      monthKey: input.monthKey,
      unitName: input.unitName.trim(),
      classTime: input.classTime.trim(),
      rows: input.rows.map((row) => ({ date: row.date, day: row.day, topics: row.topics.trim() })),
      status: input.status,
      reviewNote: input.reviewNote ?? "",
      submittedAtIso: input.submittedAtIso ?? "",
      approvedByUserId: input.approvedByUserId ?? "",
      approvedByName: input.approvedByName ?? "",
      approvedAtIso: input.approvedAtIso ?? "",
      createdAtIso: input.createdAtIso || nowIso,
      updatedAtIso: nowIso,
      updatedByUserId: actor.userId,
      updatedByName: actor.name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return id;
}

export async function submitTeachingPlan(id: string, actor: ScheduleActor) {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, teachingPlansCollectionName, id), {
    status: "submitted",
    submittedAtIso: nowIso,
    reviewNote: "",
    updatedAtIso: nowIso,
    updatedByUserId: actor.userId,
    updatedByName: actor.name,
  });
}

export async function approveTeachingPlan(id: string, actor: ScheduleActor) {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, teachingPlansCollectionName, id), {
    status: "approved",
    approvedByUserId: actor.userId,
    approvedByName: actor.name,
    approvedAtIso: nowIso,
    updatedAtIso: nowIso,
    updatedByUserId: actor.userId,
    updatedByName: actor.name,
  });
}

export async function rejectTeachingPlan(id: string, actor: ScheduleActor, note: string) {
  if (isDemoMode()) return;
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, teachingPlansCollectionName, id), {
    status: "draft",
    reviewNote: note.trim(),
    submittedAtIso: "",
    updatedAtIso: nowIso,
    updatedByUserId: actor.userId,
    updatedByName: actor.name,
  });
}

export async function deleteTeachingPlan(id: string) {
  if (isDemoMode()) return;
  await deleteDoc(doc(firestoreDb, teachingPlansCollectionName, id));
}

export async function getTeachingPlanById(id: string): Promise<TeachingPlanRecord | null> {
  if (!id || isDemoMode()) return null;
  const snapshot = await getDoc(doc(firestoreDb, teachingPlansCollectionName, id));
  return snapshot.exists() ? normalizeTeachingPlanRecord(snapshot.id, snapshot.data() ?? {}) : null;
}

export async function listTeachingPlansForTeacher(profile: UserProfileRecord): Promise<TeachingPlanRecord[]> {
  if (isDemoMode()) return [];
  const snapshot = await getDocs(
    query(collection(firestoreDb, teachingPlansCollectionName), where("teacherUserId", "==", profile.userId)),
  );
  return snapshot.docs
    .map((item) => normalizeTeachingPlanRecord(item.id, item.data()))
    .sort((left, right) => right.weekStartDate.localeCompare(left.weekStartDate));
}

export async function listTeachingPlansForAdmin(admin: AdminRecord): Promise<TeachingPlanRecord[]> {
  if (isDemoMode()) return [];
  const col = collection(firestoreDb, teachingPlansCollectionName);
  const snapshot =
    admin.role === "admin"
      ? await getDocs(col)
      : admin.role === "centre_incharge"
        ? await getDocs(query(col, where("centreId", "==", admin.centreId)))
        : await getDocs(query(col, where("regionId", "==", admin.regionId)));
  return snapshot.docs
    .map((item) => normalizeTeachingPlanRecord(item.id, item.data()))
    .sort((left, right) => right.weekStartDate.localeCompare(left.weekStartDate));
}

export async function listTeachingPlansForStudent(profile: UserProfileRecord): Promise<TeachingPlanRecord[]> {
  if (isDemoMode() || !profile.classId) return [];
  const snapshot = await getDocs(
    query(
      collection(firestoreDb, teachingPlansCollectionName),
      where("classId", "==", profile.classId),
      where("status", "==", "approved"),
    ),
  );
  return snapshot.docs
    .map((item) => normalizeTeachingPlanRecord(item.id, item.data()))
    .sort((left, right) => right.weekStartDate.localeCompare(left.weekStartDate));
}

// --- Doubt / Remedial session slots ---

export type SessionTeacherOption = {
  teacherUserId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  centreId: string;
  centreName: string;
  regionId: string;
  regionName: string;
};

// Unique subject teachers for a student, from their class_subjects mappings.
export async function listSessionTeachersForStudent(profile: UserProfileRecord): Promise<SessionTeacherOption[]> {
  const mappings = await listClassSubjectsForStudent(profile);
  const seen = new Set<string>();
  const out: SessionTeacherOption[] = [];
  for (const m of mappings) {
    if (!m.teacherUserId) continue;
    const key = `${m.teacherUserId}__${m.subjectId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      teacherUserId: m.teacherUserId,
      teacherName: m.teacherName,
      subjectId: m.subjectId,
      subjectName: m.subjectName,
      centreId: m.centreId,
      centreName: m.centreName,
      regionId: m.regionId,
      regionName: m.regionName,
    });
  }
  return out;
}

export async function createSessionSlot(input: {
  teacherUserId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  centreId: string;
  centreName: string;
  regionId: string;
  regionName: string;
  date: string;
  startTime: string;
  endTime: string;
  locationNote: string;
  actor: ScheduleActor;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  const fields = {
    teacherUserId: input.teacherUserId,
    teacherName: input.teacherName,
    subjectId: input.subjectId,
    subjectName: input.subjectName,
    centreId: input.centreId,
    centreName: input.centreName,
    regionId: input.regionId,
    regionName: input.regionName,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    locationNote: input.locationNote.trim(),
    status: "open" as const,
    sessionType: "" as const,
    topic: "",
    bookedByUserId: "",
    bookedByName: "",
    bookedClassId: "",
    bookedClassName: "",
    declineNote: "",
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    updatedByUserId: input.actor.userId,
    updatedByName: input.actor.name,
  };
  if (isDemoMode()) {
    await hydrateDemoState();
    addDemoSessionSlot({ id: `demo-slot-${Date.now()}`, ...fields });
    return;
  }
  await addDoc(collection(firestoreDb, sessionSlotsCollectionName), fields);
}

export async function deleteSessionSlot(id: string) {
  if (isDemoMode()) { deleteDemoSessionSlot(id); return; }
  await deleteDoc(doc(firestoreDb, sessionSlotsCollectionName, id));
}

export async function listTeacherSessionSlots(profile: UserProfileRecord): Promise<SessionSlotRecord[]> {
  if (isDemoMode()) {
    await hydrateDemoState();
    return getDemoSessionSlots()
      .filter((slot) => slot.teacherUserId === profile.userId)
      .sort((a, b) => `${b.date}-${b.startTime}`.localeCompare(`${a.date}-${a.startTime}`));
  }
  const snapshot = await getDocs(
    query(collection(firestoreDb, sessionSlotsCollectionName), where("teacherUserId", "==", profile.userId)),
  );
  return snapshot.docs
    .map((item) => normalizeSessionSlotRecord(item.id, item.data()))
    .sort((a, b) => `${b.date}-${b.startTime}`.localeCompare(`${a.date}-${a.startTime}`));
}

export async function listOpenSlotsForTeacher(teacherUserId: string): Promise<SessionSlotRecord[]> {
  if (!teacherUserId) return [];
  const today = getTodayDateValue();
  if (isDemoMode()) {
    await hydrateDemoState();
    return getDemoSessionSlots()
      .filter((slot) => slot.teacherUserId === teacherUserId && slot.status === "open" && slot.date >= today)
      .sort((a, b) => `${a.date}-${a.startTime}`.localeCompare(`${b.date}-${b.startTime}`));
  }
  const snapshot = await getDocs(
    query(
      collection(firestoreDb, sessionSlotsCollectionName),
      where("teacherUserId", "==", teacherUserId),
      where("status", "==", "open"),
    ),
  );
  return snapshot.docs
    .map((item) => normalizeSessionSlotRecord(item.id, item.data()))
    .filter((slot) => slot.date >= today)
    .sort((a, b) => `${a.date}-${a.startTime}`.localeCompare(`${b.date}-${b.startTime}`));
}

export async function bookSessionSlot(input: {
  slot: SessionSlotRecord;
  sessionType: SessionType;
  topic: string;
  student: UserProfileRecord;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  const patch = {
    status: "requested" as const,
    sessionType: input.sessionType,
    topic: input.topic.trim(),
    bookedByUserId: input.student.userId,
    bookedByName: input.student.name || input.student.fullName || "Student",
    bookedClassId: input.student.classId,
    bookedClassName: input.student.className,
    declineNote: "",
    updatedAtIso: nowIso,
    updatedByUserId: input.student.userId,
    updatedByName: input.student.name || "Student",
  };
  if (isDemoMode()) { await hydrateDemoState(); updateDemoSessionSlot(input.slot.id, patch); return; }
  await updateDoc(doc(firestoreDb, sessionSlotsCollectionName, input.slot.id), patch);
}

const SESSION_RESET = {
  status: "open" as const,
  sessionType: "" as const,
  topic: "",
  bookedByUserId: "",
  bookedByName: "",
  bookedClassId: "",
  bookedClassName: "",
};

export async function cancelSessionBooking(id: string, actor: ScheduleActor) {
  const nowIso = new Date().toISOString();
  const patch = { ...SESSION_RESET, declineNote: "", updatedAtIso: nowIso, updatedByUserId: actor.userId, updatedByName: actor.name };
  if (isDemoMode()) { updateDemoSessionSlot(id, patch); return; }
  await updateDoc(doc(firestoreDb, sessionSlotsCollectionName, id), patch);
}

export async function confirmSessionRequest(id: string, actor: ScheduleActor) {
  const nowIso = new Date().toISOString();
  const patch = { status: "confirmed" as const, updatedAtIso: nowIso, updatedByUserId: actor.userId, updatedByName: actor.name };
  if (isDemoMode()) { updateDemoSessionSlot(id, patch); return; }
  await updateDoc(doc(firestoreDb, sessionSlotsCollectionName, id), patch);
}

export async function declineSessionRequest(id: string, actor: ScheduleActor, note: string) {
  const nowIso = new Date().toISOString();
  const patch = { ...SESSION_RESET, declineNote: note.trim(), updatedAtIso: nowIso, updatedByUserId: actor.userId, updatedByName: actor.name };
  if (isDemoMode()) { updateDemoSessionSlot(id, patch); return; }
  await updateDoc(doc(firestoreDb, sessionSlotsCollectionName, id), patch);
}

export async function completeSession(id: string, actor: ScheduleActor) {
  const nowIso = new Date().toISOString();
  const patch = { status: "completed" as const, updatedAtIso: nowIso, updatedByUserId: actor.userId, updatedByName: actor.name };
  if (isDemoMode()) { updateDemoSessionSlot(id, patch); return; }
  await updateDoc(doc(firestoreDb, sessionSlotsCollectionName, id), patch);
}

export async function listStudentSessions(profile: UserProfileRecord): Promise<SessionSlotRecord[]> {
  if (isDemoMode()) {
    await hydrateDemoState();
    return getDemoSessionSlots()
      .filter((slot) => slot.bookedByUserId === profile.userId)
      .sort((a, b) => `${b.date}-${b.startTime}`.localeCompare(`${a.date}-${a.startTime}`));
  }
  const snapshot = await getDocs(
    query(collection(firestoreDb, sessionSlotsCollectionName), where("bookedByUserId", "==", profile.userId)),
  );
  return snapshot.docs
    .map((item) => normalizeSessionSlotRecord(item.id, item.data()))
    .sort((a, b) => `${b.date}-${b.startTime}`.localeCompare(`${a.date}-${a.startTime}`));
}

export async function listAdminSessions(admin: AdminRecord): Promise<SessionSlotRecord[]> {
  if (isDemoMode()) {
    await hydrateDemoState();
    return [...getDemoSessionSlots()].sort((a, b) => `${b.date}-${b.startTime}`.localeCompare(`${a.date}-${a.startTime}`));
  }
  const col = collection(firestoreDb, sessionSlotsCollectionName);
  const snapshot =
    admin.role === "admin"
      ? await getDocs(col)
      : admin.role === "centre_incharge"
        ? await getDocs(query(col, where("centreId", "==", admin.centreId)))
        : await getDocs(query(col, where("regionId", "==", admin.regionId)));
  return snapshot.docs
    .map((item) => normalizeSessionSlotRecord(item.id, item.data()))
    .sort((a, b) => `${b.date}-${b.startTime}`.localeCompare(`${a.date}-${a.startTime}`));
}

// ─── Admission inquiries (HT logs walk-in / call leads; admin tracks) ────────
export type InquiryActor = { userId: string; name: string };

function inquiryDocRef(id: string) {
  return doc(firestoreDb, admissionInquiriesCollectionName, id);
}

function inquiryFollowUpsCol(id: string) {
  return collection(firestoreDb, admissionInquiriesCollectionName, id, inquiryFollowUpsSubcollectionName);
}

// Newest-contacted first.
function inquirySort(a: AdmissionInquiryRecord, b: AdmissionInquiryRecord): number {
  return (b.lastContactedAtIso || b.createdAtIso).localeCompare(a.lastContactedAtIso || a.createdAtIso);
}

// Dedup lookup: same phone within the same centre = the same lead.
export async function findInquiryByPhone(phone: string, centreId: string): Promise<AdmissionInquiryRecord | null> {
  const phoneKey = normalizeInquiryPhoneKey(phone);
  if (!phoneKey || !centreId) return null;
  if (isDemoMode()) {
    await hydrateDemoState();
    return getDemoInquiries().find((i) => i.phoneKey === phoneKey && i.centreId === centreId) ?? null;
  }
  const snapshot = await getDocs(query(
    collection(firestoreDb, admissionInquiriesCollectionName),
    where("centreId", "==", centreId),
    where("phoneKey", "==", phoneKey),
  ));
  const first = snapshot.docs[0];
  return first ? normalizeAdmissionInquiryRecord(first.id, first.data()) : null;
}

export async function createInquiry(input: {
  studentName: string;
  phone: string;
  email: string;
  course: string;
  mode: InquiryMode;
  remark: string;
  nextFollowUpDate: string;
  profile: UserProfileRecord;
}): Promise<string> {
  const nowIso = new Date().toISOString();
  const phoneKey = normalizeInquiryPhoneKey(input.phone);
  const actorName = input.profile.name || input.profile.fullName || "Head Teacher";
  const inquiryFields = {
    studentName: input.studentName.trim(),
    phone: input.phone.trim(),
    phoneKey,
    email: input.email.trim(),
    course: input.course.trim(),
    mode: input.mode,
    status: "new" as const,
    remark: input.remark.trim(),
    centreId: input.profile.centreId,
    centreName: input.profile.centreName,
    regionId: input.profile.regionId,
    regionName: input.profile.regionName,
    createdByUserId: input.profile.userId,
    createdByName: actorName,
    assignedToUserId: input.profile.userId,
    assignedToName: actorName,
    followUpCount: 1,
    lastContactedAtIso: nowIso,
    nextFollowUpDate: input.nextFollowUpDate,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    updatedByUserId: input.profile.userId,
    updatedByName: actorName,
  };
  const followUpFields = {
    note: input.remark.trim(),
    mode: input.mode,
    outcome: "new" as const,
    nextFollowUpDate: input.nextFollowUpDate,
    byUserId: input.profile.userId,
    byName: actorName,
    createdAtIso: nowIso,
  };
  if (isDemoMode()) {
    await hydrateDemoState();
    const id = `demo-inq-${Date.now()}`;
    addDemoInquiry({ id, ...inquiryFields }, { id: `demo-fu-${Date.now()}`, ...followUpFields });
    return id;
  }
  const ref = await addDoc(collection(firestoreDb, admissionInquiriesCollectionName), inquiryFields);
  await addDoc(inquiryFollowUpsCol(ref.id), followUpFields);
  return ref.id;
}

export async function addInquiryFollowUp(input: {
  inquiry: AdmissionInquiryRecord;
  note: string;
  mode: InquiryMode;
  outcome: InquiryStatus;
  nextFollowUpDate: string;
  actor: InquiryActor;
}): Promise<void> {
  const nowIso = new Date().toISOString();
  const followUpFields = {
    note: input.note.trim(),
    mode: input.mode,
    outcome: input.outcome,
    nextFollowUpDate: input.nextFollowUpDate,
    byUserId: input.actor.userId,
    byName: input.actor.name,
    createdAtIso: nowIso,
  };
  const patch = {
    status: input.outcome,
    remark: input.note.trim() || input.inquiry.remark,
    followUpCount: input.inquiry.followUpCount + 1,
    lastContactedAtIso: nowIso,
    nextFollowUpDate: input.nextFollowUpDate,
    updatedAtIso: nowIso,
    updatedByUserId: input.actor.userId,
    updatedByName: input.actor.name,
  };
  if (isDemoMode()) {
    await hydrateDemoState();
    addDemoInquiryFollowUp(input.inquiry.id, { id: `demo-fu-${Date.now()}`, ...followUpFields }, patch);
    return;
  }
  await addDoc(inquiryFollowUpsCol(input.inquiry.id), followUpFields);
  await updateDoc(inquiryDocRef(input.inquiry.id), patch);
}

export async function listHeadTeacherInquiries(profile: UserProfileRecord): Promise<AdmissionInquiryRecord[]> {
  if (isDemoMode()) {
    await hydrateDemoState();
    return [...getDemoInquiries()].filter((i) => i.centreId === profile.centreId).sort(inquirySort);
  }
  if (!profile.centreId) return [];
  const snapshot = await getDocs(query(
    collection(firestoreDb, admissionInquiriesCollectionName),
    where("centreId", "==", profile.centreId),
  ));
  return snapshot.docs.map((d) => normalizeAdmissionInquiryRecord(d.id, d.data())).sort(inquirySort);
}

export async function listAdminInquiries(admin: AdminRecord): Promise<AdmissionInquiryRecord[]> {
  if (isDemoMode()) {
    await hydrateDemoState();
    return [...getDemoInquiries()].sort(inquirySort);
  }
  const col = collection(firestoreDb, admissionInquiriesCollectionName);
  const snapshot =
    admin.role === "admin"
      ? await getDocs(col)
      : admin.role === "centre_incharge"
        ? await getDocs(query(col, where("centreId", "==", admin.centreId)))
        : await getDocs(query(col, where("regionId", "==", admin.regionId)));
  return snapshot.docs.map((d) => normalizeAdmissionInquiryRecord(d.id, d.data())).sort(inquirySort);
}

export async function listInquiryFollowUps(inquiryId: string): Promise<InquiryFollowUpRecord[]> {
  if (isDemoMode()) {
    await hydrateDemoState();
    return [...getDemoInquiryFollowUps(inquiryId)].sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
  }
  const snapshot = await getDocs(inquiryFollowUpsCol(inquiryId));
  return snapshot.docs
    .map((d) => normalizeInquiryFollowUpRecord(d.id, d.data()))
    .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
}

export async function getInquiryById(id: string): Promise<AdmissionInquiryRecord | null> {
  if (isDemoMode()) {
    await hydrateDemoState();
    return getDemoInquiries().find((i) => i.id === id) ?? null;
  }
  const snapshot = await getDoc(inquiryDocRef(id));
  return snapshot.exists() ? normalizeAdmissionInquiryRecord(snapshot.id, snapshot.data() ?? {}) : null;
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
  if (isDemoMode()) { await hydrateDemoState(); return getDemoAttendanceForClass(classId, date); }
  const snapshot = await getDocs(
    query(
      collection(firestoreDb, studentAttendanceCollectionName),
      where("classId", "==", classId),
      where("attendanceDate", "==", date),
    ),
  );

  return snapshot.docs.map((item) => normalizeStudentAttendanceRecord(item.id, item.data()));
}

// Approved student leaves covering a class on a given date (auto-mark as leave).
export async function listApprovedLeavesForClass(classId: string, date: string): Promise<StudentLeaveRequestRecord[]> {
  if (!classId) return [];
  if (isDemoMode()) {
    await hydrateDemoState();
    return getDemoLeaveRequests().filter(
      (r) => r.status === "approved" && r.classId === classId && r.startDate <= date && r.endDate >= date,
    );
  }
  const snapshot = await getDocs(
    query(
      collection(firestoreDb, studentLeaveRequestsCollectionName),
      where("classId", "==", classId),
      where("status", "==", "approved"),
    ),
  );
  return snapshot.docs
    .map((item) => normalizeStudentLeaveRequestRecord(item.id, item.data() as Record<string, unknown>))
    .filter((r) => r.startDate <= date && r.endDate >= date);
}

export async function isAttendanceLocked(classId: string, date: string): Promise<boolean> {
  if (!classId) return false;
  if (isDemoMode()) { await hydrateDemoState(); return isDemoAttendanceLocked(classId, date); }
  const snapshot = await getDoc(doc(firestoreDb, attendanceLocksCollectionName, `${classId}__${date}`));
  return snapshot.exists();
}

export async function lockAttendanceForDay(classId: string, date: string, actor: ScheduleActor) {
  if (isDemoMode()) { lockDemoAttendance(classId, date); return; }
  await setDoc(doc(firestoreDb, attendanceLocksCollectionName, `${classId}__${date}`), {
    classId,
    attendanceDate: date,
    lockedByUserId: actor.userId,
    lockedByName: actor.name,
    lockedAtIso: new Date().toISOString(),
  });
}

// Persist many statuses at once (used by Submit).
export async function saveAttendanceBatch({
  teacherProfile,
  entries,
  attendanceDate,
}: {
  teacherProfile: UserProfileRecord;
  entries: { student: UserProfileRecord; status: AttendanceStatus }[];
  attendanceDate: string;
}) {
  const build = (student: UserProfileRecord, status: AttendanceStatus) => ({
    studentUserId: student.userId,
    teacherUserId: teacherProfile.userId,
    teacherName: teacherProfile.name,
    studentName: student.name,
    studentBranch: student.centreName,
    classId: student.classId,
    className: student.className,
    attendanceDate,
    status,
  });
  if (isDemoMode()) {
    await hydrateDemoState();
    for (const { student, status } of entries) {
      setDemoAttendance({ id: buildStudentAttendanceId(student.userId, attendanceDate), ...build(student, status) });
    }
    return;
  }
  await Promise.all(
    entries.map(({ student, status }) =>
      setDoc(doc(firestoreDb, studentAttendanceCollectionName, buildStudentAttendanceId(student.userId, attendanceDate)), build(student, status)),
    ),
  );
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
  const recordId = buildStudentAttendanceId(studentProfile.userId, attendanceDate);
  const fields = {
    studentUserId: studentProfile.userId,
    teacherUserId: teacherProfile.userId,
    teacherName: teacherProfile.name,
    studentName: studentProfile.name,
    studentBranch: studentProfile.centreName,
    classId: studentProfile.classId,
    className: studentProfile.className,
    attendanceDate,
    status,
  };
  if (isDemoMode()) { await hydrateDemoState(); setDemoAttendance({ id: recordId, ...fields }); return; }
  await setDoc(doc(firestoreDb, studentAttendanceCollectionName, recordId), fields);
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
  if (isDemoMode()) { setDemoComplaintResolution(complaintId, "resolved", adminReply.trim()); return; }
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, studentComplaintsCollectionName, complaintId), {
    status: "resolved",
    adminReply: adminReply.trim(),
    updatedAtIso: nowIso,
  });
}

export async function markComplaintInReview(complaintId: string): Promise<void> {
  if (isDemoMode()) { setDemoComplaintResolution(complaintId, "in_progress"); return; }
  const nowIso = new Date().toISOString();
  await updateDoc(doc(firestoreDb, studentComplaintsCollectionName, complaintId), {
    status: "in_progress",
    updatedAtIso: nowIso,
  });
}

export async function rejectComplaint(complaintId: string, adminReply: string): Promise<void> {
  if (isDemoMode()) { setDemoComplaintResolution(complaintId, "rejected", adminReply.trim()); return; }
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

export async function listResultsForAdmin(admin: AdminRecord): Promise<StudentResultRecord[]> {
  if (isDemoMode()) return [];
  const classes = await listScopedClasses(admin);
  if (classes.length === 0) return [];

  const classIds = classes.map((c) => c.id);
  const chunks: string[][] = [];
  for (let i = 0; i < classIds.length; i += 30) {
    chunks.push(classIds.slice(i, i + 30));
  }

  const snapshots = await Promise.all(
    chunks.map((chunk) => getDocs(query(collection(firestoreDb, studentResultsCollectionName), where("classId", "in", chunk)))),
  );

  return snapshots
    .flatMap((s) => s.docs)
    .map((item) => normalizeStudentResultRecord(item.id, item.data()))
    .filter((r) => r.publishedAtIso)
    .sort((a, b) => b.publishedAtIso.localeCompare(a.publishedAtIso));
}

export async function listRecentResultsForAdmin(admin: AdminRecord, take = 6): Promise<StudentResultRecord[]> {
  const all = await listResultsForAdmin(admin);
  return all.slice(0, take);
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
