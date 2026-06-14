import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  setDoc,
  deleteDoc,
  where,
} from "firebase/firestore";
import { firestoreDb } from "./firebase";
import { isDemoMode } from "./demoMode";
import { listEmployeeStudents } from "./erp";
import type { UserProfileRecord } from "../shared";

// ---------------------------------------------------------------------------
// Student fee module (EIS-Digital-style). Managed by the employee role only;
// students/parents can read their own records. Manual payment recording — no
// payment-gateway integration. See firestore.rules for access enforcement.
// ---------------------------------------------------------------------------

export const feeStructuresCollectionName = "feeStructures";
export const studentFeesCollectionName = "studentFees";
export const feePaymentsCollectionName = "feePayments";
export const feeCountersCollectionName = "feeCounters";

export type FeeMode = "cash" | "upi" | "card" | "bank" | "cheque" | "pdc";
export type FeeStatus = "pending" | "partial" | "cleared" | "refunded";
export type FeeInstallmentStatus = "due" | "partial" | "paid" | "overdue";

export const FEE_MODES: { value: FeeMode; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "pdc", label: "Post-dated Cheque" },
];

// Template installment (no payment state).
export type FeeInstallmentPlan = {
  label: string;
  amount: number;
  dueDateIso: string;
};

// Per-student installment (carries running payment state).
export type StudentFeeInstallment = FeeInstallmentPlan & {
  paidAmount: number;
  status: FeeInstallmentStatus;
};

export type FeeStructureRecord = {
  id: string;
  regionId: string;
  centreId: string;
  classId: string;
  className: string;
  title: string;
  academicYear: string;
  totalAmount: number;
  installments: FeeInstallmentPlan[];
  active: boolean;
  createdAtIso: string;
  updatedAtIso: string;
};

export type StudentFeeRecord = {
  id: string; // studentUserId__structureId
  studentUserId: string;
  studentName: string;
  rollNumber: string;
  regionId: string;
  centreId: string;
  classId: string;
  className: string;
  structureId: string;
  title: string;
  academicYear: string;
  totalAmount: number;
  installments: StudentFeeInstallment[];
  paidAmount: number;
  dueAmount: number;
  status: FeeStatus;
  createdAtIso: string;
  updatedAtIso: string;
};

export type FeePaymentRecord = {
  id: string;
  receiptNo: string;
  studentFeeId: string;
  studentUserId: string;
  studentName: string;
  rollNumber: string;
  regionId: string;
  centreId: string;
  amount: number; // negative for refunds
  mode: FeeMode;
  installmentLabel: string;
  paidAtIso: string;
  collectedByUserId: string;
  collectedByName: string;
  note: string;
  refunded: boolean;
  refundOfPaymentId: string;
};

export type FeeCollectionSummary = {
  totalBilled: number;
  totalCollected: number;
  totalDue: number;
  studentCount: number;
  clearedCount: number;
  perClass: { classId: string; className: string; billed: number; collected: number; due: number }[];
};

// ---------------------------------------------------------------------------
// Helpers / normalizers
// ---------------------------------------------------------------------------

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

export function buildStudentFeeId(studentUserId: string, structureId: string) {
  return `${studentUserId}__${structureId}`;
}

function formatReceiptNo(seq: number) {
  return `R-${String(seq).padStart(5, "0")}`;
}

function normalizeFeeMode(v: unknown): FeeMode {
  return ["cash", "upi", "card", "bank", "cheque", "pdc"].includes(v as string) ? (v as FeeMode) : "cash";
}

function normalizeFeeStatus(v: unknown): FeeStatus {
  return ["partial", "cleared", "refunded"].includes(v as string) ? (v as FeeStatus) : "pending";
}

function normalizeInstallmentPlans(value: unknown): FeeInstallmentPlan[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): FeeInstallmentPlan | null => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      return { label: str(raw.label) || "Installment", amount: num(raw.amount), dueDateIso: str(raw.dueDateIso) };
    })
    .filter((i): i is FeeInstallmentPlan => i !== null);
}

function normalizeStudentInstallments(value: unknown): StudentFeeInstallment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): StudentFeeInstallment | null => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const amount = num(raw.amount);
      const paidAmount = num(raw.paidAmount);
      const rawStatus = raw.status;
      const status: FeeInstallmentStatus = ["partial", "paid", "overdue"].includes(rawStatus as string)
        ? (rawStatus as FeeInstallmentStatus)
        : "due";
      return { label: str(raw.label) || "Installment", amount, dueDateIso: str(raw.dueDateIso), paidAmount, status };
    })
    .filter((i): i is StudentFeeInstallment => i !== null);
}

export function normalizeFeeStructure(id: string, data: Record<string, unknown>): FeeStructureRecord {
  return {
    id,
    regionId: str(data.regionId),
    centreId: str(data.centreId),
    classId: str(data.classId),
    className: str(data.className),
    title: str(data.title) || "Fee Plan",
    academicYear: str(data.academicYear),
    totalAmount: num(data.totalAmount),
    installments: normalizeInstallmentPlans(data.installments),
    active: data.active !== false,
    createdAtIso: str(data.createdAtIso),
    updatedAtIso: str(data.updatedAtIso),
  };
}

export function normalizeStudentFee(id: string, data: Record<string, unknown>): StudentFeeRecord {
  const installments = normalizeStudentInstallments(data.installments);
  const totalAmount = num(data.totalAmount) || installments.reduce((s, i) => s + i.amount, 0);
  const paidAmount = num(data.paidAmount);
  return {
    id,
    studentUserId: str(data.studentUserId),
    studentName: str(data.studentName) || "Unknown Student",
    rollNumber: str(data.rollNumber),
    regionId: str(data.regionId),
    centreId: str(data.centreId),
    classId: str(data.classId),
    className: str(data.className),
    structureId: str(data.structureId),
    title: str(data.title) || "Fee Plan",
    academicYear: str(data.academicYear),
    totalAmount,
    installments,
    paidAmount,
    dueAmount: num(data.dueAmount) || round2(totalAmount - paidAmount),
    status: normalizeFeeStatus(data.status),
    createdAtIso: str(data.createdAtIso),
    updatedAtIso: str(data.updatedAtIso),
  };
}

export function normalizeFeePayment(id: string, data: Record<string, unknown>): FeePaymentRecord {
  return {
    id,
    receiptNo: str(data.receiptNo) || id,
    studentFeeId: str(data.studentFeeId),
    studentUserId: str(data.studentUserId),
    studentName: str(data.studentName),
    rollNumber: str(data.rollNumber),
    regionId: str(data.regionId),
    centreId: str(data.centreId),
    amount: num(data.amount),
    mode: normalizeFeeMode(data.mode),
    installmentLabel: str(data.installmentLabel),
    paidAtIso: str(data.paidAtIso),
    collectedByUserId: str(data.collectedByUserId),
    collectedByName: str(data.collectedByName),
    note: str(data.note),
    refunded: data.refunded === true,
    refundOfPaymentId: str(data.refundOfPaymentId),
  };
}

// Apply a signed delta (+payment / -refund) to installments, waterfall oldest-first
// for payments and newest-first for refunds. Returns the new installment state +
// totals. Pure function — caller persists.
function applyDelta(
  installments: StudentFeeInstallment[],
  delta: number,
  installmentLabel: string,
): { installments: StudentFeeInstallment[]; paidAmount: number; dueAmount: number; status: FeeStatus } {
  const next = installments.map((i) => ({ ...i }));
  let remaining = round2(Math.abs(delta));
  const isRefund = delta < 0;

  const order = installmentLabel
    ? next.map((_, idx) => idx).filter((idx) => next[idx].label === installmentLabel)
    : isRefund
      ? next.map((_, idx) => idx).reverse()
      : next.map((_, idx) => idx);

  for (const idx of order) {
    if (remaining <= 0) break;
    const inst = next[idx];
    if (isRefund) {
      const take = Math.min(remaining, inst.paidAmount);
      inst.paidAmount = round2(inst.paidAmount - take);
      remaining = round2(remaining - take);
    } else {
      const room = round2(inst.amount - inst.paidAmount);
      const add = Math.min(remaining, Math.max(room, 0));
      inst.paidAmount = round2(inst.paidAmount + add);
      remaining = round2(remaining - add);
    }
  }
  // Any leftover (overpay/refund-beyond-installments) lands on first/last installment.
  if (remaining > 0 && next.length > 0) {
    const idx = isRefund ? next.length - 1 : 0;
    next[idx].paidAmount = round2(Math.max(0, next[idx].paidAmount + (isRefund ? -remaining : remaining)));
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  for (const inst of next) {
    if (inst.paidAmount >= inst.amount && inst.amount > 0) inst.status = "paid";
    else if (inst.paidAmount > 0) inst.status = "partial";
    else if (inst.dueDateIso && inst.dueDateIso.slice(0, 10) < todayIso) inst.status = "overdue";
    else inst.status = "due";
  }

  const totalAmount = round2(next.reduce((s, i) => s + i.amount, 0));
  const paidAmount = round2(next.reduce((s, i) => s + i.paidAmount, 0));
  const dueAmount = round2(Math.max(0, totalAmount - paidAmount));
  const status: FeeStatus = paidAmount <= 0 ? "pending" : dueAmount <= 0 ? "cleared" : "partial";
  return { installments: next, paidAmount, dueAmount, status };
}

// ---------------------------------------------------------------------------
// Fee structures (templates)
// ---------------------------------------------------------------------------

export async function listFeeStructures(profile: UserProfileRecord): Promise<FeeStructureRecord[]> {
  if (isDemoMode() || !profile.centreId) return [];
  const snapshot = await getDocs(
    query(collection(firestoreDb, feeStructuresCollectionName), where("centreId", "==", profile.centreId)),
  );
  return snapshot.docs
    .map((d) => normalizeFeeStructure(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
}

export type FeeStructureInput = {
  classId: string;
  className: string;
  title: string;
  academicYear: string;
  installments: FeeInstallmentPlan[];
};

export async function upsertFeeStructure(
  profile: UserProfileRecord,
  input: FeeStructureInput,
  structureId?: string,
): Promise<string> {
  const nowIso = new Date().toISOString();
  const totalAmount = round2(input.installments.reduce((s, i) => s + num(i.amount), 0));
  const ref = structureId
    ? doc(firestoreDb, feeStructuresCollectionName, structureId)
    : doc(collection(firestoreDb, feeStructuresCollectionName));
  await setDoc(
    ref,
    {
      regionId: profile.regionId,
      centreId: profile.centreId,
      classId: input.classId,
      className: input.className,
      title: input.title,
      academicYear: input.academicYear,
      totalAmount,
      installments: input.installments.map((i) => ({ label: i.label, amount: num(i.amount), dueDateIso: i.dueDateIso })),
      active: true,
      ...(structureId ? {} : { createdAtIso: nowIso }),
      updatedAtIso: nowIso,
    },
    { merge: true },
  );
  return ref.id;
}

export async function deleteFeeStructure(structureId: string): Promise<void> {
  await deleteDoc(doc(firestoreDb, feeStructuresCollectionName, structureId));
}

// Assign a structure to one student → creates/initialises the studentFees doc.
export async function assignFeeStructureToStudent(
  structure: FeeStructureRecord,
  student: UserProfileRecord,
): Promise<string> {
  const id = buildStudentFeeId(student.userId, structure.id);
  const ref = doc(firestoreDb, studentFeesCollectionName, id);
  const existing = await getDoc(ref);
  if (existing.exists()) return id; // never overwrite payment state
  const nowIso = new Date().toISOString();
  const installments: StudentFeeInstallment[] = structure.installments.map((i) => ({
    label: i.label,
    amount: num(i.amount),
    dueDateIso: i.dueDateIso,
    paidAmount: 0,
    status: "due",
  }));
  await setDoc(ref, {
    studentUserId: student.userId,
    studentName: student.name,
    rollNumber: student.rollNumber || student.studentId || "",
    regionId: structure.regionId,
    centreId: structure.centreId,
    classId: structure.classId,
    className: structure.className,
    structureId: structure.id,
    title: structure.title,
    academicYear: structure.academicYear,
    totalAmount: structure.totalAmount,
    installments,
    paidAmount: 0,
    dueAmount: structure.totalAmount,
    status: "pending",
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  });
  return id;
}

// Assign a structure to every student in its class (skips those already assigned).
export async function assignFeeStructureToClass(
  profile: UserProfileRecord,
  structure: FeeStructureRecord,
): Promise<number> {
  const students = (await listEmployeeStudents(profile)).filter((s) => s.classId === structure.classId);
  let count = 0;
  for (const student of students) {
    const id = buildStudentFeeId(student.userId, structure.id);
    const existing = await getDoc(doc(firestoreDb, studentFeesCollectionName, id));
    if (existing.exists()) continue;
    await assignFeeStructureToStudent(structure, student);
    count += 1;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Student fee records + payments
// ---------------------------------------------------------------------------

export async function listStudentFees(profile: UserProfileRecord): Promise<StudentFeeRecord[]> {
  if (isDemoMode() || !profile.centreId) return [];
  const snapshot = await getDocs(
    query(collection(firestoreDb, studentFeesCollectionName), where("centreId", "==", profile.centreId)),
  );
  return snapshot.docs
    .map((d) => normalizeStudentFee(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => a.studentName.localeCompare(b.studentName));
}

// Superadmin oversight — every centre's fees, global (mirrors listVisibleProfilesForAdmin).
export async function listAllStudentFees(): Promise<StudentFeeRecord[]> {
  if (isDemoMode()) return [];
  const snapshot = await getDocs(collection(firestoreDb, studentFeesCollectionName));
  return snapshot.docs
    .map((d) => normalizeStudentFee(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => a.studentName.localeCompare(b.studentName));
}

export async function getStudentFee(id: string): Promise<StudentFeeRecord | null> {
  if (!id) return null;
  const snap = await getDoc(doc(firestoreDb, studentFeesCollectionName, id));
  if (!snap.exists()) return null;
  return normalizeStudentFee(snap.id, snap.data() as Record<string, unknown>);
}

export async function listOwnStudentFees(profile: UserProfileRecord): Promise<StudentFeeRecord[]> {
  if (isDemoMode() || !profile.userId) return [];
  const snapshot = await getDocs(
    query(collection(firestoreDb, studentFeesCollectionName), where("studentUserId", "==", profile.userId)),
  );
  return snapshot.docs
    .map((d) => normalizeStudentFee(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso));
}

export async function listPaymentsForFee(studentFeeId: string): Promise<FeePaymentRecord[]> {
  if (isDemoMode() || !studentFeeId) return [];
  const snapshot = await getDocs(
    query(collection(firestoreDb, feePaymentsCollectionName), where("studentFeeId", "==", studentFeeId)),
  );
  return snapshot.docs
    .map((d) => normalizeFeePayment(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.paidAtIso.localeCompare(a.paidAtIso));
}

export type RecordPaymentInput = {
  studentFee: StudentFeeRecord;
  amount: number;
  mode: FeeMode;
  installmentLabel?: string;
  note?: string;
  collectedByUserId: string;
  collectedByName: string;
};

// Atomic: bump centre receipt counter, recompute installment/balance state, write
// the immutable payment receipt. Returns the receipt number.
export async function recordFeePayment(input: RecordPaymentInput): Promise<string> {
  const amount = round2(input.amount);
  if (amount <= 0) throw new Error("Payment amount must be greater than zero.");
  const nowIso = new Date().toISOString();
  const fee = input.studentFee;

  return runTransaction(firestoreDb, async (tx) => {
    const counterRef = doc(firestoreDb, feeCountersCollectionName, fee.centreId);
    const feeRef = doc(firestoreDb, studentFeesCollectionName, fee.id);
    const counterSnap = await tx.get(counterRef);
    const feeSnap = await tx.get(feeRef);
    if (!feeSnap.exists()) throw new Error("Fee record not found.");

    const current = normalizeStudentFee(feeSnap.id, feeSnap.data() as Record<string, unknown>);
    const lastSeq = counterSnap.exists() ? num(counterSnap.data().lastSeq) : 0;
    const nextSeq = lastSeq + 1;
    const receiptNo = formatReceiptNo(nextSeq);

    const recomputed = applyDelta(current.installments, amount, input.installmentLabel || "");
    const paymentRef = doc(collection(firestoreDb, feePaymentsCollectionName));

    tx.set(paymentRef, {
      receiptNo,
      studentFeeId: fee.id,
      studentUserId: fee.studentUserId,
      studentName: fee.studentName,
      rollNumber: fee.rollNumber,
      regionId: fee.regionId,
      centreId: fee.centreId,
      amount,
      mode: input.mode,
      installmentLabel: input.installmentLabel || "",
      paidAtIso: nowIso,
      collectedByUserId: input.collectedByUserId,
      collectedByName: input.collectedByName,
      note: input.note || "",
      refunded: false,
      refundOfPaymentId: "",
    });
    tx.set(counterRef, { lastSeq: nextSeq, centreId: fee.centreId, updatedAtIso: nowIso }, { merge: true });
    tx.update(feeRef, {
      installments: recomputed.installments,
      paidAmount: recomputed.paidAmount,
      dueAmount: recomputed.dueAmount,
      status: recomputed.status,
      updatedAtIso: nowIso,
    });
    return receiptNo;
  });
}

// Refund a prior payment: writes a negative offsetting receipt, marks the original
// refunded, and reverses the balance. Returns the refund receipt number.
export async function refundFeePayment(
  payment: FeePaymentRecord,
  collectedByUserId: string,
  collectedByName: string,
): Promise<string> {
  if (payment.amount <= 0) throw new Error("Only positive payments can be refunded.");
  if (payment.refunded) throw new Error("This payment was already refunded.");
  const nowIso = new Date().toISOString();

  return runTransaction(firestoreDb, async (tx) => {
    const counterRef = doc(firestoreDb, feeCountersCollectionName, payment.centreId);
    const feeRef = doc(firestoreDb, studentFeesCollectionName, payment.studentFeeId);
    const origRef = doc(firestoreDb, feePaymentsCollectionName, payment.id);
    const counterSnap = await tx.get(counterRef);
    const feeSnap = await tx.get(feeRef);
    if (!feeSnap.exists()) throw new Error("Fee record not found.");

    const current = normalizeStudentFee(feeSnap.id, feeSnap.data() as Record<string, unknown>);
    const lastSeq = counterSnap.exists() ? num(counterSnap.data().lastSeq) : 0;
    const nextSeq = lastSeq + 1;
    const receiptNo = formatReceiptNo(nextSeq);

    const recomputed = applyDelta(current.installments, -payment.amount, payment.installmentLabel || "");
    const refundRef = doc(collection(firestoreDb, feePaymentsCollectionName));

    tx.set(refundRef, {
      receiptNo,
      studentFeeId: payment.studentFeeId,
      studentUserId: payment.studentUserId,
      studentName: payment.studentName,
      rollNumber: payment.rollNumber,
      regionId: payment.regionId,
      centreId: payment.centreId,
      amount: -payment.amount,
      mode: payment.mode,
      installmentLabel: payment.installmentLabel || "",
      paidAtIso: nowIso,
      collectedByUserId,
      collectedByName,
      note: `Refund of ${payment.receiptNo}`,
      refunded: false,
      refundOfPaymentId: payment.id,
    });
    tx.update(origRef, { refunded: true, updatedAtIso: nowIso });
    tx.set(counterRef, { lastSeq: nextSeq, centreId: payment.centreId, updatedAtIso: nowIso }, { merge: true });
    tx.update(feeRef, {
      installments: recomputed.installments,
      paidAmount: recomputed.paidAmount,
      dueAmount: recomputed.dueAmount,
      status: recomputed.dueAmount >= current.totalAmount && recomputed.paidAmount <= 0 ? "refunded" : recomputed.status,
      updatedAtIso: nowIso,
    });
    return receiptNo;
  });
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function feeCollectionSummary(fees: StudentFeeRecord[]): FeeCollectionSummary {
  const perClassMap = new Map<string, { classId: string; className: string; billed: number; collected: number; due: number }>();
  let totalBilled = 0;
  let totalCollected = 0;
  let totalDue = 0;
  let clearedCount = 0;

  for (const fee of fees) {
    totalBilled = round2(totalBilled + fee.totalAmount);
    totalCollected = round2(totalCollected + fee.paidAmount);
    totalDue = round2(totalDue + fee.dueAmount);
    if (fee.status === "cleared") clearedCount += 1;
    const key = fee.classId || "unassigned";
    const entry = perClassMap.get(key) || { classId: fee.classId, className: fee.className || "Unassigned", billed: 0, collected: 0, due: 0 };
    entry.billed = round2(entry.billed + fee.totalAmount);
    entry.collected = round2(entry.collected + fee.paidAmount);
    entry.due = round2(entry.due + fee.dueAmount);
    perClassMap.set(key, entry);
  }

  return {
    totalBilled,
    totalCollected,
    totalDue,
    studentCount: fees.length,
    clearedCount,
    perClass: Array.from(perClassMap.values()).sort((a, b) => a.className.localeCompare(b.className)),
  };
}

// ---------------------------------------------------------------------------
// Due-date reminders
// ---------------------------------------------------------------------------

export type FeeReminderHit = {
  installmentLabel: string;
  dueDateIso: string;
  amountDue: number;
  kind: "upcoming" | "due" | "overdue";
};

function daysBetweenIso(fromIso: string, toIso: string): number {
  const a = Date.parse(`${fromIso.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${toIso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return NaN;
  return Math.round((b - a) / 86_400_000);
}

// Reminder milestones that fire on `todayIso` for a fee's unpaid installments:
// 3 days before due, on due date, then every 7 days while overdue. Pure +
// offset-based so a once-daily run never double-fires. NOTE: the cron route
// (app/api/fee-reminders/route.ts) duplicates this rule server-side — keep in sync.
export function feeRemindersDueOn(fee: StudentFeeRecord, todayIso: string): FeeReminderHit[] {
  const hits: FeeReminderHit[] = [];
  for (const inst of fee.installments) {
    if (inst.paidAmount >= inst.amount || !inst.dueDateIso) continue;
    const daysUntil = daysBetweenIso(todayIso, inst.dueDateIso);
    if (Number.isNaN(daysUntil)) continue;
    const amountDue = round2(inst.amount - inst.paidAmount);
    if (daysUntil === 3) hits.push({ installmentLabel: inst.label, dueDateIso: inst.dueDateIso, amountDue, kind: "upcoming" });
    else if (daysUntil === 0) hits.push({ installmentLabel: inst.label, dueDateIso: inst.dueDateIso, amountDue, kind: "due" });
    else if (daysUntil < 0 && (-daysUntil) % 7 === 0) hits.push({ installmentLabel: inst.label, dueDateIso: inst.dueDateIso, amountDue, kind: "overdue" });
  }
  return hits;
}

// Build a CSV string for export (EIS-style fee report).
export function buildFeeReportCsv(fees: StudentFeeRecord[]): string {
  const header = ["Roll No", "Student", "Class", "Plan", "Total", "Paid", "Due", "Status"];
  const rows = fees.map((f) => [
    f.rollNumber,
    f.studentName,
    f.className,
    f.title,
    f.totalAmount.toString(),
    f.paidAmount.toString(),
    f.dueAmount.toString(),
    f.status,
  ]);
  return [header, ...rows]
    .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
