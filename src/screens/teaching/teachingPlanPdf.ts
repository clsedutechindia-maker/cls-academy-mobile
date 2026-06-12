import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { TeachingPlanRecord } from "../../shared";

const FULL_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function topicsHtml(topics: string): string {
  if (!topics.trim()) return "&nbsp;";
  return esc(topics).replace(/\r?\n/g, "<br/>");
}

function parse(dateValue: string): Date | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? new Date(`${dateValue}T00:00:00`) : null;
}

function ddmmyyyy(dateValue: string): string {
  const d = parse(dateValue);
  if (!d) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function dayName(dateValue: string): string {
  const d = parse(dateValue);
  return d ? FULL_DAYS[d.getDay()]! : "";
}

function monthLabel(monthKey: string): string {
  if (!/^\d{4}-\d{2}$/.test(monthKey)) return "";
  const [year, month] = monthKey.split("-").map(Number);
  return `${FULL_MONTHS[(month ?? 1) - 1]} ${year}`;
}

function dateRange(start: string, end: string): string {
  const s = parse(start);
  const e = parse(end) ?? s;
  if (!s) return "";
  const sStr = `${String(s.getDate()).padStart(2, "0")} ${FULL_MONTHS[s.getMonth()]}`;
  const eStr = e ? `${String(e.getDate()).padStart(2, "0")} ${FULL_MONTHS[e.getMonth()]} ${e.getFullYear()}` : "";
  return `${sStr} – ${eStr}`;
}

function buildHtml(plan: TeachingPlanRecord): string {
  const rows = plan.rows
    .map(
      (row) => `
      <tr>
        <td class="c-date">${ddmmyyyy(row.date)}</td>
        <td class="c-day">${esc(row.day || dayName(row.date))}</td>
        <td class="c-topics">${topicsHtml(row.topics)}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #1B1230; margin: 0; padding: 18px; }
  .page { border: 1.5px solid #1B1230; padding: 22px 26px; position: relative; min-height: calc(100vh - 36px); }
  .page > *:not(.watermark) { position: relative; z-index: 1; }
  .watermark { position: absolute; top: 46%; left: 50%; transform: translate(-50%, -50%); font-size: 150px; font-weight: 800; color: rgba(11,42,107,0.05); letter-spacing: -4px; z-index: 0; pointer-events: none; }
  .topbar { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700; margin-bottom: 14px; }
  .month { background: #BBF7D0; padding: 3px 10px; border-radius: 3px; color: #14532D; }
  .course { color: #1B1230; }
  .syllabus { color: #1B1230; }
  .brand { text-align: center; font-size: 36px; font-weight: 800; color: #0B2A6B; letter-spacing: -0.5px; margin: 8px 0 0; }
  .brand .accent { color: #C0392B; }
  .brand-rule { text-align: center; font-size: 13px; font-weight: 800; color: #1B1230; letter-spacing: 4px; margin: 0 0 2px; }
  .heading { text-align: center; font-size: 17px; font-weight: 800; color: #6D28D9; margin-top: 10px; }
  .daterange { text-align: center; font-size: 13px; margin: 4px 0 12px; }
  .infobox { background: #DCE7FB; border: 1px solid #B9CCEF; border-radius: 4px; padding: 10px 14px; display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; }
  .infobox .col { display: flex; flex-direction: column; gap: 4px; }
  .infobox .right { text-align: right; }
  .wtp { text-align: center; font-size: 18px; font-weight: 800; margin: 16px 0 4px; }
  .unit { text-align: center; font-size: 14px; font-weight: 700; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #1B1230; padding: 8px 10px; font-size: 12px; vertical-align: top; }
  th { background: #F1EEFA; font-weight: 800; text-align: center; }
  .c-date { width: 16%; text-align: center; }
  .c-day { width: 14%; text-align: center; }
  .c-topics { width: 70%; line-height: 1.5; }
  .footer { text-align: center; margin-top: 22px; font-size: 12px; }
  .footer .open { font-weight: 800; }
  .footer .tag { color: #B91C1C; font-style: italic; font-weight: 700; margin: 4px 0; }
  .footer .addr { font-weight: 700; font-size: 11px; }
</style>
</head>
<body>
  <div class="page">
  <div class="watermark">CLS</div>
  <div class="topbar">
    <span class="month">${esc(monthLabel(plan.monthKey))}</span>
    <span class="course">${esc(plan.className || "")}</span>
    <span class="syllabus">Syllabus Plan</span>
  </div>

  <div class="brand"><span class="accent">CLS</span> Academy</div>
  <div class="brand-rule">- - -</div>
  <div class="heading">Teaching Plan &amp; Class Schedule</div>
  <div class="daterange">{Date: ${esc(dateRange(plan.weekStartDate, plan.weekEndDate))}}</div>

  <div class="infobox">
    <div class="col">
      <span>Subject: ${esc(plan.subjectName || "")}</span>
      ${plan.classTime ? `<span>Class Time: ${esc(plan.classTime)}</span>` : ""}
    </div>
    <div class="col right">
      <span>Faculty: ${esc(plan.teacherName || "")}</span>
      ${plan.centreName ? `<span>${esc(plan.centreName)}</span>` : ""}
    </div>
  </div>

  <div class="wtp">Weekly Teaching Plan</div>
  ${plan.unitName ? `<div class="unit">Unit Name: ${esc(plan.unitName)}</div>` : ""}

  <table>
    <thead>
      <tr><th>Date</th><th>Day</th><th>Chapter / Topics</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <div class="open">Admission Open for Session 2026-27…</div>
    <div class="tag">Ignite Your Potential &amp; Transform Your Career with CLS Academy</div>
    <div class="addr">CLS Academy: 3rd Floor, USHA Pride, Main Road Mowa, Raipur (C.G.) Ph. 0771-4520189, 89623-20189</div>
  </div>
  </div>
</body>
</html>`;
}

// expo-print on web is a stub that calls window.print() and ignores the html,
// which prints the live app page (floating tab bar included). Render the html in
// an isolated hidden iframe and print that instead.
function printHtmlWeb(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  iframe.src = url;
  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
    setTimeout(() => {
      iframe.remove();
      URL.revokeObjectURL(url);
    }, 1000);
  };
  document.body.appendChild(iframe);
}

export async function exportTeachingPlanPdf(plan: TeachingPlanRecord): Promise<void> {
  const html = buildHtml(plan);
  if (Platform.OS === "web") {
    printHtmlWeb(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Teaching Plan", UTI: "com.adobe.pdf" });
  }
}
