import { StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
import { D } from "../../components/theme";
import { type FeePaymentRecord } from "../../lib/fees";
import { formatDateLabel } from "../../lib/date";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const MODE_LABELS: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank: "Bank Transfer",
  cheque: "Cheque",
  pdc: "PDC",
};

// Receipt ledger view. `payments` is expected already-filtered by the parent;
// the summary strip + count reflect exactly what is passed in.
export function FeeLedgerList({
  payments,
  loading,
  error,
}: {
  payments: FeePaymentRecord[];
  loading: boolean;
  error?: string | null;
}) {
  const totalShown = useMemo(
    () => payments.filter((p) => !p.refunded && p.amount > 0).reduce((s, p) => s + p.amount, 0),
    [payments],
  );

  return (
    <View>
      {/* Summary strip */}
      <View style={s.summaryCard}>
        <View style={s.summaryStat}>
          <Text style={s.summaryLabel}>RECEIPTS SHOWN</Text>
          <Text style={s.summaryValue}>{payments.length}</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryStat}>
          <Text style={s.summaryLabel}>TOTAL COLLECTED</Text>
          <Text style={s.summaryValue}>{loading ? "—" : money(totalShown)}</Text>
        </View>
      </View>

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>All payments</Text>
        <Text style={s.sectionCount}>{payments.length} shown</Text>
      </View>

      {loading && (
        <View style={[s.card, { padding: 20, alignItems: "center" }]}>
          <Text style={s.muted}>Loading ledger…</Text>
        </View>
      )}
      {error && (
        <View style={[s.card, { padding: 16 }]}>
          <Text style={{ fontSize: 13, fontFamily: D.font, color: "#B91C1C" }}>{error}</Text>
        </View>
      )}
      {!loading && !error && payments.length === 0 && (
        <View style={[s.card, { padding: 20, alignItems: "center" }]}>
          <Text style={s.muted}>No payments recorded yet.</Text>
        </View>
      )}
      {!loading && !error && payments.length > 0 && (
        <View style={s.card}>
          {payments.map((p, i) => {
            const isRefund = p.amount < 0 || p.refunded;
            return (
              <View key={p.id} style={[s.payRow, i < payments.length - 1 && s.divider]}>
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={s.receiptNo}>{p.receiptNo}</Text>
                    {isRefund && (
                      <View style={s.refundBadge}>
                        <Text style={s.refundBadgeText}>REFUND</Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.studentName} numberOfLines={1}>{p.studentName}</Text>
                  <Text style={s.metaLine} numberOfLines={1}>
                    {p.rollNumber ? `Roll ${p.rollNumber} · ` : ""}{p.installmentLabel || "Payment"}
                  </Text>
                  <Text style={s.metaLine} numberOfLines={1}>
                    {MODE_LABELS[p.mode] ?? p.mode} · {p.collectedByName || "Staff"}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={[s.amount, { color: isRefund ? "#B91C1C" : "#047857" }]}>
                    {isRefund ? "−" : "+"}{money(Math.abs(p.amount))}
                  </Text>
                  <Text style={s.dateText}>{formatDateLabel(p.paidAtIso.slice(0, 10))}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  summaryCard: { flexDirection: "row", backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", marginBottom: 18, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 4, elevation: 1 },
  summaryStat: { flex: 1, alignItems: "center", paddingVertical: 14 },
  summaryDivider: { width: 1, backgroundColor: D.outlineVariant, marginVertical: 10 },
  summaryLabel: { fontSize: 8.5, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.4 },
  summaryValue: { marginTop: 5, fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.35 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  sectionCount: { fontSize: 11, fontFamily: D.font, color: D.outline },
  card: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  payRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  receiptNo: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  studentName: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  metaLine: { fontSize: 10, color: D.outline, fontFamily: D.font },
  amount: { fontSize: 14, fontWeight: "800", fontFamily: D.fontExtraBold },
  dateText: { fontSize: 10, color: D.outline, fontFamily: D.font },
  refundBadge: { backgroundColor: "#FEE2E2", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  refundBadgeText: { fontSize: 8, fontWeight: "700", fontFamily: D.fontBold, color: "#B91C1C", letterSpacing: 0.3 },
  muted: { fontSize: 13, fontFamily: D.font, color: D.outline },
});
