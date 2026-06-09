import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { AvatarCircle } from "../../components/ui";

const pending = [
  { n: "Vikram Nair", b: "NEET 11-B" },
  { n: "Sneha Gupta", b: "NEET 11-B" },
];

const students = [
  { n: "Aanya Verma", roll: "043", b: "NEET 11-B", att: 96 },
  { n: "Arjun Singh", roll: "046", b: "NEET 11-B", att: 74 },
  { n: "Karthik Reddy", roll: "044", b: "NEET 11-B", att: 81 },
  { n: "Meera Patel", roll: "048", b: "NEET 11-A", att: 94 },
  { n: "Priya Joshi", roll: "047", b: "NEET 12-A", att: 68 },
  { n: "Rahul Sharma", roll: "042", b: "NEET 11-B", att: 92 },
  { n: "Sahil Kumar", roll: "051", b: "NEET 12-A", att: 88 },
  { n: "Tanvi Nair", roll: "052", b: "NEET 11-A", att: 79 },
];

const batches = ["All · 124", "NEET 11-B", "NEET 11-A", "NEET 12-A"];

export function HTStudentsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 18, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 16 }}>
          <Text style={s.pageTitle}>Students</Text>
          <Text style={s.pageSubtitle}>Manage your batches and enrolments</Text>
        </View>

        {/* Search + filter */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Ionicons name="search-outline" size={15} color={D.outline} />
            <Text style={s.searchPlaceholder}>Search by name or roll…</Text>
          </View>
          <View style={s.filterBtn}>
            <Ionicons name="options-outline" size={17} color={D.onSurface} />
          </View>
        </View>

        {/* Batch chips */}
        <View style={{ flexDirection: "row", gap: 7, marginTop: 12, marginBottom: 16 }}>
          {batches.map((b, i) => (
            <View key={b} style={[s.chip, i === 0 ? s.chipActive : s.chipInactive]}>
              <Text style={[s.chipText, { color: i === 0 ? "#fff" : D.onSurfaceVariant }]}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Pending approvals banner */}
        <View style={s.pendingBanner}>
          <View style={s.pendingHeader}>
            <View style={s.pendingTitleRow}>
              <View style={s.pendingIcon}>
                <Ionicons name="alert-circle-outline" size={13} color="#92400E" />
              </View>
              <Text style={s.pendingTitle}>Pending Approvals · {pending.length}</Text>
            </View>
            <Text style={s.pendingLink}>Review all</Text>
          </View>
          {pending.map((p, i) => (
            <View key={p.n} style={[s.pendingRow, i > 0 && { borderTopWidth: 1, borderTopColor: "#FDE68A", paddingTop: 10 }]}>
              <AvatarCircle name={p.n} size={28} />
              <View style={{ flex: 1 }}>
                <Text style={s.pendingName}>{p.n}</Text>
                <Text style={s.pendingBatch}>{p.b} · Awaiting approval</Text>
              </View>
              <AnimatedPressable style={s.reviewBtn} onPress={() => router.push("/(head-teacher)/approve-student")}>
                <Text style={s.reviewBtnText}>Review</Text>
              </AnimatedPressable>
            </View>
          ))}
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16, marginBottom: 18 }}>
          {[
            { label: "My students", value: "124", sub: "3 batches" },
            { label: "Avg att.", value: "84%", sub: "This month" },
            { label: "At risk", value: "7", sub: "Att < 75%", accent: "#B91C1C" },
          ].map((c) => (
            <View key={c.label} style={s.statTile}>
              <Text style={s.statLabel}>{c.label}</Text>
              <Text style={[s.statValue, c.accent ? { color: c.accent } : {}]}>{c.value}</Text>
              <Text style={s.statSub}>{c.sub}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>ALL STUDENTS</Text>
        <View style={s.card}>
          {students.map((s2, i) => (
            <AnimatedPressable
              key={s2.n}
              style={[s.studentRow, i < students.length - 1 && s.divider]}
              onPress={() => router.push("/(head-teacher)/student-detail")}
            >
              <AvatarCircle name={s2.n} size={34} />
              <View style={{ flex: 1 }}>
                <Text style={s.studentName}>{s2.n}</Text>
                <Text style={s.studentMeta}>Roll {s2.roll} · {s2.b}</Text>
              </View>
              <View style={{ alignItems: "flex-end", marginRight: 4 }}>
                <Text style={[s.attValue, { color: s2.att < 75 ? "#B91C1C" : D.onSurface }]}>
                  {s2.att}<Text style={s.attPct}>%</Text>
                </Text>
                <Text style={[s.attLabel, { color: s2.att < 75 ? "#EF4444" : "#15803D" }]}>ATT</Text>
              </View>
              <Ionicons name="chevron-forward" size={13} color={D.outline} />
            </AnimatedPressable>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <AnimatedPressable
        style={s.fab}
        onPress={() => router.push("/(head-teacher)/approve-student")}
      >
        <Ionicons name="add" size={16} color="#fff" />
        <Text style={s.fabText}>Approve Student</Text>
      </AnimatedPressable>
    </View>
  );
}

const s = StyleSheet.create({
  pageTitle: { fontSize: 22, fontWeight: "800", color: D.onSurface, letterSpacing: -0.5, marginBottom: 4, fontFamily: D.fontExtraBold },
  pageSubtitle: { fontSize: 12.5, color: D.outline, fontFamily: D.font },
  searchRow: { flexDirection: "row", gap: 8 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 9, padding: 13, borderRadius: 16, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, fontFamily: D.font },
  searchPlaceholder: { flex: 1, fontSize: 12.5, color: D.outline, letterSpacing: -0.1, fontFamily: D.font },
  filterBtn: { width: 46, height: 46, borderRadius: 16, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  chipActive: { backgroundColor: D.primary, borderWidth: 1, borderColor: D.primary },
  chipInactive: { backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  chipText: { fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold },
  pendingBanner: { padding: 14, borderRadius: 18, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A" },
  pendingHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  pendingTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  pendingIcon: { width: 24, height: 24, borderRadius: 7, backgroundColor: "#FCD34D", alignItems: "center", justifyContent: "center" },
  pendingTitle: { fontSize: 12, fontWeight: "700", color: "#92400E", fontFamily: D.fontBold },
  pendingLink: { fontSize: 11, fontWeight: "700", color: "#B45309", fontFamily: D.fontBold },
  pendingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  pendingName: { fontSize: 12, fontWeight: "600", color: "#78350F", fontFamily: D.fontSemiBold },
  pendingBatch: { fontSize: 10.5, color: "#B45309", marginTop: 1, fontFamily: D.font },
  reviewBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: D.surface, borderWidth: 1, borderColor: "#FCD34D" },
  reviewBtnText: { fontSize: 10.5, fontWeight: "700", color: "#92400E", fontFamily: D.fontBold },
  statTile: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  statLabel: { fontSize: 9.5, fontWeight: "700", color: D.outline, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5, fontFamily: D.fontBold },
  statValue: { fontSize: 18, fontWeight: "800", color: D.onSurface, letterSpacing: -0.5, lineHeight: 22, fontFamily: D.fontExtraBold },
  statSub: { fontSize: 10, color: D.outline, marginTop: 4, fontFamily: D.font },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: D.outline, letterSpacing: 0.5, marginBottom: 10, fontFamily: D.fontBold },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  studentName: { fontSize: 12.5, fontWeight: "700", color: D.onSurface, letterSpacing: -0.15, fontFamily: D.fontBold },
  studentMeta: { fontSize: 10.5, color: D.outline, marginTop: 1, fontFamily: D.font },
  attValue: { fontSize: 13, fontWeight: "800", letterSpacing: -0.3, fontFamily: D.fontExtraBold },
  attPct: { fontSize: 9.5, fontWeight: "600", color: D.outline, fontFamily: D.fontSemiBold },
  attLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.4, marginTop: 1, fontFamily: D.fontBold },
  fab: { position: "absolute", bottom: 88, right: 18, flexDirection: "row", alignItems: "center", gap: 7, height: 44, paddingLeft: 14, paddingRight: 16, borderRadius: 22, backgroundColor: D.primary, shadowColor: D.primary, shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  fabText: { fontSize: 12.5, fontWeight: "700", color: "#fff", letterSpacing: -0.1, fontFamily: D.fontBold },
});
