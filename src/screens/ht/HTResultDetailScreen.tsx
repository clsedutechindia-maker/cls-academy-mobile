import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const students = [
  { n: "Aanya Verma", color: "#EC4899", marks: 47, total: 50, rank: 1 },
  { n: "Rahul Sharma", color: "#7C3AED", marks: 44, total: 50, rank: 2 },
  { n: "Karthik Reddy", color: "#F59E0B", marks: 38, total: 50, rank: 3 },
  { n: "Sahil Kumar", color: "#0EA5E9", marks: 36, total: 50, rank: 4 },
  { n: "Meera Patel", color: "#10B981", marks: 34, total: 50, rank: 5 },
  { n: "Arjun Singh", color: "#6366F1", marks: 31, total: 50, rank: 6 },
  { n: "Priya Joshi", color: "#EF4444", marks: 28, total: 50, rank: 7 },
];

const avg = Math.round(students.reduce((s, r) => s + r.marks, 0) / students.length);
const highest = students[0]!.marks;
const lowest = students[students.length - 1]!.marks;
const passing = students.filter((s) => (s.marks / s.total) >= 0.6).length;

const rankBg = ["#FCD34D", "#E5E7EB", "#FED7AA"];

export function HTResultDetailScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Results</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Test Detail</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Test Detail</Text>
        {/* Meta card */}
        <View style={s.metaCard}>
          <Text style={s.testName}>Cell Division Unit Test</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {[
              { text: "NEET 11-B", bg: D.surfaceLow, color: D.primary },
              { text: "Biology", bg: "#F0FDF4", color: "#15803D" },
              { text: "Jun 5, 2026", bg: "#F4F4F2", color: D.outline },
              { text: "Total: 50", bg: "#F4F4F2", color: D.outline },
            ].map((b) => (
              <View key={b.text} style={[s.badge, { backgroundColor: b.bg }]}>
                <Text style={[s.badgeText, { color: b.color }]}>{b.text}</Text>
              </View>
            ))}
          </View>
          <Text style={s.uploadedBy}>Uploaded by <Text style={{ color: D.onSurface, fontWeight: "600", fontFamily: D.fontSemiBold }}>Mr. Sharma</Text> · Jun 5, 2026</Text>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
          {[
            { label: "Class avg", value: `${avg}`, sub: "/ 50", accent: avg >= 40 ? "#15803D" : "#B45309" },
            { label: "Highest", value: `${highest}`, sub: "/ 50", accent: "#6366F1" },
            { label: "Lowest", value: `${lowest}`, sub: "/ 50", accent: "#B91C1C" },
            { label: "Pass (≥60%)", value: `${passing}`, sub: `/ ${students.length}`, accent: "#15803D" },
          ].map((stat) => (
            <View key={stat.label} style={s.statTile}>
              <Text style={s.statLabel}>{stat.label}</Text>
              <Text style={[s.statValue, { color: stat.accent }]}>{stat.value}</Text>
              <Text style={s.statSub}>{stat.sub}</Text>
            </View>
          ))}
        </View>

        {/* Sort toggle + list */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Text style={s.sectionLabel}>STUDENT SCORES</Text>
          <View style={s.sortToggle}>
            {["By Marks", "A–Z"].map((t, i) => (
              <View key={t} style={[s.sortBtn, i === 0 && s.sortBtnActive]}>
                <Text style={[s.sortText, { color: i === 0 ? D.primary : D.outline }]}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.card}>
          {/* Header */}
          <View style={[s.tableHeader, { backgroundColor: D.bg }]}>
            <Text style={[s.colLabel, { width: 28 }]}>#</Text>
            <Text style={[s.colLabel, { flex: 1 }]}>STUDENT</Text>
            <Text style={[s.colLabel, { width: 60, textAlign: "center" }]}>SCORE</Text>
            <Text style={[s.colLabel, { width: 44, textAlign: "right" }]}>%</Text>
          </View>
          {students.map((student, i) => {
            const pct = Math.round((student.marks / student.total) * 100);
            return (
              <View key={student.n} style={[s.scoreRow, i < students.length - 1 && s.divider, i === 0 && { backgroundColor: "#FFFBF0" }]}>
                <View style={[s.rankBadge, { backgroundColor: i < 3 ? rankBg[i] : "transparent" }]}>
                  <Text style={[s.rankNum, { color: i < 3 ? "#1F2937" : D.outline }]}>{student.rank}</Text>
                </View>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: student.color, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" }}>{student.n.split(" ").map((w) => w[0]).join("")}</Text>
                </View>
                <Text style={{ flex: 1, fontSize: 13, fontWeight: "500", fontFamily: D.fontMedium, color: D.onSurface, letterSpacing: -0.1 }}>{student.n}</Text>
                <Text style={[s.scoreText, { width: 60, textAlign: "center" }]}>{student.marks}<Text style={{ fontSize: 10, color: D.outline, fontWeight: "500", fontFamily: D.fontMedium }}>/{student.total}</Text></Text>
                <Text style={[s.pctText, { width: 44, textAlign: "right", color: pct >= 80 ? "#15803D" : pct >= 60 ? "#B45309" : "#B91C1C" }]}>{pct}%</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 10, backgroundColor: D.bg },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingRight: 10, paddingLeft: 6, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, height: 38 },
  backText: { fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  headerTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  pageTitle: { fontSize: 22, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.7, marginBottom: 14 },
  metaCard: { backgroundColor: D.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 12, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  testName: { fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5, marginBottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold },
  uploadedBy: { fontSize: 12, fontFamily: D.font, color: D.outline },
  statTile: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  statLabel: { fontSize: 9.5, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 3 },
  statValue: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, letterSpacing: -0.5, lineHeight: 22 },
  statSub: { fontSize: 10, fontFamily: D.font, color: D.outline, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 },
  sortToggle: { flexDirection: "row", padding: 3, borderRadius: 10, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, gap: 2 },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  sortBtnActive: { backgroundColor: D.surface, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  sortText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  tableHeader: { flexDirection: "row", alignItems: "center", padding: 8, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  colLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.3 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, paddingHorizontal: 14, backgroundColor: D.surface },
  rankBadge: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  rankNum: { fontSize: 11, fontWeight: "800", fontFamily: D.fontExtraBold },
  scoreText: { fontSize: 13, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
  pctText: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold },
});
