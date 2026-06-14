import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import type { FeePaymentRecord, StudentFeeRecord, FeeCollectionSummary } from "../../lib/fees";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const headerHtml = `
  <div class="head">
    <div class="brand">CLS Academy</div>
    <div class="addr">3rd Floor, USHA Pride, Main Road Mowa, Raipur (C.G.) · Ph. 0771-4520189</div>
  </div>`;

const baseStyle = `
  <style>
    * { box-sizing: border-box; font-family: -apple-system, Segoe UI, Roboto, sans-serif; }
    body { margin: 0; padding: 28px; color: #1f2937; }
    .head { text-align: center; border-bottom: 2px solid #6D28D9; padding-bottom: 12px; margin-bottom: 18px; }
    .brand { font-size: 22px; font-weight: 800; color: #6D28D9; letter-spacing: -0.5px; }
    .addr { font-size: 11px; color: #6b7280; margin-top: 4px; }
    h1 { font-size: 16px; margin: 0 0 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
    th { background: #f5f3ff; color: #4c1d95; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; }
    .right { text-align: right; }
    .meta { font-size: 12px; line-height: 1.7; }
    .meta b { display: inline-block; min-width: 120px; color: #6b7280; font-weight: 600; }
    .total { font-weight: 800; font-size: 14px; }
    .badge { display: inline-block; padding: 3px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: #ecfdf5; color: #047857; }
    .foot { margin-top: 26px; font-size: 10.5px; color: #9ca3af; text-align: center; }
  </style>`;

// expo-print on web ignores html and prints the live page; render in a hidden iframe.
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

async function emit(html: string, title: string): Promise<void> {
  if (Platform.OS === "web") {
    printHtmlWeb(html);
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: title, UTI: "com.adobe.pdf" });
  }
}

export async function exportFeeReceiptPdf(payment: FeePaymentRecord, fee: StudentFeeRecord): Promise<void> {
  const isRefund = payment.amount < 0;
  const html = `<!doctype html><html><head><meta charset="utf-8">${baseStyle}</head><body>
    ${headerHtml}
    <h1>${isRefund ? "Refund Receipt" : "Fee Receipt"} — ${esc(payment.receiptNo)}</h1>
    <div class="meta">
      <div><b>Receipt No</b> ${esc(payment.receiptNo)}</div>
      <div><b>Date</b> ${esc(new Date(payment.paidAtIso).toLocaleString("en-IN"))}</div>
      <div><b>Student</b> ${esc(payment.studentName)} ${payment.rollNumber ? `(Roll ${esc(payment.rollNumber)})` : ""}</div>
      <div><b>Class</b> ${esc(fee.className)}</div>
      <div><b>Fee Plan</b> ${esc(fee.title)}</div>
      ${payment.installmentLabel ? `<div><b>Installment</b> ${esc(payment.installmentLabel)}</div>` : ""}
      <div><b>Mode</b> ${esc(payment.mode.toUpperCase())}</div>
      <div><b>Collected By</b> ${esc(payment.collectedByName)}</div>
      ${payment.note ? `<div><b>Note</b> ${esc(payment.note)}</div>` : ""}
    </div>
    <table>
      <tr><th>Description</th><th class="right">Amount</th></tr>
      <tr><td>${isRefund ? "Refund" : "Fee payment"}</td><td class="right total">${money(payment.amount)}</td></tr>
    </table>
    <table style="margin-top:18px">
      <tr><td>Total Fee</td><td class="right">${money(fee.totalAmount)}</td></tr>
      <tr><td>Paid to date</td><td class="right">${money(fee.paidAmount)}</td></tr>
      <tr><td><b>Balance Due</b></td><td class="right total">${money(fee.dueAmount)}</td></tr>
    </table>
    <div class="foot">This is a computer-generated receipt. CLS Academy, Raipur.</div>
  </body></html>`;
  await emit(html, "Fee Receipt");
}

export async function exportFeeReportPdf(fees: StudentFeeRecord[], summary: FeeCollectionSummary): Promise<void> {
  const rows = fees
    .map(
      (f) => `<tr>
        <td>${esc(f.rollNumber)}</td>
        <td>${esc(f.studentName)}</td>
        <td>${esc(f.className)}</td>
        <td class="right">${money(f.totalAmount)}</td>
        <td class="right">${money(f.paidAmount)}</td>
        <td class="right">${money(f.dueAmount)}</td>
        <td>${esc(f.status)}</td>
      </tr>`,
    )
    .join("");
  const classRows = summary.perClass
    .map(
      (c) => `<tr><td>${esc(c.className)}</td><td class="right">${money(c.billed)}</td><td class="right">${money(c.collected)}</td><td class="right">${money(c.due)}</td></tr>`,
    )
    .join("");
  const html = `<!doctype html><html><head><meta charset="utf-8">${baseStyle}</head><body>
    ${headerHtml}
    <h1>Fee Collection Report</h1>
    <div class="meta">
      <div><b>Generated</b> ${esc(new Date().toLocaleString("en-IN"))}</div>
      <div><b>Total Billed</b> ${money(summary.totalBilled)}</div>
      <div><b>Total Collected</b> ${money(summary.totalCollected)}</div>
      <div><b>Total Due</b> ${money(summary.totalDue)}</div>
      <div><b>Students</b> ${summary.studentCount} (${summary.clearedCount} cleared)</div>
    </div>
    <h1 style="margin-top:22px">By Batch</h1>
    <table>
      <tr><th>Batch</th><th class="right">Billed</th><th class="right">Collected</th><th class="right">Due</th></tr>
      ${classRows}
    </table>
    <h1 style="margin-top:22px">Students</h1>
    <table>
      <tr><th>Roll</th><th>Student</th><th>Class</th><th class="right">Total</th><th class="right">Paid</th><th class="right">Due</th><th>Status</th></tr>
      ${rows}
    </table>
    <div class="foot">Computer-generated report. CLS Academy, Raipur.</div>
  </body></html>`;
  await emit(html, "Fee Report");
}
