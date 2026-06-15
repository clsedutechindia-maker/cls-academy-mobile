import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { showAlert } from "../../lib/alert";
import { normalizeUserProfileRecord } from "../../shared";
import {
  getStudentFee,
  listPaymentsForFee,
  markInstallmentPaid,
  markInstallmentUnpaid,
  refundFeePayment,
  setStudentFeeDiscount,
  publishStudentFee,
  FEE_MODES,
  type FeeMode,
  type StudentFeeRecord,
  type FeePaymentRecord,
} from "../../lib/fees";
import { exportFeeReceiptPdf } from "./feePdf";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const INST_TONES: Record<string, { bg: string; fg: string }> = {
  paid: { bg: "#ECFDF5", fg: "#047857" },
  partial: { bg: "#E0F2FE", fg: "#0369A1" },
  overdue: { bg: "#FEF2F2", fg: "#B91C1C" },
  due: { bg: "#F3F4F6", fg: "#6B7280" },
};

export function EmployeeFeeDetailScreen() {
  const insets = useSafeAreaInsets();
  const { profile, adminRecord, authUser } = useSession();
  const { feeId } = useLocalSearchParams<{ feeId: string }>();

  // Admins have no `userProfiles` doc (their record lives in `admins/{uid}`), so
  // `profile` is null for them. Fall back to a profile-shaped view of adminRecord
  // so admin sessions can record/refund payments with proper collectedBy attribution.
  const effectiveProfile = useMemo(() => {
    if (profile) return profile;
    if (!adminRecord) return null;
    return normalizeUserProfileRecord(
      authUser?.uid ?? adminRecord.email,
      {
        name: "Admin",
        role: "employee",
        regionId: adminRecord.regionId,
        regionName: adminRecord.regionName,
        centreId: adminRecord.centreId,
        centreName: adminRecord.centreName,
        email: adminRecord.email,
      },
      adminRecord.email,
    );
  }, [profile, adminRecord, authUser?.uid]);

  const { data, loading, error, reload } = useResource(
    async () => {
      if (!feeId) return { fee: null, payments: [] as FeePaymentRecord[] };
      const fee = await getStudentFee(feeId);
      const payments = fee ? await listPaymentsForFee(feeId, { centreId: fee.centreId }) : [];
      return { fee, payments };
    },
    [feeId],
  );

  const fee = data?.fee ?? null;
  const payments = data?.payments ?? [];

  // Mark-as-paid sheet. `markTarget` is a single installment, or "all" for
  // "Collect all dues" (loops over every unpaid installment with one mode).
  const [markOpen, setMarkOpen] = useState(false);
  const [markTarget, setMarkTarget] = useState<{ label: string; amount: number } | "all" | null>(null);
  const [mode, setMode] = useState<FeeMode>("cash");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [discountInput, setDiscountInput] = useState("");
  const [discountSaving, setDiscountSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const isDraft = !!fee && !fee.published;
  const canManage = !!fee;

  async function handleSaveDiscount() {
    if (!fee) return;
    const d = Number(discountInput);
    if (!Number.isFinite(d) || d < 0) {
      showAlert("Invalid discount", "Enter a discount amount of zero or more.");
      return;
    }
    setDiscountSaving(true);
    try {
      await setStudentFeeDiscount(fee, d);
      setDiscountInput("");
      await reload();
    } catch (e) {
      showAlert("Could not apply discount", e instanceof Error ? e.message : "Try again.");
    } finally {
      setDiscountSaving(false);
    }
  }

  function handlePublish() {
    if (!fee) return;
    showAlert(
      "Publish fee",
      `Publish ${fee.studentName}'s fee of ${money(fee.totalAmount)}? It becomes visible to the student and you can start recording payments.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Publish",
          onPress: async () => {
            setPublishing(true);
            try {
              await publishStudentFee(fee);
              await reload();
              showAlert("Published", "The fee is now final and visible to the student.");
            } catch (e) {
              showAlert("Publish failed", e instanceof Error ? e.message : "Try again.");
            } finally {
              setPublishing(false);
            }
          },
        },
      ],
    );
  }

  function openMark(target: { label: string; amount: number } | "all") {
    setMarkTarget(target);
    setMode("cash");
    setNote("");
    setMarkOpen(true);
  }

  // Confirm the mark-as-paid sheet. Records a full-installment receipt for the
  // chosen mode; for "all" it loops every unpaid installment (one receipt each).
  async function handleConfirmMark() {
    if (!fee || !markTarget) return;
    setSubmitting(true);
    try {
      const collectedByUserId = effectiveProfile?.userId || "";
      const collectedByName = effectiveProfile?.name || "Office Staff";
      const trimmedNote = note.trim() || undefined;
      if (markTarget === "all") {
        const unpaid = fee.installments.filter((i) => i.amount - i.paidAmount > 0);
        for (const inst of unpaid) {
          await markInstallmentPaid({ studentFee: fee, installmentLabel: inst.label, mode, note: trimmedNote, collectedByUserId, collectedByName });
        }
      } else {
        await markInstallmentPaid({ studentFee: fee, installmentLabel: markTarget.label, mode, note: trimmedNote, collectedByUserId, collectedByName });
      }
      setMarkOpen(false);
      await reload();
      showAlert("Marked paid", "Payment recorded and receipt created.");
    } catch (e) {
      showAlert("Could not record payment", e instanceof Error ? e.message : "Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function confirmMarkUnpaid(inst: { label: string }) {
    if (!fee) return;
    showAlert("Mark unpaid", `Reverse the payment for ${inst.label}? This creates a refund receipt.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark unpaid",
        style: "destructive",
        onPress: async () => {
          try {
            const reversed = await markInstallmentUnpaid({
              studentFee: fee,
              installmentLabel: inst.label,
              collectedByUserId: effectiveProfile?.userId || "",
              collectedByName: effectiveProfile?.name || "Office Staff",
            });
            await reload();
            if (reversed === 0) {
              showAlert("Nothing to reverse", "No matching receipt for this installment. Use the payment history below to refund manually.");
            } else {
              showAlert("Marked unpaid", "A refund receipt was created.");
            }
          } catch (e) {
            showAlert("Could not update", e instanceof Error ? e.message : "Try again.");
          }
        },
      },
    ]);
  }

  function confirmRefund(payment: FeePaymentRecord) {
    showAlert("Refund payment", `Refund ${money(payment.amount)} (receipt ${payment.receiptNo})?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Refund",
        style: "destructive",
        onPress: async () => {
          try {
            await refundFeePayment(payment, effectiveProfile?.userId || "", effectiveProfile?.name || "Office Staff");
            await reload();
            showAlert("Refunded", "A refund receipt was created.");
          } catch (e) {
            showAlert("Refund failed", e instanceof Error ? e.message : "Try again.");
          }
        },
      },
    ]);
  }

  async function printReceipt(payment: FeePaymentRecord) {
    if (!fee) return;
    try {
      await exportFeeReceiptPdf(payment, fee);
    } catch (e) {
      showAlert("Print failed", e instanceof Error ? e.message : "Try again.");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          <AnimatedPressable style={s.backBtn} onPress={() => navigateBack(router)}>
            <Ionicons name="chevron-back" size={22} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.headerTitle}>Fee Details</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading && (
          <View style={[s.card, s.pad, { marginHorizontal: 18, alignItems: "center" }]}>
            <Text style={s.muted}>Loading…</Text>
          </View>
        )}
        {error && (
          <View style={[s.card, s.pad, { marginHorizontal: 18 }]}>
            <Text style={{ color: "#B91C1C", fontFamily: D.font, fontSize: 13 }}>{error}</Text>
          </View>
        )}
        {!loading && !error && !fee && (
          <View style={[s.card, s.pad, { marginHorizontal: 18, alignItems: "center" }]}>
            <Text style={s.muted}>Fee record not found.</Text>
          </View>
        )}

        {!loading && fee && (
          <View style={{ paddingHorizontal: 18 }}>
            <View style={[s.card, s.pad]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={s.studentName}>{fee.studentName}</Text>
                {isDraft && (
                  <View style={s.draftPill}>
                    <Text style={s.draftPillText}>DRAFT</Text>
                  </View>
                )}
              </View>
              <Text style={s.studentMeta}>{fee.rollNumber ? `Roll ${fee.rollNumber} · ` : ""}{fee.className} · {fee.title}</Text>
              {fee.discount > 0 && (
                <Text style={s.discountLine}>Gross {money(fee.grossAmount)} − Discount {money(fee.discount)}</Text>
              )}
              <View style={s.balRow}>
                <View style={s.balItem}>
                  <Text style={s.balLabel}>PAYABLE</Text>
                  <Text style={s.balValue}>{money(fee.totalAmount)}</Text>
                </View>
                <View style={s.balItem}>
                  <Text style={s.balLabel}>PAID</Text>
                  <Text style={[s.balValue, { color: "#047857" }]}>{money(fee.paidAmount)}</Text>
                </View>
                <View style={s.balItem}>
                  <Text style={s.balLabel}>DUE</Text>
                  <Text style={[s.balValue, { color: fee.dueAmount > 0 ? "#B45309" : D.onSurface }]}>{money(fee.dueAmount)}</Text>
                </View>
              </View>
              {canManage && fee.published && fee.dueAmount > 0 && (
                <AnimatedPressable style={s.payBtn} onPress={() => openMark("all")}>
                  <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                  <Text style={s.payBtnText}>Collect all dues · {money(fee.dueAmount)}</Text>
                </AnimatedPressable>
              )}
            </View>

            {canManage && isDraft && (
              <View style={[s.card, s.pad, { marginTop: 14, borderColor: "#FCD34D", backgroundColor: "#FFFBEB" }]}>
                <Text style={s.draftTitle}>Finalise this fee</Text>
                <Text style={s.draftHint}>Apply an optional discount, then publish to make it final and visible to the student.</Text>
                <Text style={s.fieldLabel}>Discount (₹)</Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    value={discountInput}
                    onChangeText={setDiscountInput}
                    keyboardType="numeric"
                    placeholder={fee.discount > 0 ? String(fee.discount) : "0"}
                    placeholderTextColor={D.outline}
                  />
                  <AnimatedPressable style={[s.discountBtn, discountSaving && { opacity: 0.6 }]} onPress={handleSaveDiscount} disabled={discountSaving}>
                    {discountSaving ? <ActivityIndicator size="small" color={D.primary} /> : <Text style={s.discountBtnText}>Apply</Text>}
                  </AnimatedPressable>
                </View>
                <AnimatedPressable style={[s.payBtn, { marginTop: 14 }, publishing && { opacity: 0.6 }]} onPress={handlePublish} disabled={publishing}>
                  {publishing ? <ActivityIndicator size="small" color="#fff" /> : (
                    <>
                      <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                      <Text style={s.payBtnText}>Publish Fee</Text>
                    </>
                  )}
                </AnimatedPressable>
              </View>
            )}

            <Text style={s.sectionLabel}>INSTALLMENTS</Text>
            <View style={[s.card]}>
              {fee.installments.length === 0 && (
                <View style={s.pad}><Text style={s.muted}>No installments defined.</Text></View>
              )}
              {fee.installments.map((inst, i) => {
                const tone = INST_TONES[inst.status] || INST_TONES.due;
                const remaining = Math.max(0, inst.amount - inst.paidAmount);
                return (
                  <View key={inst.label + i} style={[s.instRow, i < fee.installments.length - 1 && s.divider]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.instLabel}>{inst.label}</Text>
                      <Text style={s.instMeta}>
                        {money(inst.amount)}{inst.dueDateIso ? ` · due ${inst.dueDateIso.slice(0, 10)}` : ""}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <View style={[s.badge, { backgroundColor: tone.bg }]}>
                        <Text style={[s.badgeText, { color: tone.fg }]}>{inst.status}</Text>
                      </View>
                      {canManage && fee.published && (
                        inst.status === "paid" ? (
                          <AnimatedPressable style={s.togglePaid} onPress={() => confirmMarkUnpaid(inst)}>
                            <Ionicons name="checkmark-circle" size={17} color="#047857" />
                            <Text style={s.togglePaidText}>Paid</Text>
                          </AnimatedPressable>
                        ) : remaining > 0 ? (
                          <AnimatedPressable style={s.toggleUnpaid} onPress={() => openMark({ label: inst.label, amount: remaining })}>
                            <Ionicons name="ellipse-outline" size={15} color={D.primary} />
                            <Text style={s.toggleUnpaidText}>Mark paid</Text>
                          </AnimatedPressable>
                        ) : null
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={s.sectionLabel}>PAYMENT HISTORY</Text>
            <View style={[s.card]}>
              {payments.length === 0 && (
                <View style={s.pad}><Text style={s.muted}>No payments yet.</Text></View>
              )}
              {payments.map((p, i) => {
                const isRefund = p.amount < 0;
                return (
                  <View key={p.id} style={[s.payRow, i < payments.length - 1 && s.divider]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.payAmt, isRefund && { color: "#B91C1C" }]}>{money(p.amount)} · {p.mode.toUpperCase()}</Text>
                      <Text style={s.payMeta}>
                        {p.receiptNo} · {new Date(p.paidAtIso).toLocaleDateString("en-IN")}
                        {p.installmentLabel ? ` · ${p.installmentLabel}` : ""}{p.refunded ? " · refunded" : ""}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      <Pressable style={s.smallBtn} onPress={() => printReceipt(p)}>
                        <Ionicons name="print-outline" size={16} color={D.primary} />
                      </Pressable>
                      {!isRefund && !p.refunded && (
                        <Pressable style={s.smallBtn} onPress={() => confirmRefund(p)}>
                          <Ionicons name="return-down-back-outline" size={16} color="#B91C1C" />
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={markOpen} transparent animationType="slide" onRequestClose={() => setMarkOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setMarkOpen(false)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={s.sheetTitle}>Mark as paid</Text>

            <View style={s.markTargetCard}>
              <Text style={s.markTargetLabel}>
                {markTarget === "all" ? "All dues" : markTarget?.label ?? ""}
              </Text>
              <Text style={s.markTargetAmount}>
                {markTarget === "all" ? money(fee?.dueAmount ?? 0) : money(markTarget?.amount ?? 0)}
              </Text>
            </View>

            <Text style={s.fieldLabel}>Payment mode</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {FEE_MODES.map((m) => {
                const active = mode === m.value;
                return (
                  <AnimatedPressable key={m.value} style={[s.modeChip, active && s.modeChipActive]} onPress={() => setMode(m.value)}>
                    <Text style={[s.modeChipText, active && { color: "#fff" }]}>{m.label}</Text>
                  </AnimatedPressable>
                );
              })}
            </ScrollView>

            <Text style={s.fieldLabel}>Note (optional)</Text>
            <TextInput
              style={s.input}
              value={note}
              onChangeText={setNote}
              placeholder="Reference, remarks…"
              placeholderTextColor={D.outline}
            />

            <AnimatedPressable style={[s.payBtn, { marginTop: 18 }, submitting && { opacity: 0.6 }]} onPress={handleConfirmMark} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={s.payBtnText}>Confirm payment</Text>
                </>
              )}
            </AnimatedPressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  headerTitle: { fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  card: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  pad: { padding: 16 },
  muted: { fontSize: 13, fontFamily: D.font, color: D.outline },
  studentName: { fontSize: 17, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
  studentMeta: { fontSize: 12, fontFamily: D.font, color: D.outline, marginTop: 3 },
  discountLine: { fontSize: 11.5, fontFamily: D.fontSemiBold, color: "#B45309", marginTop: 6 },
  draftPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, backgroundColor: "#FEF3C7" },
  draftPillText: { fontSize: 9.5, fontWeight: "800", fontFamily: D.fontExtraBold, color: "#B45309", letterSpacing: 0.5 },
  draftTitle: { fontSize: 14, fontWeight: "800", fontFamily: D.fontExtraBold, color: "#92400E" },
  draftHint: { fontSize: 11.5, fontFamily: D.font, color: "#B45309", marginTop: 4, lineHeight: 16 },
  discountBtn: { paddingHorizontal: 18, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: D.primary },
  discountBtnText: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  balRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  balItem: { flex: 1, backgroundColor: D.surfaceLow, borderRadius: 10, padding: 12 },
  balLabel: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 },
  balValue: { marginTop: 4, fontSize: 14, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: D.primary, borderRadius: 12, paddingVertical: 13, marginTop: 16 },
  payBtnText: { color: "#fff", fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold },
  sectionLabel: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.6, marginTop: 22, marginBottom: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  instRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  instLabel: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  instMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 9.5, fontWeight: "700", fontFamily: D.fontBold, textTransform: "capitalize" },
  togglePaid: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99, backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0" },
  togglePaidText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: "#047857" },
  toggleUnpaid: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99, backgroundColor: D.surface, borderWidth: 1, borderColor: D.primary },
  toggleUnpaidText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  markTargetCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: D.surfaceLow, borderRadius: 10, padding: 14 },
  markTargetLabel: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  markTargetAmount: { fontSize: 15, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface },
  payRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  payAmt: { fontSize: 13, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface },
  payMeta: { fontSize: 10.5, fontFamily: D.font, color: D.outline, marginTop: 2 },
  smallBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.outlineVariant },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  sheetTitle: { fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginBottom: 16 },
  fieldLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.3, marginBottom: 8, marginTop: 14 },
  input: { borderWidth: 1, borderColor: D.outlineVariant, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: D.fontMedium, color: D.onSurface, backgroundColor: D.surface },
  modeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  modeChipActive: { backgroundColor: D.primary, borderColor: D.primary },
  modeChipText: { fontSize: 12, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
});
