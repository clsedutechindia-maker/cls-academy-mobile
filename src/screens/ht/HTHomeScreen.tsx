import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "../../providers/session";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { LinearGradient } from "expo-linear-gradient";

const summaryCards = [
  { label: "My Students", value: "124", sub: "3 batches", accent: "#fff", labelColor: "rgba(255,255,255,0.7)", subColor: "rgba(255,255,255,0.55)", cardBg: "rgba(255,255,255,0.12)" },
  { label: "Today's Att.", value: "87%", sub: "across batches", accent: "#A7F3D0", labelColor: "rgba(255,255,255,0.7)", subColor: "rgba(255,255,255,0.55)", cardBg: "rgba(255,255,255,0.12)" },
  { label: "Leave Requests", value: "3", sub: "pending review", accent: "#FCD34D", labelColor: "rgba(255,255,255,0.7)", subColor: "rgba(255,255,255,0.55)", cardBg: "rgba(255,255,255,0.12)" },
  { label: "Open Doubts", value: "5", sub: "unanswered", accent: "#93C5FD", labelColor: "rgba(255,255,255,0.7)", subColor: "rgba(255,255,255,0.55)", cardBg: "rgba(255,255,255,0.12)" },
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

export function HTHomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const initials = profile?.name?.split(" ").slice(0, 2).map((w: string) => w[0]).join("") || "HT";
  const firstName = profile?.name?.split(" ")[0] ?? "Teacher";

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const dateLabel = `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}`;

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Gradient hero header */}
        <LinearGradient
          colors={[D.primary, D.primaryBtn, "#8B5CF6"]}
          style={[s.heroGradient, { paddingTop: Math.max(insets.top + 20, 56) }]}
        >
          <View style={s.heroInner}>
            {/* Top row: avatar + name + bell */}
            <View style={s.heroTopRow}>
              <View style={s.heroLeft}>
                <View style={s.avatarCircle}>
                  <Text style={s.avatarText}>{initials}</Text>
                </View>
                <View>
                  <Text style={s.heroLabel}>HEAD TEACHER</Text>
                  <Text style={s.heroName}>{profile?.name || "Head Teacher"}</Text>
                </View>
              </View>
              <AnimatedPressable style={s.bellBtn} onPress={() => {}}>
                <Ionicons name="notifications-outline" size={19} color="#fff" />
                <View style={s.bellDot} />
              </AnimatedPressable>
            </View>

            {/* Date + session label */}
            <View style={s.heroBatchCard}>
              <View>
                <Text style={s.heroBatchLabel}>TODAY</Text>
                <Text style={s.heroBatchSub}>{dateLabel} · NEET Session</Text>
              </View>
              <View style={s.heroStatusBadge}>
                <Text style={s.heroStatusText}>ACTIVE</Text>
              </View>
            </View>

            {/* Stats row inside gradient */}
            <View style={s.heroStatsRow}>
              {summaryCards.map((c) => (
                <View key={c.label} style={s.heroStatCard}>
                  <Text style={s.heroStatLabel}>{c.label}</Text>
                  <Text style={[s.heroStatValue, { color: c.accent }]}>{c.value}</Text>
                  <Text style={s.heroStatSub}>{c.sub}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Content section */}
        <View style={s.contentSection}>

          {/* Alert rows */}
          {alerts.length > 0 && (
            <View style={{ gap: 8, marginBottom: 22 }}>
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
          )}

          {/* Quick actions */}
          <Text style={s.sectionLabel}>QUICK ACTIONS</Text>
          <View style={[s.row, { gap: 10, marginBottom: 24 }]}>
            {quickActions.map((q) => (
              <AnimatedPressable key={q.label} style={[s.quickAction, { backgroundColor: q.bg }]} onPress={() => router.push(q.route as any)}>
                <View style={[s.quickIcon, { backgroundColor: D.surface }]}>
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
            {todayClasses.map((cls, i) => (
              <View key={cls.time} style={[s.classRow, i < todayClasses.length - 1 && s.divider]}>
                <Text style={s.classTime}>{cls.time}</Text>
                <View style={[s.accentLine, { backgroundColor: i === 0 ? D.primary : D.outlineVariant }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.classSubject}>{cls.subject}</Text>
                  <Text style={s.classMeta}>{cls.batch} · {cls.room}</Text>
                </View>
                {i === 0 && <View style={s.nextBadge}><Text style={s.nextBadgeText}>NEXT</Text></View>}
              </View>
            ))}
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
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  scrollContent: { paddingBottom: 100 },
  row: { flexDirection: "row", alignItems: "center" },

  // Hero gradient header
  heroGradient: { paddingBottom: 28 },
  heroInner: { paddingHorizontal: 22 },
  heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  heroLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.22)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 13, fontWeight: "800", color: "#fff", fontFamily: D.fontExtraBold },
  heroLabel: { fontSize: 9, color: "rgba(255,255,255,0.65)", fontWeight: "700", letterSpacing: 0.6, fontFamily: D.fontBold },
  heroName: { fontSize: 15, color: "#fff", fontWeight: "800", letterSpacing: -0.2, marginTop: 1, fontFamily: D.fontExtraBold },
  bellBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  bellDot: { position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: D.primaryBtn },

  heroBatchCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.13)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", marginBottom: 18 },
  heroBatchLabel: { fontSize: 8.5, color: "rgba(255,255,255,0.65)", fontWeight: "700", letterSpacing: 0.6, fontFamily: D.fontBold },
  heroBatchSub: { fontSize: 12, color: "#fff", fontWeight: "600", marginTop: 2, letterSpacing: -0.1, fontFamily: D.fontSemiBold },
  heroStatusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.2)" },
  heroStatusText: { fontSize: 9.5, fontWeight: "700", color: "#fff", letterSpacing: 0.4, fontFamily: D.fontBold },

  heroStatsRow: { flexDirection: "row", gap: 8 },
  heroStatCard: { flex: 1, padding: 12, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.13)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  heroStatLabel: { fontSize: 8.5, fontWeight: "700", color: "rgba(255,255,255,0.65)", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 4, fontFamily: D.fontBold },
  heroStatValue: { fontSize: 16, fontWeight: "800", letterSpacing: -0.5, lineHeight: 20, fontFamily: D.fontExtraBold },
  heroStatSub: { fontSize: 9.5, color: "rgba(255,255,255,0.55)", marginTop: 2, fontFamily: D.font },

  // Content section
  contentSection: { paddingHorizontal: 18, paddingTop: 20 },

  alertRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, borderRadius: 14, borderWidth: 1 },
  alertCount: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  alertCountText: { fontSize: 10, fontWeight: "800", color: "#fff", fontFamily: D.fontExtraBold },
  alertLabel: { flex: 1, fontSize: 12, fontWeight: "600", letterSpacing: -0.1, fontFamily: D.fontSemiBold },

  sectionLabel: { fontSize: 10, fontWeight: "700", color: D.outline, letterSpacing: 0.5, marginBottom: 12, fontFamily: D.fontBold },
  sectionLink: { flex: 1, textAlign: "right", fontSize: 11, fontWeight: "600", color: D.primary, fontFamily: D.fontSemiBold },

  quickAction: { flex: 1, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", gap: 8 },
  quickIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  quickLabel: { fontSize: 9.5, fontWeight: "700", letterSpacing: -0.1, textAlign: "center", lineHeight: 13, fontFamily: D.fontBold },

  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },

  classRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 15, paddingHorizontal: 16 },
  classTime: { width: 58, fontSize: 10.5, fontWeight: "700", color: D.outline, letterSpacing: -0.1, textAlign: "right", flexShrink: 0, fontFamily: D.fontBold },
  accentLine: { width: 3, height: 36, borderRadius: 2, flexShrink: 0 },
  classSubject: { fontSize: 12.5, fontWeight: "700", color: D.onSurface, letterSpacing: -0.2, marginBottom: 2, fontFamily: D.fontBold },
  classMeta: { fontSize: 10.5, color: D.outline, fontFamily: D.font },
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
