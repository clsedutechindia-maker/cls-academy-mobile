import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useResource } from "../../hooks/useResource";
import { approveStudentEnrollment, getStudentProfile, listStudentAttendanceByIdWithDemo, listStudentResultsByIdWithDemo, rejectStudentEnrollment } from "../../lib/erp";
import type { UserProfileRecord, StudentAttendanceRecord, StudentResultRecord } from "../../shared";

const tabs = ["Basic Info", "Results", "Attendance", "Fee"];

const statusStyle = {
  paid: { bg: "#DCFCE7", color: "#15803D", dot: "#22C55E", label: "Paid" },
  due: { bg: "#FEF3C7", color: "#B45309", dot: "#F59E0B", label: "Due" },
  overdue: { bg: "#FEE2E2", color: "#B91C1C", dot: "#EF4444", label: "Overdue" },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function StudentHero({
  profile,
  activeTab,
  onTabChange,
  approveMode,
}: {
  profile: UserProfileRecord | null;
  activeTab: number;
  onTabChange: (i: number) => void;
  approveMode: boolean;
}) {
  const name = profile?.name || "Student";
  const initials = getInitials(name);
  return (
    <>
      <View style={s.heroCard}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: D.primary, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, color: "#fff" }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.heroName}>{name}</Text>
          <Text style={s.heroMeta}>
            {profile?.rollNumber ? `Roll ${profile.rollNumber} · ` : ""}
            {profile?.className || "—"}
          </Text>
          {approveMode && (
            <View style={{ flexDirection: "row", gap: 6, marginTop: 7 }}>
              <View style={[s.badge, { backgroundColor: "#FEF3C7" }]}>
                <Text style={[s.badgeText, { color: "#B45309" }]}>PENDING APPROVAL</Text>
              </View>
            </View>
          )}
        </View>
      </View>
      <View style={s.tabStrip}>
        {tabs.map((t, i) => (
          <AnimatedPressable key={t} style={[s.tabBtn, i === activeTab && s.tabBtnActive]} onPress={() => onTabChange(i)}>
            <Text style={[s.tabText, { color: i === activeTab ? D.primary : D.onSurfaceVariant }]}>{t}</Text>
          </AnimatedPressable>
        ))}
      </View>
    </>
  );
}

function BasicInfoTab({ profile, approveMode, userId }: { profile: UserProfileRecord | null; approveMode: boolean; userId: string }) {
  const [approving, setApproving] = useState(false);

  const infoRows = [
    { l: "Full Name", v: profile?.name || "—" },
    { l: "Phone", v: profile?.phone || "—" },
    { l: "Email", v: profile?.email || "—" },
    { l: "Parent / Guardian", v: profile?.parentOneName || profile?.parentTwoName || "—" },
    { l: "Parent Email", v: profile?.parentOneEmail || "—" },
    { l: "Class", v: profile?.className || "—" },
    { l: "Roll No.", v: profile?.rollNumber || "—" },
    { l: "Date of Birth", v: profile?.dateOfBirth || "—" },
    { l: "Gender", v: profile?.gender || "—" },
    { l: "Address", v: profile?.address || "—" },
  ];

  async function handleApprove() {
    if (!userId) return;
    setApproving(true);
    try {
      await approveStudentEnrollment(userId);
      Alert.alert("Approved", "Student has been activated successfully.", [
        { text: "OK", onPress: () => navigateBack(router) },
      ]);
    } catch {
      Alert.alert("Error", "Failed to approve student. Please try again.");
    } finally {
      setApproving(false);
    }
  }

  function handleReject() {
    Alert.alert("Reject Enrollment", "Are you sure you want to reject this student?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject", style: "destructive", onPress: async () => {
          try {
            await rejectStudentEnrollment(userId);
          } catch {
            // best-effort
          }
          navigateBack(router);
        },
      },
    ]);
  }

  return (
    <>
      <View style={[s.card, { marginTop: 16 }]}>
        {infoRows.map((row, i) => (
          <View key={row.l} style={[s.infoRow, i < infoRows.length - 1 && s.divider]}>
            <Text style={s.infoLabel}>{row.l}</Text>
            <Text style={s.infoValue}>{row.v}</Text>
          </View>
        ))}
      </View>

      {approveMode ? (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 22 }}>
          <AnimatedPressable
            style={[s.removeBtn, { flex: 1 }]}
            onPress={handleReject}
          >
            <Ionicons name="close-circle-outline" size={18} color="#B91C1C" />
            <Text style={s.removeBtnText}>Reject</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[s.approveBtn, { flex: 2 }, approving && { opacity: 0.6 }]}
            onPress={handleApprove}
            disabled={approving}
          >
            {approving
              ? <ActivityIndicator size="small" color="#fff" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                  <Text style={s.approveBtnText}>Approve & Activate</Text>
                </>
            }
          </AnimatedPressable>
        </View>
      ) : (
        <AnimatedPressable
          style={s.removeBtn}
          onPress={() => router.push({ pathname: "/(head-teacher)/remove-student", params: { userId, name: profile?.name ?? "" } })}
        >
          <Ionicons name="trash-outline" size={18} color="#B91C1C" />
          <Text style={s.removeBtnText}>Remove Student</Text>
        </AnimatedPressable>
      )}
    </>
  );
}

function ResultsTab({ userId }: { userId: string }) {
  const { data: results, loading, error } = useResource(
    async () => listStudentResultsByIdWithDemo(userId),
    [userId],
  );

  if (loading) {
    return (
      <View style={{ padding: 32, alignItems: "center" }}>
        <ActivityIndicator color={D.primary} />
      </View>
    );
  }
  if (error) {
    return <Text style={{ color: "#B91C1C", margin: 16, fontFamily: D.font }}>{error}</Text>;
  }
  if (!results || results.length === 0) {
    return (
      <View style={[s.card, { marginTop: 16, padding: 20, alignItems: "center" }]}>
        <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No results found.</Text>
      </View>
    );
  }

  // Group by subject
  const bySubject: Record<string, StudentResultRecord[]> = {};
  for (const r of results) {
    const key = r.subjectName || "Other";
    if (!bySubject[key]) bySubject[key] = [];
    bySubject[key].push(r);
  }

  const subjectColors: Record<string, { color: string; bg: string }> = {
    Physics: { color: "#6366F1", bg: "#EEF2FF" },
    Chemistry: { color: "#0EA5E9", bg: "#F0F9FF" },
    Biology: { color: "#10B981", bg: "#F0FDF4" },
    Mathematics: { color: "#F59E0B", bg: "#FFFBEB" },
    Math: { color: "#F59E0B", bg: "#FFFBEB" },
  };

  function getSubjectColor(name: string) {
    for (const key of Object.keys(subjectColors)) {
      if (name.includes(key)) return subjectColors[key]!;
    }
    return { color: D.primary, bg: D.surfaceLow };
  }

  const totalTests = results.length;
  const avgPct =
    results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + (r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0), 0) / results.length)
      : 0;

  return (
    <>
      <View style={[s.rankCard, { marginTop: 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.rankLabel}>OVERALL AVG</Text>
          <Text style={s.rankValue}>{avgPct}%</Text>
          <Text style={s.rankSub}>{totalTests} tests taken</Text>
        </View>
      </View>
      <Text style={[s.sectionLabel, { marginTop: 20 }]}>SUBJECT PERFORMANCE</Text>
      <View style={{ gap: 8 }}>
        {Object.entries(bySubject).map(([subjName, subjResults]) => {
          const avg = Math.round(
            subjResults.reduce((acc, r) => acc + (r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0), 0) / subjResults.length,
          );
          const sc = getSubjectColor(subjName);
          return (
            <View key={subjName} style={[s.card, { padding: 15 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: sc.color }} />
                  <Text style={{ fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface }}>{subjName}</Text>
                  <View style={[s.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[s.badgeText, { color: sc.color }]}>{subjResults.length} tests</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 15, fontWeight: "800", fontFamily: D.fontExtraBold, color: sc.color, letterSpacing: -0.4 }}>{avg}%</Text>
              </View>
              <View style={{ height: 7, borderRadius: 999, backgroundColor: sc.bg, overflow: "hidden" }}>
                <View style={{ width: `${avg}%`, height: "100%", backgroundColor: sc.color, borderRadius: 999 }} />
              </View>
            </View>
          );
        })}
      </View>
      <Text style={[s.sectionLabel, { marginTop: 20 }]}>RECENT TESTS</Text>
      <View style={s.card}>
        {results.slice(0, 10).map((t, i) => {
          const pct = t.maxScore > 0 ? Math.round((t.score / t.maxScore) * 100) : 0;
          const sc = getSubjectColor(t.subjectName || "");
          return (
            <View key={t.id} style={[s.testResultRow, i < Math.min(results.length, 10) - 1 && s.divider]}>
              <View style={[s.subjectIcon, { backgroundColor: sc.bg }]}>
                <Text style={{ fontSize: 10, fontWeight: "800", fontFamily: D.fontExtraBold, color: sc.color }}>
                  {(t.subjectName || "?").slice(0, 3).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.testName}>{t.assessmentTitle}</Text>
                <Text style={s.testMeta}>{t.assessmentDate || t.subjectName}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.scoreText}>
                  {t.score}
                  <Text style={{ fontSize: 11, color: D.outline, fontWeight: "500", fontFamily: D.fontMedium }}>/{t.maxScore}</Text>
                </Text>
                <Text style={{ fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: pct >= 80 ? "#15803D" : pct >= 60 ? "#B45309" : "#B91C1C", marginTop: 1 }}>{pct}%</Text>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

function AttendanceTab({ userId }: { userId: string }) {
  const { data: attendance, loading, error } = useResource(
    async () => listStudentAttendanceByIdWithDemo(userId),
    [userId],
  );

  if (loading) {
    return (
      <View style={{ padding: 32, alignItems: "center" }}>
        <ActivityIndicator color={D.primary} />
      </View>
    );
  }
  if (error) {
    return <Text style={{ color: "#B91C1C", margin: 16, fontFamily: D.font }}>{error}</Text>;
  }

  const records: StudentAttendanceRecord[] = attendance ?? [];
  const total = records.length;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const overallPct = total > 0 ? Math.round((present / total) * 100) : 0;

  // Group by month
  const byMonth: Record<string, { present: number; total: number }> = {};
  for (const r of records) {
    const month = r.attendanceDate?.slice(0, 7) || "unknown";
    if (!byMonth[month]) byMonth[month] = { present: 0, total: 0 };
    byMonth[month].total++;
    if (r.status === "present") byMonth[month].present++;
  }
  const monthEntries = Object.entries(byMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-3)
    .map(([key, val]) => {
      const [year, mon] = key.split("-");
      const label = new Date(parseInt(year ?? "2026"), parseInt(mon ?? "1") - 1, 1).toLocaleString("default", { month: "short" });
      return { m: label, pct: val.total > 0 ? Math.round((val.present / val.total) * 100) : 0, present: val.present, total: val.total };
    });

  return (
    <>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
        {[
          { label: "Overall", value: `${overallPct}%`, sub: "This year", accent: overallPct >= 75 ? "#15803D" : "#B91C1C", bg: "#F8F8F8" },
          { label: "Present", value: String(present), sub: `of ${total} classes`, accent: D.onSurface, bg: "#F8F8F8" },
          { label: "Absent", value: String(absent), sub: "days absent", accent: "#B91C1C", bg: "#FEE2E2" },
        ].map((c) => (
          <View key={c.label} style={s.attStat}>
            <Text style={s.attStatLabel}>{c.label}</Text>
            <Text style={[s.attStatValue, { color: c.accent }]}>{c.value}</Text>
            <Text style={s.attStatSub}>{c.sub}</Text>
          </View>
        ))}
      </View>
      {monthEntries.length > 0 && (
        <View style={[s.card, { padding: 16, marginTop: 16 }]}>
          <Text style={s.cardTitle}>Monthly breakdown</Text>
          <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-end", height: 90 }}>
            {monthEntries.map((mo) => (
              <View key={mo.m} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: mo.pct >= 75 ? "#15803D" : "#B45309" }}>{mo.pct}%</Text>
                <View style={{ width: "100%", borderRadius: 4, height: Math.round((mo.pct / 100) * 60), backgroundColor: mo.pct >= 75 ? "#10B981" : "#F59E0B" }} />
                <Text style={{ fontSize: 12, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.outline }}>{mo.m}</Text>
                <Text style={{ fontSize: 10.5, fontFamily: D.font, color: D.outline }}>{mo.present}/{mo.total}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );
}

function FeeTab() {
  return (
    <View style={[s.card, { marginTop: 16, padding: 20, alignItems: "center" }]}>
      <Ionicons name="card-outline" size={32} color={D.outline} style={{ marginBottom: 10 }} />
      <Text style={{ fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginBottom: 4 }}>Fee records managed by admin</Text>
      <Text style={{ fontSize: 12, fontFamily: D.font, color: D.outline, textAlign: "center" }}>Fee information is maintained by the admin team. Contact admin for fee details.</Text>
    </View>
  );
}

export function HTStudentDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ userId: string; name: string; mode?: string }>();
  const userId = params.userId ?? "";
  const approveMode = params.mode === "approve";
  const [activeTab, setActiveTab] = useState(0);

  const { data: profile, loading: profileLoading, error: profileError } = useResource(
    async () => {
      if (!userId) return null;
      return getStudentProfile(userId);
    },
    [userId],
  );

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      {/* Header */}
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.navTitle}>Student Profile</Text>
        <View style={s.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={D.onSurface} />
        </View>
      </View>

      {profileLoading && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={D.primary} />
        </View>
      )}

      {profileError && !profileLoading && (
        <View style={{ flex: 1, padding: 24 }}>
          <Text style={{ color: "#B91C1C", fontFamily: D.font }}>{profileError}</Text>
        </View>
      )}

      {!profileLoading && (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
          <StudentHero profile={profile} activeTab={activeTab} onTabChange={setActiveTab} approveMode={approveMode} />

          {activeTab === 0 && <BasicInfoTab profile={profile} approveMode={approveMode} userId={userId} />}
          {activeTab === 1 && userId && <ResultsTab userId={userId} />}
          {activeTab === 2 && userId && <AttendanceTab userId={userId} />}
          {activeTab === 3 && <FeeTab />}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  heroCard: { backgroundColor: D.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: D.outlineVariant, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  heroName: { fontSize: 17, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  heroMeta: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.3 },
  tabStrip: { flexDirection: "row", padding: 3, borderRadius: 14, backgroundColor: D.surfaceLow, marginTop: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: "center" },
  tabBtnActive: { backgroundColor: D.surface, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  tabText: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: -0.1 },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  infoRow: { flexDirection: "row", alignItems: "center", padding: 14 },
  infoLabel: { width: 134, fontSize: 12, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.outline, letterSpacing: 0.1, flexShrink: 0 },
  infoValue: { flex: 1, fontSize: 13, fontWeight: "500", fontFamily: D.fontMedium, color: D.onSurface, letterSpacing: -0.1 },
  removeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 22, height: 52, borderRadius: 16, backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA" },
  removeBtnText: { fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: "#B91C1C", letterSpacing: -0.2 },
  approveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 22, height: 52, borderRadius: 16, backgroundColor: "#15803D", shadowColor: "#15803D", shadowOpacity: 0.28, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  approveBtnText: { fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
  rankCard: { borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: D.primary, shadowColor: D.primary, shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  rankLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: "rgba(255,255,255,0.7)", letterSpacing: 0.5 },
  rankValue: { fontSize: 34, fontWeight: "800", fontFamily: D.fontExtraBold, color: "#fff", letterSpacing: -1, lineHeight: 38 },
  rankSub: { fontSize: 12, fontFamily: D.font, color: "rgba(255,255,255,0.8)", marginTop: 3 },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  subjectIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  testResultRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  testName: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  testMeta: { fontSize: 11.5, fontFamily: D.font, color: D.outline, marginTop: 1 },
  scoreText: { fontSize: 13, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
  attStat: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  attStatLabel: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, textTransform: "uppercase" },
  attStatValue: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, letterSpacing: -0.6, lineHeight: 22, marginTop: 3 },
  attStatSub: { fontSize: 10.5, fontFamily: D.font, color: D.outline, marginTop: 3 },
  cardTitle: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2, marginBottom: 14 },
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
  moreBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
});
