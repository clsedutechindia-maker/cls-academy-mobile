import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { useSession } from "../providers/session";
import { useResource } from "../hooks/useResource";
import { showAlert } from "../lib/alert";
import { listOwnStudentFees, listPaymentsForFee, feeRemindersDueOn, type StudentFeeRecord, type FeePaymentRecord } from "../lib/fees";
import { exportFeeReceiptPdf } from "./employee/feePdf";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const INST_TONES: Record<string, { bg: string; fg: string }> = {
  paid: { bg: "#ECFDF5", fg: "#047857" },
  partial: { bg: "#E0F2FE", fg: "#0369A1" },
  overdue: { bg: "#FEF2F2", fg: "#B91C1C" },
  due: { bg: "#F3F4F6", fg: "#6B7280" },
};

export function StudentFeesScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const { data, loading, error } = useResource(
    async () => {
      if (!profile) return [] as { fee: StudentFeeRecord; payments: FeePaymentRecord[] }[];
      const fees = await listOwnStudentFees(profile);
      return Promise.all(fees.map(async (fee) => ({ fee, payments: await listPaymentsForFee(fee.id) })));
    },
    [profile?.userId],
  );

  const groups = data ?? [];

  const todayIso = new Date().toISOString().slice(0, 10);
  const alertFees = groups
    .map((g) => g.fee)
    .filter((fee) => fee.dueAmount > 0 && (
      fee.installments.some((i) => i.status === "overdue") || feeRemindersDueOn(fee, todayIso).length > 0
    ));
  const anyOverdue = alertFees.some((fee) => fee.installments.some((i) => i.status === "overdue"));
  const alertTotal = alertFees.reduce((sum, fee) => sum + fee.dueAmount, 0);

  async function printReceipt(payment: FeePaymentRecord, fee: StudentFeeRecord) {
    try {
      await exportFeeReceiptPdf(payment, fee);
    } catch (e) {
      showAlert("Download failed", e instanceof Error ? e.message : "Try again.");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.headerTitle}>My Fees</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={{ paddingHorizontal: 18 }}>
          {!loading && alertFees.length > 0 && (
            <View style={[s.banner, { backgroundColor: anyOverdue ? "#FEF2F2" : "#FEF3C7", borderColor: anyOverdue ? "#FECACA" : "#FDE68A" }]}>
              <Ionicons name={anyOverdue ? "alert-circle" : "time-outline"} size={20} color={anyOverdue ? "#B91C1C" : "#B45309"} />
              <Text style={[s.bannerText, { color: anyOverdue ? "#B91C1C" : "#92400E" }]}>
                {anyOverdue ? "Fees overdue" : "Fees due soon"} — {money(alertTotal)} pending. Please pay at the office.
              </Text>
            </View>
          )}
          {loading && <View style={[s.card, s.pad, { alignItems: "center" }]}><Text style={s.muted}>Loading…</Text></View>}
          {error && <View style={[s.card, s.pad]}><Text style={{ color: "#B91C1C", fontFamily: D.font, fontSize: 13 }}>{error}</Text></View>}
          {!loading && !error && groups.length === 0 && (
            <View style={[s.card, s.pad, { alignItems: "center" }]}>
              <Ionicons name="card-outline" size={26} color={D.outline} />
              <Text style={[s.muted, { marginTop: 8 }]}>No fee records yet.</Text>
            </View>
          )}

          {groups.map(({ fee, payments }) => (
            <View key={fee.id} style={{ marginBottom: 18 }}>
              <View style={[s.card, s.pad]}>
                <Text style={s.planTitle}>{fee.title}</Text>
                <Text style={s.planMeta}>{fee.className}{fee.academicYear ? ` · ${fee.academicYear}` : ""}</Text>
                <View style={s.balRow}>
                  <View style={s.balItem}><Text style={s.balLabel}>TOTAL</Text><Text style={s.balValue}>{money(fee.totalAmount)}</Text></View>
                  <View style={s.balItem}><Text style={s.balLabel}>PAID</Text><Text style={[s.balValue, { color: "#047857" }]}>{money(fee.paidAmount)}</Text></View>
                  <View style={s.balItem}><Text style={s.balLabel}>DUE</Text><Text style={[s.balValue, { color: fee.dueAmount > 0 ? "#B45309" : D.onSurface }]}>{money(fee.dueAmount)}</Text></View>
                </View>
              </View>

              <Text style={s.sectionLabel}>SCHEDULE</Text>
              <View style={s.card}>
                {fee.installments.map((inst, i) => {
                  const tone = INST_TONES[inst.status] || INST_TONES.due;
                  return (
                    <View key={inst.label + i} style={[s.row, i < fee.installments.length - 1 && s.divider]}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.rowTitle}>{inst.label}</Text>
                        <Text style={s.rowMeta}>{money(inst.amount)}{inst.dueDateIso ? ` · due ${inst.dueDateIso.slice(0, 10)}` : ""}</Text>
                      </View>
                      <View style={[s.badge, { backgroundColor: tone.bg }]}>
                        <Text style={[s.badgeText, { color: tone.fg }]}>{inst.status}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {payments.length > 0 && (
                <>
                  <Text style={s.sectionLabel}>RECEIPTS</Text>
                  <View style={s.card}>
                    {payments.map((p, i) => {
                      const isRefund = p.amount < 0;
                      return (
                        <View key={p.id} style={[s.row, i < payments.length - 1 && s.divider]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[s.rowTitle, isRefund && { color: "#B91C1C" }]}>{money(p.amount)} · {p.mode.toUpperCase()}</Text>
                            <Text style={s.rowMeta}>{p.receiptNo} · {new Date(p.paidAtIso).toLocaleDateString("en-IN")}</Text>
                          </View>
                          <Pressable style={s.smallBtn} onPress={() => printReceipt(p, fee)}>
                            <Ionicons name="download-outline" size={16} color={D.primary} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  headerTitle: { fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  card: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  pad: { padding: 16 },
  banner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  bannerText: { flex: 1, fontSize: 12.5, fontFamily: D.fontSemiBold, lineHeight: 17 },
  muted: { fontSize: 13, fontFamily: D.font, color: D.outline },
  planTitle: { fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
  planMeta: { fontSize: 12, fontFamily: D.font, color: D.outline, marginTop: 3 },
  balRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  balItem: { flex: 1, backgroundColor: D.surfaceLow, borderRadius: 10, padding: 12 },
  balLabel: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 },
  balValue: { marginTop: 4, fontSize: 14, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface },
  sectionLabel: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.6, marginTop: 18, marginBottom: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowTitle: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  rowMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 9.5, fontWeight: "700", fontFamily: D.fontBold, textTransform: "capitalize" },
  smallBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.outlineVariant },
});
