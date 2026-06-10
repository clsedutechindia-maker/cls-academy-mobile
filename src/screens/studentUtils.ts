import type { StudentAttendanceRecord, StudentResultRecord } from "../shared";

export const SUBJECT_COLORS = ["#3525cd", "#0f766e", "#b45309", "#be123c", "#2563eb", "#7c3aed"];

export function percent(score: number, maxScore: number) {
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

export function resultDate(result: StudentResultRecord) {
  return result.assessmentDate || result.publishedAtIso?.slice(0, 10) || "";
}

export function subjectColor(subject: string) {
  const total = subject.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return SUBJECT_COLORS[total % SUBJECT_COLORS.length] ?? SUBJECT_COLORS[0]!;
}

const SUBJECT_BG_COLORS = ["#e2dfff", "#ccfbf1", "#fef3c7", "#ffe4e6", "#dbeafe", "#ede9fe"];

export function subjectBgColor(subject: string) {
  const total = subject.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return SUBJECT_BG_COLORS[total % SUBJECT_BG_COLORS.length] ?? SUBJECT_BG_COLORS[0]!;
}

export function daysBetweenInclusive(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
}

export function daysRemaining(dateValue: string) {
  const target = new Date(`${dateValue}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(target.getTime())) return null;
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export function monthKey(dateValue: string) {
  return dateValue.slice(0, 7);
}

export function monthLabel(year: number, monthIndex: number) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, monthIndex, 1));
}

export function attendancePercent(records: StudentAttendanceRecord[]) {
  const marked = records.filter((record) => record.status !== "leave");
  const present = records.filter((record) => record.status === "present").length;
  const total = marked.length || records.length;
  return total > 0 ? Math.round((present / total) * 100) : 0;
}

export function attendanceStatusLabel(value: number) {
  if (value >= 85) return { label: "On Track", tone: "success" as const };
  if (value >= 70) return { label: "At Risk", tone: "warning" as const };
  return { label: "Critical", tone: "danger" as const };
}

export function groupResultsBySubject(results: StudentResultRecord[]) {
  const map = new Map<string, StudentResultRecord[]>();
  for (const result of results) {
    const key = result.subjectName || "General";
    map.set(key, [...(map.get(key) ?? []), result]);
  }
  for (const [subject, items] of map.entries()) {
    map.set(subject, items.sort((a, b) => resultDate(b).localeCompare(resultDate(a))));
  }
  return map;
}

export function resultDelta(result: StudentResultRecord, allResults: StudentResultRecord[]) {
  const subjectResults = allResults
    .filter((item) => (item.subjectId && item.subjectId === result.subjectId) || item.subjectName === result.subjectName)
    .sort((a, b) => resultDate(b).localeCompare(resultDate(a)));
  const index = subjectResults.findIndex((item) => item.id === result.id);
  const previous = index >= 0 ? subjectResults[index + 1] : null;
  if (!previous) return null;
  return percent(result.score, result.maxScore) - percent(previous.score, previous.maxScore);
}
