import { useCallback } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { D, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { useSession } from "../providers/session";
import { useResource } from "../hooks/useResource";
import {
  listAdminComplaints,
  listPendingLeaveRequests,
  listStudentLeaveRequestsForAdmin,
  getPendingApprovalsCount,
  getInquirySummaryForAdmin,
  listTeachingPlansForAdmin,
} from "../lib/erp";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
type BadgeKey = "complaints" | "teachingPlans" | "inquiries" | "leave" | "approvals";
type NavItem = { label: string; sub: string; icon: IoniconsName; color: string; bg: string; route: string; badge?: BadgeKey };

// Top 4 = priority quick actions (rendered as compact circle buttons).
const QUICK_ACTIONS: NavItem[] = [
  { label: "Fees", sub: "Collections & dues", icon: "card", color: "#047857", bg: "#ECFDF5", route: "/(admin)/fees" },
  { label: "Inquiries", sub: "Admission leads", icon: "call", color: "#4338CA", bg: "#E0E7FF", route: "/(admin)/inquiries", badge: "inquiries" },
  { label: "Fee Plans", sub: "Set up fee structures", icon: "options", color: "#9333EA", bg: "#F3E8FF", route: "/(admin)/fee-structures" },
  { label: "Complaints", sub: "Student reports", icon: "alert-circle", color: "#7C3AED", bg: "#EDE9FE", route: "/(admin)/complaints", badge: "complaints" },
];

const NAV_CARDS: NavItem[] = [
  { label: "Approvals", sub: "Students & staff access", icon: "person-add-outline", color: "#1D4ED8", bg: "#DBEAFE", route: "/(admin)/approvals", badge: "approvals" },
  { label: "Schedule", sub: "Timetable & exams", icon: "calendar-outline", color: D.primary, bg: D.surfaceLow, route: "/(admin)/schedule" },
  { label: "Teaching Plan", sub: "Review & approve", icon: "reader-outline", color: "#7C3AED", bg: "#F3E8FF", route: "/(admin)/teaching-plans", badge: "teachingPlans" },
  { label: "Sessions", sub: "Doubt & remedial", icon: "time-outline", color: "#0D9488", bg: "#CCFBF1", route: "/(admin)/sessions" },
  { label: "Results", sub: "Test results", icon: "trophy-outline", color: D.success, bg: "#dcfce7", route: "/(admin)/results" },
  { label: "Leave", sub: "Manage requests", icon: "document-text-outline", color: "#B45309", bg: "#FEF3C7", route: "/(admin)/leave", badge: "leave" },
];

type Counts = Record<BadgeKey, number>;

export function AdminOperationsScreen() {
  const { adminRecord } = useSession();

  const { data: counts, reload } = useResource<Counts>(
    async () => {
      const empty: Counts = { complaints: 0, teachingPlans: 0, inquiries: 0, leave: 0, approvals: 0 };
      if (!adminRecord) return empty;
      const [complaints, leave, studentLeave, approvals, inquiries, plans] = await Promise.all([
        listAdminComplaints(adminRecord),
        listPendingLeaveRequests(adminRecord),
        listStudentLeaveRequestsForAdmin(adminRecord),
        getPendingApprovalsCount(adminRecord),
        getInquirySummaryForAdmin(adminRecord),
        listTeachingPlansForAdmin(adminRecord),
      ]);
      return {
        complaints: complaints.filter((c) => c.status === "open" || c.status === "in_progress").length,
        leave: leave.length + studentLeave.length,
        approvals,
        inquiries: inquiries.newCount,
        teachingPlans: plans.filter((p) => p.status === "submitted").length,
      };
    },
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const badgeFor = (item: NavItem) => (item.badge ? (counts?.[item.badge] ?? 0) : 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Operations</Text>
          <AnimatedPressable style={styles.iconBtn} onPress={() => router.push("/(admin)/notifications")}>
            <Ionicons name="notifications-outline" size={20} color={D.onSurface} />
          </AnimatedPressable>
        </View>

        {/* Quick actions — soft circle tiles */}
        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((item) => {
            const count = badgeFor(item);
            return (
              <AnimatedPressable key={item.label} style={styles.quick} onPress={() => router.push(item.route as any)}>
                <View style={styles.quickCircleWrap}>
                  <View style={[styles.quickCircle, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={21} color={item.color} />
                  </View>
                  {count > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.quickLabel} numberOfLines={1}>{item.label}</Text>
              </AnimatedPressable>
            );
          })}
        </View>

        {/* Rest — 2-up tile grid */}
        <View style={styles.grid}>
          {NAV_CARDS.map((c) => {
            const count = badgeFor(c);
            return (
              <AnimatedPressable key={c.label} style={styles.gridCard} onPress={() => router.push(c.route as any)}>
                <View style={[styles.cardIcon, { backgroundColor: c.bg }]}>
                  <Ionicons name={c.icon} size={18} color={c.color} />
                </View>
                <Text style={styles.cardTitle}>{c.label}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>{c.sub}</Text>
                <View style={styles.arrowContainer}>
                  <View style={[styles.arrowWrap, { backgroundColor: c.bg }]}>
                    <Ionicons name="chevron-forward" size={12} color={c.color} />
                  </View>
                </View>
                {count > 0 && (
                  <View style={[styles.badge, styles.gridBadge]}>
                    <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
                  </View>
                )}
              </AnimatedPressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: 18, paddingBottom: MOBILE_BOTTOM_SPACING },
  header: { flexDirection: "row", alignItems: "center", paddingTop: 14, paddingBottom: 4 },
  pageTitle: { flex: 1, fontSize: 24, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },

  quickRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 18, marginBottom: 4 },
  quick: { alignItems: "center", gap: 9, width: "23%" },
  quickCircleWrap: { position: "relative" },
  quickCircle: {
    width: 54, height: 54, borderRadius: 12, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: D.outlineVariant,
  },
  quickLabel: { fontSize: 11.5, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  gridCard: {
    width: "48.5%",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    shadowColor: "#4C1D95",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  cardTitle: { fontSize: 13, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.2 },
  cardSub: { fontSize: 10.5, color: D.outline, marginTop: 2, fontFamily: D.font },
  arrowContainer: { marginTop: 9, flexDirection: "row", justifyContent: "flex-end" },
  arrowWrap: { width: 22, height: 22, borderRadius: 7, alignItems: "center", justifyContent: "center" },

  badge: {
    position: "absolute", top: -4, right: -4,
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5,
    backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: D.bg,
  },
  gridBadge: { top: 10, right: 10 },
  badgeText: { fontSize: 10, fontFamily: D.fontExtraBold, color: "#fff" },
});
