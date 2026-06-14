import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listStudentFees, feeCollectionSummary, type FeeStatus, type StudentFeeRecord } from "../../lib/fees";
import { exportFeeReportPdf } from "./feePdf";
import { showAlert } from "../../lib/alert";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_TONES: Record<FeeStatus, { bg: string; fg: string; label: string }> = {
  pending: { bg: "#FEF3C7", fg: "#B45309", label: "Pending" },
  partial: { bg: "#E0F2FE", fg: "#0369A1", label: "Partial" },
  cleared: { bg: "#ECFDF5", fg: "#047857", label: "Cleared" },
  refunded: { bg: "#F3F4F6", fg: "#6B7280", label: "Refunded" },
};

const FILTERS: ("All" | FeeStatus)[] = ["All", "pending", "partial", "cleared", "refunded"];

export function EmployeeFeesScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"All" | FeeStatus>("All");
  const [exporting, setExporting] = useState(false);

  const { data: fees, loading, error } = useResource(
    async () => (profile ? listStudentFees(profile) : []),
    [profile?.userId],
  );

  const summary = useMemo(() => feeCollectionSummary(fees ?? []), [fees]);

  const filtered = (fees ?? []).filter((f) => {
    if (statusFilter !== "All" && f.status !== statusFilter) return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      return [f.studentName, f.rollNumber, f.className, f.title].join(" ").toLowerCase().includes(term);
    }
    return true;
  });

  async function handleExport() {
    if (!fees || fees.length === 0) {
      showAlert("Nothing to export", "No fee records found for your centre.");
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
        <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
          <View style={s.titleRow}>
            <Text style={s.pageTitle}>Fees</Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <AnimatedPressable style={s.iconBtn} onPress={handleExport} disabled={exporting}>
                <Ionicons name="download-outline" size={19} color={D.onSurface} />
              </AnimatedPressable>
              <AnimatedPressable style={s.iconBtn} onPress={() => { setSearchVisible((v) => !v); if (searchVisible) setSearch(""); }}>
                <Ionicons name={searchVisible ? "close" : "search"} size={20} color={D.onSurface} />
              </AnimatedPressable>
            </View>
          </View>
        </View>

        {searchVisible && (
          <View style={{ paddingHorizontal: 18, paddingBottom: 10, backgroundColor: D.bg }}>
            <View style={s.searchBox}>
              <Ionicons name="search-outline" size={17} color={D.outline} />
              <TextInput
                style={{ flex: 1, fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface }}
                placeholder="Search by name, roll, or batch…"
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

        <View style={s.contentArea}>
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

          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Student fees</Text>
            <Text style={s.sectionCount}>{filtered.length} shown</Text>
          </View>

          {loading && (
            <View style={[s.card, { padding: 20, alignItems: "center" }]}>
              <Text style={s.muted}>Loading fees…</Text>
            </View>
          )}
          {error && (
            <View style={[s.card, { padding: 16 }]}>
              <Text style={{ fontSize: 13, fontFamily: D.font, color: "#B91C1C" }}>{error}</Text>
            </View>
          )}
          {!loading && !error && filtered.length === 0 && (
            <View style={[s.card, { padding: 20, alignItems: "center" }]}>
              <Text style={s.muted}>No fee records. Set up a fee plan first.</Text>
            </View>
          )}
          {!loading && !error && filtered.length > 0 && (
            <View style={s.card}>
              {filtered.map((f: StudentFeeRecord, i) => {
                const tone = STATUS_TONES[f.status];
                return (
                  <AnimatedPressable
                    key={f.id}
                    style={[s.feeRow, i < filtered.length - 1 && s.divider]}
                    onPress={() => router.push({ pathname: "/(employee)/fee-detail", params: { feeId: f.id } })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.feeName}>{f.studentName}</Text>
                      <Text style={s.feeMeta}>{f.rollNumber ? `Roll ${f.rollNumber} · ` : ""}{f.className} · {f.title}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={s.feeDue}>{f.dueAmount > 0 ? money(f.dueAmount) : "Paid"}</Text>
                      {f.published ? (
                        <View style={[s.badge, { backgroundColor: tone.bg }]}>
                          <Text style={[s.badgeText, { color: tone.fg }]}>{tone.label}</Text>
                        </View>
                      ) : (
                        <View style={[s.badge, { backgroundColor: "#FEF3C7" }]}>
                          <Text style={[s.badgeText, { color: "#B45309" }]}>Draft</Text>
                        </View>
                      )}
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
  headerSection: { paddingHorizontal: 18, paddingBottom: 16, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontSize: 24, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  contentArea: { paddingHorizontal: 18 },
  grid2: { flexDirection: "row", gap: 16 },
  featureCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 4, elevation: 1 },
  fcIcon: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  fcLabel: { marginTop: 10, fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 },
  fcValue: { marginTop: 4, fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.35 },
  fcSub: { marginTop: 3, fontSize: 9.5, color: D.onSurfaceVariant, fontFamily: D.font },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  chipActive: { backgroundColor: D.primary, borderColor: D.primary },
  chipText: { fontSize: 12, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  chipTextActive: { color: "#fff" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 12, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  sectionCount: { fontSize: 11, fontFamily: D.font, color: D.outline },
  card: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  feeRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  feeName: { fontSize: 13, fontWeight: "700", color: D.onSurface, fontFamily: D.fontBold },
  feeMeta: { fontSize: 10.5, color: D.outline, marginTop: 2, fontFamily: D.font },
  feeDue: { fontSize: 13, fontWeight: "800", color: D.onSurface, fontFamily: D.fontExtraBold },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 9.5, fontWeight: "700", fontFamily: D.fontBold },
  muted: { fontSize: 13, fontFamily: D.font, color: D.outline },
});
