import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCachedResource } from "../hooks/useResource";
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
import { getTodayDateValue } from "../lib/date";
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

function formatTime(t: string) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  if (h === undefined || m === undefined) return t;
  const ampm = h! >= 12 ? "PM" : "AM";
  const hour = h! % 12 || 12;
  return `${hour}:${String(m!).padStart(2, "0")} ${ampm}`;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function formatExamDate(dateStr: string) {
  if (!dateStr) return { mon: "—", day: "—" };
  const d = new Date(dateStr);
  return {
    mon: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
  };
}

export function AdminOverviewScreen() {
  const { adminRecord, profile, authUser, roleLabel } = useSession();
  const insets = useSafeAreaInsets();

  const displayName = profile?.name || authUser?.displayName || authUser?.email?.split("@")[0] || "Admin";
  const initials = displayName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "AD";
  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "GOOD MORNING" : greetingHour < 17 ? "GOOD AFTERNOON" : "GOOD EVENING";
  const scopeLabel = "All centres";

  const resource = useCachedResource(
    `home-admin:${adminRecord?.role ?? ""}:${adminRecord?.centreId ?? ""}:${adminRecord?.regionId ?? ""}`,
    async () => {
      if (!adminRecord) return null;
      const [profiles, attendance, staffAttendance, leaveRequests, complaints, studentLeaveRequests, recentResults, schedule] = await Promise.all([
        listVisibleProfilesForAdmin(adminRecord),
        listAdminAttendanceOverview(adminRecord),
        listStaffAttendanceForAdmin(adminRecord),
        listPendingLeaveRequests(adminRecord),
        listAdminComplaints(adminRecord),
        listStudentLeaveRequestsForAdmin(adminRecord),
        listRecentResultsForAdmin(adminRecord, 2),
        listAdminSchedule(adminRecord),
      ]);

      const studentProfiles = profiles.filter((p) => p.role === "student");
      const staffProfiles = profiles.filter((p) => p.role === "teacher" || p.role === "team");

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
              {/* Pending leave requests / open complaints */}
              <Animated.View entering={enter(0)} style={s.statsCard}>
                <AnimatedPressable style={s.statSec} onPress={() => router.push("/(admin)/leave")}>
                  <CountUp value={resource.data.pendingLeaveRequests} style={s.statVal} />
                  <Text style={s.statKey}>Leave Requests</Text>
                  <Text style={s.statSub}>Pending</Text>
                </AnimatedPressable>
                <View style={s.divider} />
                <AnimatedPressable style={s.statSec} onPress={() => router.push("/(admin)/complaints")}>
                  <CountUp value={resource.data.openComplaints} style={s.statVal} />
                  <Text style={s.statKey}>Complaints</Text>
                  <Text style={s.statSub}>Open</Text>
                </AnimatedPressable>
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
                      <AnimatedPressable
                        key={result.id}
                        style={[s.listRow, i === resource.data!.recentResults.length - 1 && { borderBottomWidth: 0 }]}
                        onPress={() =>
                          router.push({
                            pathname: "/(admin)/result-detail",
                            params: {
                              assessmentTitle: result.assessmentTitle,
                              classId: result.classId,
                              className: result.className,
                              subjectName: result.subjectName,
                              subjectId: result.subjectId,
                            },
                          })
                        }
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
                      </AnimatedPressable>
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
                  resource.data.todaySchedule.map((entry, i, arr) => {
                    const sc = getSubjectColor(entry.subjectName || "");
                    return (
                      <View key={entry.id} style={[s.slotRow, i < arr.length - 1 && s.listDivider]}>
                        <View style={s.slotTimeBlock}>
                          <Text style={s.slotTime}>{formatTime(entry.startTime)}</Text>
                          {entry.endTime ? <Text style={s.slotHall}>{formatTime(entry.endTime)}</Text> : null}
                        </View>
                        <View style={[s.accentLine, { backgroundColor: sc.text }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[s.slotSubjectTag, { color: sc.text }]}>{(entry.subjectName || "").toUpperCase()}</Text>
                          <Text style={s.slotSubject} numberOfLines={1}>{entry.className}</Text>
                          {entry.notes ? <Text style={s.slotMeta} numberOfLines={1}>{entry.notes}</Text> : null}
                        </View>
                      </View>
                    );
                  })
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
                  resource.data.upcomingExams.slice(0, 2).map((exam, i, arr) => {
                    const sc = getSubjectColor(exam.subjectName || "");
                    const { mon, day } = formatExamDate(exam.scheduleDate);
                    const dl = daysUntil(exam.scheduleDate);
                    return (
                      <View key={exam.id} style={[s.examRow, i < arr.length - 1 && s.listDivider]}>
                        <View style={s.datePill}>
                          <Text style={s.datePillMon}>{mon}</Text>
                          <Text style={s.datePillDay}>{day}</Text>
                        </View>
                        <View style={[s.accentLine, { backgroundColor: sc.text }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[s.subjInline, { color: sc.text }]}>{(exam.subjectName || "").toUpperCase()}</Text>
                          <Text style={s.examName} numberOfLines={1}>{exam.assessmentTitle}</Text>
                          <Text style={s.examBatch} numberOfLines={1}>{exam.className}</Text>
                        </View>
                        <Text style={[s.daysLeft, { color: dl <= 3 ? "#B45309" : D.outline }]}>
                          {dl === 0 ? "Today" : dl === 1 ? "Tomorrow" : `in ${dl}d`}
                        </Text>
                      </View>
                    );
                  })
                )}
              </Animated.View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

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
  greetingText: { fontSize: 8.5, color: "rgba(255,255,255,0.72)", letterSpacing: 0.35, fontWeight: "700", fontFamily: D.fontBold },
  nameText: { fontSize: 14, color: "#fff", fontWeight: "800", letterSpacing: -0.2, marginTop: 3, fontFamily: D.fontExtraBold },
  bellBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 12 },
  bellDot: { position: "absolute", top: 6, right: 6, width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#FF4D67", borderWidth: 2, borderColor: "#fff" },
  roleCard: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.13)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  roleLabel: { fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: "700", letterSpacing: 0.6, fontFamily: D.fontBold },
  roleSub: { fontSize: 11, color: "#fff", fontWeight: "600", marginTop: 4, letterSpacing: -0.05, fontFamily: D.fontSemiBold },

  // Content overlap
  content: { marginTop: -44, paddingHorizontal: 18, gap: 22 },

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
  statSec: { flex: 1, alignItems: "center", paddingVertical: 22, paddingHorizontal: 8, gap: 4 },
  divider: { width: 1, backgroundColor: D.outlineVariant, marginVertical: 18 },
  statVal: { fontSize: 20, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  statKey: { fontSize: 8.5, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, textTransform: "uppercase" },
  statSub: { fontSize: 9, color: D.onSurfaceVariant },

  // Card
  card: {
    backgroundColor: D.surface,
    borderRadius: 18,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 5,
    elevation: 1,
  },
  cardTitle: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },

  // Generic section list (Recent Results / Today's Schedule / Upcoming Exams)
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: D.surfaceContainer },
  sectionEmpty: { alignItems: "center", paddingVertical: 24 },
  sectionEmptyText: { fontSize: 12, color: D.onSurfaceVariant, fontFamily: D.font },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: D.surfaceContainer,
  },
  listRowTitle: { fontSize: 12, fontFamily: D.fontSemiBold, color: D.onSurface },
  listRowSub: { fontSize: 10, color: D.onSurfaceVariant, marginTop: 2, fontFamily: D.font },
  listRowMeta: { fontSize: 11, fontFamily: D.fontBold, color: D.primary },
  subjectIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  subjectIconText: { fontSize: 9.5, fontWeight: "800", fontFamily: D.fontExtraBold },
  listDivider: { borderBottomWidth: 1, borderBottomColor: D.surfaceContainer },

  // Today's Schedule rows
  slotRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 15 },
  slotTimeBlock: { width: 68, flexShrink: 0 },
  slotTime: { fontSize: 10.5, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.2 },
  slotHall: { fontSize: 9, color: D.outline, marginTop: 4, fontFamily: D.font },
  accentLine: { width: 3, height: 40, borderRadius: 2, flexShrink: 0 },
  slotSubjectTag: { fontSize: 8.5, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.5, marginBottom: 3 },
  slotSubject: { fontSize: 11.5, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  slotMeta: { fontSize: 9, fontFamily: D.font, color: D.outline, marginTop: 4 },

  // Upcoming Exams rows
  examRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 15 },
  datePill: { width: 40, alignItems: "center", flexShrink: 0 },
  datePillMon: { fontSize: 8.5, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.4, textTransform: "uppercase", color: D.outline },
  datePillDay: { fontSize: 15, fontWeight: "800", fontFamily: D.fontExtraBold, letterSpacing: -0.4, lineHeight: 19, color: D.onSurface },
  subjInline: { fontSize: 8.5, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.5, marginBottom: 3 },
  examName: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  examBatch: { fontSize: 10.5, fontFamily: D.font, color: D.outline, marginTop: 2 },
  daysLeft: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, flexShrink: 0 },
});
