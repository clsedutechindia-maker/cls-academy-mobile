import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { useResource } from "../hooks/useResource";
import { listResultsForAssessment } from "../lib/erp";

const rankBg = ["#FCD34D", "#E5E7EB", "#FED7AA"];

const avatarColors = [
  "#EC4899", "#7C3AED", "#F59E0B", "#0EA5E9",
  "#10B981", "#6366F1", "#EF4444", "#84CC16",
];

export function AdminResultDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    assessmentTitle: string;
    classId: string;
    className: string;
    subjectName: string;
    subjectId: string;
  }>();

  const assessmentTitle = params.assessmentTitle ?? "";
  const classId = params.classId ?? "";
  const className = params.className ?? "";
  const subjectName = params.subjectName ?? "";
  const subjectId = params.subjectId ?? "";

  const { data: students, loading, error } = useResource(
    async () => {
      if (!assessmentTitle || !classId) return [];
      return listResultsForAssessment(assessmentTitle, classId, subjectId || undefined);
    },
    [assessmentTitle, classId, subjectId],
  );

  const sorted = students ?? [];
  const avg = sorted.length > 0
    ? Math.round(sorted.reduce((s, r) => s + (r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0), 0) / sorted.length)
    : 0;
  const highest = sorted.length > 0 ? sorted[0]!.score : 0;
  const lowest = sorted.length > 0 ? sorted[sorted.length - 1]!.score : 0;
  const maxScore = sorted.length > 0 ? sorted[0]!.maxScore : 50;

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.navTitle}>Test Detail</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={s.metaCard}>
          <Text style={s.testName}>{assessmentTitle || "Test Detail"}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {[
              { text: className, bg: D.surfaceLow, color: D.primary },
              { text: subjectName, bg: "#F0FDF4", color: "#15803D" },
            ].filter((b) => b.text).map((b) => (
              <View key={b.text} style={[s.badge, { backgroundColor: b.bg }]}>
                <Text style={[s.badgeText, { color: b.color }]}>{b.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {loading && (
          <View style={{ padding: 32, alignItems: "center" }}>
            <ActivityIndicator size="large" color={D.primary} />
          </View>
        )}

        {error && (
          <View style={{ padding: 16 }}>
            <Text style={{ color: "#B91C1C", fontFamily: D.font }}>{error}</Text>
          </View>
        )}

        {!loading && !error && (
          <>
            <View style={{ flexDirection: "row", gap: 8, marginVertical: 18 }}>
              {[
                { label: "Class avg", value: `${avg}%` },
                { label: "Highest", value: `${highest}/${maxScore}` },
                { label: "Lowest", value: `${lowest}/${maxScore}` },
              ].map((stat) => (
                <View key={stat.label} style={s.statTile}>
                  <Text style={s.statLabel}>{stat.label}</Text>
                  <Text style={s.statValue}>{stat.value}</Text>
                </View>
              ))}
            </View>

            <Text style={[s.sectionLabel, { marginBottom: 12 }]}>STUDENT SCORES</Text>

            {sorted.length === 0 ? (
              <View style={[s.card, { padding: 20, alignItems: "center" }]}>
                <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No scores found for this test.</Text>
              </View>
            ) : (
              <View style={s.card}>
                <View style={[s.tableHeader, { backgroundColor: D.bg }]}>
                  <Text style={[s.colLabel, { width: 28 }]}>#</Text>
                  <Text style={[s.colLabel, { flex: 1 }]}>STUDENT</Text>
                  <Text style={[s.colLabel, { width: 60, textAlign: "center" }]}>SCORE</Text>
                  <Text style={[s.colLabel, { width: 44, textAlign: "right" }]}>%</Text>
                </View>
                {sorted.map((student, i) => {
                  const pct = student.maxScore > 0 ? Math.round((student.score / student.maxScore) * 100) : 0;
                  const initials = student.studentName
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0] ?? "")
                    .join("")
                    .toUpperCase();
                  const avatarColor = avatarColors[i % avatarColors.length]!;
                  return (
                    <View key={student.id} style={[s.scoreRow, i < sorted.length - 1 && s.divider, i === 0 && { backgroundColor: "#FFFBF0" }]}>
                      <View style={[s.rankBadge, { backgroundColor: i < 3 ? rankBg[i] : "transparent" }]}>
                        <Text style={[s.rankNum, { color: i < 3 ? "#1F2937" : D.outline }]}>{i + 1}</Text>
                      </View>
                      <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: avatarColor, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" }}>{initials}</Text>
                      </View>
                      <Text style={{ flex: 1, fontSize: 13, fontWeight: "500", fontFamily: D.fontMedium, color: D.onSurface, letterSpacing: -0.1 }}>{student.studentName}</Text>
                      <Text style={[s.scoreText, { width: 60, textAlign: "center" }]}>
                        {student.score}
                        <Text style={{ fontSize: 10, color: D.outline, fontWeight: "500", fontFamily: D.fontMedium }}>/{student.maxScore}</Text>
                      </Text>
                      <Text style={[s.pctText, { width: 44, textAlign: "right", color: pct >= 80 ? "#15803D" : pct >= 60 ? "#B45309" : "#B91C1C" }]}>{pct}%</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  metaCard: { backgroundColor: D.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 12, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  testName: { fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5, marginBottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold },
  statTile: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  statLabel: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.4 },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  tableHeader: { flexDirection: "row", alignItems: "center", padding: 8, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  colLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.3 },
  scoreRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, paddingHorizontal: 14, backgroundColor: D.surface },
  rankBadge: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  rankNum: { fontSize: 11, fontWeight: "800", fontFamily: D.fontExtraBold },
  scoreText: { fontSize: 13, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
  pctText: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold },
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
});
