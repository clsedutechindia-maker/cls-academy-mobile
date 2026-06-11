import type { SessionSlotStatus, SessionType } from "../../shared";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const STATUS_META: Record<SessionSlotStatus, { label: string; fg: string; bg: string }> = {
  open: { label: "Open", fg: "#15803D", bg: "#DCFCE7" },
  requested: { label: "Requested", fg: "#B45309", bg: "#FEF3C7" },
  confirmed: { label: "Confirmed", fg: "#1D4ED8", bg: "#DBEAFE" },
  completed: { label: "Completed", fg: "#4B3E66", bg: "#EDE9F5" },
};

export function sessionTypeLabel(type: SessionType): string {
  if (type === "doubt") return "Doubt Session";
  if (type === "remedial") return "Remedial Class";
  return "Session";
}

function parse(dateValue: string): Date | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? new Date(`${dateValue}T00:00:00`) : null;
}

export function formatSessionDate(dateValue: string): string {
  const d = parse(dateValue);
  if (!d) return "—";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${weekday}, ${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
}

export function formatTime(t: string): string {
  if (!/^\d{2}:\d{2}$/.test(t)) return t || "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = (h ?? 0) >= 12 ? "PM" : "AM";
  const hour = (h ?? 0) % 12 || 12;
  return `${hour}:${String(m ?? 0).padStart(2, "0")} ${ampm}`;
}

export function formatSessionWhen(date: string, start: string, end: string): string {
  return `${formatSessionDate(date)} · ${formatTime(start)}–${formatTime(end)}`;
}
