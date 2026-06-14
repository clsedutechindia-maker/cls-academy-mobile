import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useState } from "react";
import { D } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { useSession } from "../providers/session";
import { useResource } from "../hooks/useResource";
import { showAlert } from "../lib/alert";
import { listAllStudentFees, feeCollectionSummary, type FeeStatus, type StudentFeeRecord } from "../lib/fees";
import { exportFeeReportPdf } from "./employee/feePdf";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_TONES: Record<FeeStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#FEF3C7", fg: "#B45309", label: "Pending" },
  partial: { bg: "#E0F2FE", fg: "#0369A1", label: "Partial" },
  cleared: { bg: "#ECFDF5", fg: "#047857", label: "Cleared" },
  refunded: { bg: "#F3F4F6", fg: "#6B7280", label: "Refunded" },
};

const FILTERS: ("All" | FeeStatus)[] = ["All", "pending", "partial", "cleared", "refunded"];

export function AdminFeesScreen() {
  const insets = useSafeAreaInsets();
  const { adminRecord } = useSession();
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All" | FeeStatus>("All");
  const [exporting, setExporting] = useState(false);

  const { data: fees, loading, error } = useResource(
    async () => (adminRecord ? listAllStudentFees() : []),
    [adminRecord?.role],
  );

  const summary = useMemo(() => feeCollectionSummary(fees ?? []), [fees]);

  const filtered = (fees ?? []).filter((f) => {
    if (statusFilter !== "All" && f.status !== statusFilter) return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      return [f.studentName, f.rollNumber, f.className, f.title, f.centreId].join(" ").toLowerCase().includes(term);
    }
    return true;
  });

  async function handleExport() {
    if (!fees || fees.length === 0) {
      showAlert("Nothing to export", "No fee records found.");
      return;
    }
    setExporting(true);
    try {
      await exportFeeReportPdf(fees, summary);
    } catch (e) {
      showAlert("Export failed", e instanceof Error ? e.message : "Could not generate the report.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          <AnimatedPressable style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.headerTitle}>Fees</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <AnimatedPressable style={s.iconBtn} onPress={handleExport} disabled={exporting}>
              <Ionicons name="download-outline" size={19} color={D.onSurface} />
            </AnimatedPressable>
            <AnimatedPressable style={s.iconBtn} onPress={() => { setSearchVisible((v) => !v); if (searchVisible) setSearch(""); }}>
              <Ionicons name={searchVisible ? "close" : "search"} size={20} color={D.onSurface} />
            </AnimatedPressable>
          </View>
        </View>

        {searchVisible && (
          <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
            <View style={s.searchBox}>
              <Ionicons name="search-outline" size={17} color={D.outline} />
              <TextInput
                style={{ flex: 1, fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface }}
                placeholder="Search name, roll, batch…"
                placeholderTextColor={D.outline}
                value={search}
                onChangeText={setSearch}
                autoFocus
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={17} color={D.outline} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        <View style={{ paddingHorizontal: 18 }}>
          <View style={s.grid2}>
            <View style={s.featureCard}>
              <View style={[s.fcIcon, { backgroundColor: "#ECFDF5" }]}>
                <Ionicons name="cash-outline" size={14} color="#047857" />
              </View>
              <Text style={s.fcLabel}>COLLECTED</Text>
              <Text style={s.fcValue}>{loading ? "—" : money(summary.totalCollected)}</Text>
              <Text style={s.fcSub}>{summary.clearedCount} cleared</Text>
            </View>
            <View style={s.featureCard}>
              <View style={[s.fcIcon, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="alert-circle-outline" size={14} color="#B45309" />
              </View>
              <Text style={s.fcLabel}>OUTSTANDING</Text>
              <Text style={s.fcValue}>{loading ? "—" : money(summary.totalDue)}</Text>
              <Text style={s.fcSub}>{summary.studentCount} student{summary.studentCount !== 1 ? "s" : ""}</Text>
            </View>
          </View>

          {summary.perClass.length > 0 && (
            <>
              <Text style={s.sectionLabel}>BY BATCH</Text>
              <View style={s.card}>
                {summary.perClass.map((c, i) => (
                  <View key={c.classId || c.className} style={[s.batchRow, i < summary.perClass.length - 1 && s.divider]}>
                    <Text style={s.batchName} numberOfLines={1}>{c.className}</Text>
                    <View style={{ flexDirection: "row", gap: 14 }}>
                      <Text style={s.batchCollected}>{money(c.collected)}</Text>
                      <Text style={[s.batchDue, { color: c.due > 0 ? "#B45309" : D.outline }]}>{money(c.due)} due</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 18 }} contentContainerStyle={{ gap: 8, paddingRight: 18 }}>
            {FILTERS.map((f) => {
              const active = statusFilter === f;
              const label = f === "All" ? "All" : STATUS_TONES[f].label;
              return (
                <AnimatedPressable key={f} style={[s.chip, active && s.chipActive]} onPress={() => setStatusFilter(f)}>
                  <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>

          <View style={s.sectionRow}>
            <Text style={s.sectionTitle}>Student fees</Text>
            <Text style={s.sectionCount}>{filtered.length} shown</Text>
          </View>

          {loading && <View style={[s.card, { padding: 20, alignItems: "center" }]}><Text style={s.muted}>Loading fees…</Text></View>}
          {error && <View style={[s.card, { padding: 16 }]}><Text style={{ fontSize: 13, fontFamily: D.font, color: "#B91C1C" }}>{error}</Text></View>}
          {!loading && !error && filtered.length === 0 && (
            <View style={[s.card, { padding: 20, alignItems: "center" }]}><Text style={s.muted}>No fee records.</Text></View>
          )}
          {!loading && !error && filtered.length > 0 && (
            <View style={s.card}>
              {filtered.map((f: StudentFeeRecord, i) => {
                const tone = STATUS_TONES[f.status];
                return (
                  <AnimatedPressable
                    key={f.id}
                    style={[s.feeRow, i < filtered.length - 1 && s.divider]}
                    onPress={() => router.push({ pathname: "/(admin)/fee-detail", params: { feeId: f.id } })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.feeName}>{f.studentName}</Text>
                      <Text style={s.feeMeta}>{f.rollNumber ? `Roll ${f.rollNumber} · ` : ""}{f.className} · {f.title}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={s.feeDue}>{f.dueAmount > 0 ? money(f.dueAmount) : "Paid"}</Text>
                      <View style={[s.badge, { backgroundColor: tone.bg }]}>
                        <Text style={[s.badgeText, { color: tone.fg }]}>{tone.label}</Text>
                      </View>
                    </View>
                  </AnimatedPressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  grid2: { flexDirection: "row", gap: 16 },
  featureCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: D.outlineVariant },
  fcIcon: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  fcLabel: { marginTop: 10, fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 },
  fcValue: { marginTop: 4, fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.35 },
  fcSub: { marginTop: 3, fontSize: 9.5, color: D.onSurfaceVariant, fontFamily: D.font },
  sectionLabel: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.6, marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  batchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, gap: 12 },
  batchName: { flex: 1, fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  batchCollected: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: "#047857" },
  batchDue: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  chipActive: { backgroundColor: D.primary, borderColor: D.primary },
  chipText: { fontSize: 12, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  chipTextActive: { color: "#fff" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 12, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  sectionCount: { fontSize: 11, fontFamily: D.font, color: D.outline },
  feeRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  feeName: { fontSize: 13, fontWeight: "700", color: D.onSurface, fontFamily: D.fontBold },
  feeMeta: { fontSize: 10.5, color: D.outline, marginTop: 2, fontFamily: D.font },
  feeDue: { fontSize: 13, fontWeight: "800", color: D.onSurface, fontFamily: D.fontExtraBold },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 9.5, fontWeight: "700", fontFamily: D.fontBold },
  muted: { fontSize: 13, fontFamily: D.font, color: D.outline },
});
