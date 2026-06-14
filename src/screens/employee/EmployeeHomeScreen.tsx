import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "../../providers/session";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { LinearGradient } from "expo-linear-gradient";
import { useCachedResource } from "../../hooks/useResource";
import { listEmployeeResults, listEmployeeClasses, listEmployeeStudents } from "../../lib/erp";
import { getTodayDateValue } from "../../lib/date";

const quickActions = [
  { label: "Upload\nResult", icon: "bar-chart-outline" as const, color: D.primary, route: "/(employee)/upload-result" as const },
  { label: "Mark\nAttendance", icon: "checkmark-circle-outline" as const, color: "#0369A1", route: "/(employee)/attendance" as const },
  { label: "Log\nInquiry", icon: "person-add-outline" as const, color: "#15803D", route: "/(employee)/log-inquiry" as const },
  { label: "View\nSchedule", icon: "calendar-outline" as const, color: "#B45309", route: "/(employee)/schedules" as const },
];

export function EmployeeHomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const today = getTodayDateValue();
  const initials = profile?.name?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "EO";
  const centre = (profile as any)?.centreName || "CLS Academy";
  const employeeType = (profile as any)?.employeeType || "Office Staff";
  const roleLabel = `${employeeType.toUpperCase()} · ${centre.toUpperCase()}`;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "GOOD MORNING" : hour < 17 ? "GOOD AFTERNOON" : "GOOD EVENING";

  const { data: results } = useCachedResource(
    `employee-results:${profile?.userId ?? "anon"}`,
    async () => {
      if (!profile) return [];
      return listEmployeeResults(profile);
    },
    [profile?.userId],
  );

  const { data: students } = useCachedResource(
    `employee-students:${profile?.userId ?? "anon"}`,
    async () => {
      if (!profile) return [];
      return listEmployeeStudents(profile);
    },
    [profile?.userId],
  );

  const todayResults = (results ?? []).filter((r) => r.publishedAtIso?.startsWith(today));
  const recentResults = (results ?? []).slice(0, 5);

  const summaryCards = [
    {
      label: "My Students",
      value: students != null ? String(students.length) : "—",
      sub: "enrolled in centre",
      icon: "people-outline" as const,
      tone: { bg: D.surfaceLow, fg: D.primary },
      onPress: () => router.push("/(employee)/students"),
    },
    {
      label: "Results Today",
      value: todayResults.length > 0 ? String(todayResults.length) : "—",
      sub: "entries this centre",
      icon: "document-text-outline" as const,
      tone: { bg: "#F0FDF4", fg: "#15803D" },
      onPress: () => router.push("/(employee)/results"),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[D.primary, D.primaryBtn, "#8B5CF6"]}
          style={[s.topGradient, { paddingTop: Math.max(insets.top + 24, 60) }]}
        >
          <View style={{ paddingHorizontal: 22, paddingBottom: 24 }}>
            <View style={s.topBarRow}>
              <View style={s.userRow}>
                <View style={s.avatarCircle}>
                  <Text style={s.avatarText}>{initials}</Text>
                </View>
                <View>
                  <Text style={s.greetingText}>{greeting}</Text>
                  <Text style={s.nameText}>{profile?.name || "Employee"}</Text>
                </View>
              </View>
              <AnimatedPressable style={s.bellBtn} onPress={() => router.push("/(employee)/notifications")}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
              </AnimatedPressable>
            </View>

            <View style={s.roleCard}>
              <Text style={s.roleLabel}>{roleLabel}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={s.contentOverlap}>
          <View style={s.grid2}>
            {summaryCards.map((c) => (
              <AnimatedPressable key={c.label} style={s.featureCard} onPress={c.onPress}>
                <View style={s.fcTopRow}>
                  <View style={[s.fcIcon, { backgroundColor: c.tone.bg }]}>
                    <Ionicons name={c.icon} size={18} color={c.tone.fg} />
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={D.outline} />
                </View>
                <Text style={s.fcLabel}>{c.label.toUpperCase()}</Text>
                <Text style={s.fcValue}>{c.value}</Text>
                <Text style={s.fcSub}>{c.sub}</Text>
              </AnimatedPressable>
            ))}
          </View>

          <Text style={s.sectionLabel}>QUICK ACTIONS</Text>
          <View style={s.qaGrid}>
            {quickActions.map((a) => (
              <AnimatedPressable key={a.label} style={s.qaCard} onPress={() => router.push(a.route as any)}>
                <View style={[s.qaIcon, { backgroundColor: `${a.color}18` }]}>
                  <Ionicons name={a.icon} size={20} color={a.color} />
                </View>
                <Text style={s.qaLabel}>{a.label}</Text>
              </AnimatedPressable>
            ))}
          </View>

          <View style={s.sectionRow}>
            <Text style={s.sectionLabel}>RECENT UPLOADS</Text>
            <AnimatedPressable onPress={() => router.push("/(employee)/results")}>
              <Text style={s.seeAll}>See all</Text>
            </AnimatedPressable>
          </View>

          {recentResults.length === 0 ? (
            <View style={[s.card, { padding: 20, alignItems: "center" }]}>
              <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No results uploaded yet.</Text>
            </View>
          ) : (
            <View style={s.card}>
              {recentResults.map((r, i) => (
                <View key={r.id} style={[s.resultRow, i < recentResults.length - 1 && s.divider]}>
                  <View style={[s.subjectIcon, { backgroundColor: D.surfaceLow }]}>
                    <Text style={{ fontSize: 9, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.primary }}>
                      {(r.subjectName || "?").slice(0, 3).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.resultName}>{r.assessmentTitle}</Text>
                    <Text style={s.resultMeta}>{r.className} · {r.subjectName}</Text>
                  </View>
                  <Text style={{ fontSize: 10, fontFamily: D.font, color: D.outline }}>
                    {r.maxScore > 0 ? `/ ${r.maxScore}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  topGradient: { paddingBottom: 0 },
  topBarRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "800", color: "#fff", fontFamily: D.fontExtraBold },
  greetingText: { fontSize: 9.5, color: "rgba(255,255,255,0.75)", fontFamily: D.fontSemiBold, letterSpacing: 0.5 },
  nameText: { fontSize: 15, fontWeight: "700", color: "#fff", fontFamily: D.fontBold, letterSpacing: -0.3 },
  bellBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  roleCard: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 12 },
  roleLabel: { fontSize: 10, fontWeight: "700", color: "rgba(255,255,255,0.9)", fontFamily: D.fontBold, letterSpacing: 0.5 },
  contentOverlap: { marginTop: -16, paddingHorizontal: 18, paddingTop: 20 },
  grid2: { flexDirection: "row", gap: 16, marginBottom: 24 },
  featureCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 16, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  fcTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fcIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  fcLabel: { marginTop: 12, fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 },
  fcValue: { marginTop: 4, fontSize: 22, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  fcSub: { marginTop: 2, fontSize: 9.5, color: D.onSurfaceVariant, fontFamily: D.font },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAll: { fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.primary },
  qaGrid: { flexDirection: "row", gap: 10, marginBottom: 28 },
  qaCard: { flex: 1, alignItems: "center", backgroundColor: D.surface, borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderColor: D.outlineVariant },
  qaIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  qaLabel: { fontSize: 10.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.1 },
  card: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1, marginBottom: 16 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  subjectIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  resultName: { fontSize: 12.5, fontWeight: "700", color: D.onSurface, letterSpacing: -0.1, fontFamily: D.fontBold },
  resultMeta: { fontSize: 10.5, color: D.outline, marginTop: 3, fontFamily: D.font },
});
