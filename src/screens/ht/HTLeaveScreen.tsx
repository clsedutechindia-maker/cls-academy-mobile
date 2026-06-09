import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const leaveRequests = [
  { name: "Mr. Ramesh Kumar", role: "Physics Teacher", type: "Sick Leave", dates: "Jun 12–13", days: 2, status: "pending", initials: "RK", color: "#6366F1" },
  { name: "Ms. Priya Sharma", role: "Chemistry Teacher", type: "Personal Leave", dates: "Jun 15", days: 1, status: "pending", initials: "PS", color: "#EC4899" },
  { name: "Mr. Anand Joshi", role: "Math Teacher", type: "Casual Leave", dates: "Jun 18", days: 1, status: "approved", initials: "AJ", color: "#10B981" },
  { name: "Ms. Sunita Patel", role: "Biology Teacher", type: "Sick Leave", dates: "Jun 20–22", days: 3, status: "rejected", initials: "SP", color: "#F59E0B" },
];

const ownLeave = [
  { type: "Casual Leave", dates: "Jun 25", days: 1, status: "pending" },
];

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "#FEF3C7", color: "#B45309", label: "Pending" },
  approved: { bg: "#DCFCE7", color: "#15803D", label: "Approved" },
  rejected: { bg: "#FEE2E2", color: "#B91C1C", label: "Rejected" },
};

export function HTLeaveScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Other</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Leave</Text>
        <AnimatedPressable style={s.actionBtn} onPress={() => router.push("/(head-teacher)/new-leave")}>
          <Ionicons name="add" size={18} color={D.onSurface} />
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Leave</Text>
        {/* Segmented control */}
        <View style={s.segControl}>
          {["Staff Requests", "My Leave"].map((t, i) => (
            <AnimatedPressable key={t} style={[s.segBtn, i === activeTab && s.segBtnActive]} onPress={() => setActiveTab(i)}>
              <Text style={[s.segText, { color: i === activeTab ? D.primary : D.onSurfaceVariant }]}>{t}</Text>
            </AnimatedPressable>
          ))}
        </View>

        {activeTab === 0 && (
          <>
            {/* Pending alert */}
            <View style={s.alertBanner}>
              <Ionicons name="time-outline" size={14} color="#92400E" />
              <Text style={s.alertText}>2 requests pending your approval</Text>
            </View>

            <Text style={s.sectionLabel}>ALL REQUESTS · {leaveRequests.length}</Text>
            <View style={s.card}>
              {leaveRequests.map((lr, i) => {
                const ss = statusStyle[lr.status]!;
                return (
                  <View key={i} style={[s.leaveRow, i < leaveRequests.length - 1 && s.divider]}>
                    <View style={[s.avatar, { backgroundColor: lr.color }]}>
                      <Text style={s.avatarText}>{lr.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.leaveName}>{lr.name}</Text>
                      <Text style={s.leaveRole}>{lr.role}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 4 }}>
                        <Text style={s.leaveType}>{lr.type}</Text>
                        <View style={s.dot} />
                        <Text style={s.leaveDates}>{lr.dates} ({lr.days}d)</Text>
                      </View>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: ss.bg }]}>
                      <Text style={[s.statusText, { color: ss.color }]}>{ss.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {activeTab === 1 && (
          <>
            <AnimatedPressable style={s.newLeaveBtn} onPress={() => router.push("/(head-teacher)/new-leave")}>
              <Ionicons name="add-circle-outline" size={16} color={D.primary} />
              <Text style={s.newLeaveText}>Apply for Leave</Text>
            </AnimatedPressable>

            <Text style={s.sectionLabel}>MY LEAVE HISTORY</Text>
            <View style={s.card}>
              {ownLeave.map((l, i) => {
                const ss = statusStyle[l.status]!;
                return (
                  <View key={i} style={s.leaveRow}>
                    <View style={[s.avatar, { backgroundColor: D.primary }]}>
                      <Text style={s.avatarText}>HT</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.leaveName}>{l.type}</Text>
                      <Text style={s.leaveDates}>{l.dates} ({l.days}d)</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: ss.bg }]}>
                      <Text style={[s.statusText, { color: ss.color }]}>{ss.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 10, backgroundColor: D.bg },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingRight: 10, paddingLeft: 6, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, height: 38 },
  backText: { fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  headerTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  actionBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 22, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.7, marginBottom: 16 },
  segControl: { flexDirection: "row", padding: 3, borderRadius: 14, backgroundColor: D.surfaceLow, marginBottom: 16 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: "center" },
  segBtnActive: { backgroundColor: D.surface, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: -0.1 },
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 16, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", marginBottom: 16 },
  alertText: { fontSize: 12, fontWeight: "600", fontFamily: D.fontSemiBold, color: "#92400E" },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  leaveRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" },
  leaveName: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  leaveRole: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 1 },
  leaveType: { fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.outline },
  leaveDates: { fontSize: 11, fontFamily: D.font, color: D.outline },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold },
  newLeaveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 15, borderRadius: 18, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, marginBottom: 16 },
  newLeaveText: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
});
