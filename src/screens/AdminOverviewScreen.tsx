import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResource } from "../hooks/useResource";
import {
  listAdminAttendanceOverview,
  listAdminAnnouncements,
  listPendingLeaveRequests,
  listVisibleProfilesForAdmin,
} from "../lib/erp";
import { useSession } from "../providers/session";
import { D, EmptyCard, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { Animated, AnimatedPressable, CountUp, enter } from "../components/motion";

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
      const [profiles, attendance, announcements, leaveRequests] = await Promise.all([
        listVisibleProfilesForAdmin(adminRecord),
        listAdminAttendanceOverview(adminRecord),
        listAdminAnnouncements(adminRecord),
        listPendingLeaveRequests(adminRecord),
      ]);
      const students = profiles.filter((p) => p.role === "student").length;
      const staff = profiles.filter((p) => p.role === "teacher").length;
      const employees = profiles.filter((p) => p.role === "employee").length;
      const present = attendance.filter((a) => a.status === "present").length;
      const absent = attendance.filter((a) => a.status === "absent").length;
      const onLeave = attendance.filter((a) => a.status === "leave").length;
      const total = present + absent + onLeave;
      const pendingAnnouncements = announcements.filter((a) => a.status === "pending").length;
      const pendingLeave = leaveRequests.length;
      return { students, staff, employees, present, absent, onLeave, total, pendingAnnouncements, pendingLeave };
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
              {/* Stats — single card with 3 sections (max 2-per-row rule: this is one card) */}
              <Animated.View entering={enter(0)} style={s.statsCard}>
                <View style={s.statSec}>
                  <CountUp value={resource.data.students} style={s.statVal} />
                  <Text style={s.statKey}>Students</Text>
                  <Text style={s.statSub}>Enrolled</Text>
                </View>
                <View style={s.divider} />
                <View style={s.statSec}>
                  <CountUp value={resource.data.staff} style={s.statVal} />
                  <Text style={s.statKey}>Teachers</Text>
                  <Text style={s.statSub}>Faculty</Text>
                </View>
                <View style={s.divider} />
                <View style={s.statSec}>
                  <CountUp value={resource.data.employees} style={s.statVal} />
                  <Text style={s.statKey}>Employees</Text>
                  <Text style={s.statSub}>Staff</Text>
                </View>
              </Animated.View>

              {/* Today's Attendance */}
              <Animated.View entering={enter(1)} style={s.card}>
                <View style={s.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardTitle}>Today's Student Attendance</Text>
                    <Text style={s.cardSub}>Live overview across all centres.</Text>
                  </View>
                  {resource.data.total > 0 && (
                    <View style={s.pctBadge}>
                      <Text style={s.pctText}>
                        {Math.round((resource.data.present / resource.data.total) * 100)}%
                      </Text>
                    </View>
                  )}
                </View>

                {resource.data.total === 0 ? (
                  <Text style={s.muted}>No attendance records yet.</Text>
                ) : (
                  <>
                    <View style={s.attendRow}>
                      <View style={s.attendBox}>
                        <View style={s.dotRow}>
                          <View style={[s.dot, { backgroundColor: D.success }]} />
                          <Text style={s.attendLabel}>Present</Text>
                        </View>
                        <Text style={s.attendValue}>{resource.data.present.toLocaleString()}</Text>
                      </View>
                      <View style={s.attendBox}>
                        <View style={s.dotRow}>
                          <View style={[s.dot, { backgroundColor: D.error }]} />
                          <Text style={s.attendLabel}>Absent</Text>
                        </View>
                        <Text style={s.attendValue}>{resource.data.absent}</Text>
                      </View>
                      <View style={s.attendBox}>
                        <View style={s.dotRow}>
                          <View style={[s.dot, { backgroundColor: "#F97316" }]} />
                          <Text style={s.attendLabel}>Leave</Text>
                        </View>
                        <Text style={s.attendValue}>{resource.data.onLeave}</Text>
                      </View>
                    </View>
                    <View style={s.progressBar}>
                      <View
                        style={[
                          s.progressSeg,
                          {
                            flex: resource.data.present || 0.001,
                            backgroundColor: D.success,
                            borderTopLeftRadius: 99,
                            borderBottomLeftRadius: 99,
                          },
                        ]}
                      />
                      <View style={[s.progressSeg, { flex: resource.data.absent || 0.001, backgroundColor: D.error }]} />
                      <View
                        style={[
                          s.progressSeg,
                          {
                            flex: resource.data.onLeave || 0.001,
                            backgroundColor: "#F97316",
                            borderTopRightRadius: 99,
                            borderBottomRightRadius: 99,
                          },
                        ]}
                      />
                    </View>
                  </>
                )}
              </Animated.View>

              {/* Pending Actions */}
              <Animated.View entering={enter(2)} style={[s.card, { gap: 0 }]}>
                <View style={s.pendingHeader}>
                  <Ionicons name="checkmark-circle" size={18} color={D.primary} />
                  <Text style={s.cardTitle}>Pending Actions</Text>
                </View>

                {resource.data.pendingAnnouncements === 0 && resource.data.pendingLeave === 0 ? (
                  <View style={s.pendingEmpty}>
                    <Ionicons name="checkmark-done-outline" size={28} color={D.success} />
                    <Text style={s.pendingEmptyText}>All clear — nothing pending.</Text>
                  </View>
                ) : (
                  <>
                    {resource.data.pendingAnnouncements > 0 && (
                      <AnimatedPressable style={s.pendingRow} onPress={() => router.push("/(admin)/operations")}>
                        <View style={s.pendingIconBg}>
                          <Ionicons name="megaphone-outline" size={18} color={D.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.pendingRowTitle}>
                            {resource.data.pendingAnnouncements} announcement{resource.data.pendingAnnouncements > 1 ? "s" : ""}
                          </Text>
                          <Text style={s.pendingRowSub}>Awaiting approval</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={D.outline} />
                      </AnimatedPressable>
                    )}
                    {resource.data.pendingLeave > 0 && (
                      <AnimatedPressable style={[s.pendingRow, { borderBottomWidth: 0 }]} onPress={() => router.push("/(admin)/staff")}>
                        <View style={[s.pendingIconBg, { backgroundColor: "#fff7ed" }]}>
                          <Ionicons name="calendar-outline" size={18} color="#F97316" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.pendingRowTitle}>
                            {resource.data.pendingLeave} leave request{resource.data.pendingLeave > 1 ? "s" : ""}
                          </Text>
                          <Text style={s.pendingRowSub}>Pending review</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={D.outline} />
                      </AnimatedPressable>
                    )}
                  </>
                )}

                <AnimatedPressable style={s.viewAllRow} onPress={() => router.push("/(admin)/operations")}>
                  <Text style={s.viewAllText}>View all tasks</Text>
                  <Ionicons name="arrow-forward" size={14} color={D.primaryBtn} />
                </AnimatedPressable>
              </Animated.View>

              {/* Quick Access 2×2 grid */}
              <Animated.View entering={enter(3)} style={s.quickGrid}>
                {QUICK_TILES.map((tile) => (
                  <AnimatedPressable key={tile.label} style={s.quickTile} onPress={tile.onPress}>
                    <View style={[s.quickIconBg, { backgroundColor: tile.bg }]}>
                      <Ionicons name={tile.icon as never} size={20} color={tile.color} />
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
  { icon: "people-outline", label: "Students", color: D.primary, bg: D.primaryFixed, onPress: () => router.push("/(admin)/students") },
  { icon: "briefcase-outline", label: "Staff", color: "#7C3AED", bg: "#F5F3FF", onPress: () => router.push("/(admin)/staff") },
  { icon: "megaphone-outline", label: "Announcements", color: "#9d4300", bg: "#ffdbca", onPress: () => router.push("/(admin)/operations") },
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
  content: { marginTop: -44, paddingHorizontal: 18, gap: 14 },

  // Stats card — single card, 3 sections
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
  statSec: { flex: 1, alignItems: "center", paddingVertical: 18, paddingHorizontal: 8, gap: 2 },
  divider: { width: 1, backgroundColor: D.outlineVariant, marginVertical: 14 },
  statVal: { fontSize: 26, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.7 },
  statKey: { fontSize: 9.5, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, textTransform: "uppercase" },
  statSub: { fontSize: 10, color: D.onSurfaceVariant },

  // Card
  card: {
    backgroundColor: D.surface,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 5,
    elevation: 1,
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardTitle: { fontSize: 15, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  cardSub: { fontSize: 12, color: D.onSurfaceVariant, lineHeight: 17, marginTop: 2 },
  pctBadge: { backgroundColor: D.primaryFixed, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pctText: { fontSize: 13, fontFamily: D.fontBold, color: D.primary },
  muted: { color: D.onSurfaceVariant, fontSize: 13, fontFamily: D.font },

  // Attendance
  attendRow: { flexDirection: "row", gap: 8 },
  attendBox: {
    flex: 1,
    backgroundColor: D.surfaceLow,
    borderRadius: 10,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: D.outlineVariant,
  },
  dotRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  attendLabel: { fontSize: 10, fontFamily: D.fontMedium, color: D.onSurfaceVariant },
  attendValue: { fontSize: 20, fontFamily: D.fontBold, color: D.onSurface },
  progressBar: { height: 5, borderRadius: 99, flexDirection: "row", overflow: "hidden", backgroundColor: D.primaryFixed },
  progressSeg: { height: "100%" },

  // Pending actions
  pendingHeader: { flexDirection: "row", alignItems: "center", gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: D.surfaceContainer },
  pendingEmpty: { alignItems: "center", gap: 8, paddingVertical: 20 },
  pendingEmptyText: { fontSize: 13, color: D.onSurfaceVariant, fontFamily: D.font },
  pendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: D.surfaceContainer,
  },
  pendingIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: D.primaryFixed, alignItems: "center", justifyContent: "center" },
  pendingRowTitle: { fontSize: 13, fontFamily: D.fontSemiBold, color: D.onSurface },
  pendingRowSub: { fontSize: 11, color: D.onSurfaceVariant, marginTop: 1, fontFamily: D.font },
  viewAllRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 12 },
  viewAllText: { fontSize: 13, fontFamily: D.fontSemiBold, color: D.primaryBtn },

  // Quick access
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  quickTile: {
    width: "47.5%",
    backgroundColor: D.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 4,
    elevation: 1,
  },
  quickIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 13, fontFamily: D.fontSemiBold, color: D.onSurface },
});
