import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfileRecord } from "../shared";
import type {
  StudentComplaintRecord,
  LearningResourceRecord,
  StudentDoubtRecord,
  StudentDoubtReplyRecord,
  StudentLeaveRequestRecord,
  StudentNotificationItem,
  LeaveRequestRecord,
} from "./erp";
import type { ClassRecord, ClassSubjectRecord, SessionSlotRecord, StudentResultRecord, StudentAttendanceRecord } from "../shared";
import type { AdmissionInquiryRecord, InquiryFollowUpRecord } from "../shared";
import type { FeeStructureRecord, StudentFeeRecord, FeePaymentRecord } from "./fees";
import type { DemoRole } from "./demoMode";

// ─── Shared constants ────────────────────────────────────────────────────────
const CENTRE_ID = "demo-centre-raipur";
const CENTRE_NAME = "CLS Raipur Centre";
const REGION_ID = "demo-region-cg";
const REGION_NAME = "Chhattisgarh";
const CLASS_ID_11B = "demo-class-neet11b";
const CLASS_NAME_11B = "NEET 11-B";
const CLASS_ID_11A = "demo-class-neet11a";
const CLASS_NAME_11A = "NEET 11-A";
const CLASS_ID_12A = "demo-class-neet12a";
const CLASS_NAME_12A = "NEET 12-A";

// ─── Mock Profiles ────────────────────────────────────────────────────────────
export const DEMO_PROFILES: Record<DemoRole, UserProfileRecord> = {
  student: {
    userId: "demo-student-001",
    name: "Aanya Verma",
    fullName: "Aanya Verma",
    email: "aanya.verma@demo.cls",
    role: "student",
    accountType: "student",
    regionId: REGION_ID,
    regionName: REGION_NAME,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    branch: CLASS_NAME_11B,
    teacherId: "",
    teacherRole: "",
    teacher_role: "",
    teacherClassIds: [],
    teacherClassNames: [],
    teacherSubjectIds: [],
    teacherSubjectNames: [],
    teacher_class_ids: [],
    teacher_class_names: [],
    teacher_subject_ids: [],
    teacher_subject_names: [],
    employeeId: "",
    employee_id: "",
    employeeType: "",
    employeeCompetitiveExam: "",
    employeeQualification: "",
    employeeSubject: "",
    studentId: "CLS-ST-0042",
    rollNumber: "001",
    classId: CLASS_ID_11B,
    className: CLASS_NAME_11B,
  } as unknown as UserProfileRecord,

  teacher: {
    userId: "demo-teacher-001",
    name: "Mr. Ramesh Kumar",
    fullName: "Mr. Ramesh Kumar",
    email: "ramesh.kumar@demo.cls",
    role: "teacher",
    accountType: "teacher",
    regionId: REGION_ID,
    regionName: REGION_NAME,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    branch: "",
    teacherId: "CLS-T-0011",
    teacherRole: "",
    teacher_role: "",
    teacherClassIds: [CLASS_ID_11B, CLASS_ID_12A],
    teacherClassNames: [CLASS_NAME_11B, CLASS_NAME_12A],
    teacherSubjectIds: ["demo-sub-physics"],
    teacherSubjectNames: ["Physics"],
    teacher_class_ids: [CLASS_ID_11B, CLASS_ID_12A],
    teacher_class_names: [CLASS_NAME_11B, CLASS_NAME_12A],
    teacher_subject_ids: ["demo-sub-physics"],
    teacher_subject_names: ["Physics"],
    employeeId: "",
    employee_id: "",
    employeeType: "",
    employeeCompetitiveExam: "",
    employeeQualification: "",
    employeeSubject: "",
    studentId: "",
    rollNumber: "",
    classId: "",
    className: "",
  } as unknown as UserProfileRecord,

  team: {
    userId: "demo-teacher-003",
    name: "Dr. Anand Joshi",
    fullName: "Dr. Anand Joshi",
    email: "anand.joshi@demo.cls",
    role: "team",
    accountType: "team",
    regionId: REGION_ID,
    regionName: REGION_NAME,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    branch: "",
    teacherId: "CLS-HT-0001",
    teacherRole: "",
    teacher_role: "",
    teacherClassIds: [CLASS_ID_11B, CLASS_ID_12A, "demo-class-neet11a"],
    teacherClassNames: [CLASS_NAME_11B, CLASS_NAME_12A, "NEET 11-A"],
    teacherSubjectIds: ["demo-sub-physics", "demo-sub-chemistry"],
    teacherSubjectNames: ["Physics", "Chemistry"],
    teacher_class_ids: [CLASS_ID_11B, CLASS_ID_12A, "demo-class-neet11a"],
    teacher_class_names: [CLASS_NAME_11B, CLASS_NAME_12A, "NEET 11-A"],
    teacher_subject_ids: ["demo-sub-physics", "demo-sub-chemistry"],
    teacher_subject_names: ["Physics", "Chemistry"],
    employeeId: "",
    employee_id: "",
    employeeType: "",
    employeeCompetitiveExam: "",
    employeeQualification: "",
    employeeSubject: "",
    studentId: "",
    rollNumber: "",
    classId: "",
    className: "",
  } as unknown as UserProfileRecord,

  admin: {
    userId: "demo-admin-001",
    name: "Mrs. Kavita Singh",
    fullName: "Mrs. Kavita Singh",
    email: "kavita.singh@demo.cls",
    role: "teacher",
    accountType: "teacher",
    regionId: REGION_ID,
    regionName: REGION_NAME,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    branch: "",
    teacherId: "",
    teacherRole: "",
    teacher_role: "",
    teacherClassIds: [],
    teacherClassNames: [],
    teacherSubjectIds: [],
    teacherSubjectNames: [],
    teacher_class_ids: [],
    teacher_class_names: [],
    teacher_subject_ids: [],
    teacher_subject_names: [],
    employeeId: "",
    employee_id: "",
    employeeType: "",
    employeeCompetitiveExam: "",
    employeeQualification: "",
    employeeSubject: "",
    studentId: "",
    rollNumber: "",
    classId: "",
    className: "",
  } as unknown as UserProfileRecord,

  employee: {
    userId: "demo-employee-001",
    name: "Ms. Priya Sharma",
    fullName: "Ms. Priya Sharma",
    email: "priya.sharma@demo.cls",
    role: "employee",
    accountType: "employee",
    regionId: REGION_ID,
    regionName: REGION_NAME,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    branch: "",
    teacherId: "",
    teacherRole: "",
    teacher_role: "",
    teacherClassIds: [],
    teacherClassNames: [],
    teacherSubjectIds: [],
    teacherSubjectNames: [],
    teacher_class_ids: [],
    teacher_class_names: [],
    teacher_subject_ids: [],
    teacher_subject_names: [],
    employeeId: "CLS-EMP-0001",
    employee_id: "CLS-EMP-0001",
    employeeType: "Office Staff",
    employeeCompetitiveExam: "",
    employeeQualification: "",
    employeeSubject: "",
    studentId: "",
    rollNumber: "",
    classId: "",
    className: "",
  } as unknown as UserProfileRecord,
};

// ─── Demo Admin Record ────────────────────────────────────────────────────────
export const DEMO_ADMIN_RECORD = {
  userId: "demo-admin-001",
  role: "admin" as const,
  centreId: CENTRE_ID,
  centreName: CENTRE_NAME,
  regionId: REGION_ID,
  regionName: REGION_NAME,
  name: "Mrs. Kavita Singh",
  email: "kavita.singh@demo.cls",
};

// ─── Attendance ───────────────────────────────────────────────────────────────
function makeAttDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function makeAtt(id: string, daysAgo: number, status: "present" | "absent" | "leave"): StudentAttendanceRecord {
  return {
    id,
    studentUserId: "demo-student-001",
    teacherUserId: "demo-teacher-002",
    teacherName: "Ms. Priya Sharma",
    studentName: "Aanya Verma",
    studentBranch: CLASS_NAME_11B,
    classId: CLASS_ID_11B,
    className: CLASS_NAME_11B,
    attendanceDate: makeAttDate(daysAgo),
    status,
  };
}

export const DEMO_ATTENDANCE: StudentAttendanceRecord[] = [
  makeAtt("a1", 0, "present"),
  makeAtt("a2", 1, "present"),
  makeAtt("a3", 2, "absent"),
  makeAtt("a4", 3, "present"),
  makeAtt("a5", 4, "present"),
  makeAtt("a6", 5, "present"),
  makeAtt("a7", 6, "leave"),
  makeAtt("a8", 7, "present"),
  makeAtt("a9", 8, "present"),
  makeAtt("a10", 9, "absent"),
  makeAtt("a11", 10, "present"),
  makeAtt("a12", 11, "present"),
  makeAtt("a13", 12, "present"),
  makeAtt("a14", 13, "absent"),
  makeAtt("a15", 14, "present"),
  makeAtt("a16", 15, "present"),
  makeAtt("a17", 16, "present"),
  makeAtt("a18", 17, "leave"),
  makeAtt("a19", 18, "present"),
  makeAtt("a20", 19, "present"),
  makeAtt("a21", 20, "present"),
  makeAtt("a22", 21, "absent"),
  makeAtt("a23", 22, "present"),
  makeAtt("a24", 23, "present"),
  makeAtt("a25", 24, "present"),
  makeAtt("a26", 25, "present"),
  makeAtt("a27", 26, "present"),
  makeAtt("a28", 27, "absent"),
  makeAtt("a29", 28, "present"),
  makeAtt("a30", 29, "present"),
];

// ─── Results ──────────────────────────────────────────────────────────────────
function makeResult(
  id: string,
  subject: string,
  subjectId: string,
  title: string,
  category: StudentResultRecord["assessmentCategory"],
  score: number,
  max: number,
  daysAgo: number,
  avg: number | null = null,
  grade = "",
  remarks = "",
): StudentResultRecord {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const iso = d.toISOString();
  return {
    id,
    studentUserId: "demo-student-001",
    teacherUserId: "demo-teacher-001",
    teacherName: "Mr. Ramesh Kumar",
    studentName: "Aanya Verma",
    classId: CLASS_ID_11B,
    className: CLASS_NAME_11B,
    subjectId,
    subjectName: subject,
    subject,
    classSubjectId: `${CLASS_ID_11B}__${subjectId}`,
    assessmentCategory: category,
    assessmentTitle: title,
    score,
    maxScore: max,
    grade: grade || (score / max >= 0.9 ? "A+" : score / max >= 0.75 ? "A" : score / max >= 0.6 ? "B" : "C"),
    remarks: remarks || (score / max >= 0.85 ? "Excellent work!" : score / max >= 0.7 ? "Good effort, keep it up." : "Needs improvement."),
    assessmentDate: iso.slice(0, 10),
    publishedAtIso: iso,
    classAveragePercent: avg,
  };
}

export const DEMO_RESULTS: StudentResultRecord[] = [
  makeResult("r1", "Physics", "demo-sub-physics", "Electrostatics Unit Test", "class_test", 47, 50, 4, 79, "A+", "Excellent! Full marks in theory section."),
  makeResult("r2", "Chemistry", "demo-sub-chemistry", "Organic Chem Mock #3", "class_test", 38, 50, 8, 72, "A", "Good understanding of mechanisms."),
  makeResult("r3", "Biology", "demo-sub-biology", "Cell Division Test", "class_test", 44, 50, 12, 68, "A+", "Perfect on diagrams. Review meiosis I."),
  makeResult("r4", "Physics", "demo-sub-physics", "Quarterly Exam – Term 1", "quarterly_exam", 156, 200, 18, 71, "A", "Strong in optics. Work on modern physics."),
  makeResult("r5", "Mathematics", "demo-sub-math", "Integration Practice Test", "class_test", 32, 50, 22, 61, "B", "Integration by parts needs revision."),
  makeResult("r6", "Chemistry", "demo-sub-chemistry", "Thermodynamics Test", "class_test", 41, 50, 26, 74, "A", "Excellent Hess's Law approach."),
  makeResult("r7", "Biology", "demo-sub-biology", "Genetics Mid-Term", "midterm", 88, 100, 35, 65, "A", "Strong on Mendelian genetics."),
  makeResult("r8", "Physics", "demo-sub-physics", "Optics Unit Test", "class_test", 43, 50, 40, 77, "A+", "Perfect score on ray diagrams."),
  makeResult("r9", "Chemistry", "demo-sub-chemistry", "Chemical Bonding Test", "class_test", 36, 50, 48, 70, "A", "VSEPR theory needs practice."),
  makeResult("r10", "Mathematics", "demo-sub-math", "Calculus Mid-Term", "midterm", 74, 100, 60, 55, "B", "Good on differentiation. Integration needs work."),
];

// ─── Timetable ────────────────────────────────────────────────────────────────
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const SLOTS = [
  { slotKey: "slot-1", slotLabel: "8:00 – 9:30 AM", startTime: "08:00", endTime: "09:30" },
  { slotKey: "slot-2", slotLabel: "10:00 – 11:30 AM", startTime: "10:00", endTime: "11:30" },
  { slotKey: "slot-3", slotLabel: "12:30 – 2:00 PM", startTime: "12:30", endTime: "14:00" },
  { slotKey: "slot-4", slotLabel: "2:30 – 4:00 PM", startTime: "14:30", endTime: "16:00" },
];
const SUBJECTS = [
  { id: "demo-sub-physics", name: "Physics", teacher: "Mr. Ramesh Kumar", teacherId: "demo-teacher-001" },
  { id: "demo-sub-chemistry", name: "Chemistry", teacher: "Ms. Priya Sharma", teacherId: "demo-teacher-002" },
  { id: "demo-sub-biology", name: "Biology", teacher: "Mr. Suresh Nair", teacherId: "demo-teacher-004" },
  { id: "demo-sub-math", name: "Mathematics", teacher: "Ms. Lalita Rao", teacherId: "demo-teacher-005" },
];

const TIMETABLE_PLAN: Record<string, string[]> = {
  monday:    ["demo-sub-physics", "demo-sub-chemistry", "demo-sub-biology", "demo-sub-math"],
  tuesday:   ["demo-sub-math", "demo-sub-physics", "demo-sub-chemistry", "demo-sub-biology"],
  wednesday: ["demo-sub-biology", "demo-sub-math", "demo-sub-physics", "demo-sub-chemistry"],
  thursday:  ["demo-sub-chemistry", "demo-sub-biology", "demo-sub-math", "demo-sub-physics"],
  friday:    ["demo-sub-physics", "demo-sub-math", "demo-sub-chemistry", "demo-sub-biology"],
  saturday:  ["demo-sub-biology", "demo-sub-physics", "", ""],
};

export const DEMO_TIMETABLE = DAYS.flatMap((day) =>
  SLOTS.map((slot, si) => {
    const subId = TIMETABLE_PLAN[day]?.[si] ?? "";
    const sub = SUBJECTS.find((s) => s.id === subId);
    return {
      id: `tt-${day}-${slot.slotKey}`,
      classId: CLASS_ID_11B,
      className: CLASS_NAME_11B,
      centreId: CENTRE_ID,
      centreName: CENTRE_NAME,
      regionId: REGION_ID,
      regionName: REGION_NAME,
      dayKey: day,
      slotKey: slot.slotKey,
      slotLabel: slot.slotLabel,
      startTime: slot.startTime,
      endTime: slot.endTime,
      subjectId: sub?.id ?? "",
      subjectName: sub?.name ?? "",
      teacherUserId: sub?.teacherId ?? "",
      teacherName: sub?.teacher ?? "",
      notes: "",
      updatedByUserId: "",
      updatedByName: "",
    };
  }).filter((e) => e.subjectId !== ""),
);

export const DEMO_TEST_SCHEDULES = [
  { id: "ts1", classId: CLASS_ID_11B, className: CLASS_NAME_11B, classSubjectId: `${CLASS_ID_11B}__demo-sub-physics`, centreId: CENTRE_ID, centreName: CENTRE_NAME, regionId: REGION_ID, regionName: REGION_NAME, subjectId: "demo-sub-physics", subjectName: "Physics", assessmentCategory: "class_test" as const, assessmentTitle: "Physics Unit Test – Electrostatics", scheduleDate: "2026-06-11", startTime: "10:00", endTime: "11:30", notes: "Chapters 1–4", teacherName: "Mr. Ramesh Kumar", teacherUserId: "demo-teacher-001", updatedByUserId: "", updatedByName: "" },
  { id: "ts2", classId: CLASS_ID_11B, className: CLASS_NAME_11B, classSubjectId: `${CLASS_ID_11B}__demo-sub-chemistry`, centreId: CENTRE_ID, centreName: CENTRE_NAME, regionId: REGION_ID, regionName: REGION_NAME, subjectId: "demo-sub-chemistry", subjectName: "Chemistry", assessmentCategory: "class_test" as const, assessmentTitle: "Chemistry Mock #4 – Organic", scheduleDate: "2026-06-13", startTime: "12:30", endTime: "14:00", notes: "Ch 12–16 organic mechanisms", teacherName: "Ms. Priya Sharma", teacherUserId: "demo-teacher-002", updatedByUserId: "", updatedByName: "" },
  { id: "ts3", classId: CLASS_ID_11B, className: CLASS_NAME_11B, classSubjectId: `${CLASS_ID_11B}__demo-sub-biology`, centreId: CENTRE_ID, centreName: CENTRE_NAME, regionId: REGION_ID, regionName: REGION_NAME, subjectId: "demo-sub-biology", subjectName: "Biology", assessmentCategory: "midterm" as const, assessmentTitle: "Biology Mid-Term", scheduleDate: "2026-06-17", startTime: "08:00", endTime: "10:00", notes: "Chapters 1–8", teacherName: "Mr. Suresh Nair", teacherUserId: "demo-teacher-004", updatedByUserId: "", updatedByName: "" },
  { id: "ts4", classId: CLASS_ID_11B, className: CLASS_NAME_11B, classSubjectId: `${CLASS_ID_11B}__demo-sub-physics`, centreId: CENTRE_ID, centreName: CENTRE_NAME, regionId: REGION_ID, regionName: REGION_NAME, subjectId: "demo-sub-physics", subjectName: "Physics", assessmentCategory: "class_test" as const, assessmentTitle: "Electrostatics Revision Test", scheduleDate: "2026-06-20", startTime: "14:30", endTime: "16:00", notes: "Revision for quarterly", teacherName: "Mr. Ramesh Kumar", teacherUserId: "demo-teacher-001", updatedByUserId: "", updatedByName: "" },
  { id: "ts5", classId: CLASS_ID_11B, className: CLASS_NAME_11B, classSubjectId: `${CLASS_ID_11B}__demo-sub-math`, centreId: CENTRE_ID, centreName: CENTRE_NAME, regionId: REGION_ID, regionName: REGION_NAME, subjectId: "demo-sub-math", subjectName: "Mathematics", assessmentCategory: "class_test" as const, assessmentTitle: "Calculus Practice Test", scheduleDate: "2026-06-24", startTime: "10:00", endTime: "11:30", notes: "Integration and differentiation", teacherName: "Ms. Lalita Rao", teacherUserId: "demo-teacher-005", updatedByUserId: "", updatedByName: "" },
];

// ─── Circulars / Announcements ────────────────────────────────────────────────
function makeCircular(id: string, title: string, message: string, tag: string, daysAgo: number, scope: string = "all"): any {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return {
    id,
    title,
    message,
    tag,
    audienceScope: scope,
    classId: scope === "class" ? CLASS_ID_11B : "",
    className: scope === "class" ? CLASS_NAME_11B : "",
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    regionId: REGION_ID,
    regionName: REGION_NAME,
    createdByName: "CLS Academy",
    status: "approved",
    createdAtIso: d.toISOString(),
    updatedAtIso: d.toISOString(),
    attachments: id === "c1" ? [{ label: "mock14_schedule.pdf", url: "#", kind: "file" }] : [],
  };
}

export const DEMO_CIRCULARS = [
  makeCircular("c1", "JEE Mock #14 — schedule released", "Computer-based test in Hall C on Saturday, Jun 14 at 1:30 PM. Students must carry hall tickets and report 30 mins early. Syllabus: Optics (Ch 9–11), Modern Physics (Ch 12), Electrostatics (Ch 1–4).", "exam", 0),
  makeCircular("c2", "Holiday notice — Jun 12 (Public Holiday)", "The institute will remain closed on June 12, 2026 on account of a public holiday. Classes will resume normally on June 13.", "general", 1),
  makeCircular("c3", "Parent-Teacher Meeting — Jun 18", "PTM for NEET 11 batches is scheduled for June 18, 2026 at 10:00 AM. Parents are requested to be present with the student's progress report.", "ptm", 3, "class"),
  makeCircular("c4", "Fee reminder — Term 3 due by June 30", "Kindly clear Term 3 dues before June 30, 2026 to avoid a late fee penalty of ₹500. Visit the accounts desk between 9 AM–12 PM on weekdays.", "fees", 6),
  makeCircular("c5", "Library books return — deadline Jun 20", "All borrowed library books must be returned by June 20, 2026. Overdue books will attract a fine of ₹10/day.", "general", 8, "class"),
  makeCircular("c6", "New batch timings from July 1", "Starting July 1, 2026, NEET 11-B batch timings will shift to 7:30 AM – 1:00 PM. Updated timetable has been posted in the app.", "general", 10, "class"),
  makeCircular("c7", "Quarterly Exam 1 results published", "Results for Quarterly Exam 1 (Physics, Chemistry, Biology) are now available in the Results section of the app.", "exam", 14),
  makeCircular("c8", "Independence Day celebration — Aug 15", "CLS Academy will celebrate Independence Day on August 15, 2026 at 9:00 AM in the main hall. All students and staff are requested to attend.", "general", 18),
];

// ─── Learning Resources / Materials ──────────────────────────────────────────
function makeMaterial(id: string, title: string, subject: string, subjectId: string, desc: string, daysAgo: number, scope: "all" | "class" = "class"): LearningResourceRecord {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const iso = d.toISOString();
  return {
    id,
    kind: "resource",
    title,
    description: desc,
    linkUrl: "",
    audienceScope: scope,
    regionId: REGION_ID,
    regionName: REGION_NAME,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    classId: scope === "class" ? CLASS_ID_11B : "",
    className: scope === "class" ? CLASS_NAME_11B : "",
    subjectId,
    subjectName: subject,
    status: "approved",
    createdByUserId: "demo-teacher-001",
    createdByName: "Mr. Ramesh Kumar",
    createdAtIso: iso,
    updatedAtIso: iso,
    attachments: [{ label: `${title.toLowerCase().replace(/\s+/g, "_")}.pdf`, url: "#", kind: "file" }],
  };
}

export const DEMO_MATERIALS: LearningResourceRecord[] = [
  makeMaterial("m1", "Electrostatics Revision Notes", "Physics", "demo-sub-physics", "Complete revision notes covering Coulomb's law, electric field, potential, capacitors and dielectrics.", 1),
  makeMaterial("m2", "Organic Chemistry Formula Sheet", "Chemistry", "demo-sub-chemistry", "All important named reactions, reagents and mechanisms for NEET organic chemistry.", 3),
  makeMaterial("m3", "Cell Division Diagrams — Mitosis & Meiosis", "Biology", "demo-sub-biology", "Annotated diagrams for all stages of mitosis and meiosis with key differences table.", 5),
  makeMaterial("m4", "JEE Mock #13 Solutions", "Physics", "demo-sub-physics", "Detailed solutions with alternate methods for all 30 questions from Mock #13.", 7),
  makeMaterial("m5", "Integration Practice Problems (200Q)", "Mathematics", "demo-sub-math", "200 practice problems on integration techniques: substitution, by parts, partial fractions.", 10),
  makeMaterial("m6", "NEET Biology Flashcards – Genetics", "Biology", "demo-sub-biology", "Quick reference flashcards covering genetics, heredity and evolution for last-minute revision.", 14, "all"),
  makeMaterial("m7", "Thermodynamics Quick Reference", "Chemistry", "demo-sub-chemistry", "Concise notes on laws of thermodynamics, enthalpy, entropy and Gibbs free energy.", 18),
  makeMaterial("m8", "Previous 10 Years NEET Physics MCQs", "Physics", "demo-sub-physics", "Topicwise collection of NEET physics MCQs from 2015–2025 with answer key.", 22, "all"),
];

// ─── Complaints ───────────────────────────────────────────────────────────────
export const DEMO_COMPLAINTS: StudentComplaintRecord[] = [
  {
    id: "comp1",
    studentUserId: "demo-student-001",
    studentName: "Aanya Verma",
    classId: CLASS_ID_11B,
    className: CLASS_NAME_11B,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    regionId: REGION_ID,
    subject: "Classroom Facilities",
    description: "The projector in Hall C has been malfunctioning for the past two weeks. It affects the physics lectures where diagrams need to be displayed. Please arrange for a replacement or repair.",
    status: "in_progress",
    adminReply: "Acknowledged. The projector has been sent for repair and a spare unit will be deployed by Jun 14.",
    createdAtIso: new Date(Date.now() - 14 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 3 * 864e5).toISOString(),
    attachments: [],
  },
  {
    id: "comp2",
    studentUserId: "demo-student-001",
    studentName: "Aanya Verma",
    classId: CLASS_ID_11B,
    className: CLASS_NAME_11B,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    regionId: REGION_ID,
    subject: "Study Material",
    description: "The Biology study material for chapters 7 and 8 has not been distributed yet. Other students in the batch already have it from last year's reprint.",
    status: "resolved",
    adminReply: "Study material for chapters 7–8 has been dispatched. Collect from the front desk.",
    createdAtIso: new Date(Date.now() - 28 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 20 * 864e5).toISOString(),
    attachments: [],
  },
  {
    id: "comp3",
    studentUserId: "demo-student-001",
    studentName: "Aanya Verma",
    classId: CLASS_ID_11B,
    className: CLASS_NAME_11B,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    regionId: REGION_ID,
    subject: "Attendance",
    description: "My attendance for May 28 has been marked absent but I was present in all three classes that day. Please check the records.",
    status: "open",
    adminReply: "",
    createdAtIso: new Date(Date.now() - 10 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 10 * 864e5).toISOString(),
    attachments: [],
  },
];

// ─── Doubts ───────────────────────────────────────────────────────────────────
export const DEMO_DOUBTS: StudentDoubtRecord[] = [
  {
    id: "d1",
    studentUserId: "demo-student-001",
    studentName: "Aanya Verma",
    studentClassId: CLASS_ID_11B,
    studentClassName: CLASS_NAME_11B,
    teacherUserId: "demo-teacher-001",
    teacherName: "Mr. Ramesh Kumar",
    subjectId: "demo-sub-physics",
    subjectName: "Physics",
    classSubjectId: `${CLASS_ID_11B}__demo-sub-physics`,
    questionText: "In the derivation of electric field due to a dipole at a general point, how do we resolve axial and equatorial components? I'm confused about the direction of the net field vector at an oblique angle.",
    status: "replied",
    teacherSeen: true,
    studentSeen: false,
    createdAtIso: new Date(Date.now() - 2 * 3600e3).toISOString(),
    updatedAtIso: new Date(Date.now() - 1 * 3600e3).toISOString(),
    attachmentUrl: "",
    attachmentName: "",
  },
  {
    id: "d2",
    studentUserId: "demo-student-001",
    studentName: "Aanya Verma",
    studentClassId: CLASS_ID_11B,
    studentClassName: CLASS_NAME_11B,
    teacherUserId: "demo-teacher-002",
    teacherName: "Ms. Priya Sharma",
    subjectId: "demo-sub-chemistry",
    subjectName: "Chemistry",
    classSubjectId: `${CLASS_ID_11B}__demo-sub-chemistry`,
    questionText: "Why does SN2 reaction fail for tertiary halides despite having a good leaving group? Is it purely steric or are electronic factors also involved?",
    status: "open",
    teacherSeen: false,
    studentSeen: true,
    createdAtIso: new Date(Date.now() - 5 * 3600e3).toISOString(),
    updatedAtIso: new Date(Date.now() - 5 * 3600e3).toISOString(),
    attachmentUrl: "",
    attachmentName: "",
  },
  {
    id: "d3",
    studentUserId: "demo-student-001",
    studentName: "Aanya Verma",
    studentClassId: CLASS_ID_11B,
    studentClassName: CLASS_NAME_11B,
    teacherUserId: "demo-teacher-004",
    teacherName: "Mr. Suresh Nair",
    subjectId: "demo-sub-biology",
    subjectName: "Biology",
    classSubjectId: `${CLASS_ID_11B}__demo-sub-biology`,
    questionText: "Difference between incomplete dominance and codominance with examples from NEET perspective? The NCERT explanation seems contradictory in some places.",
    status: "resolved",
    teacherSeen: true,
    studentSeen: true,
    createdAtIso: new Date(Date.now() - 2 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 1 * 864e5).toISOString(),
    attachmentUrl: "",
    attachmentName: "",
  },
  {
    id: "d4",
    studentUserId: "demo-student-001",
    studentName: "Aanya Verma",
    studentClassId: CLASS_ID_11B,
    studentClassName: CLASS_NAME_11B,
    teacherUserId: "demo-teacher-001",
    teacherName: "Mr. Ramesh Kumar",
    subjectId: "demo-sub-physics",
    subjectName: "Physics",
    classSubjectId: `${CLASS_ID_11B}__demo-sub-physics`,
    questionText: "Can you explain the concept of mutual inductance with a numerical example? I struggle with identifying which coil is primary vs secondary in coupled circuits.",
    status: "open",
    teacherSeen: false,
    studentSeen: true,
    createdAtIso: new Date(Date.now() - 3 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 3 * 864e5).toISOString(),
    attachmentUrl: "",
    attachmentName: "",
  },
];

// ─── Leave Requests ───────────────────────────────────────────────────────────
export const DEMO_LEAVE_REQUESTS: StudentLeaveRequestRecord[] = [
  {
    id: "lr1",
    studentUserId: "demo-student-001",
    studentName: "Aanya Verma",
    classId: CLASS_ID_11B,
    className: CLASS_NAME_11B,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    regionId: REGION_ID,
    startDate: "2026-06-25",
    endDate: "2026-06-25",
    reason: "Family function — cousin's wedding ceremony",
    status: "pending",
    adminReply: "",
    requestedAtIso: new Date(Date.now() - 2 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 2 * 864e5).toISOString(),
  },
  {
    id: "lr2",
    studentUserId: "demo-student-001",
    studentName: "Aanya Verma",
    classId: CLASS_ID_11B,
    className: CLASS_NAME_11B,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    regionId: REGION_ID,
    startDate: "2026-05-28",
    endDate: "2026-05-30",
    reason: "Medical leave — viral fever and doctor's advice to rest",
    status: "approved",
    adminReply: "Approved. Please collect missed notes from the class representative.",
    requestedAtIso: new Date(Date.now() - 12 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 10 * 864e5).toISOString(),
  },
  {
    id: "lr3",
    studentUserId: "demo-student-001",
    studentName: "Aanya Verma",
    classId: CLASS_ID_11B,
    className: CLASS_NAME_11B,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    regionId: REGION_ID,
    startDate: "2026-05-15",
    endDate: "2026-05-15",
    reason: "Attending national-level science olympiad competition",
    status: "approved",
    adminReply: "Approved. Best of luck!",
    requestedAtIso: new Date(Date.now() - 25 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 24 * 864e5).toISOString(),
  },
  {
    id: "lr4",
    studentUserId: "demo-student-001",
    studentName: "Aanya Verma",
    classId: CLASS_ID_11B,
    className: CLASS_NAME_11B,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    regionId: REGION_ID,
    startDate: "2026-04-18",
    endDate: "2026-04-20",
    reason: "Personal — family emergency",
    status: "rejected",
    adminReply: "Leave cannot be approved during pre-exam period. Please plan accordingly.",
    requestedAtIso: new Date(Date.now() - 52 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 50 * 864e5).toISOString(),
  },
];

// ─── Notifications ────────────────────────────────────────────────────────────
export const DEMO_NOTIFICATIONS: StudentNotificationItem[] = [
  { id: "n1", type: "result", title: "Result published — Electrostatics Unit Test", message: "Your score: 47/50 (94%). Class average: 79%. You ranked 1st in the batch.", createdAtIso: new Date(Date.now() - 4 * 864e5).toISOString(), href: "/(student)/results" },
  { id: "n2", type: "circular", title: "JEE Mock #14 schedule released", message: "CBT on Jun 14 at 1:30 PM in Hall C. Carry hall ticket and report 30 mins early.", createdAtIso: new Date(Date.now() - 0.5 * 864e5).toISOString(), href: "/(student)/circulars" },
  { id: "n3", type: "doubt", title: "Teacher replied to your doubt", message: "Mr. Ramesh Kumar answered your question on electric dipole field.", createdAtIso: new Date(Date.now() - 1 * 3600e3).toISOString(), href: "/(student)/doubts" },
  { id: "n4", type: "material", title: "New material: Electrostatics Revision Notes", message: "Mr. Ramesh Kumar uploaded revision notes for Physics Ch 1–4.", createdAtIso: new Date(Date.now() - 1 * 864e5).toISOString(), href: "/(student)/materials" },
  { id: "n5", type: "leave", title: "Leave request approved", message: "Your leave request for May 28–30 has been approved by the admin.", createdAtIso: new Date(Date.now() - 10 * 864e5).toISOString(), href: "/(student)/other" },
  { id: "n6", type: "circular", title: "Parent-Teacher Meeting — Jun 18", message: "PTM for NEET 11 batches at 10 AM. Please inform your parents.", createdAtIso: new Date(Date.now() - 3 * 864e5).toISOString(), href: "/(student)/circulars" },
  { id: "n7", type: "result", title: "Result published — Organic Chem Mock #3", message: "Your score: 38/50 (76%). Class average: 72%.", createdAtIso: new Date(Date.now() - 8 * 864e5).toISOString(), href: "/(student)/results" },
  { id: "n8", type: "complaint", title: "Complaint update — Classroom Facilities", message: "Your complaint is in progress. Projector repair has been initiated.", createdAtIso: new Date(Date.now() - 3 * 864e5).toISOString(), href: "/(student)/complaints" },
];

// ─── Admin-level leave requests (for admin view) ──────────────────────────────
export const DEMO_ADMIN_LEAVE_REQUESTS: LeaveRequestRecord[] = [
  { id: "al1", staffUserId: "demo-teacher-001", staffName: "Mr. Ramesh Kumar", startDate: "2026-06-12", endDate: "2026-06-13", reason: "Sick leave — viral fever", leaveType: "Sick Leave", status: "pending", centreId: CENTRE_ID, regionId: REGION_ID, requestedAtIso: new Date(Date.now() - 2 * 864e5).toISOString() },
  { id: "al2", staffUserId: "demo-teacher-002", staffName: "Ms. Priya Sharma", startDate: "2026-06-15", endDate: "2026-06-15", reason: "Personal leave — family obligation", leaveType: "Personal Leave", status: "pending", centreId: CENTRE_ID, regionId: REGION_ID, requestedAtIso: new Date(Date.now() - 1 * 864e5).toISOString() },
  { id: "al3", staffUserId: "demo-teacher-004", staffName: "Mr. Suresh Nair", startDate: "2026-06-18", endDate: "2026-06-18", reason: "Casual leave", leaveType: "Casual Leave", status: "approved", centreId: CENTRE_ID, regionId: REGION_ID, requestedAtIso: new Date(Date.now() - 5 * 864e5).toISOString() },
  { id: "al4", staffUserId: "demo-teacher-005", staffName: "Ms. Lalita Rao", startDate: "2026-06-20", endDate: "2026-06-22", reason: "Medical leave — surgery follow-up", leaveType: "Sick Leave", status: "rejected", centreId: CENTRE_ID, regionId: REGION_ID, requestedAtIso: new Date(Date.now() - 8 * 864e5).toISOString() },
];

// ─── Getters by role ──────────────────────────────────────────────────────────
export function getDemoAnnouncements() {
  return DEMO_CIRCULARS;
}

export function getDemoStudentResults() {
  return DEMO_RESULTS;
}

export function getDemoStudentAttendance() {
  return DEMO_ATTENDANCE;
}

export function getDemoStudentSchedules() {
  return { timetableEntries: DEMO_TIMETABLE, tests: DEMO_TEST_SCHEDULES };
}

export function getDemoMaterials() {
  return DEMO_MATERIALS;
}

export function getDemoComplaints() {
  return [..._pendingDemoComplaints, ...DEMO_COMPLAINTS].map((c) => {
    const override = _complaintOverrides.get(c.id);
    if (!override) return c;
    return {
      ...c,
      status: override.status,
      adminReply: override.adminReply ?? c.adminReply,
      updatedAtIso: override.updatedAtIso,
    };
  });
}

// ─── Demo persistent queues ────────────────────────────────────────────────────
let _pendingDemoDoubts: StudentDoubtRecord[] = [];
let _pendingDemoLeaves: StudentLeaveRequestRecord[] = [];
let _pendingDemoComplaints: StudentComplaintRecord[] = [];
let _demoSessionSlots: SessionSlotRecord[] = [];
let _demoInquiries: AdmissionInquiryRecord[] = [];
let _demoInquiryFollowUps: Record<string, InquiryFollowUpRecord[]> = {};
let _demoAttendance: Record<string, StudentAttendanceRecord> = {};
let _demoAttendanceLocks: string[] = [];
const _studentLeaveOverrides = new Map<string, "approved" | "rejected">();
const _staffLeaveOverrides = new Map<string, "approved" | "rejected">();
type ComplaintOverride = { status: StudentComplaintRecord["status"]; adminReply?: string; updatedAtIso: string };
const _complaintOverrides = new Map<string, ComplaintOverride>();

const KEY_DOUBTS = "cls:demo-pending-doubts";
const KEY_LEAVES = "cls:demo-pending-leaves";
const KEY_COMPLAINTS = "cls:demo-pending-complaints";
const KEY_STUDENT_OVERRIDES = "cls:demo-leave-overrides";
const KEY_STAFF_OVERRIDES = "cls:demo-staff-overrides";
const KEY_COMPLAINT_OVERRIDES = "cls:demo-complaint-overrides";
const KEY_SESSIONS = "cls:demo-session-slots";
const KEY_INQUIRIES = "cls:demo-inquiries";
const KEY_INQUIRY_FOLLOWUPS = "cls:demo-inquiry-followups";
const KEY_ATTENDANCE = "cls:demo-attendance";
const KEY_ATT_LOCKS = "cls:demo-attendance-locks";
const KEY_FEE_STRUCTURES = "cls:demo-fee-structures";
const KEY_STUDENT_FEES = "cls:demo-student-fees";
const KEY_FEE_PAYMENTS = "cls:demo-fee-payments";
let _demoFeeStructures: FeeStructureRecord[] = [];
let _demoStudentFees: StudentFeeRecord[] = [];
let _demoFeePayments: FeePaymentRecord[] = [];
let _hydrated = false;

export async function hydrateDemoState(): Promise<void> {
  if (_hydrated) return;
  _hydrated = true;
  try {
    const [doubtsRaw, leavesRaw, complaintsRaw, studentOvRaw, staffOvRaw, sessionsRaw, attendanceRaw, locksRaw, complaintOvRaw, inquiriesRaw, followUpsRaw, feeStructuresRaw, studentFeesRaw, feePaymentsRaw] = await Promise.all([
      AsyncStorage.getItem(KEY_DOUBTS),
      AsyncStorage.getItem(KEY_LEAVES),
      AsyncStorage.getItem(KEY_COMPLAINTS),
      AsyncStorage.getItem(KEY_STUDENT_OVERRIDES),
      AsyncStorage.getItem(KEY_STAFF_OVERRIDES),
      AsyncStorage.getItem(KEY_SESSIONS),
      AsyncStorage.getItem(KEY_ATTENDANCE),
      AsyncStorage.getItem(KEY_ATT_LOCKS),
      AsyncStorage.getItem(KEY_COMPLAINT_OVERRIDES),
      AsyncStorage.getItem(KEY_INQUIRIES),
      AsyncStorage.getItem(KEY_INQUIRY_FOLLOWUPS),
      AsyncStorage.getItem(KEY_FEE_STRUCTURES),
      AsyncStorage.getItem(KEY_STUDENT_FEES),
      AsyncStorage.getItem(KEY_FEE_PAYMENTS),
    ]);
    if (doubtsRaw) _pendingDemoDoubts = JSON.parse(doubtsRaw) as StudentDoubtRecord[];
    if (leavesRaw) _pendingDemoLeaves = JSON.parse(leavesRaw) as StudentLeaveRequestRecord[];
    if (complaintsRaw) _pendingDemoComplaints = JSON.parse(complaintsRaw) as StudentComplaintRecord[];
    if (sessionsRaw) _demoSessionSlots = JSON.parse(sessionsRaw) as SessionSlotRecord[];
    // Inquiries: use stored if present, otherwise seed sample leads so admin/HT
    // have data to see in demo mode.
    if (inquiriesRaw) {
      _demoInquiries = JSON.parse(inquiriesRaw) as AdmissionInquiryRecord[];
      _demoInquiryFollowUps = followUpsRaw ? (JSON.parse(followUpsRaw) as Record<string, InquiryFollowUpRecord[]>) : {};
    } else {
      seedDemoInquiries();
    }
    if (attendanceRaw) _demoAttendance = JSON.parse(attendanceRaw) as Record<string, StudentAttendanceRecord>;
    if (locksRaw) _demoAttendanceLocks = JSON.parse(locksRaw) as string[];
    if (feeStructuresRaw) _demoFeeStructures = JSON.parse(feeStructuresRaw) as FeeStructureRecord[];
    if (studentFeesRaw) _demoStudentFees = JSON.parse(studentFeesRaw) as StudentFeeRecord[];
    if (feePaymentsRaw) _demoFeePayments = JSON.parse(feePaymentsRaw) as FeePaymentRecord[];
    if (studentOvRaw) {
      const entries = JSON.parse(studentOvRaw) as Array<[string, "approved" | "rejected"]>;
      for (const [k, v] of entries) _studentLeaveOverrides.set(k, v);
    }
    if (staffOvRaw) {
      const entries = JSON.parse(staffOvRaw) as Array<[string, "approved" | "rejected"]>;
      for (const [k, v] of entries) _staffLeaveOverrides.set(k, v);
    }
    if (complaintOvRaw) {
      const entries = JSON.parse(complaintOvRaw) as Array<[string, ComplaintOverride]>;
      for (const [k, v] of entries) _complaintOverrides.set(k, v);
    }
  } catch {}
}

export function addDemoPendingDoubt(doubt: StudentDoubtRecord) {
  _pendingDemoDoubts.unshift(doubt);
  void AsyncStorage.setItem(KEY_DOUBTS, JSON.stringify(_pendingDemoDoubts));
}

export function addDemoPendingLeave(req: StudentLeaveRequestRecord) {
  _pendingDemoLeaves.unshift(req);
  void AsyncStorage.setItem(KEY_LEAVES, JSON.stringify(_pendingDemoLeaves));
}

export function addDemoPendingComplaint(complaint: StudentComplaintRecord) {
  _pendingDemoComplaints.unshift(complaint);
  void AsyncStorage.setItem(KEY_COMPLAINTS, JSON.stringify(_pendingDemoComplaints));
}

export function setDemoStudentLeaveStatus(id: string, status: "approved" | "rejected") {
  _studentLeaveOverrides.set(id, status);
  void AsyncStorage.setItem(KEY_STUDENT_OVERRIDES, JSON.stringify(Array.from(_studentLeaveOverrides.entries())));
}

export function setDemoStaffLeaveStatus(id: string, status: "approved" | "rejected") {
  _staffLeaveOverrides.set(id, status);
  void AsyncStorage.setItem(KEY_STAFF_OVERRIDES, JSON.stringify(Array.from(_staffLeaveOverrides.entries())));
}

export function setDemoComplaintResolution(
  id: string,
  status: StudentComplaintRecord["status"],
  adminReply?: string,
) {
  const prev = _complaintOverrides.get(id);
  _complaintOverrides.set(id, {
    status,
    adminReply: adminReply ?? prev?.adminReply,
    updatedAtIso: new Date().toISOString(),
  });
  void AsyncStorage.setItem(KEY_COMPLAINT_OVERRIDES, JSON.stringify(Array.from(_complaintOverrides.entries())));
}

// ─── Demo session slots ─────────────────────────────────────────────────────
function persistDemoSessions() {
  void AsyncStorage.setItem(KEY_SESSIONS, JSON.stringify(_demoSessionSlots));
}

export function getDemoSessionSlots(): SessionSlotRecord[] {
  return _demoSessionSlots;
}

export function addDemoSessionSlot(slot: SessionSlotRecord) {
  _demoSessionSlots.unshift(slot);
  persistDemoSessions();
}

export function updateDemoSessionSlot(id: string, patch: Partial<SessionSlotRecord>) {
  _demoSessionSlots = _demoSessionSlots.map((s) => (s.id === id ? { ...s, ...patch } : s));
  persistDemoSessions();
}

export function deleteDemoSessionSlot(id: string) {
  _demoSessionSlots = _demoSessionSlots.filter((s) => s.id !== id);
  persistDemoSessions();
}

// ─── Demo fee system ────────────────────────────────────────────────────────
function persistDemoFeeStructures() {
  void AsyncStorage.setItem(KEY_FEE_STRUCTURES, JSON.stringify(_demoFeeStructures));
}
function persistDemoStudentFees() {
  void AsyncStorage.setItem(KEY_STUDENT_FEES, JSON.stringify(_demoStudentFees));
}
function persistDemoFeePayments() {
  void AsyncStorage.setItem(KEY_FEE_PAYMENTS, JSON.stringify(_demoFeePayments));
}

export function getDemoFeeStructures(): FeeStructureRecord[] {
  return _demoFeeStructures;
}

export function upsertDemoFeeStructure(record: FeeStructureRecord) {
  const idx = _demoFeeStructures.findIndex((s) => s.id === record.id);
  if (idx >= 0) _demoFeeStructures[idx] = record;
  else _demoFeeStructures.unshift(record);
  persistDemoFeeStructures();
}

export function deleteDemoFeeStructure(id: string) {
  _demoFeeStructures = _demoFeeStructures.filter((s) => s.id !== id);
  persistDemoFeeStructures();
}

export function getDemoStudentFees(): StudentFeeRecord[] {
  return _demoStudentFees;
}

export function addDemoStudentFees(records: StudentFeeRecord[]) {
  const existing = new Set(_demoStudentFees.map((f) => f.id));
  const fresh = records.filter((r) => !existing.has(r.id));
  _demoStudentFees = [..._demoStudentFees, ...fresh];
  persistDemoStudentFees();
}

export function updateDemoStudentFee(id: string, patch: Partial<StudentFeeRecord>) {
  _demoStudentFees = _demoStudentFees.map((f) => (f.id === id ? { ...f, ...patch } : f));
  persistDemoStudentFees();
}

export function getDemoFeePayments(): FeePaymentRecord[] {
  return _demoFeePayments;
}

export function addDemoFeePayment(payment: FeePaymentRecord) {
  _demoFeePayments.unshift(payment);
  persistDemoFeePayments();
}

export function updateDemoFeePayment(id: string, patch: Partial<FeePaymentRecord>) {
  _demoFeePayments = _demoFeePayments.map((p) => (p.id === id ? { ...p, ...patch } : p));
  persistDemoFeePayments();
}

// ─── Demo admission inquiries ───────────────────────────────────────────────
function persistDemoInquiries() {
  void AsyncStorage.setItem(KEY_INQUIRIES, JSON.stringify(_demoInquiries));
  void AsyncStorage.setItem(KEY_INQUIRY_FOLLOWUPS, JSON.stringify(_demoInquiryFollowUps));
}

function daysFromNowIso(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}

function daysFromNowDate(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

function seedDemoInquiries() {
  const ht = { id: "demo-ht-001", name: "Ishika Sharma" };
  const base = {
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    regionId: REGION_ID,
    regionName: REGION_NAME,
    createdByUserId: ht.id,
    createdByName: ht.name,
    assignedToUserId: ht.id,
    assignedToName: ht.name,
    updatedByUserId: ht.id,
    updatedByName: ht.name,
  };
  _demoInquiries = [
    {
      id: "demo-inq-001",
      studentName: "Arya Agarwal",
      phone: "7000068365",
      phoneKey: "7000068365",
      email: "arya.agarwal@example.com",
      course: "10th Foundation",
      mode: "phone",
      status: "demo_scheduled",
      remark: "Will join demo class tomorrow.",
      followUpCount: 2,
      lastContactedAtIso: daysFromNowIso(-1),
      nextFollowUpDate: daysFromNowDate(1),
      createdAtIso: daysFromNowIso(-3),
      updatedAtIso: daysFromNowIso(-1),
      ...base,
    },
    {
      id: "demo-inq-002",
      studentName: "Anagha Mishra",
      phone: "8827256970",
      phoneKey: "8827256970",
      email: "anagha.mishra@example.com",
      course: "11th NEET",
      mode: "walk_in",
      status: "demo_attended",
      remark: "Joined the demo class today; parents reviewing fee.",
      followUpCount: 3,
      lastContactedAtIso: daysFromNowIso(0),
      nextFollowUpDate: daysFromNowDate(2),
      createdAtIso: daysFromNowIso(-5),
      updatedAtIso: daysFromNowIso(0),
      ...base,
    },
    {
      id: "demo-inq-003",
      studentName: "Prince Verma",
      phone: "9303012345",
      phoneKey: "9303012345",
      email: "",
      course: "12th JEE",
      mode: "reference",
      status: "contacted",
      remark: "Referred by current student; call back after school hours.",
      followUpCount: 1,
      lastContactedAtIso: daysFromNowIso(-2),
      nextFollowUpDate: daysFromNowDate(-1), // overdue
      createdAtIso: daysFromNowIso(-2),
      updatedAtIso: daysFromNowIso(-2),
      ...base,
    },
    {
      id: "demo-inq-004",
      studentName: "Mihir Sahu",
      phone: "7771234567",
      phoneKey: "7771234567",
      email: "mihir.sahu@example.com",
      course: "11th NEET",
      mode: "walk_in",
      status: "enrolled",
      remark: "Admission confirmed; fee paid.",
      followUpCount: 4,
      lastContactedAtIso: daysFromNowIso(-1),
      nextFollowUpDate: "",
      createdAtIso: daysFromNowIso(-9),
      updatedAtIso: daysFromNowIso(-1),
      ...base,
    },
    {
      id: "demo-inq-005",
      studentName: "Pokhan Yadav",
      phone: "9425098765",
      phoneKey: "9425098765",
      email: "pokhan.y@example.com",
      course: "10th Foundation",
      mode: "online",
      status: "new",
      remark: "Enquired via website form; not yet contacted.",
      followUpCount: 1,
      lastContactedAtIso: daysFromNowIso(0),
      nextFollowUpDate: daysFromNowDate(0),
      createdAtIso: daysFromNowIso(0),
      updatedAtIso: daysFromNowIso(0),
      ...base,
    },
  ];
  _demoInquiryFollowUps = {
    "demo-inq-001": [
      { id: "demo-fu-001a", note: "First call — interested in 10th foundation batch.", mode: "phone", outcome: "new", nextFollowUpDate: daysFromNowDate(-1), byUserId: ht.id, byName: ht.name, createdAtIso: daysFromNowIso(-3) },
      { id: "demo-fu-001b", note: "Scheduled a demo class for tomorrow.", mode: "phone", outcome: "demo_scheduled", nextFollowUpDate: daysFromNowDate(1), byUserId: ht.id, byName: ht.name, createdAtIso: daysFromNowIso(-1) },
    ],
    "demo-inq-002": [
      { id: "demo-fu-002a", note: "Walked into office, took batch details.", mode: "walk_in", outcome: "new", nextFollowUpDate: "", byUserId: ht.id, byName: ht.name, createdAtIso: daysFromNowIso(-5) },
      { id: "demo-fu-002b", note: "Called to invite for demo.", mode: "phone", outcome: "demo_scheduled", nextFollowUpDate: daysFromNowDate(0), byUserId: ht.id, byName: ht.name, createdAtIso: daysFromNowIso(-2) },
      { id: "demo-fu-002c", note: "Attended demo class; parents reviewing fee.", mode: "walk_in", outcome: "demo_attended", nextFollowUpDate: daysFromNowDate(2), byUserId: ht.id, byName: ht.name, createdAtIso: daysFromNowIso(0) },
    ],
    "demo-inq-003": [
      { id: "demo-fu-003a", note: "Referred by current student; call back after school.", mode: "reference", outcome: "contacted", nextFollowUpDate: daysFromNowDate(-1), byUserId: ht.id, byName: ht.name, createdAtIso: daysFromNowIso(-2) },
    ],
    "demo-inq-004": [
      { id: "demo-fu-004d", note: "Admission confirmed; fee paid.", mode: "walk_in", outcome: "enrolled", nextFollowUpDate: "", byUserId: ht.id, byName: ht.name, createdAtIso: daysFromNowIso(-1) },
    ],
    "demo-inq-005": [
      { id: "demo-fu-005a", note: "Website enquiry received.", mode: "online", outcome: "new", nextFollowUpDate: daysFromNowDate(0), byUserId: ht.id, byName: ht.name, createdAtIso: daysFromNowIso(0) },
    ],
  };
}

export function getDemoInquiries(): AdmissionInquiryRecord[] {
  return _demoInquiries;
}

export function getDemoInquiryFollowUps(inquiryId: string): InquiryFollowUpRecord[] {
  return _demoInquiryFollowUps[inquiryId] ?? [];
}

export function addDemoInquiry(inquiry: AdmissionInquiryRecord, followUp: InquiryFollowUpRecord) {
  _demoInquiries.unshift(inquiry);
  _demoInquiryFollowUps[inquiry.id] = [followUp];
  persistDemoInquiries();
}

export function addDemoInquiryFollowUp(inquiryId: string, followUp: InquiryFollowUpRecord, patch: Partial<AdmissionInquiryRecord>) {
  _demoInquiryFollowUps[inquiryId] = [...(_demoInquiryFollowUps[inquiryId] ?? []), followUp];
  _demoInquiries = _demoInquiries.map((i) => (i.id === inquiryId ? { ...i, ...patch } : i));
  persistDemoInquiries();
}

// ─── Demo attendance + locks ────────────────────────────────────────────────
export function getDemoAttendanceForClass(classId: string, date: string): StudentAttendanceRecord[] {
  return Object.values(_demoAttendance).filter((r) => r.classId === classId && r.attendanceDate === date);
}

export function setDemoAttendance(record: StudentAttendanceRecord) {
  _demoAttendance[`${record.studentUserId}__${record.attendanceDate}`] = record;
  void AsyncStorage.setItem(KEY_ATTENDANCE, JSON.stringify(_demoAttendance));
}

export function isDemoAttendanceLocked(classId: string, date: string): boolean {
  return _demoAttendanceLocks.includes(`${classId}__${date}`);
}

export function lockDemoAttendance(classId: string, date: string) {
  const key = `${classId}__${date}`;
  if (!_demoAttendanceLocks.includes(key)) {
    _demoAttendanceLocks.push(key);
    void AsyncStorage.setItem(KEY_ATT_LOCKS, JSON.stringify(_demoAttendanceLocks));
  }
}

export function getDemoDoubts() {
  return [..._pendingDemoDoubts, ...DEMO_DOUBTS];
}

export function getDemoLeaveRequests() {
  const all = [..._pendingDemoLeaves, ...DEMO_LEAVE_REQUESTS];
  return all.map((r) => {
    const override = _studentLeaveOverrides.get(r.id);
    return override ? { ...r, status: override } : r;
  });
}

export function getDemoAdminLeaveRequestsWithOverrides() {
  return DEMO_ADMIN_LEAVE_REQUESTS.map((r) => {
    const override = _staffLeaveOverrides.get(r.id);
    return override ? { ...r, status: override } : r;
  });
}

export function getDemoNotifications() {
  return DEMO_NOTIFICATIONS;
}

export function getDemoAdminLeaveRequests() {
  return DEMO_ADMIN_LEAVE_REQUESTS;
}

// ─── HT Demo Students ─────────────────────────────────────────────────────────
function makeStudent(
  userId: string,
  name: string,
  roll: string,
  classId: string,
  className: string,
  phone: string,
  parentName: string,
  dob: string,
  gender: "Male" | "Female",
): UserProfileRecord {
  return {
    userId,
    name,
    fullName: name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@demo.cls`,
    role: "student",
    accountType: "student",
    regionId: REGION_ID,
    regionName: REGION_NAME,
    centreId: CENTRE_ID,
    centreName: CENTRE_NAME,
    branch: className,
    teacherId: "",
    teacherRole: "",
    teacher_role: "",
    teacherClassIds: [],
    teacherClassNames: [],
    teacherSubjectIds: [],
    teacherSubjectNames: [],
    teacher_class_ids: [],
    teacher_class_names: [],
    teacher_subject_ids: [],
    teacher_subject_names: [],
    employeeId: "",
    employee_id: "",
    employeeType: "",
    employeeCompetitiveExam: "",
    employeeQualification: "",
    employeeSubject: "",
    studentId: `CLS-ST-${roll}`,
    rollNumber: roll,
    classId,
    className,
    studentClass: className,
    age: "",
    dateOfBirth: dob,
    gender,
    phone,
    address: "Raipur, Chhattisgarh",
    passportPhotoDataUrl: "",
    passportPhotoName: "",
    parentOneName: parentName,
    parentOneAge: "",
    parentOneEmail: "",
    parentTwoName: "",
    parentTwoAge: "",
    parentTwoEmail: "",
    salaryAccountHolderName: "",
    salaryBankName: "",
    salaryAccountNumber: "",
    salaryIfscCode: "",
    salaryUpiId: "",
    baseSalary: 0,
    passwordHash: "",
    password_hash: "",
    emailVerified: false,
  } as unknown as UserProfileRecord;
}

export const DEMO_HT_STUDENTS: UserProfileRecord[] = [
  // NEET 11-B
  makeStudent("demo-st-11b-001", "Aanya Verma",   "011", CLASS_ID_11B, CLASS_NAME_11B, "+91 98765 43210", "Ramesh Verma",    "2008-03-14", "Female"),
  makeStudent("demo-st-11b-002", "Arjun Singh",    "012", CLASS_ID_11B, CLASS_NAME_11B, "+91 98712 34567", "Rajiv Singh",     "2008-07-22", "Male"),
  makeStudent("demo-st-11b-003", "Karthik Reddy",  "013", CLASS_ID_11B, CLASS_NAME_11B, "+91 97654 32100", "Suresh Reddy",    "2008-01-30", "Male"),
  makeStudent("demo-st-11b-004", "Rahul Sharma",   "014", CLASS_ID_11B, CLASS_NAME_11B, "+91 96543 21098", "Vikas Sharma",    "2007-11-05", "Male"),
  makeStudent("demo-st-11b-005", "Sneha Gupta",    "015", CLASS_ID_11B, CLASS_NAME_11B, "+91 95432 10987", "Alok Gupta",      "2008-05-18", "Female"),
  makeStudent("demo-st-11b-006", "Vikram Nair",    "016", CLASS_ID_11B, CLASS_NAME_11B, "+91 94321 09876", "Prakash Nair",    "2007-09-12", "Male"),
  makeStudent("demo-st-11b-007", "Pooja Mishra",   "017", CLASS_ID_11B, CLASS_NAME_11B, "+91 93210 98765", "Deepak Mishra",   "2008-02-27", "Female"),
  makeStudent("demo-st-11b-008", "Tanmay Das",     "018", CLASS_ID_11B, CLASS_NAME_11B, "+91 92109 87654", "Subhash Das",     "2008-06-03", "Male"),
  // NEET 12-A
  makeStudent("demo-st-12a-001", "Priya Joshi",    "021", CLASS_ID_12A, CLASS_NAME_12A, "+91 99001 12345", "Mohan Joshi",     "2007-04-09", "Female"),
  makeStudent("demo-st-12a-002", "Sahil Kumar",    "022", CLASS_ID_12A, CLASS_NAME_12A, "+91 99002 23456", "Dinesh Kumar",    "2007-08-15", "Male"),
  makeStudent("demo-st-12a-003", "Ritika Agarwal", "023", CLASS_ID_12A, CLASS_NAME_12A, "+91 99003 34567", "Harish Agarwal",  "2007-12-22", "Female"),
  makeStudent("demo-st-12a-004", "Dev Patel",      "024", CLASS_ID_12A, CLASS_NAME_12A, "+91 99004 45678", "Naresh Patel",    "2007-03-30", "Male"),
  makeStudent("demo-st-12a-005", "Ananya Roy",     "025", CLASS_ID_12A, CLASS_NAME_12A, "+91 99005 56789", "Sudipta Roy",     "2007-06-17", "Female"),
  makeStudent("demo-st-12a-006", "Nikhil Sharma",  "026", CLASS_ID_12A, CLASS_NAME_12A, "+91 99006 67890", "Praveen Sharma",  "2007-10-04", "Male"),
  // NEET 11-A
  makeStudent("demo-st-11a-001", "Meera Patel",    "031", CLASS_ID_11A, CLASS_NAME_11A, "+91 88001 11111", "Girish Patel",    "2008-02-14", "Female"),
  makeStudent("demo-st-11a-002", "Tanvi Nair",     "032", CLASS_ID_11A, CLASS_NAME_11A, "+91 88002 22222", "Ravi Nair",       "2007-11-28", "Female"),
  makeStudent("demo-st-11a-003", "Deepak Verma",   "033", CLASS_ID_11A, CLASS_NAME_11A, "+91 88003 33333", "Ashok Verma",     "2008-04-05", "Male"),
  makeStudent("demo-st-11a-004", "Sonal Singh",    "034", CLASS_ID_11A, CLASS_NAME_11A, "+91 88004 44444", "Brijesh Singh",   "2008-07-19", "Female"),
  makeStudent("demo-st-11a-005", "Rohan Kumar",    "035", CLASS_ID_11A, CLASS_NAME_11A, "+91 88005 55555", "Manoj Kumar",     "2007-09-08", "Male"),
  makeStudent("demo-st-11a-006", "Ishita Jain",    "036", CLASS_ID_11A, CLASS_NAME_11A, "+91 88006 66666", "Sanjay Jain",     "2008-01-23", "Female"),
];

// ─── HT Demo Results (uploaded by Dr. Anand Joshi / demo-teacher-003) ─────────
function makeHTResult(
  id: string,
  studentUserId: string,
  studentName: string,
  classId: string,
  className: string,
  subjectId: string,
  subjectName: string,
  title: string,
  score: number,
  maxScore: number,
  daysAgo: number,
): StudentResultRecord {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const iso = d.toISOString();
  const pct = score / maxScore;
  return {
    id,
    studentUserId,
    teacherUserId: "demo-teacher-003",
    teacherName: "Dr. Anand Joshi",
    studentName,
    classId,
    className,
    subjectId,
    subjectName,
    subject: subjectName,
    classSubjectId: `${classId}__${subjectId}`,
    assessmentCategory: "class_test",
    assessmentTitle: title,
    score,
    maxScore,
    grade: pct >= 0.9 ? "A+" : pct >= 0.75 ? "A" : pct >= 0.6 ? "B" : "C",
    remarks: pct >= 0.85 ? "Excellent work!" : pct >= 0.7 ? "Good effort." : "Needs improvement.",
    assessmentDate: iso.slice(0, 10),
    publishedAtIso: iso,
    classAveragePercent: null,
  };
}

const PHY_MARKS_11B  = [47, 38, 42, 44, 35, 29, 40, 33];
const CHEM_MARKS_11B = [41, 36, 44, 39, 28, 32, 46, 30];
const PHY_MARKS_12A  = [38, 45, 29, 42, 36, 31];
const BIO_MARKS_11A  = [44, 38, 42, 35, 47, 40];
const PHY_MARKS_11A  = [36, 41, 28, 45, 33, 38];

const STUDENTS_11B = DEMO_HT_STUDENTS.filter((s) => s.classId === CLASS_ID_11B);
const STUDENTS_12A = DEMO_HT_STUDENTS.filter((s) => s.classId === CLASS_ID_12A);
const STUDENTS_11A = DEMO_HT_STUDENTS.filter((s) => s.classId === CLASS_ID_11A);

export const DEMO_HT_RESULTS: StudentResultRecord[] = [
  // Physics Unit Test — NEET 11-B (daysAgo ~4)
  ...STUDENTS_11B.map((st, i) =>
    makeHTResult(`htr-phy-11b-${i}`, st.userId, st.name, CLASS_ID_11B, CLASS_NAME_11B, "demo-sub-physics", "Physics", "Physics Unit Test — Electrostatics", PHY_MARKS_11B[i] ?? 35, 50, 4)
  ),
  // Chemistry Mock — NEET 11-B (daysAgo ~10)
  ...STUDENTS_11B.map((st, i) =>
    makeHTResult(`htr-chem-11b-${i}`, st.userId, st.name, CLASS_ID_11B, CLASS_NAME_11B, "demo-sub-chemistry", "Chemistry", "Chemistry Mock #2 — Organic", CHEM_MARKS_11B[i] ?? 32, 50, 10)
  ),
  // Physics Quarterly — NEET 12-A (daysAgo ~7)
  ...STUDENTS_12A.map((st, i) =>
    makeHTResult(`htr-phy-12a-${i}`, st.userId, st.name, CLASS_ID_12A, CLASS_NAME_12A, "demo-sub-physics", "Physics", "Physics Quarterly Exam", PHY_MARKS_12A[i] ?? 33, 50, 7)
  ),
  // Biology Unit Test — NEET 11-A (daysAgo ~3)
  ...STUDENTS_11A.map((st, i) =>
    makeHTResult(`htr-bio-11a-${i}`, st.userId, st.name, CLASS_ID_11A, CLASS_NAME_11A, "demo-sub-biology", "Biology", "Biology Unit Test — Genetics", BIO_MARKS_11A[i] ?? 38, 50, 3)
  ),
  // Physics Revision — NEET 11-A (daysAgo ~14)
  ...STUDENTS_11A.map((st, i) =>
    makeHTResult(`htr-phy-11a-${i}`, st.userId, st.name, CLASS_ID_11A, CLASS_NAME_11A, "demo-sub-physics", "Physics", "Physics Revision Test", PHY_MARKS_11A[i] ?? 30, 50, 14)
  ),
];

// ─── HT Demo Doubts (addressed to Dr. Anand Joshi / demo-teacher-003) ─────────
export const DEMO_HT_DOUBTS: StudentDoubtRecord[] = [
  {
    id: "htd1",
    studentUserId: "demo-st-11b-001",
    studentName: "Aanya Verma",
    studentClassId: CLASS_ID_11B,
    studentClassName: CLASS_NAME_11B,
    teacherUserId: "demo-teacher-003",
    teacherName: "Dr. Anand Joshi",
    subjectId: "demo-sub-physics",
    subjectName: "Physics",
    classSubjectId: `${CLASS_ID_11B}__demo-sub-physics`,
    questionText: "In the derivation of electric field due to a dipole at a general point, how do we resolve axial and equatorial components? I'm confused about the direction of the net field vector at an oblique angle.",
    status: "open",
    teacherSeen: false,
    studentSeen: true,
    createdAtIso: new Date(Date.now() - 2 * 3600e3).toISOString(),
    updatedAtIso: new Date(Date.now() - 2 * 3600e3).toISOString(),
    attachmentUrl: "",
    attachmentName: "",
  },
  {
    id: "htd2",
    studentUserId: "demo-st-11b-004",
    studentName: "Rahul Sharma",
    studentClassId: CLASS_ID_11B,
    studentClassName: CLASS_NAME_11B,
    teacherUserId: "demo-teacher-003",
    teacherName: "Dr. Anand Joshi",
    subjectId: "demo-sub-chemistry",
    subjectName: "Chemistry",
    classSubjectId: `${CLASS_ID_11B}__demo-sub-chemistry`,
    questionText: "Why does SN2 reaction fail for tertiary halides despite having a good leaving group? Is it purely steric or are electronic factors also involved?",
    status: "open",
    teacherSeen: false,
    studentSeen: true,
    createdAtIso: new Date(Date.now() - 5 * 3600e3).toISOString(),
    updatedAtIso: new Date(Date.now() - 5 * 3600e3).toISOString(),
    attachmentUrl: "",
    attachmentName: "",
  },
  {
    id: "htd3",
    studentUserId: "demo-st-11a-001",
    studentName: "Meera Patel",
    studentClassId: CLASS_ID_11A,
    studentClassName: CLASS_NAME_11A,
    teacherUserId: "demo-teacher-003",
    teacherName: "Dr. Anand Joshi",
    subjectId: "demo-sub-physics",
    subjectName: "Physics",
    classSubjectId: `${CLASS_ID_11A}__demo-sub-physics`,
    questionText: "Can you explain mutual inductance with a numerical example? I struggle with identifying which coil is primary vs secondary in coupled circuits.",
    status: "open",
    teacherSeen: false,
    studentSeen: true,
    createdAtIso: new Date(Date.now() - 1 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 1 * 864e5).toISOString(),
    attachmentUrl: "",
    attachmentName: "",
  },
  {
    id: "htd4",
    studentUserId: "demo-st-12a-001",
    studentName: "Priya Joshi",
    studentClassId: CLASS_ID_12A,
    studentClassName: CLASS_NAME_12A,
    teacherUserId: "demo-teacher-003",
    teacherName: "Dr. Anand Joshi",
    subjectId: "demo-sub-chemistry",
    subjectName: "Chemistry",
    classSubjectId: `${CLASS_ID_12A}__demo-sub-chemistry`,
    questionText: "In which cases do we prefer mole fraction over molarity for concentration calculations? NCERT seems inconsistent in its examples.",
    status: "replied",
    teacherSeen: true,
    studentSeen: false,
    createdAtIso: new Date(Date.now() - 2 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 1 * 864e5).toISOString(),
    attachmentUrl: "",
    attachmentName: "",
  },
  {
    id: "htd5",
    studentUserId: "demo-st-11b-003",
    studentName: "Karthik Reddy",
    studentClassId: CLASS_ID_11B,
    studentClassName: CLASS_NAME_11B,
    teacherUserId: "demo-teacher-003",
    teacherName: "Dr. Anand Joshi",
    subjectId: "demo-sub-physics",
    subjectName: "Physics",
    classSubjectId: `${CLASS_ID_11B}__demo-sub-physics`,
    questionText: "How does the concept of superposition work when two waves of different amplitudes and frequencies overlap? Is the resultant wave always periodic?",
    status: "replied",
    teacherSeen: true,
    studentSeen: true,
    createdAtIso: new Date(Date.now() - 3 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 2 * 864e5).toISOString(),
    attachmentUrl: "",
    attachmentName: "",
  },
  {
    id: "htd6",
    studentUserId: "demo-st-11a-005",
    studentName: "Rohan Kumar",
    studentClassId: CLASS_ID_11A,
    studentClassName: CLASS_NAME_11A,
    teacherUserId: "demo-teacher-003",
    teacherName: "Dr. Anand Joshi",
    subjectId: "demo-sub-chemistry",
    subjectName: "Chemistry",
    classSubjectId: `${CLASS_ID_11A}__demo-sub-chemistry`,
    questionText: "Why is the bond angle in H2O (104.5°) less than that in NH3 (107°)? Both have lone pairs but the values are different.",
    status: "resolved",
    teacherSeen: true,
    studentSeen: true,
    createdAtIso: new Date(Date.now() - 5 * 864e5).toISOString(),
    updatedAtIso: new Date(Date.now() - 4 * 864e5).toISOString(),
    attachmentUrl: "",
    attachmentName: "",
  },
];

// ─── HT Demo Attendance (per student, for student-detail view) ────────────────
export function getDemoStudentAttendanceById(userId: string): StudentAttendanceRecord[] {
  const student = DEMO_HT_STUDENTS.find((s) => s.userId === userId);
  if (!student) return DEMO_ATTENDANCE;
  const pattern: Array<"present" | "absent" | "leave"> = [
    "present","present","present","absent","present","present","leave","present",
    "present","present","absent","present","present","present","present","absent",
    "present","present","present","present","leave","present","present","present",
    "present","absent","present","present","present","present",
  ];
  return pattern.map((status, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
      id: `${userId}-att-${i}`,
      studentUserId: userId,
      teacherUserId: "demo-teacher-003",
      teacherName: "Dr. Anand Joshi",
      studentName: student.name,
      studentBranch: student.className,
      classId: student.classId,
      className: student.className,
      attendanceDate: d.toISOString().slice(0, 10),
      status,
    };
  });
}

export function getDemoStudentResultsById(userId: string): StudentResultRecord[] {
  return DEMO_HT_RESULTS.filter((r) => r.studentUserId === userId);
}

export function getDemoStudentProfileById(userId: string): UserProfileRecord | null {
  return DEMO_HT_STUDENTS.find((s) => s.userId === userId) ?? null;
}

export function getDemoHTStudents() {
  return DEMO_HT_STUDENTS;
}

export function getDemoHTResults() {
  return DEMO_HT_RESULTS;
}

export function getDemoHTDoubts() {
  return DEMO_HT_DOUBTS;
}

export function getDemoResultsForAssessment(assessmentTitle: string, classId: string): StudentResultRecord[] {
  return DEMO_HT_RESULTS.filter(
    (r) => r.assessmentTitle === assessmentTitle && r.classId === classId,
  ).sort((a, b) => b.score - a.score);
}

const DEMO_CLASS_SUBJECTS: ClassSubjectRecord[] = [
  {
    id: `${CLASS_ID_11B}__demo-sub-physics`,
    classId: CLASS_ID_11B, class_id: CLASS_ID_11B,
    className: CLASS_NAME_11B,
    subjectId: "demo-sub-physics", subject_id: "demo-sub-physics",
    subjectName: "Physics",
    teacherUserId: "demo-teacher-003", teacherId: "demo-teacher-003", teacher_id: "demo-teacher-003",
    teacherName: "Dr. Anand Joshi",
    centreId: CENTRE_ID, centreName: CENTRE_NAME,
    regionId: REGION_ID, regionName: REGION_NAME,
    active: true,
  },
  {
    id: `${CLASS_ID_11B}__demo-sub-chemistry`,
    classId: CLASS_ID_11B, class_id: CLASS_ID_11B,
    className: CLASS_NAME_11B,
    subjectId: "demo-sub-chemistry", subject_id: "demo-sub-chemistry",
    subjectName: "Chemistry",
    teacherUserId: "demo-teacher-003", teacherId: "demo-teacher-003", teacher_id: "demo-teacher-003",
    teacherName: "Dr. Anand Joshi",
    centreId: CENTRE_ID, centreName: CENTRE_NAME,
    regionId: REGION_ID, regionName: REGION_NAME,
    active: true,
  },
  {
    id: `${CLASS_ID_11B}__demo-sub-maths`,
    classId: CLASS_ID_11B, class_id: CLASS_ID_11B,
    className: CLASS_NAME_11B,
    subjectId: "demo-sub-maths", subject_id: "demo-sub-maths",
    subjectName: "Maths",
    teacherUserId: "demo-teacher-003", teacherId: "demo-teacher-003", teacher_id: "demo-teacher-003",
    teacherName: "Dr. Anand Joshi",
    centreId: CENTRE_ID, centreName: CENTRE_NAME,
    regionId: REGION_ID, regionName: REGION_NAME,
    active: true,
  },
];

export function getDemoClassSubjects(): ClassSubjectRecord[] {
  return DEMO_CLASS_SUBJECTS;
}

const DEMO_DOUBT_REPLIES: Record<string, StudentDoubtReplyRecord[]> = {
  htd2: [
    {
      id: "reply-htd2-1",
      doubtId: "htd2",
      authorUserId: "demo-teacher-003",
      authorName: "Dr. Anand Joshi",
      authorRole: "teacher",
      replyText: "In SN2 reactions, the nucleophile attacks from the back of the leaving group. For a chiral centre, this causes inversion of configuration (Walden inversion). Strong nucleophiles and primary substrates favour SN2.",
      createdAtIso: new Date(Date.now() - 1 * 3600e3).toISOString(),
    },
  ],
  htd4: [
    {
      id: "reply-htd4-1",
      doubtId: "htd4",
      authorUserId: "demo-teacher-003",
      authorName: "Dr. Anand Joshi",
      authorRole: "teacher",
      replyText: "Mutual inductance M = μ₀ × N₁ × N₂ × A / l, where A is the cross-sectional area and l is the length of the solenoid. The emf induced in the secondary coil is e = -M × dI/dt.",
      createdAtIso: new Date(Date.now() - 3 * 3600e3).toISOString(),
    },
  ],
};

export function getDemoDoubtReplies(doubtId: string): StudentDoubtReplyRecord[] {
  return DEMO_DOUBT_REPLIES[doubtId] ?? [];
}

export function getDemoClasses(): ClassRecord[] {
  return [
    { id: CLASS_ID_11B, name: CLASS_NAME_11B, regionId: REGION_ID, regionName: REGION_NAME, centreId: CENTRE_ID, centreName: CENTRE_NAME, teacherUserId: "demo-teacher-003", teacherId: "CLS-HT-0001", teacherName: "Dr. Anand Joshi", active: true },
    { id: CLASS_ID_12A, name: CLASS_NAME_12A, regionId: REGION_ID, regionName: REGION_NAME, centreId: CENTRE_ID, centreName: CENTRE_NAME, teacherUserId: "demo-teacher-003", teacherId: "CLS-HT-0001", teacherName: "Dr. Anand Joshi", active: true },
    { id: CLASS_ID_11A, name: CLASS_NAME_11A, regionId: REGION_ID, regionName: REGION_NAME, centreId: CENTRE_ID, centreName: CENTRE_NAME, teacherUserId: "demo-teacher-003", teacherId: "CLS-HT-0001", teacherName: "Dr. Anand Joshi", active: true },
  ];
}
