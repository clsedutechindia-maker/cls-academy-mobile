import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResource } from "../hooks/useResource";
import {
  listAdminAttendanceOverview,
  listStaffAttendanceForAdmin,
  listPendingLeaveRequests,
  listVisibleProfilesForAdmin,
  listAdminComplaints,
  listStudentLeaveRequestsForAdmin,
  listAdminSchedule,
  listRecentResultsForAdmin,
} from "../lib/erp";
import { getTodayDateValue, formatDateLabel } from "../lib/date";
import { useSession } from "../providers/session";
import { D, EmptyCard, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { Animated, AnimatedPressable, CountUp, enter } from "../components/motion";

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const subjectColor: Record<string, { text: string; bg: string }> = {
  Physics: { text: "#6366F1", bg: "#EEF2FF" },
  Chemistry: { text: "#0EA5E9", bg: "#F0F9FF" },
  Biology: { text: "#10B981", bg: "#F0FDF4" },
  Math: { text: "#F59E0B", bg: "#FEF3C7" },
};

function getSubjectColor(subjectName: string) {
  for (const key of Object.keys(subjectColor)) {
    if (subjectName.includes(key)) return subjectColor[key]!;
  }
  return { text: D.outline, bg: D.surfaceLow };
}

export function AdminOverviewScreen() {
  const { adminRecord, profile, authUser, roleLabel } = useSession();
  const insets = useSafeAreaInsets();

  const displayName = profile?.name || authUser?.displayName || authUser?.email?.split("@")[0] || "Admin";
  const initials = displayName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "AD";
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "GOOD MORNING" : greetingHour < 17 ? "GOOD AFTERNOON" : "GOOD EVENING";
  const scopeLabel =
    adminRecord?.role === "centre_incharge"
      ? adminRecord.centreName || "Centre"
      : adminRecord?.role === "regional_incharge"
        ? adminRecord.regionName || "Region"
        : "All centres";

  const resource = useResource(
    async () => {
      if (!adminRecord) return null;
      const [profiles, attendance, staffAttendance, leaveRequests, complaints, studentLeaveRequests, recentResults, schedule] = await Promise.all([
        listVisibleProfilesForAdmin(adminRecord),
        listAdminAttendanceOverview(adminRecord),
        listStaffAttendanceForAdmin(adminRecord),
        listPendingLeaveRequests(adminRecord),
        listAdminComplaints(adminRecord),
        listStudentLeaveRequestsForAdmin(adminRecord),
        listRecentResultsForAdmin(adminRecord),
        listAdminSchedule(adminRecord),
      ]);

      const studentProfiles = profiles.filter((p) => p.role === "student");
      const staffProfiles = profiles.filter((p) => p.role === "teacher" || p.role === "employee");

      const today = getTodayDateValue();
      const studentsPresent = attendance.filter((a) => a.status === "present").length;
      const studentsTotal = studentProfiles.length;
      const staffPresent = staffAttendance.filter((a) => a.attendanceDate === today && a.status === "present").length;
      const staffTotal = staffProfiles.length;

      const openComplaints = complaints.filter((c) => c.status === "open" || c.status === "in_progress").length;
      const pendingLeaveRequests = leaveRequests.length + studentLeaveRequests.length;

      const todayKey = DAY_KEYS[new Date().getDay()];
      const todaySchedule = schedule.timetableEntries
        .filter((entry) => entry.dayKey === todayKey)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      const upcomingExams = schedule.tests
        .filter((test) => test.scheduleDate >= today)
        .sort((a, b) => `${a.scheduleDate}-${a.startTime}`.localeCompare(`${b.scheduleDate}-${b.startTime}`));

      return {
        studentsPresent,
        studentsTotal,
        staffPresent,
        staffTotal,
        recentResults,
        todaySchedule,
        upcomingExams,
        openComplaints,
        pendingLeaveRequests,
      };
    },
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Personalized gradient header — matches Student / Head Teacher home */}
        <LinearGradient
          colors={[D.primary, D.primaryBtn, "#8B5CF6"]}
          style={[s.gradient, { paddingTop: Math.max(insets.top + 24, 60) }]}
        >
          <View style={s.topBarRow}>
            <View style={s.userRow}>
              <View style={s.avatarCircle}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View>
                <Text style={s.greetingText}>{greeting}</Text>
                <Text style={s.nameText} numberOfLines={1}>{displayName}</Text>
              </View>
            </View>
            <AnimatedPressable onPress={() => router.push("/(admin)/notifications")} style={s.bellBtn}>
              <Ionicons name="notifications-outline" size={20} color="#fff" />
              <View style={s.bellDot} />
            </AnimatedPressable>
          </View>

          {/* Role / scope card */}
          <View style={s.roleCard}>
            <Text style={s.roleLabel}>{roleLabel.toUpperCase()}</Text>
            <Text style={s.roleSub}>{scopeLabel}</Text>
          </View>
        </LinearGradient>

        {/* Overlapping content */}
        <View style={s.content}>
          {resource.loading ? (
            <LoadingCard label="Loading overview…" />
          ) : resource.error ? (
            <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
          ) : !resource.data ? (
            <EmptyCard title="No data" message="Unable to load overview." />
          ) : (
            <>
              {/* Today's attendance — students present/total, staff present/total */}
              <Animated.View entering={enter(0)} style={s.statsCard}>
                <View style={s.statSec}>
                  <CountUp value={resource.data.studentsPresent} suffix={`/${resource.data.studentsTotal}`} style={s.statVal} />
                  <Text style={s.statKey}>Students Present</Text>
                  <Text style={s.statSub}>Today</Text>
                </View>
                <View style={s.divider} />
                <View style={s.statSec}>
                  <CountUp value={resource.data.staffPresent} suffix={`/${resource.data.staffTotal}`} style={s.statVal} />
                  <Text style={s.statKey}>Staff Present</Text>
                  <Text style={s.statSub}>Today</Text>
                </View>
              </Animated.View>

              {/* Recent Results */}
              <Animated.View entering={enter(1)} style={[s.card, { gap: 0 }]}>
                <View style={s.sectionHeader}>
                  <Ionicons name="trophy-outline" size={18} color={D.success} />
                  <Text style={s.cardTitle}>Recent Results</Text>
                </View>
                {resource.data.recentResults.length === 0 ? (
                  <View style={s.sectionEmpty}>
                    <Text style={s.sectionEmptyText}>No results published yet.</Text>
                  </View>
                ) : (
                  resource.data.recentResults.map((result, i) => {
                    const sc = getSubjectColor(result.subjectName || "");
                    const pct = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;
                    return (
                      <View
                        key={result.id}
                        style={[s.listRow, i === resource.data!.recentResults.length - 1 && { borderBottomWidth: 0 }]}
                      >
                        <View style={[s.subjectIcon, { backgroundColor: sc.bg }]}>
                          <Text style={[s.subjectIconText, { color: sc.text }]}>{(result.subjectName || "?").slice(0, 3).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.listRowTitle} numberOfLines={1}>{result.assessmentTitle}</Text>
                          <Text style={s.listRowSub} numberOfLines={1}>{result.className} · {result.studentName}</Text>
                        </View>
                        <Text style={[s.listRowMeta, { color: pct >= 80 ? "#15803D" : pct >= 60 ? "#B45309" : "#B91C1C" }]}>{pct}%</Text>
                        <Ionicons name="chevron-forward" size={16} color={D.outline} />
                      </View>
                    );
                  })
                )}
              </Animated.View>

              {/* Today's Schedule */}
              <Animated.View entering={enter(2)} style={[s.card, { gap: 0 }]}>
                <View style={s.sectionHeader}>
                  <Ionicons name="time-outline" size={18} color={D.primary} />
                  <Text style={s.cardTitle}>Today's Schedule</Text>
                </View>
                {resource.data.todaySchedule.length === 0 ? (
                  <View style={s.sectionEmpty}>
                    <Text style={s.sectionEmptyText}>No classes scheduled today.</Text>
                  </View>
                ) : (
                  resource.data.todaySchedule.slice(0, 5).map((entry, i, arr) => (
                    <View key={entry.id} style={[s.listRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.listRowTitle} numberOfLines={1}>{entry.subjectName}</Text>
                        <Text style={s.listRowSub} numberOfLines={1}>{entry.className} · {entry.teacherName}</Text>
                      </View>
                      <Text style={s.listRowMeta}>{entry.startTime}–{entry.endTime}</Text>
                    </View>
                  ))
                )}
              </Animated.View>

              {/* Upcoming Exams */}
              <Animated.View entering={enter(3)} style={[s.card, { gap: 0 }]}>
                <View style={s.sectionHeader}>
                  <Ionicons name="document-text-outline" size={18} color="#7C3AED" />
                  <Text style={s.cardTitle}>Upcoming Exams</Text>
                </View>
                {resource.data.upcomingExams.length === 0 ? (
                  <View style={s.sectionEmpty}>
                    <Text style={s.sectionEmptyText}>No upcoming exams scheduled.</Text>
                  </View>
                ) : (
                  resource.data.upcomingExams.slice(0, 5).map((exam, i, arr) => (
                    <View key={exam.id} style={[s.listRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.listRowTitle} numberOfLines={1}>{exam.assessmentTitle} · {exam.subjectName}</Text>
                        <Text style={s.listRowSub} numberOfLines={1}>{exam.className} · {formatDateLabel(exam.scheduleDate)}</Text>
                      </View>
                      <Text style={s.listRowMeta}>{exam.startTime}</Text>
                    </View>
                  ))
                )}
              </Animated.View>

              {/* Leave requests / Open complaints */}
              <Animated.View entering={enter(4)} style={s.twoCol}>
                <AnimatedPressable style={s.actionBox} onPress={() => router.push("/(admin)/leave")}>
                  <View style={[s.actionIconBg, { backgroundColor: "#fff7ed" }]}>
                    <Ionicons name="calendar-outline" size={18} color="#F97316" />
                  </View>
                  <CountUp value={resource.data.pendingLeaveRequests} style={s.actionVal} />
                  <Text style={s.actionLabel}>Leave Requests</Text>
                </AnimatedPressable>
                <AnimatedPressable style={s.actionBox} onPress={() => router.push("/(admin)/complaints")}>
                  <View style={[s.actionIconBg, { backgroundColor: "#FEE2E2" }]}>
                    <Ionicons name="warning-outline" size={18} color={D.error} />
                  </View>
                  <CountUp value={resource.data.openComplaints} style={s.actionVal} />
                  <Text style={s.actionLabel}>Open Complaints</Text>
                </AnimatedPressable>
              </Animated.View>

              {/* Quick Access */}
              <Animated.View entering={enter(5)} style={s.quickGrid}>
                {QUICK_TILES.map((tile) => (
                  <AnimatedPressable key={tile.label} style={s.quickTile} onPress={tile.onPress}>
                    <View style={[s.quickIconBg, { backgroundColor: tile.bg }]}>
                      <Ionicons name={tile.icon as never} size={18} color={tile.color} />
                    </View>
                    <Text style={s.quickLabel}>{tile.label}</Text>
                  </AnimatedPressable>
                ))}
              </Animated.View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const QUICK_TILES = [
  { icon: "megaphone-outline", label: "Announcements", color: "#9d4300", bg: "#ffdbca", onPress: () => router.push("/(admin)/circulars") },
  { icon: "clipboard-outline", label: "Operations", color: D.success, bg: "#dcfce7", onPress: () => router.push("/(admin)/operations") },
];

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },
  scroll: { paddingBottom: MOBILE_BOTTOM_SPACING },

  // Gradient header
  gradient: {
    paddingHorizontal: 22,
    paddingBottom: 72,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topBarRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F3E8FF", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.45)", flexShrink: 0 },
  avatarText: { color: D.primary, fontWeight: "800", fontSize: 12, fontFamily: D.fontExtraBold },
  greetingText: { fontSize: 9, color: "rgba(255,255,255,0.72)", letterSpacing: 0.35, fontWeight: "700", fontFamily: D.fontBold },
  nameText: { fontSize: 15, color: "#fff", fontWeight: "800", letterSpacing: -0.2, marginTop: 2, fontFamily: D.fontExtraBold },
  bellBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 },
  bellDot: { position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: "#F472B6", borderWidth: 2, borderColor: D.primaryBtn },
  roleCard: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.13)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  roleLabel: { fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: "700", letterSpacing: 0.6, fontFamily: D.fontBold },
  roleSub: { fontSize: 11, color: "#fff", fontWeight: "600", marginTop: 4, letterSpacing: -0.05, fontFamily: D.fontSemiBold },

  // Content overlap
  content: { marginTop: -44, paddingHorizontal: 18, gap: 18 },

  // Stats card — single card, sections divided
  statsCard: {
    flexDirection: "row",
    backgroundColor: D.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    overflow: "hidden",
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  statSec: { flex: 1, alignItems: "center", paddingVertical: 20, paddingHorizontal: 8, gap: 3 },
  divider: { width: 1, backgroundColor: D.outlineVariant, marginVertical: 16 },
  statVal: { fontSize: 24, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.7 },
  statKey: { fontSize: 9, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, textTransform: "uppercase" },
  statSub: { fontSize: 9.5, color: D.onSurfaceVariant },

  // Card
  card: {
    backgroundColor: D.surface,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 5,
    elevation: 1,
  },
  cardTitle: { fontSize: 14, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },

  // Generic section list (Recent Results / Today's Schedule / Upcoming Exams)
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: D.surfaceContainer },
  sectionEmpty: { alignItems: "center", paddingVertical: 24 },
  sectionEmptyText: { fontSize: 12.5, color: D.onSurfaceVariant, fontFamily: D.font },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: D.surfaceContainer,
  },
  listRowTitle: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.onSurface },
  listRowSub: { fontSize: 10.5, color: D.onSurfaceVariant, marginTop: 1, fontFamily: D.font },
  listRowMeta: { fontSize: 12, fontFamily: D.fontBold, color: D.primary },
  subjectIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  subjectIconText: { fontSize: 9.5, fontWeight: "800", fontFamily: D.fontExtraBold },

  // Leave requests / Open complaints
  twoCol: { flexDirection: "row", gap: 12 },
  actionBox: {
    flex: 1,
    backgroundColor: D.surface,
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 5,
    elevation: 1,
  },
  actionIconBg: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  actionVal: { fontSize: 22, fontFamily: D.fontBold, color: D.onSurface, marginTop: 4, letterSpacing: -0.5 },
  actionLabel: { fontSize: 11, color: D.onSurfaceVariant, fontFamily: D.fontMedium },

  // Quick access
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  quickTile: {
    width: "47.5%",
    backgroundColor: D.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 4,
    elevation: 1,
  },
  quickIconBg: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.onSurface },
});
