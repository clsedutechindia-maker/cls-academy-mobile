import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const subjectColor: Record<string, { text: string; bg: string }> = {
  Physics: { text: "#6366F1", bg: "#EEF2FF" },
  Chemistry: { text: "#0EA5E9", bg: "#F0F9FF" },
  Biology: { text: "#10B981", bg: "#F0FDF4" },
};

const batchColor: Record<string, { text: string; bg: string }> = {
  "NEET 11-B": { text: D.primary, bg: D.surfaceLow },
  "NEET 11-A": { text: "#0369A1", bg: "#E0F2FE" },
  "NEET 12-A": { text: "#B45309", bg: "#FEF3C7" },
};

const results = [
  { batch: "NEET 11-B", subject: "Physics", name: "Optics Mock #3", date: "Jun 2", students: 42, avg: 76 },
  { batch: "NEET 11-A", subject: "Chemistry", name: "Equilibrium Unit Test", date: "May 28", students: 38, avg: 81 },
  { batch: "NEET 11-B", subject: "Biology", name: "Cell Division Test", date: "Jun 5", students: 42, avg: 88 },
  { batch: "NEET 12-A", subject: "Physics", name: "Electrostatics Mock", date: "May 20", students: 36, avg: 69 },
  { batch: "NEET 11-A", subject: "Biology", name: "Genetics Unit Test", date: "May 15", students: 38, avg: 84 },
  { batch: "NEET 11-B", subject: "Chemistry", name: "Organic Chemistry #2", date: "May 10", students: 42, avg: 73 },
  { batch: "NEET 12-A", subject: "Chemistry", name: "Electrochemistry Test", date: "May 5", students: 36, avg: 77 },
];

const batches = ["All batches", "NEET 11-B", "NEET 11-A", "NEET 12-A"];

export function HTResultsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 18, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title row */}
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Results</Text>
          <AnimatedPressable style={s.uploadBtn} onPress={() => router.push("/(head-teacher)/upload-result")}>
            <Ionicons name="cloud-upload-outline" size={13} color="#fff" />
            <Text style={s.uploadText}>Upload</Text>
          </AnimatedPressable>
        </View>

        {/* Batch filter chips */}
        <View style={{ flexDirection: "row", gap: 7, marginBottom: 16 }}>
          {batches.map((b, i) => (
            <View key={b} style={[s.chip, i === 0 ? s.chipActive : s.chipInactive]}>
              <Text style={[s.chipText, { color: i === 0 ? "#fff" : D.onSurfaceVariant }]}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Tests uploaded", value: "24", sub: "This year" },
            { label: "Avg class score", value: "79%", sub: "Across batches" },
            { label: "Below 60%", value: "3", sub: "Tests flagged", accent: "#B91C1C" },
          ].map((c) => (
            <View key={c.label} style={s.statTile}>
              <Text style={s.statLabel}>{c.label}</Text>
              <Text style={[s.statValue, c.accent ? { color: c.accent } : {}]}>{c.value}</Text>
              <Text style={s.statSub}>{c.sub}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>RECENT UPLOADS</Text>
        <View style={s.card}>
          {results.map((r, i) => {
            const sc = subjectColor[r.subject] ?? { text: D.outline, bg: "#F4F4F2" };
            const bc = batchColor[r.batch] ?? { text: D.outline, bg: "#F4F4F2" };
            return (
              <AnimatedPressable
                key={i}
                style={[s.resultRow, i < results.length - 1 && s.divider]}
                onPress={() => router.push("/(head-teacher)/result-detail")}
              >
                <View style={{ flexDirection: "row", gap: 6, marginBottom: 6 }}>
                  <View style={[s.badge, { backgroundColor: bc.bg }]}><Text style={[s.badgeText, { color: bc.text }]}>{r.batch}</Text></View>
                  <View style={[s.badge, { backgroundColor: sc.bg }]}><Text style={[s.badgeText, { color: sc.text }]}>{r.subject}</Text></View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.resultName}>{r.name}</Text>
                    <Text style={s.resultMeta}>{r.date} · {r.students} students</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[s.avgText, { color: r.avg >= 80 ? "#15803D" : r.avg >= 65 ? "#B45309" : "#B91C1C" }]}>{r.avg}%</Text>
                    <Ionicons name="chevron-forward" size={13} color={D.outline} />
                  </View>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  pageTitle: { fontSize: 22, fontWeight: "800", color: D.onSurface, letterSpacing: -0.5, fontFamily: D.fontExtraBold },
  uploadBtn: { flexDirection: "row", alignItems: "center", gap: 6, height: 34, paddingHorizontal: 12, borderRadius: 12, backgroundColor: D.primary, shadowColor: D.primary, shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 5 } },
  uploadText: { fontSize: 11.5, fontWeight: "700", color: "#fff", letterSpacing: -0.1, fontFamily: D.fontBold },
  chip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999 },
  chipActive: { backgroundColor: D.primary, borderWidth: 1, borderColor: D.primary },
  chipInactive: { backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  chipText: { fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold },
  statTile: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  statLabel: { fontSize: 9.5, fontWeight: "700", color: D.outline, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 5, fontFamily: D.fontBold },
  statValue: { fontSize: 18, fontWeight: "800", color: D.onSurface, letterSpacing: -0.5, lineHeight: 22, fontFamily: D.fontExtraBold },
  statSub: { fontSize: 10, color: D.outline, marginTop: 4, fontFamily: D.font },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: D.outline, letterSpacing: 0.5, marginBottom: 10, fontFamily: D.fontBold },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  resultRow: { padding: 14 },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.2, fontFamily: D.fontBold },
  resultName: { fontSize: 12.5, fontWeight: "700", color: D.onSurface, letterSpacing: -0.15, fontFamily: D.fontBold },
  resultMeta: { fontSize: 10.5, color: D.outline, marginTop: 3, fontFamily: D.font },
  avgText: { fontSize: 13, fontWeight: "800", letterSpacing: -0.3, fontFamily: D.fontExtraBold },
});
