import { getTodayDateValue } from "../../lib/date";
import {
  INQUIRY_MODE_META,
  INQUIRY_MODE_ORDER,
  INQUIRY_STATUS_META,
  INQUIRY_STATUS_ORDER,
  isTerminalInquiryStatus,
  type AdmissionInquiryRecord,
  type InquiryMode,
  type InquiryStatus,
} from "../../shared";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export { INQUIRY_MODE_META, INQUIRY_MODE_ORDER, INQUIRY_STATUS_META, INQUIRY_STATUS_ORDER };

export const MODE_OPTIONS = INQUIRY_MODE_ORDER.map((m) => ({ key: m, label: INQUIRY_MODE_META[m].label }));
export const STATUS_OPTIONS = INQUIRY_STATUS_ORDER.map((s) => ({ key: s, label: INQUIRY_STATUS_META[s].label }));

// "YYYY-MM-DD" → "Mon, 08 Jun"
export function formatInquiryDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "—";
  const d = new Date(`${value}T00:00:00`);
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${weekday}, ${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
}

// ISO timestamp → "08 Jun · 6:56 PM"
export function formatInquiryTimestamp(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const date = `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
  const h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${date} · ${hour}:${String(d.getMinutes()).padStart(2, "0")} ${ampm}`;
}

// Lead needs attention: a follow-up date that has passed and not yet closed.
export function isInquiryOverdue(inquiry: AdmissionInquiryRecord): boolean {
  if (!inquiry.nextFollowUpDate || isTerminalInquiryStatus(inquiry.status)) return false;
  return inquiry.nextFollowUpDate < getTodayDateValue();
}

export function isFollowUpDueToday(inquiry: AdmissionInquiryRecord): boolean {
  if (!inquiry.nextFollowUpDate || isTerminalInquiryStatus(inquiry.status)) return false;
  return inquiry.nextFollowUpDate === getTodayDateValue();
}

export type InquiryStat = { total: number; active: number; overdue: number; enrolled: number; conversion: number };

export function computeInquiryStats(list: AdmissionInquiryRecord[]): InquiryStat {
  const total = list.length;
  const enrolled = list.filter((i) => i.status === "enrolled").length;
  const closed = enrolled + list.filter((i) => i.status === "lost").length;
  const overdue = list.filter(isInquiryOverdue).length;
  const active = total - closed;
  const conversion = total > 0 ? Math.round((enrolled / total) * 100) : 0;
  return { total, active, overdue, enrolled, conversion };
}

export const inquiryModeIcon = (mode: InquiryMode) => INQUIRY_MODE_META[mode]?.icon ?? "ellipsis-horizontal-outline";
export const inquiryStatusMeta = (status: InquiryStatus) => INQUIRY_STATUS_META[status] ?? INQUIRY_STATUS_META.new;
