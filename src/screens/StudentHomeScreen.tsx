import { router } from "expo-router";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useMemo } from "react";
import { useResource } from "../hooks/useResource";
import {
  listAnnouncementsForProfile,
  listLearningResourcesForProfile,
  listStudentAttendance,
  listStudentResults,
  listStudentSchedules,
} from "../lib/erp";
import { formatDateLabel } from "../lib/date";
import { useSession } from "../providers/session";
import { EmptyCard, ErrorCard, LoadingCard, D, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { attendancePercent, daysRemaining, monthKey, percent, resultDelta, subjectBgColor, subjectColor } from "./studentUtils";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedPressable } from "../components/motion";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function StudentHomeScreen() {
  const { profile } = useSession();
  const insets = useSafeAreaInsets();

  const resource = useResource(async () => {
    if (!profile) return null;
    const [attendance, results, schedules, materials, circulars] = await Promise.all([
      listStudentAttendance(profile),
      listStudentResults(profile),
      listStudentSchedules(profile),
      listLearningResourcesForProfile(profile),
      listAnnouncementsForProfile(profile),
    ]);
    return { attendance, results, schedules, materials, circulars };
  }, [profile?.userId, profile?.classId, profile?.regionId, profile?.centreId]);

  const summary = useMemo(() => {
    const data = resource.data;
    const today = new Date();
    const currentMonth = monthKey(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`);
    const monthAttendance = (data?.attendance ?? []).filter((record) => monthKey(record.attendanceDate) === currentMonth);
    const present = monthAttendance.filter((record) => record.status === "present").length;
    const total = monthAttendance.filter((record) => record.status !== "leave").length || monthAttendance.length;
    const attendancePct = attendancePercent(monthAttendance);
    const latestResult = data?.results[0] ?? null;
    const latestCircular = data?.circulars[0] ?? null;
    return { present, total, attendancePct, latestResult, latestCircular };
  }, [resource.data]);

  const todaySchedule = useMemo(() => {
    const entries = resource.data?.schedules.timetableEntries ?? [];
    const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const todayKey = dayKeys[new Date().getDay()] ?? "monday";
    const sorted = [...entries].sort((left, right) => `${left.dayKey}-${left.startTime}`.localeCompare(`${right.dayKey}-${right.startTime}`));
    const todaysItems = sorted.filter((entry) => entry.dayKey === todayKey);
    return (todaysItems.length > 0 ? todaysItems : sorted).slice(0, 3);
  }, [resource.data]);

  const upcomingTests = useMemo(() => {
    const tests = resource.data?.schedules.tests ?? [];
    return [...tests]
      .sort((left, right) => `${left.scheduleDate}-${left.startTime}`.localeCompare(`${right.scheduleDate}-${right.startTime}`))
      .slice(0, 3);
  }, [resource.data]);

  const recentResults = useMemo(() => (resource.data?.results ?? []).slice(0, 3), [resource.data]);

  const initials = profile?.name?.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() || "ST";
  const batchMeta = [profile?.studentClass || "Class 11 · Section B", `Roll ${profile?.rollNumber || "--"}`].filter(Boolean).join(" · ");

  if (resource.loading) return <ScreenWrap><LoadingCard label="Loading your dashboard..." /></ScreenWrap>;
  if (resource.error) return <ScreenWrap><ErrorCard message={resource.error} onRetry={() => void resource.reload()} /></ScreenWrap>;
  if (!resource.data) return <ScreenWrap><EmptyCard title="Profile pending" message="Your student profile is still being prepared." /></ScreenWrap>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top bar / greeting */}
        <LinearGradient
          colors={[D.primary, D.primaryBtn, '#8B5CF6']}
          style={[styles.topGradient, { paddingTop: Math.max(insets.top + 24, 60) }]}
        >
          <View style={{ paddingHorizontal: 22, paddingBottom: 72 }}>
            <View style={styles.topBarRow}>
              <View style={styles.userRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View>
                  <Text style={styles.greetingText}>GOOD MORNING</Text>
                  <Text style={styles.nameText}>{profile?.name || "Student"}</Text>
                </View>
              </View>
              <AnimatedPressable style={styles.bellBtn} onPress={() => router.push("/(student)/notifications")}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
                <View style={styles.bellDot} />
              </AnimatedPressable>
            </View>

            {/* batch + class */}
            <View style={styles.batchCard}>
              <View>
                <Text style={styles.batchLabel}>{profile?.className?.toUpperCase() || "NEET 2027 · ACE BATCH"}</Text>
                <Text style={styles.batchSub}>{batchMeta}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Content overlap */}
        <View style={styles.contentOverlap}>
        {/* Attendance hero card */}
          <View style={styles.attendanceCard}>
            <View style={styles.attHeaderRow}>
              <Text style={styles.attTitle}>THIS MONTH'S ATTENDANCE</Text>
            </View>
            <View style={styles.attValueRow}>
              <View style={styles.attInfoBlock}>
                <View style={styles.attPctRow}>
                  <Text style={styles.attPct}>{summary.attendancePct}</Text>
                  <Text style={styles.attPctSym}>%</Text>
                </View>
                <Text style={styles.attSub}>{summary.present} of {summary.total || 0} days present</Text>
              </View>
              <View style={styles.attMiniChart}>
                {[0.5, 0.7, 0.4, 0.85, 0.6, 0.95, 0.8].map((h, i) => (
                  <View
                    key={i}
                    style={[
                      styles.attMiniBar,
                      {
                        height: `${h * 100}%`,
                        backgroundColor: i === 5 ? D.primary : "#DDD6FE",
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
            <View style={styles.attTrack}>
              <LinearGradient
                colors={[D.primary, D.primaryBtn]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.attFill, { width: `${Math.min(summary.attendancePct, 100)}%` }]}
              />
            </View>
          </View>

          {/* quick actions grid */}
          <View style={styles.grid2}>
            <FeatureCard
              label="Test Results"
              value={summary.latestResult ? `${formatPercent(percent(summary.latestResult.score, summary.latestResult.maxScore))}%` : "--"}
              sub={summary.latestResult ? `Last: ${summary.latestResult.assessmentTitle}` : "No tests yet"}
              icon="trophy-outline"
              tone="amber"
              onPress={() => router.push("/(student)/results")}
            />
            <FeatureCard
              label="Circulars"
              value={`${resource.data.circulars.length} new`}
              sub={summary.latestCircular ? summary.latestCircular.title : "None yet"}
              icon="notifications-outline"
              tone="sky"
              onPress={() => router.push("/(student)/circulars")}
            />
          </View>

          <SectionHeader title="Today's schedule" action="View all" onPress={() => router.push("/(student)/schedules")} />
          <View style={styles.scheduleCard}>
            {todaySchedule.length === 0 ? (
              <Text style={styles.emptyListText}>No classes scheduled yet.</Text>
            ) : (
              todaySchedule.map((entry, index) => {
                const color = subjectColor(entry.subjectName || "Class");
                return (
                  <View key={entry.id} style={[styles.scheduleRow, index < todaySchedule.length - 1 && styles.borderBottom]}>
                    <View style={styles.scheduleTimeBlock}>
                      <Text style={styles.scheduleTime} numberOfLines={1}>{formatClock(entry.startTime)}</Text>
                      <Text style={styles.scheduleTimeMeta}>{entry.slotLabel || `${entry.startTime} - ${entry.endTime}`}</Text>
                    </View>
                    <View style={[styles.scheduleAccent, { backgroundColor: color }]} />
                    <View style={styles.scheduleInfo}>
                      <Text style={[styles.scheduleSubject, { color }]}>{(entry.subjectName || "Class").toUpperCase()}</Text>
                      <Text style={styles.scheduleTopic} numberOfLines={1}>
                        {entry.notes || `${entry.subjectName || "Class"} session`}
                      </Text>
                      <Text style={styles.scheduleMeta} numberOfLines={1}>
                        {[entry.teacherName, entry.endTime ? `Till ${formatClock(entry.endTime)}` : ""].filter(Boolean).join(" · ") || "Teacher details pending"}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Upcoming Tests */}
          <SectionHeader title="Upcoming tests" action="View all" onPress={() => router.push("/(student)/schedules")} />
          <View style={styles.listCard}>
            {upcomingTests.length === 0 ? (
              <Text style={styles.emptyListText}>No upcoming tests yet.</Text>
            ) : (
              upcomingTests.map((test, i, arr) => (
                <AnimatedPressable key={test.id} onPress={() => router.push(`/(student)/test-schedule-detail?id=${encodeURIComponent(test.id)}`)} style={[styles.listItem, i < arr.length - 1 && styles.borderBottom]}>
                  <View style={[styles.iconBox, { backgroundColor: subjectBgColor(test.subjectName || "Test") }]}>
                    <Ionicons name="document-text-outline" size={18} color={subjectColor(test.subjectName || "Test")} />
                  </View>
                  <View style={styles.listTextContainer}>
                    <Text style={[styles.listTag, { color: subjectColor(test.subjectName || "Test") }]}>{test.subjectName?.toUpperCase()}</Text>
                    <Text style={styles.listMainText} numberOfLines={1}>{test.assessmentTitle}</Text>
                    <Text style={styles.listSubText}>{formatDateLabel(test.scheduleDate)}</Text>
                  </View>
                  <View style={[styles.listBadge, { backgroundColor: subjectBgColor(test.subjectName || "Test") }]}>
                    <Text style={[styles.listBadgeText, { color: subjectColor(test.subjectName || "Test") }]}>
                      {daysRemaining(test.scheduleDate) === 0 ? "Today" : `${daysRemaining(test.scheduleDate) ?? "--"}d`}
                    </Text>
                  </View>
                </AnimatedPressable>
              ))
            )}
          </View>

          {/* Recent Results */}
          <SectionHeader title="Recent results" action="See all" onPress={() => router.push("/(student)/results")} />
          <View style={styles.listCard}>
            {recentResults.length === 0 ? (
              <Text style={styles.emptyListText}>No results published yet.</Text>
            ) : (
              recentResults.map((result, i, arr) => {
                const delta = resultDelta(result, resource.data?.results ?? []);
                const up = delta !== null && delta >= 0;
                return (
                  <AnimatedPressable key={result.id} onPress={() => router.push(`/(student)/result-detail?id=${encodeURIComponent(result.id)}`)} style={[styles.listItem, i < arr.length - 1 && styles.borderBottom]}>
                    <View style={[styles.iconBox, { backgroundColor: subjectBgColor(result.subjectName || "Result") }]}>
                      <Ionicons name={up ? "arrow-up" : "arrow-down"} size={16} color={up ? D.successFg : D.errorFg} />
                    </View>
                    <View style={styles.listTextContainer}>
                      <Text style={[styles.listTag, { color: subjectColor(result.subjectName || "Result") }]}>{(result.subjectName || "RESULT").toUpperCase()}</Text>
                      <Text style={styles.listMainText} numberOfLines={1}>{result.assessmentTitle}</Text>
                      <Text style={styles.listSubText}>{formatDateLabel(result.assessmentDate || result.publishedAtIso?.slice(0, 10) || "")}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
                      <Text style={styles.scoreText}>{result.score}<Text style={styles.scoreMax}>/{result.maxScore}</Text></Text>
                      <Text style={[styles.scoreTrend, { color: up ? D.successFg : D.errorFg }]}>{delta !== null ? (delta >= 0 ? "+" + delta : delta) : "-"}</Text>
                    </View>
                  </AnimatedPressable>
                );
              })
            )}
          </View>

          {/* Quick links */}
          <SectionHeader title="Quick links" />
          <View style={styles.grid4}>
            <QuickLink icon="library-outline" label="Study\nMaterial" color="#7C3AED" onPress={() => router.push("/(student)/materials")} />
            <QuickLink icon="chatbubbles-outline" label="Submit\nDoubt" color="#EC4899" onPress={() => router.push("/(student)/submit-doubt")} />
            <QuickLink icon="calendar-outline" label="Leave\nRequest" color="#F59E0B" onPress={() => router.push("/(student)/request-leave")} />
            <QuickLink icon="warning-outline" label="Complaints" color="#EF4444" onPress={() => router.push("/(student)/complaints")} />
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

function ScreenWrap({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: D.bg, paddingTop: insets.top }}>
      <View style={{ padding: 16 }}>{children}</View>
    </View>
  );
}

function formatPercent(value: number) {
  return value % 1 === 0 ? String(value) : value.toFixed(1);
}

function formatClock(value: string) {
  if (!value) return "--:--";
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = match[2];
  const suffix = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(twelveHour).padStart(2, "0")}:${minutes}\u00A0${suffix}`;
}

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <AnimatedPressable onPress={onPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </AnimatedPressable>
      )}
    </View>
  );
}

function FeatureCard({ label, value, sub, icon, tone, onPress }: any) {
  const tones: any = {
    amber: { bg: '#FEF3C7', fg: '#B45309' },
    sky: { bg: '#E0F2FE', fg: '#0369A1' },
  };
  const t = tones[tone] || tones.sky;
  return (
    <AnimatedPressable style={styles.featureCard} onPress={onPress}>
      <View style={styles.fcTopRow}>
        <View style={[styles.fcIcon, { backgroundColor: t.bg }]}>
          <Ionicons name={icon} size={18} color={t.fg} />
        </View>
        <Ionicons name="chevron-forward" size={16} color={D.outline} />
      </View>
      <Text style={styles.fcLabel}>{label}</Text>
      <Text style={styles.fcValue}>{value}</Text>
      <Text style={styles.fcSub} numberOfLines={1}>{sub}</Text>
    </AnimatedPressable>
  );
}

function QuickLink({ icon, label, color, onPress }: any) {
  const lines = String(label).replace(/\\n/g, "\n").split("\n");
  return (
    <AnimatedPressable style={styles.qlBox} onPress={onPress}>
      <View style={[styles.qlIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.qlLabel}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },
  scrollContent: { paddingBottom: MOBILE_BOTTOM_SPACING },
  topGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topBarRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4 },
  userRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F3E8FF", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.45)" },
  avatarText: { color: D.primary, fontWeight: "800", fontSize: 12, fontFamily: D.fontExtraBold },
  greetingText: { fontSize: 9, color: "rgba(255,255,255,0.72)", letterSpacing: 0.35, fontWeight: "700", fontFamily: D.fontBold },
  nameText: { fontSize: 15, color: "#fff", fontWeight: "800", letterSpacing: -0.2, marginTop: 2, fontFamily: D.fontExtraBold },
  bellBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  bellDot: { position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: "#F472B6", borderWidth: 2, borderColor: D.primaryBtn },
  batchCard: { marginTop: 18, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.13)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  batchLabel: { fontSize: 9, color: "rgba(255,255,255,0.7)", fontWeight: "700", letterSpacing: 0.6, fontFamily: D.fontBold },
  batchSub: { fontSize: 11, color: "#fff", fontWeight: "600", marginTop: 4, letterSpacing: -0.05, fontFamily: D.fontSemiBold },
  contentOverlap: { marginTop: -44, paddingHorizontal: 18 },
  attendanceCard: { backgroundColor: "#fff", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 2 },
  attHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  attTitle: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.7, textTransform: "uppercase" },
  attValueRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 10 },
  attInfoBlock: { flex: 1, minWidth: 0 },
  attPctRow: { flexDirection: "row", alignItems: "flex-end", gap: 3 },
  attPct: { fontSize: 26, lineHeight: 26, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.7 },
  attPctSym: { fontSize: 15, lineHeight: 15, color: D.outline, fontWeight: "600", marginBottom: 3, letterSpacing: -0.1, fontFamily: D.fontSemiBold },
  attSub: { fontSize: 10, color: D.onSurfaceVariant, marginTop: 5, textAlign: "left", fontFamily: D.font },
  attMiniChart: { flexDirection: "row", alignItems: "flex-end", gap: 5, height: 38, marginLeft: 16, flexShrink: 0 },
  attMiniBar: { width: 8, borderRadius: 3 },
  attTrack: { marginTop: 14, height: 4, borderRadius: 999, backgroundColor: D.primaryFixed, overflow: "hidden" },
  attFill: { height: "100%", borderRadius: 999 },
  grid2: { flexDirection: "row", gap: 12, marginTop: 16 },
  featureCard: { flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 4, elevation: 1 },
  fcTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fcIcon: { width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  fcLabel: { marginTop: 10, fontSize: 9.5, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, textTransform: "uppercase" },
  fcValue: { marginTop: 4, fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.35 },
  fcSub: { marginTop: 4, fontSize: 9.5, color: D.onSurfaceVariant, letterSpacing: -0.05, fontFamily: D.font, lineHeight: 14 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 12, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.15 },
  sectionAction: { fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.primary },
  scheduleCard: { backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  scheduleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14, gap: 12 },
  scheduleTimeBlock: { width: 74, flexShrink: 0 },
  scheduleTime: { fontSize: 12, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.2 },
  scheduleTimeMeta: { fontSize: 9, color: D.outline, marginTop: 3, fontFamily: D.font },
  scheduleAccent: { width: 3, alignSelf: "stretch", borderRadius: 999 },
  scheduleInfo: { flex: 1, minWidth: 0 },
  scheduleSubject: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.5, marginBottom: 3 },
  scheduleTopic: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  scheduleMeta: { fontSize: 9.5, color: D.outline, marginTop: 4, fontFamily: D.font },
  listCard: { backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  emptyListText: { padding: 14, fontSize: 11, color: D.outline, fontFamily: D.font },
  listItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  listTextContainer: { flex: 1 },
  listTag: { fontSize: 8.8, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.45, marginBottom: 3 },
  listMainText: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  listSubText: { fontSize: 9.5, color: D.outline, marginTop: 3, fontFamily: D.font },
  listBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  listBadgeText: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.3 },
  scoreText: { fontSize: 13, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
  scoreMax: { fontSize: 9, color: D.outline, fontWeight: "600" },
  scoreTrend: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, marginTop: 3 },
  grid4: { flexDirection: "row", gap: 10 },
  qlBox: {
    flex: 1,
    minWidth: 0,
    aspectRatio: 0.92,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  qlIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  qlLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    fontFamily: D.fontBold,
    color: D.onSurface,
    textAlign: "center",
    lineHeight: 14,
    letterSpacing: -0.1,
    width: "100%",
    minHeight: 28,
  },
});
