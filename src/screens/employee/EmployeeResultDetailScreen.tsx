import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useResource } from "../../hooks/useResource";
import { listResultsForAssessment } from "../../lib/erp";
import { router } from "expo-router";

const avatarColors = ["#EC4899", "#7C3AED", "#F59E0B", "#0EA5E9", "#10B981", "#6366F1"];

export function EmployeeResultDetailScreen() {
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

  const sorted = [...(students ?? [])].sort((a, b) => b.score - a.score);
  const total = sorted.length;
  const avg = total > 0 ? Math.round(sorted.reduce((acc, s) => acc + (s.maxScore > 0 ? (s.score / s.maxScore) * 100 : 0), 0) / total) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          <Text style={s.navTitle} numberOfLines={1}>{assessmentTitle}</Text>
          <Text style={s.navSub} numberOfLines={1}>{className} · {subjectName}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {loading && <View style={{ padding: 32, alignItems: "center" }}><ActivityIndicator color={D.primary} /></View>}
        {error && <View style={[s.card, { padding: 16 }]}><Text style={{ fontSize: 13, fontFamily: D.font, color: "#B91C1C" }}>{error}</Text></View>}

        {!loading && !error && sorted.length > 0 && (
          <>
            <View style={s.grid2}>
              {[
                { label: "Students", value: String(total), icon: "people-outline" as const, bg: D.surfaceLow, fg: D.primary },
                { label: "Class Avg", value: `${avg}%`, icon: "bar-chart-outline" as const, bg: "#F0FDF4", fg: "#15803D" },
              ].map((c) => (
                <View key={c.label} style={s.statCard}>
                  <View style={[s.statIcon, { backgroundColor: c.bg }]}>
                    <Ionicons name={c.icon} size={16} color={c.fg} />
                  </View>
                  <Text style={s.statLabel}>{c.label.toUpperCase()}</Text>
                  <Text style={s.statValue}>{c.value}</Text>
                </View>
              ))}
            </View>

            <Text style={s.sectionLabel}>STUDENT RESULTS</Text>
            <View style={s.card}>
              {sorted.map((r, i) => {
                const pct = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0;
                const avatarBg = avatarColors[i % avatarColors.length]!;
                const initial = r.studentName?.charAt(0)?.toUpperCase() || "?";
                return (
                  <View key={r.id} style={[s.resultRow, i < sorted.length - 1 && s.divider]}>
                    <View style={[s.avatarCircle, { backgroundColor: avatarBg }]}>
                      <Text style={s.avatarText}>{initial}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.studentName}>{r.studentName}</Text>
                      <Text style={s.gradeText}>Grade: {r.grade}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[s.scoreText, { color: pct >= 80 ? "#15803D" : pct >= 60 ? "#B45309" : "#B91C1C" }]}>
                        {r.score}/{r.maxScore}
                      </Text>
                      <Text style={s.pctText}>{pct}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {!loading && !error && sorted.length === 0 && (
          <View style={[s.card, { padding: 24, alignItems: "center" }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No results found.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  navSub: { fontSize: 11, color: D.outline, fontFamily: D.font, marginTop: 2 },
  grid2: { flexDirection: "row", gap: 16, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: D.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: D.outlineVariant },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statLabel: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 14, fontWeight: "700", color: "#fff", fontFamily: D.fontBold },
  studentName: { fontSize: 13, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface, letterSpacing: -0.1 },
  gradeText: { fontSize: 11, color: D.outline, fontFamily: D.font, marginTop: 2 },
  scoreText: { fontSize: 14, fontWeight: "800", fontFamily: D.fontExtraBold, letterSpacing: -0.3 },
  pctText: { fontSize: 10.5, color: D.outline, fontFamily: D.font, marginTop: 2 },
});
