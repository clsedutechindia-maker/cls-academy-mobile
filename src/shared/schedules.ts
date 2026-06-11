import { normalizeAssessmentTitleKey, type ResultAssessmentCategory } from "./education";

export type ScheduleDayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

export type TimetableSlotTemplate = {
  slotLabel: string;
  startTime: string;
  endTime: string;
};

export const scheduleDayOptions: Array<{ value: ScheduleDayKey; label: string }> = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
];

export const defaultTimetableSlots: TimetableSlotTemplate[] = [
  { slotLabel: "Period 1", startTime: "08:00", endTime: "08:40" },
  { slotLabel: "Period 2", startTime: "08:45", endTime: "09:25" },
  { slotLabel: "Period 3", startTime: "09:30", endTime: "10:10" },
  { slotLabel: "Period 4", startTime: "10:25", endTime: "11:05" },
  { slotLabel: "Period 5", startTime: "11:10", endTime: "11:50" },
  { slotLabel: "Period 6", startTime: "12:20", endTime: "13:00" },
  { slotLabel: "Period 7", startTime: "13:05", endTime: "13:45" },
];

export function buildClassTimetableId(classId: string, dayKey: ScheduleDayKey, slotKey: string) {
  return [classId.trim(), dayKey, slotKey.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")].join("__");
}

export function buildTestScheduleId(
  classSubjectId: string,
  assessmentCategory: ResultAssessmentCategory,
  scheduleDate: string,
  assessmentTitle: string,
) {
  return [
    classSubjectId.trim(),
    assessmentCategory,
    scheduleDate.trim(),
    normalizeAssessmentTitleKey(assessmentTitle),
  ].join("__");
}

export type ClassTimetableRecord = {
  id: string;
  classId: string;
  className: string;
  centreId: string;
  centreName: string;
  regionId: string;
  regionName: string;
  dayKey: ScheduleDayKey;
  slotKey: string;
  slotLabel: string;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  teacherUserId: string;
  teacherName: string;
  notes: string;
  updatedByUserId: string;
  updatedByName: string;
};

export type TestScheduleRecord = {
  id: string;
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
  assessmentCategory: ResultAssessmentCategory;
  assessmentTitle: string;
  scheduleDate: string;
  startTime: string;
  endTime: string;
  notes: string;
  updatedByUserId: string;
  updatedByName: string;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeScheduleDay(value: unknown): ScheduleDayKey {
  if (value === "tuesday" || value === "wednesday" || value === "thursday" || value === "friday" || value === "saturday") {
    return value;
  }

  return "monday";
}

function normalizeScheduleDate(value: unknown) {
  const normalized = normalizeString(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : "";
}

function normalizeTimeValue(value: unknown) {
  const normalized = normalizeString(value);
  return /^\d{2}:\d{2}$/.test(normalized) ? normalized : "";
}

function normalizeAssessmentCategory(value: unknown): ResultAssessmentCategory {
  if (value === "quarterly_exam" || value === "midterm" || value === "final") {
    return value;
  }

  return "class_test";
}

export function formatScheduleDateLabel(value: string) {
  if (!value) {
    return "Date pending";
  }

  const parsedDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function normalizeClassTimetableRecord(
  id: string,
  data: Partial<Omit<ClassTimetableRecord, "id">> | undefined,
): ClassTimetableRecord {
  return {
    id,
    classId: normalizeString(data?.classId),
    className: normalizeString(data?.className),
    centreId: normalizeString(data?.centreId),
    centreName: normalizeString(data?.centreName),
    regionId: normalizeString(data?.regionId),
    regionName: normalizeString(data?.regionName),
    dayKey: normalizeScheduleDay(data?.dayKey),
    slotKey: normalizeString(data?.slotKey),
    slotLabel: normalizeString(data?.slotLabel) || normalizeString(data?.slotKey),
    startTime: normalizeTimeValue(data?.startTime),
    endTime: normalizeTimeValue(data?.endTime),
    subjectId: normalizeString(data?.subjectId),
    subjectName: normalizeString(data?.subjectName),
    teacherUserId: normalizeString(data?.teacherUserId),
    teacherName: normalizeString(data?.teacherName),
    notes: normalizeString(data?.notes),
    updatedByUserId: normalizeString(data?.updatedByUserId),
    updatedByName: normalizeString(data?.updatedByName),
  };
}

// --- Teaching plans (weekly, teacher-authored, admin-approved) ---

export type TeachingPlanStatus = "draft" | "submitted" | "approved";

export type TeachingPlanRow = {
  date: string; // YYYY-MM-DD
  day: string; // weekday label, e.g. "Monday"
  topics: string;
};

export type TeachingPlanRecord = {
  id: string;
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
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM
  unitName: string;
  classTime: string;
  rows: TeachingPlanRow[];
  status: TeachingPlanStatus;
  reviewNote: string;
  submittedAtIso: string;
  approvedByUserId: string;
  approvedByName: string;
  approvedAtIso: string;
  createdAtIso: string;
  updatedAtIso: string;
  updatedByUserId: string;
  updatedByName: string;
};

function normalizeMonthKey(value: unknown) {
  const normalized = normalizeString(value);
  return /^\d{4}-\d{2}$/.test(normalized) ? normalized : "";
}

function normalizeTeachingPlanStatus(value: unknown): TeachingPlanStatus {
  if (value === "submitted" || value === "approved") return value;
  return "draft";
}

function normalizeTeachingPlanRows(value: unknown): TeachingPlanRow[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const row = (entry ?? {}) as Record<string, unknown>;
    return {
      date: normalizeScheduleDate(row.date),
      day: normalizeString(row.day),
      topics: normalizeString(row.topics),
    };
  });
}

export function buildTeachingPlanId(classSubjectId: string, weekStartDate: string) {
  return `${classSubjectId.trim()}__${weekStartDate.trim()}`;
}

export function normalizeTeachingPlanRecord(
  id: string,
  data: Partial<Omit<TeachingPlanRecord, "id">> | undefined,
): TeachingPlanRecord {
  return {
    id,
    classId: normalizeString(data?.classId),
    className: normalizeString(data?.className),
    classSubjectId: normalizeString(data?.classSubjectId),
    subjectId: normalizeString(data?.subjectId),
    subjectName: normalizeString(data?.subjectName),
    teacherUserId: normalizeString(data?.teacherUserId),
    teacherName: normalizeString(data?.teacherName),
    centreId: normalizeString(data?.centreId),
    centreName: normalizeString(data?.centreName),
    regionId: normalizeString(data?.regionId),
    regionName: normalizeString(data?.regionName),
    weekStartDate: normalizeScheduleDate(data?.weekStartDate),
    weekEndDate: normalizeScheduleDate(data?.weekEndDate),
    monthKey: normalizeMonthKey(data?.monthKey),
    unitName: normalizeString(data?.unitName),
    classTime: normalizeString(data?.classTime),
    rows: normalizeTeachingPlanRows(data?.rows),
    status: normalizeTeachingPlanStatus(data?.status),
    reviewNote: normalizeString(data?.reviewNote),
    submittedAtIso: normalizeString(data?.submittedAtIso),
    approvedByUserId: normalizeString(data?.approvedByUserId),
    approvedByName: normalizeString(data?.approvedByName),
    approvedAtIso: normalizeString(data?.approvedAtIso),
    createdAtIso: normalizeString(data?.createdAtIso),
    updatedAtIso: normalizeString(data?.updatedAtIso),
    updatedByUserId: normalizeString(data?.updatedByUserId),
    updatedByName: normalizeString(data?.updatedByName),
  };
}

export function normalizeTestScheduleRecord(
  id: string,
  data: Partial<Omit<TestScheduleRecord, "id">> | undefined,
): TestScheduleRecord {
  return {
    id,
    classId: normalizeString(data?.classId),
    className: normalizeString(data?.className),
    classSubjectId: normalizeString(data?.classSubjectId),
    subjectId: normalizeString(data?.subjectId),
    subjectName: normalizeString(data?.subjectName),
    teacherUserId: normalizeString(data?.teacherUserId),
    teacherName: normalizeString(data?.teacherName),
    centreId: normalizeString(data?.centreId),
    centreName: normalizeString(data?.centreName),
    regionId: normalizeString(data?.regionId),
    regionName: normalizeString(data?.regionName),
    assessmentCategory: normalizeAssessmentCategory(data?.assessmentCategory),
    assessmentTitle: normalizeString(data?.assessmentTitle) || "Assessment",
    scheduleDate: normalizeScheduleDate(data?.scheduleDate),
    startTime: normalizeTimeValue(data?.startTime),
    endTime: normalizeTimeValue(data?.endTime),
    notes: normalizeString(data?.notes),
    updatedByUserId: normalizeString(data?.updatedByUserId),
    updatedByName: normalizeString(data?.updatedByName),
  };
}
