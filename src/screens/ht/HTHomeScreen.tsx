import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "../../providers/session";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const summaryCards = [
  { label: "My Students", value: "124", sub: "3 batches", accent: D.primary, bg: D.surfaceLow },
  { label: "Today's Att.", value: "87%", sub: "across batches", accent: "#15803D", bg: "#F0FDF4" },
  { label: "Leave Requests", value: "3", sub: "pending review", accent: "#B45309", bg: "#FEF3C7" },
  { label: "Open Doubts", value: "5", sub: "unanswered", accent: "#0369A1", bg: "#F0F9FF" },
];

const alerts = [
  { label: "Staff leave awaiting approval", count: 2, color: "#B45309", bg: "#FEF3C7", border: "#FDE68A" },
  { label: "Pending student enrolments", count: 2, color: D.primaryBtn, bg: D.surfaceLow, border: D.surfaceHigh },
];

const todayClasses = [
  { time: "8:00 AM", subject: "Physics · Optics", batch: "NEET 11-B", room: "R-3" },
  { time: "10:00 AM", subject: "Chemistry · Equilibrium", batch: "NEET 11-A", room: "R-5" },
  { time: "12:30 PM", subject: "Biology · Cell Division", batch: "NEET 12-A", room: "R-1" },
];

const upcomingTests = [
  { date: "Jun 11", label: "Physics Unit Test", batch: "NEET 11-B", daysLeft: 2 },
  { date: "Jun 13", label: "Chemistry Mock", batch: "NEET 11-A", daysLeft: 4 },
  { date: "Jun 17", label: "Biology Mid-term", batch: "NEET 12-A", daysLeft: 8 },
];

const activityFeed = [
  { icon: "help-circle-outline" as const, color: "#0369A1", bg: "#F0F9FF", label: "New doubt posted", sub: "Rahul Sharma · NEET 11-B", time: "9 min ago" },
  { icon: "document-outline" as const, color: "#B45309", bg: "#FEF3C7", label: "Leave request submitted", sub: "Ms. Priya Iyer · Chemistry", time: "42 min ago" },
  { icon: "bar-chart-outline" as const, color: "#15803D", bg: "#F0FDF4", label: "Results uploaded", sub: "Physics Unit Test · NEET 11-B", time: "2 hr ago" },
  { icon: "megaphone-outline" as const, color: D.primaryBtn, bg: D.surfaceLow, label: "Circular posted", sub: "Holiday notice · All batches", time: "4 hr ago" },
  { icon: "person-add-outline" as const, color: "#15803D", bg: "#F0FDF4", label: "Student approved", sub: "Sneha Gupta · NEET 11-B", time: "Yesterday" },
];

const quickActions = [
  { label: "Upload Result", icon: "bar-chart-outline" as const, color: D.primary, bg: D.surfaceLow, route: "/(head-teacher)/upload-result" as const },
  { label: "Post Circular", icon: "megaphone-outline" as const, color: "#0369A1", bg: "#F0F9FF", route: "/(head-teacher)/post-circular" as const },
  { label: "Leave Requests", icon: "document-text-outline" as const, color: "#15803D", bg: "#F0FDF4", route: "/(head-teacher)/leave" as const },
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
  const firstName = profile?.name?.split(" ")[0] ?? "Teacher";

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const dateLabel = `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()} · NEET session`;

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 18, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting header */}
        <View style={[s.row, { marginBottom: 20 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>{dateLabel}</Text>
            <Text style={s.greeting}>Good morning,{"\n"}Mr. {firstName}</Text>
          </View>
          <View style={s.bellWrap}>
            <Ionicons name="notifications-outline" size={18} color={D.onSurface} />
            <View style={s.bellBadge}><Text style={s.bellBadgeText}>4</Text></View>
          </View>
        </View>

        {/* Alert rows */}
        <View style={{ gap: 8, marginBottom: 20 }}>
          {alerts.map((a) => (
            <AnimatedPressable key={a.label} style={[s.alertRow, { backgroundColor: a.bg, borderColor: a.border }]}>
              <View style={[s.alertCount, { backgroundColor: a.color }]}>
                <Text style={s.alertCountText}>{a.count}</Text>
              </View>
              <Text style={[s.alertLabel, { color: a.color }]}>{a.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={a.color} />
            </AnimatedPressable>
          ))}
        </View>

        {/* Summary 2×2 grid */}
        <View style={s.grid2}>
          {summaryCards.map((c) => (
            <View key={c.label} style={s.summaryCard}>
              <Text style={s.summaryLabel}>{c.label}</Text>
              <Text style={[s.summaryValue, { color: c.accent }]}>{c.value}</Text>
              <Text style={s.summarySub}>{c.sub}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <Text style={s.sectionLabel}>QUICK ACTIONS</Text>
        <View style={[s.row, { gap: 10, marginBottom: 24 }]}>
          {quickActions.map((q) => (
            <AnimatedPressable key={q.label} style={[s.quickAction, { backgroundColor: q.bg }]} onPress={() => router.push(q.route as any)}>
              <View style={s.quickIcon}>
                <Ionicons name={q.icon} size={17} color={q.color} />
              </View>
              <Text style={[s.quickLabel, { color: q.color }]}>{q.label}</Text>
            </AnimatedPressable>
          ))}
        </View>

        {/* Today's classes */}
        <View style={[s.row, { marginBottom: 12 }]}>
          <Text style={s.sectionLabel}>TODAY'S CLASSES</Text>
          <Text style={s.sectionLink}>Full schedule</Text>
        </View>
        <View style={s.card}>
          {todayClasses.map((cls, i) => {
            const color = subjectColor(cls.subject);
            const [subjectName, topic] = cls.subject.split(" · ");
            return (
              <View key={cls.time} style={[s.classRow, i < todayClasses.length - 1 && s.divider]}>
                <View style={s.classTimeBlock}>
                  <Text style={s.classTime}>{cls.time}</Text>
                  <Text style={s.classTimeRoom}>{cls.room}</Text>
                </View>
                <View style={[s.accentLine, { backgroundColor: color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.classSubjectTag, { color }]}>{subjectName.toUpperCase()}</Text>
                  <Text style={s.classSubject}>{topic || subjectName}</Text>
                  <Text style={s.classMeta}>{cls.batch}</Text>
                </View>
                {i === 0 && <View style={s.nextBadge}><Text style={s.nextBadgeText}>NEXT</Text></View>}
              </View>
            );
          })}
        </View>

        {/* Upcoming tests */}
        <View style={[s.row, { marginBottom: 12, marginTop: 22 }]}>
          <Text style={s.sectionLabel}>UPCOMING TESTS</Text>
          <Text style={s.sectionLink}>View all</Text>
        </View>
        <View style={s.card}>
          {upcomingTests.map((t, i) => {
            const [mon, day] = t.date.split(" ");
            return (
              <View key={t.label} style={[s.testRow, i < upcomingTests.length - 1 && s.divider]}>
                <View style={s.datePill}>
                  <Text style={s.datePillMon}>{mon}</Text>
                  <Text style={s.datePillDay}>{day}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.testName}>{t.label}</Text>
                  <Text style={s.testBatch}>{t.batch}</Text>
                </View>
                <Text style={[s.daysLeft, { color: t.daysLeft <= 3 ? "#B45309" : D.outline }]}>in {t.daysLeft}d</Text>
              </View>
            );
          })}
        </View>

        {/* Recent activity */}
        <Text style={[s.sectionLabel, { marginTop: 22, marginBottom: 12 }]}>RECENT ACTIVITY</Text>
        <View style={s.card}>
          {activityFeed.map((ev, i) => (
            <View key={ev.label} style={[s.activityRow, i < activityFeed.length - 1 && s.divider]}>
              <View style={[s.activityIcon, { backgroundColor: ev.bg }]}>
                <Ionicons name={ev.icon} size={15} color={ev.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.activityLabel}>{ev.label}</Text>
                <Text style={s.activitySub}>{ev.sub}</Text>
              </View>
              <Text style={s.activityTime}>{ev.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  dateLabel: { fontSize: 11.5, fontWeight: "600", color: D.outline, letterSpacing: 0.2, marginBottom: 4, fontFamily: D.fontSemiBold },
  greeting: { fontSize: 20, fontWeight: "800", color: D.onSurface, letterSpacing: -0.5, lineHeight: 26, fontFamily: D.fontExtraBold },
  bellWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center", marginTop: 4, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  bellBadge: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: "#EF4444", borderWidth: 2, borderColor: D.bg, alignItems: "center", justifyContent: "center" },
  bellBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff", fontFamily: D.fontExtraBold },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderRadius: 14, borderWidth: 1 },
  alertCount: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  alertCountText: { fontSize: 10, fontWeight: "800", color: "#fff", fontFamily: D.fontExtraBold },
  alertLabel: { flex: 1, fontSize: 12, fontWeight: "600", letterSpacing: -0.1, fontFamily: D.fontSemiBold },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 22 },
  summaryCard: { width: "47.5%", padding: 16, borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  summaryLabel: { fontSize: 9.5, fontWeight: "700", color: D.outline, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6, fontFamily: D.fontBold },
  summaryValue: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5, lineHeight: 22, fontFamily: D.fontExtraBold },
  summarySub: { fontSize: 10.5, color: D.onSurfaceVariant, marginTop: 4, fontFamily: D.font },
  sectionLabel: { fontSize: 10, fontWeight: "700", color: D.outline, letterSpacing: 0.5, marginBottom: 12, fontFamily: D.fontBold },
  sectionLink: { flex: 1, textAlign: "right", fontSize: 11, fontWeight: "600", color: D.primary, fontFamily: D.fontSemiBold },
  quickAction: { flex: 1, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", gap: 8 },
  quickIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: D.surface, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  quickLabel: { fontSize: 9.5, fontWeight: "700", letterSpacing: -0.1, textAlign: "center", lineHeight: 13, fontFamily: D.fontBold },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", marginBottom: 0, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  classRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  classTimeBlock: { width: 68, flexShrink: 0 },
  classTime: { fontSize: 11, fontWeight: "800", color: D.onSurface, letterSpacing: -0.2, fontFamily: D.fontExtraBold },
  classTimeRoom: { fontSize: 9.5, color: D.outline, marginTop: 3, fontFamily: D.font },
  accentLine: { width: 3, height: 40, borderRadius: 2, flexShrink: 0 },
  classSubjectTag: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.5, marginBottom: 2 },
  classSubject: { fontSize: 12, fontWeight: "700", color: D.onSurface, letterSpacing: -0.1, fontFamily: D.fontBold },
  classMeta: { fontSize: 9.5, color: D.outline, marginTop: 3, fontFamily: D.font },
  nextBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, backgroundColor: D.primary },
  nextBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 0.3, fontFamily: D.fontExtraBold },
  testRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  datePill: { width: 40, borderRadius: 10, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, paddingVertical: 6, alignItems: "center" },
  datePillMon: { fontSize: 8.5, fontWeight: "700", color: D.primary, letterSpacing: 0.4, textTransform: "uppercase", fontFamily: D.fontBold },
  datePillDay: { fontSize: 14, fontWeight: "800", color: D.primary, letterSpacing: -0.4, lineHeight: 17, fontFamily: D.fontExtraBold },
  testName: { fontSize: 12.5, fontWeight: "700", color: D.onSurface, letterSpacing: -0.2, fontFamily: D.fontBold },
  testBatch: { fontSize: 10.5, color: D.outline, marginTop: 2, fontFamily: D.font },
  daysLeft: { fontSize: 10.5, fontWeight: "700", letterSpacing: -0.1, fontFamily: D.fontBold },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  activityIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  activityLabel: { fontSize: 12, fontWeight: "700", color: D.onSurface, letterSpacing: -0.1, fontFamily: D.fontBold },
  activitySub: { fontSize: 10.5, color: D.outline, marginTop: 2, fontFamily: D.font },
  activityTime: { fontSize: 10, color: D.outline, fontWeight: "500", flexShrink: 0, letterSpacing: -0.1, fontFamily: D.fontMedium },
});
