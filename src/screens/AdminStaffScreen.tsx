import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResource } from "../hooks/useResource";
import {
  listStaffAttendanceForAdmin,
  listVisibleProfilesForAdmin,
} from "../lib/erp";
import { useSession } from "../providers/session";
import { AvatarCircle, D, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { AnimatedPressable, CountUp, enter } from "../components/motion";
import { getTodayDateValue } from "../lib/date";

function StaffStatusPill({ status }: { status: string | undefined }) {
  type TC = { bg: string; fg: string; dot: string; border: string };
  const map: Record<string, TC> = {
    present: { bg: D.successBg, fg: D.successFg, dot: D.success, border: D.success + "33" },
    absent: { bg: D.errorBg, fg: D.errorFg, dot: D.error, border: D.error + "33" },
    leave: { bg: D.leaveBg, fg: D.leave, dot: "#F97316", border: "#F9731633" },
  };
  const c = map[status ?? ""] ?? { bg: D.surfaceLow, fg: D.outline, dot: D.outline, border: D.outlineVariant + "33" };
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unmarked";
  return (
    <View style={[p.wrap, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={[p.dot, { backgroundColor: c.dot }]} />
      <Text style={[p.text, { color: c.fg }]}>{label}</Text>
    </View>
  );
}
const p = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontFamily: D.fontSemiBold },
});

export function AdminStaffScreen() {
  const { adminRecord } = useSession();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const resource = useResource(
    async () => {
      if (!adminRecord) return { staff: [], attendance: [] };
      const [profiles, attendance] = await Promise.all([
        listVisibleProfilesForAdmin(adminRecord),
        listStaffAttendanceForAdmin(adminRecord),
      ]);
      return { staff: profiles.filter((pr) => pr.role === "teacher"), attendance };
    },
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const today = getTodayDateValue();

  const todayAttByStaff = useMemo(
    () =>
      new Map(
        (resource.data?.attendance ?? [])
          .filter((r) => r.attendanceDate === today)
          .map((r) => [r.staffUserId, r.status] as const),
      ),
    [resource.data, today],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = resource.data?.staff ?? [];
    if (!term) return list;
    return list.filter((st) =>
      [st.name, st.teacherId, st.className, st.centreName].join(" ").toLowerCase().includes(term),
    );
  }, [resource.data, search]);

  const stats = useMemo(() => {
    const att = resource.data?.attendance.filter((a) => a.attendanceDate === today) ?? [];
    return {
      total: resource.data?.staff.length ?? 0,
      present: att.filter((a) => a.status === "present").length,
      absent: att.filter((a) => a.status === "absent").length,
      leave: att.filter((a) => a.status === "leave").length,
    };
  }, [resource.data, today]);

  return (
    <View style={s.safe}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: Math.max(insets.top + 18, 46) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Non-home page header — scrolls with content, matches student/HT base */}
        <View style={s.header}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.pageTitle}>Staff</Text>
            <Text style={s.pageSub}>Monitor teaching staff attendance.</Text>
          </View>
          <View style={s.headerIcons}>
            <AnimatedPressable style={s.iconBtn} onPress={() => router.push("/(admin)/notifications")}>
              <Ionicons name="notifications-outline" size={20} color={D.onSurface} />
            </AnimatedPressable>
            <AnimatedPressable style={s.iconBtn} onPress={() => router.push("/(admin)/lookups")}>
              <Ionicons name="search" size={20} color={D.onSurface} />
            </AnimatedPressable>
          </View>
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading staff…" />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : (
          <>
            {/* 2×2 stats */}
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={s.statCard}>
                  <Text style={s.statLabel}>Total</Text>
                  <CountUp value={stats.total} style={s.statValue} />
                </View>
                <View style={s.statCard}>
                  <Text style={s.statLabel}>Present</Text>
                  <CountUp value={stats.present} style={[s.statValue, { color: D.success }]} />
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={s.statCard}>
                  <Text style={s.statLabel}>Absent</Text>
                  <CountUp value={stats.absent} style={[s.statValue, { color: D.error }]} />
                </View>
                <View style={s.statCard}>
                  <Text style={s.statLabel}>Leave</Text>
                  <CountUp value={stats.leave} style={[s.statValue, { color: "#EAB308" }]} />
                </View>
              </View>
            </View>

            {/* Search */}
            <View style={s.searchBox}>
              <Ionicons name="search-outline" size={18} color={D.onSurfaceVariant} />
              <TextInput
                style={s.searchInput}
                placeholder="Search by name or ID…"
                placeholderTextColor={D.outline}
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={18} color={D.outline} />
                </Pressable>
              )}
            </View>

            {/* Status legend */}
            <View style={s.legend}>
              {[
                { color: D.success, label: "Present" },
                { color: D.error, label: "Absent" },
                { color: "#EAB308", label: "Leave" },
                { color: D.outlineVariant, label: "Unmarked" },
              ].map((item) => (
                <View key={item.label} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: item.color }]} />
                  <Text style={s.legendLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Staff list */}
            {filtered.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="briefcase-outline" size={36} color={D.outline} />
                <Text style={s.emptyText}>No staff members found.</Text>
              </View>
            ) : (
              <View style={s.listCard}>
                {filtered.map((teacher, idx) => {
                  const attStatus = todayAttByStaff.get(teacher.userId);
                  const isLast = idx === filtered.length - 1;
                  const dotColor =
                    attStatus === "present" ? D.success :
                    attStatus === "absent" ? D.error :
                    attStatus === "leave" ? "#EAB308" :
                    D.outlineVariant;
                  return (
                    <AnimatedPressable
                      key={teacher.userId}
                      entering={enter(idx)}
                      style={[s.staffRow, !isLast && s.staffRowBorder]}
                      onPress={() =>
                        router.push({
                          pathname: "/(admin)/staff/[userId]",
                          params: {
                            userId: teacher.userId,
                            name: teacher.name,
                            teacherId: teacher.teacherId ?? "",
                            className: teacher.className ?? "",
                            centreName: teacher.centreName ?? "",
                          },
                        })
                      }
                    >
                      <AvatarCircle name={teacher.name} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.staffName}>{teacher.name}</Text>
                        <Text style={s.staffClass}>{teacher.className || "Unassigned"}</Text>
                      </View>
                      <View style={[s.statusDot, { backgroundColor: dotColor }]} />
                      <Ionicons name="chevron-forward" size={15} color={D.outlineVariant} style={{ marginLeft: 8 }} />
                    </AnimatedPressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },

  // Non-home header (scrolls with content — no fixed app-bar / divider)
  header: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
  },
  pageTitle: { fontSize: 24, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  headerIcons: { flexDirection: "row", gap: 6, paddingTop: 2 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },

  scroll: { paddingHorizontal: 18, gap: 14, paddingBottom: MOBILE_BOTTOM_SPACING },
  pageSub: { fontSize: 13, color: D.onSurfaceVariant, lineHeight: 18, fontFamily: D.font },

  statCard: {
    flex: 1, backgroundColor: D.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: D.outlineVariant, gap: 3,
    shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 4, elevation: 1,
  },
  statLabel: { fontSize: 11, fontFamily: D.fontMedium, color: D.onSurfaceVariant },
  statValue: { fontSize: 24, fontFamily: D.fontBold, color: D.onSurface, lineHeight: 30 },

  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: D.surface, borderRadius: 16,
    borderWidth: 1, borderColor: D.outlineVariant,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: D.onSurface, fontFamily: D.font },

  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingVertical: 2 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: D.onSurfaceVariant, fontFamily: D.fontMedium },

  listCard: { backgroundColor: D.surface, borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  staffRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  staffRowBorder: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  staffName: { fontSize: 14, fontFamily: D.fontSemiBold, color: D.onSurface },
  staffClass: { fontSize: 12, color: D.onSurfaceVariant, marginTop: 1, fontFamily: D.font },
  statusDot: { width: 12, height: 12, borderRadius: 6 },

  empty: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 13, color: D.onSurfaceVariant, fontFamily: D.font },
});
