import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "../../providers/session";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { LinearGradient } from "expo-linear-gradient";
import { useResource } from "../../hooks/useResource";
import { listDoubtsForTeacher, listPendingStudentsForTeacher, listTeacherTimetable } from "../../lib/erp";

const quickActions = [
  { label: "Upload\nResult", icon: "bar-chart-outline" as const, color: D.primary, route: "/(team)/upload-result" as const },
  { label: "Post\nCircular", icon: "megaphone-outline" as const, color: "#0369A1", route: "/(team)/post-circular" as const },
  { label: "Leave\nRequests", icon: "document-text-outline" as const, color: "#15803D", route: "/(team)/leave" as const },
  { label: "Answer\nDoubts", icon: "help-circle-outline" as const, color: "#EC4899", route: "/(team)/doubts" as const },
];

const subjectColors: Record<string, string> = {
  Physics: "#6366F1",
  Chemistry: "#0EA5E9",
  Biology: "#10B981",
  Math: "#F59E0B",
};
function subjectColor(subject: string) {
  for (const key of Object.keys(subjectColors)) {
    if (subject.includes(key)) return subjectColors[key];
  }
  return D.primary;
}

export function HTHomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const { data: doubts } = useResource(
    async () => {
      if (!profile) return [];
      return listDoubtsForTeacher(profile);
    },
    [profile?.userId],
  );

  const { data: pendingStudents } = useResource(
    async () => {
      if (!profile) return [];
      return listPendingStudentsForTeacher(profile);
    },
    [profile?.userId],
  );

  const { data: timetable } = useResource(
    async () => {
      if (!profile) return { timetableEntries: [], tests: [] };
      return listTeacherTimetable(profile);
    },
    [profile?.userId],
  );

  const openDoubtsCount = (doubts ?? []).filter((d) => d.status === "open").length;
  const pendingCount = pendingStudents?.length ?? 0;
  const classNames: string[] = Array.from(new Set(profile?.teacherClassNames ?? [])).filter(Boolean) as string[];

  const summaryCards = [
    {
      label: "Open Doubts",
      value: String(openDoubtsCount),
      sub: "unanswered",
      icon: "help-circle-outline" as const,
      tone: { bg: "#FDF2F8", fg: "#EC4899" },
      onPress: () => router.push("/(team)/doubts"),
    },
    {
      label: "Pending Approvals",
      value: pendingCount > 0 ? String(pendingCount) : "—",
      sub: "new enrollments",
      icon: "time-outline" as const,
      tone: { bg: "#FEF3C7", fg: "#B45309" },
      onPress: () => router.push("/(team)/approve-student"),
    },
  ];

  const initials = profile?.name?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "HT";
  const subjects = (profile as any)?.teacherSubjectNames?.join(", ") || "Physics, Chemistry";
  const centre = (profile as any)?.centreName || "CLS Raipur";
  const roleLabel = "TEAM · " + centre.toUpperCase();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "GOOD MORNING" : hour < 17 ? "GOOD AFTERNOON" : "GOOD EVENING";

  const todayDayKey = (() => {
    const map: Record<number, string> = { 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday", 6: "saturday" };
    return map[new Date().getDay()] ?? "monday";
  })();
  const todayClasses = (timetable?.timetableEntries ?? [])
    .filter((e) => e.dayKey === todayDayKey)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 4)
    .map((e) => {
      const [h, m] = e.startTime.split(":").map(Number);
      const ampm = (h ?? 0) >= 12 ? "PM" : "AM";
      const hour = (h ?? 0) % 12 || 12;
      const time = `${hour}:${String(m ?? 0).padStart(2, "0")} ${ampm}`;
      return { time, subject: e.subjectName, batch: e.className, room: "—" };
    });

  // Activity feed from recent doubts
  function relativeTime(isoStr: string) {
    if (!isoStr) return "—";
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const activityFeed = (doubts ?? []).slice(0, 5).map((d) => ({
    icon: "help-circle-outline" as const,
    color: "#0369A1",
    bg: "#F0F9FF",
    label: d.status === "open" ? "New doubt posted" : "Doubt replied",
    sub: `${d.studentName} · ${d.studentClassName}`,
    time: relativeTime(d.updatedAtIso || d.createdAtIso),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Purple gradient header */}
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
                  <Text style={s.nameText}>{profile?.name || "Teacher"}</Text>
                </View>
              </View>
              <AnimatedPressable style={s.bellBtn} onPress={() => router.push("/(team)/notifications")}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                <View style={s.bellDot} />
              </AnimatedPressable>
            </View>

            {/* Role / subject card */}
            <View style={s.roleCard}>
              <View>
                <Text style={s.roleLabel}>{roleLabel}</Text>
                <Text style={s.roleSub}>{subjects}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={s.contentOverlap}>
          {/* Summary 2×2 grid — FeatureCard style */}
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

          {/* Quick links — 4 cols style */}
          <SectionHeader title="Quick links" />
          <View style={s.grid4}>
            {quickActions.map((q) => (
              <QuickLink key={q.label} icon={q.icon} label={q.label} color={q.color} onPress={() => router.push(q.route as any)} />
            ))}
          </View>

          {/* Today's classes */}
          <SectionHeader title="Today's classes" action="Full schedule" onPress={() => router.push("/(team)/schedule")} />
          <View style={s.card}>
            {todayClasses.length === 0 ? (
              <View style={{ padding: 16, alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No classes scheduled. View full schedule for details.</Text>
              </View>
            ) : (
              todayClasses.map((cls, i) => {
                const color = subjectColor(cls.subject);
                return (
                  <View key={cls.batch} style={[s.classRow, i < todayClasses.length - 1 && s.divider]}>
                    <View style={s.classTimeBlock}>
                      <Text style={s.classTime}>{cls.time}</Text>
                    </View>
                    <View style={[s.accentLine, { backgroundColor: color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.classSubject}>{cls.subject}</Text>
                      <Text style={s.classMeta}>{cls.batch}</Text>
                    </View>
                    {i === 0 && <View style={s.nextBadge}><Text style={s.nextBadgeText}>NEXT</Text></View>}
                  </View>
                );
              })
            )}
          </View>

          {/* Upcoming tests */}
          <SectionHeader title="Upcoming tests" action="View all" onPress={() => router.push("/(team)/schedule")} />
          <View style={[s.card, { padding: 16, alignItems: "center" }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>View schedule for upcoming test details.</Text>
          </View>

          {/* Recent activity */}
          <SectionHeader title="Recent activity" />
          <View style={s.card}>
            {activityFeed.length === 0 ? (
              <View style={{ padding: 16, alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No recent activity.</Text>
              </View>
            ) : (
              activityFeed.map((ev, i) => (
                <View key={`${ev.sub}-${i}`} style={[s.activityRow, i < activityFeed.length - 1 && s.divider]}>
                  <View style={[s.activityIcon, { backgroundColor: ev.bg }]}>
                    <Ionicons name={ev.icon} size={15} color={ev.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.activityLabel}>{ev.label}</Text>
                    <Text style={s.activitySub}>{ev.sub}</Text>
                  </View>
                  <Text style={s.activityTime}>{ev.time}</Text>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 124 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && (
        <AnimatedPressable onPress={onPress}>
          <Text style={s.sectionAction}>{action}</Text>
        </AnimatedPressable>
      )}
    </View>
  );
}

function QuickLink({ icon, label, color, onPress }: { icon: React.ComponentProps<typeof Ionicons>["name"]; label: string; color: string; onPress: () => void }) {
  const lines = String(label).replace(/\\n/g, "\n").split("\n");
  return (
    <AnimatedPressable style={s.qlBox} onPress={onPress}>
      <View style={[s.qlIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={s.qlLabel}>
        {lines.map((line: string, index: number) => (
          <Text key={`${line}-${index}`}>
            {line}
            {index < lines.length - 1 ? "\n" : ""}
          </Text>
        ))}
      </Text>
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  topGradient: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  topBarRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F3E8FF", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.45)" },
  avatarText: { color: D.primary, fontWeight: "800", fontSize: 12, fontFamily: D.fontExtraBold },
  greetingText: { fontSize: 9, color: "rgba(255,255,255,0.72)", letterSpacing: 0.35, fontWeight: "700", fontFamily: D.fontBold },
  nameText: { fontSize: 15, color: "#fff", fontWeight: "800", letterSpacing: -0.2, marginTop: 2, fontFamily: D.fontExtraBold },
  bellBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  bellDot: { position: "absolute", top: 6, right: 6, width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#FF4D67", borderWidth: 2, borderColor: "#fff" },
  roleCard: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.13)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  roleLabel: { fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: "700", letterSpacing: 0.6, fontFamily: D.fontBold },
  roleSub: { fontSize: 11, color: "#fff", fontWeight: "600", marginTop: 4, letterSpacing: -0.05, fontFamily: D.fontSemiBold },
  contentOverlap: { marginTop: -12, paddingHorizontal: 18 },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderRadius: 10, borderWidth: 1 },
  alertCount: { width: 22, height: 22, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  alertCountText: { fontSize: 10, fontWeight: "800", color: "#fff", fontFamily: D.fontExtraBold },
  alertLabel: { flex: 1, fontSize: 12, fontWeight: "600", letterSpacing: -0.1, fontFamily: D.fontSemiBold },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 4 },
  grid4: { flexDirection: "row", gap: 10 },
  featureCard: { width: "48%", backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 4, elevation: 1 },
  fcTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fcIcon: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  fcLabel: { marginTop: 10, fontSize: 9.5, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 },
  fcValue: { marginTop: 4, fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.35 },
  fcSub: { marginTop: 4, fontSize: 9.5, color: D.onSurfaceVariant, letterSpacing: -0.05, fontFamily: D.font, lineHeight: 14 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 12, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.15 },
  sectionAction: { fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.primary },
  grid3: { flexDirection: "row", gap: 10 },
  qlBox: { flex: 1, minWidth: 0, aspectRatio: 0.92, backgroundColor: "#fff", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 6, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  qlIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  qlLabel: { fontSize: 9.5, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", lineHeight: 14, letterSpacing: -0.1, width: "100%", minHeight: 28 },
  card: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  classRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  classTimeBlock: { width: 68, flexShrink: 0 },
  classTime: { fontSize: 11, fontWeight: "800", color: D.onSurface, letterSpacing: -0.2, fontFamily: D.fontExtraBold },
  classTimeRoom: { fontSize: 9.5, color: D.outline, marginTop: 3, fontFamily: D.font },
  accentLine: { width: 3, height: 40, borderRadius: 2, flexShrink: 0 },
  classSubjectTag: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.5, marginBottom: 2 },
  classSubject: { fontSize: 12, fontWeight: "700", color: D.onSurface, letterSpacing: -0.1, fontFamily: D.fontBold },
  classMeta: { fontSize: 9.5, color: D.outline, marginTop: 3, fontFamily: D.font },
  nextBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: D.primary },
  nextBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.3, fontFamily: D.fontExtraBold },
  testRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  datePill: { width: 40, borderRadius: 8, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, paddingVertical: 6, alignItems: "center" },
  datePillMon: { fontSize: 8.5, fontWeight: "700", color: D.primary, letterSpacing: 0.4, textTransform: "uppercase", fontFamily: D.fontBold },
  datePillDay: { fontSize: 14, fontWeight: "800", color: D.primary, letterSpacing: -0.4, lineHeight: 17, fontFamily: D.fontExtraBold },
  testName: { fontSize: 12.5, fontWeight: "700", color: D.onSurface, letterSpacing: -0.2, fontFamily: D.fontBold },
  testBatch: { fontSize: 10.5, color: D.outline, marginTop: 2, fontFamily: D.font },
  daysLeft: { fontSize: 10.5, fontWeight: "700", letterSpacing: -0.1, fontFamily: D.fontBold },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  activityIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  activityLabel: { fontSize: 12, fontWeight: "700", color: D.onSurface, letterSpacing: -0.1, fontFamily: D.fontBold },
  activitySub: { fontSize: 10.5, color: D.outline, marginTop: 2, fontFamily: D.font },
  activityTime: { fontSize: 10, color: D.outline, fontWeight: "500", flexShrink: 0, letterSpacing: -0.1, fontFamily: D.fontMedium },
});
