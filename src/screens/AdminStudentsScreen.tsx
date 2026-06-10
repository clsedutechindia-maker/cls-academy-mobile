import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResource } from "../hooks/useResource";
import {
  listAdminAttendanceOverview,
  listVisibleProfilesForAdmin,
} from "../lib/erp";
import { useSession } from "../providers/session";
import { AvatarCircle, D, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { AnimatedPressable, CountUp, enter } from "../components/motion";
import type { AttendanceStatus } from "../shared";

function StatusDot({ status }: { status: AttendanceStatus | undefined }) {
  const color =
    status === "present" ? D.success :
    status === "absent" ? D.error :
    status === "leave" ? "#EAB308" :
    D.outlineVariant;
  return <View style={[dot.circle, { backgroundColor: color }]} />;
}
const dot = StyleSheet.create({
  circle: { width: 12, height: 12, borderRadius: 6 },
});

export function AdminStudentsScreen() {
  const { adminRecord } = useSession();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const resource = useResource(
    async () => {
      if (!adminRecord) return { students: [], attendance: [] };
      const [profiles, attendance] = await Promise.all([
        listVisibleProfilesForAdmin(adminRecord),
        listAdminAttendanceOverview(adminRecord),
      ]);
      return { students: profiles.filter((p) => p.role === "student"), attendance };
    },
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const classes = useMemo(() => {
    const seen = new Set<string>();
    const result: { id: string; name: string }[] = [];
    for (const st of resource.data?.students ?? []) {
      if (st.classId && !seen.has(st.classId)) {
        seen.add(st.classId);
        result.push({ id: st.classId, name: st.className || st.classId });
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [resource.data]);

  const todayStatus = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    for (const rec of resource.data?.attendance ?? []) map.set(rec.studentUserId, rec.status);
    return map;
  }, [resource.data]);

  const filtered = useMemo(() => {
    setVisibleCount(20);
    let list = resource.data?.students ?? [];
    if (classFilter !== "all") list = list.filter((st) => st.classId === classFilter);
    const term = search.trim().toLowerCase();
    if (term) list = list.filter((st) =>
      [st.name, st.studentId, st.className].join(" ").toLowerCase().includes(term),
    );
    return list;
  }, [resource.data, search, classFilter]);

  const stats = useMemo(() => {
    const att = resource.data?.attendance ?? [];
    return {
      total: resource.data?.students.length ?? 0,
      present: att.filter((a) => a.status === "present").length,
      absent: att.filter((a) => a.status === "absent").length,
      leave: att.filter((a) => a.status === "leave").length,
    };
  }, [resource.data]);

  const activeClassName = classFilter === "all" ? "All Classes" : (classes.find((c) => c.id === classFilter)?.name ?? classFilter);

  return (
    <View style={s.safe}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: Math.max(insets.top + 18, 46) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Non-home page header — scrolls with content, matches student/HT base */}
        <View style={s.header}>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={s.pageTitle}>Students</Text>
            <Text style={s.pageSub}>Monitor student attendance across all centres.</Text>
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
          <LoadingCard label="Loading students…" />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : (
          <>
            {/* 2×2 stats grid */}
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
                placeholder="Search by name or class…"
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

            {/* Class filter chip */}
            <Pressable style={s.filterChip} onPress={() => setShowClassPicker((v) => !v)}>
              <Text style={s.filterChipText}>{activeClassName}</Text>
              <Ionicons name="chevron-down" size={14} color={D.onSurfaceVariant} />
            </Pressable>

            {showClassPicker && (
              <View style={s.dropdown}>
                <Pressable
                  style={[s.dropdownRow, classFilter === "all" && s.dropdownRowActive]}
                  onPress={() => { setClassFilter("all"); setShowClassPicker(false); }}
                >
                  <Text style={[s.dropdownText, classFilter === "all" && s.dropdownTextActive]}>All Classes</Text>
                  {classFilter === "all" && <Ionicons name="checkmark" size={14} color={D.primaryBtn} />}
                </Pressable>
                {classes.map((cls) => (
                  <Pressable
                    key={cls.id}
                    style={[s.dropdownRow, classFilter === cls.id && s.dropdownRowActive]}
                    onPress={() => { setClassFilter(cls.id); setShowClassPicker(false); }}
                  >
                    <Text style={[s.dropdownText, classFilter === cls.id && s.dropdownTextActive]}>{cls.name}</Text>
                    {classFilter === cls.id && <Ionicons name="checkmark" size={14} color={D.primaryBtn} />}
                  </Pressable>
                ))}
              </View>
            )}

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

            {/* Student list */}
            {filtered.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="people-outline" size={36} color={D.outline} />
                <Text style={s.emptyText}>No students match the filter.</Text>
              </View>
            ) : (
              <View style={s.listCard}>
                {filtered.slice(0, visibleCount).map((student, idx) => {
                  const st = todayStatus.get(student.userId);
                  const isLast = idx === filtered.slice(0, visibleCount).length - 1;
                  return (
                    <AnimatedPressable
                      key={student.userId}
                      entering={enter(idx)}
                      style={[s.studentRow, !isLast && s.studentRowBorder]}
                      onPress={() =>
                        router.push({
                          pathname: "/(admin)/students/[userId]",
                          params: {
                            userId: student.userId,
                            name: student.name,
                            className: student.className ?? "",
                            studentId: student.studentId ?? "",
                            centreName: student.centreName ?? "",
                          },
                        })
                      }
                    >
                      <AvatarCircle name={student.name} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.studentName}>{student.name}</Text>
                        <Text style={s.studentClass}>{student.className || "No class"}</Text>
                      </View>
                      <StatusDot status={st} />
                      <Ionicons name="chevron-forward" size={15} color={D.outlineVariant} style={{ marginLeft: 8 }} />
                    </AnimatedPressable>
                  );
                })}
              </View>
            )}

            {filtered.length > visibleCount && (
              <AnimatedPressable style={s.loadMoreBtn} onPress={() => setVisibleCount((c) => c + 20)}>
                <Text style={s.loadMoreText}>Load More ({filtered.length - visibleCount} remaining)</Text>
              </AnimatedPressable>
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
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  pageTitle: { fontSize: 24, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  headerIcons: { flexDirection: "row", gap: 6, paddingTop: 2 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: D.surface,
    borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },

  scroll: { paddingHorizontal: 18, gap: 14, paddingBottom: MOBILE_BOTTOM_SPACING },
  pageSub: { fontSize: 13, color: D.onSurfaceVariant, lineHeight: 18, fontFamily: D.font },

  statCard: {
    flex: 1,
    backgroundColor: D.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    gap: 3,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 4,
    elevation: 1,
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

  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
    backgroundColor: D.surface, borderRadius: 8, borderWidth: 1, borderColor: D.outlineVariant,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  filterChipText: { fontSize: 13, fontFamily: D.fontSemiBold, color: D.onSurface },

  dropdown: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", marginTop: -4 },
  dropdownRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: D.surfaceContainer,
  },
  dropdownRowActive: { backgroundColor: D.surfaceLow },
  dropdownText: { fontSize: 14, color: D.onSurface, fontFamily: D.font },
  dropdownTextActive: { fontFamily: D.fontBold, color: D.primaryBtn },

  legend: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingVertical: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: D.onSurfaceVariant, fontFamily: D.fontMedium },

  listCard: { backgroundColor: D.surface, borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  studentRowBorder: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  studentName: { fontSize: 14, fontFamily: D.fontSemiBold, color: D.onSurface },
  studentClass: { fontSize: 12, color: D.onSurfaceVariant, marginTop: 1, fontFamily: D.font },

  empty: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 13, color: D.onSurfaceVariant, fontFamily: D.font },

  loadMoreBtn: { alignItems: "center", borderRadius: 10, borderWidth: 1, borderColor: D.primaryBtn + "50", paddingVertical: 11 },
  loadMoreText: { fontSize: 13, fontFamily: D.fontSemiBold, color: D.primaryBtn },

});
