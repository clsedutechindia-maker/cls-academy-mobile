import type { ResultAssessmentCategory } from "./education";

export type ScheduleDayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

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
