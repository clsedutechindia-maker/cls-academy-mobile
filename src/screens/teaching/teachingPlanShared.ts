import type { TeachingPlanRow, TeachingPlanStatus } from "../../shared";

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function dayLabelForDate(dateValue: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return "";
  return WEEKDAY[new Date(`${dateValue}T00:00:00`).getDay()] ?? "";
}

export function addDays(dateValue: string, days: number): string {
  const base = new Date(`${dateValue}T00:00:00`);
  base.setDate(base.getDate() + days);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function monthKeyOf(dateValue: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? dateValue.slice(0, 7) : "";
}

function toValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Upcoming Monday (or today if today is Monday).
export function nextMondayValue(): string {
  const d = new Date();
  const offset = (1 - d.getDay() + 7) % 7; // days until next Monday (0 if today is Monday)
  d.setDate(d.getDate() + offset);
  return toValue(d);
}

// Monday of the week containing dateValue (week = Mon–Sun; Sunday snaps back to its Monday).
export function mondayOf(dateValue: string): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? new Date(`${dateValue}T00:00:00`) : new Date();
  const back = (d.getDay() + 6) % 7; // Mon=0 … Sun=6
  d.setDate(d.getDate() - back);
  return toValue(d);
}

// Monday of the current week.
export function thisMonday(): string {
  return mondayOf(toValue(new Date()));
}

// Earliest Monday (from fromMonday onward) that is not already taken.
export function firstOpenWeekStart(taken: Set<string>, fromMonday: string = thisMonday()): string {
  let monday = fromMonday;
  for (let i = 0; i < 104; i += 1) {
    if (!taken.has(monday)) return monday;
    monday = addDays(monday, 7);
  }
  return fromMonday;
}

// Mon–Sat teaching rows starting from the given week-start date.
export function buildWeekRows(weekStartDate: string): TeachingPlanRow[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStartDate)) return [];
  return Array.from({ length: 6 }, (_, i) => {
    const date = addDays(weekStartDate, i);
    return { date, day: dayLabelForDate(date), topics: "" };
  });
}

export function formatDayDate(dateValue: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return "—";
  const d = new Date(`${dateValue}T00:00:00`);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
}

export function formatWeekRange(start: string, end: string): string {
  if (!start) return "Week pending";
  const s = new Date(`${start}T00:00:00`);
  const e = end ? new Date(`${end}T00:00:00`) : s;
  const sStr = `${String(s.getDate()).padStart(2, "0")} ${MONTHS[s.getMonth()]}`;
  const eStr = `${String(e.getDate()).padStart(2, "0")} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  return `${sStr} – ${eStr}`;
}

export function formatMonthLabel(monthKey: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return "Undated";
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTHS[(month ?? 1) - 1]} ${year}`;
}

export const STATUS_META: Record<TeachingPlanStatus, { label: string; fg: string; bg: string }> = {
  draft: { label: "Draft", fg: "#4B3E66", bg: "#EDE9F5" },
  submitted: { label: "In Review", fg: "#B45309", bg: "#FEF3C7" },
  approved: { label: "Approved", fg: "#15803D", bg: "#DCFCE7" },
};
