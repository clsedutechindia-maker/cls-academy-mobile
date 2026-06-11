import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { AvatarCircle } from "../../components/ui";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import {
  isAttendanceLocked,
  listApprovedLeavesForClass,
  listTeacherAttendanceForClass,
  listTeacherStudents,
  lockAttendanceForDay,
  saveAttendanceBatch,
} from "../../lib/erp";
import { getTodayDateValue } from "../../lib/date";
import type { AttendanceStatus, UserProfileRecord } from "../../shared";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function prettyDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(`${value}T00:00:00`);
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${wd}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function TeacherAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const attendanceDate = getTodayDateValue();

  const classNames: string[] = Array.from(new Set(profile?.teacherClassNames ?? [])).filter(Boolean) as string[];
  const classIds: string[] = Array.from(new Set(profile?.teacherClassIds ?? [])).filter(Boolean) as string[];

  const classNameToId = useMemo(() => {
    const map: Record<string, string> = {};
    classNames.forEach((name, i) => { if (classIds[i]) map[name] = classIds[i]!; });
    return map;
  }, [classNames.join(","), classIds.join(",")]);

  const [selectedClassName, setSelectedClassName] = useState(classNames[0] ?? "");
  const selectedClassId = classNameToId[selectedClassName] ?? classIds[0] ?? "";

  const { data: students, loading: studentsLoading } = useResource(
    async () => {
      if (!profile) return [];
      const all = await listTeacherStudents(profile);
      return all.filter((s) => !selectedClassId || s.classId === selectedClassId);
    },
    [profile?.userId, selectedClassId],
  );

  const { data: bundle, loading: bundleLoading, reload: reloadBundle } = useResource(
    async () => {
      if (!selectedClassId) return { records: [], leaves: [], locked: false };
      const [records, leaves, locked] = await Promise.all([
        listTeacherAttendanceForClass(selectedClassId, attendanceDate),
        listApprovedLeavesForClass(selectedClassId, attendanceDate),
        isAttendanceLocked(selectedClassId, attendanceDate),
      ]);
      return { records, leaves, locked };
    },
    [selectedClassId, attendanceDate],
  );

  const locked = bundle?.locked ?? false;
  const leaveUserIds = useMemo(
    () => new Set((bundle?.leaves ?? []).map((l) => l.studentUserId)),
    [bundle],
  );

  // Working draft: studentUserId -> status. Seeded from saved records + approved leaves.
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  useEffect(() => {
    if (!bundle) return;
    const next: Record<string, AttendanceStatus> = {};
    for (const r of bundle.records) next[r.studentUserId] = r.status;
    for (const id of leaveUserIds) next[id] = "leave"; // approved leave always wins
    setDraft(next);
  }, [bundle, leaveUserIds]);

  const loading = studentsLoading || bundleLoading;
  const roster = students ?? [];

  const stats = useMemo(() => {
    const s = { present: 0, absent: 0, leave: 0, unmarked: 0 };
    roster.forEach((st) => {
      const status = draft[st.userId];
      if (status === "present") s.present++;
      else if (status === "absent") s.absent++;
      else if (status === "leave") s.leave++;
      else s.unmarked++;
    });
    return s;
  }, [roster, draft]);

  function setStatus(userId: string, status: AttendanceStatus) {
    if (locked || leaveUserIds.has(userId)) return;
    setDraft((prev) => ({ ...prev, [userId]: status }));
  }

  function markAllPresent() {
    if (locked) return;
    setDraft((prev) => {
      const next = { ...prev };
      roster.forEach((st) => {
        if (leaveUserIds.has(st.userId)) next[st.userId] = "leave";
        else if (!next[st.userId]) next[st.userId] = "present";
      });
      return next;
    });
  }

  async function submit() {
    if (!profile || locked) return;
    const unmarked = roster.filter((st) => !draft[st.userId]);
    if (unmarked.length > 0) {
      Alert.alert("Incomplete", `${unmarked.length} student${unmarked.length > 1 ? "s" : ""} still unmarked. Mark everyone before submitting.`);
      return;
    }
    Alert.alert("Submit Attendance", "Lock today's attendance? It cannot be changed after this.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit & Lock",
        onPress: async () => {
          setSubmitting(true);
          try {
            const entries = roster.map((st) => ({ student: st as UserProfileRecord, status: draft[st.userId]! }));
            await saveAttendanceBatch({ teacherProfile: profile, entries, attendanceDate });
            await lockAttendanceForDay(selectedClassId, attendanceDate, { userId: profile.userId, name: profile.name || "Teacher" });
            await reloadBundle();
            Alert.alert("Submitted", "Attendance locked for today.");
          } catch {
            Alert.alert("Error", "Could not submit. Try again.");
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
          <Text style={s.pageTitle}>Attendance</Text>
          <View style={s.toolbar}>
            {classNames.length > 1 ? (
              <AnimatedPressable style={s.batchDropdown} onPress={() => setPickerOpen(true)}>
                <Ionicons name="people-outline" size={14} color={D.primary} />
                <Text style={s.batchDropdownText} numberOfLines={1}>{selectedClassName || "Select class"}</Text>
                <Ionicons name="chevron-down" size={13} color={D.outline} />
              </AnimatedPressable>
            ) : (
              <View style={s.batchDropdown}>
                <Ionicons name="people-outline" size={14} color={D.primary} />
                <Text style={s.batchDropdownText} numberOfLines={1}>{selectedClassName || "My class"}</Text>
              </View>
            )}
            <View style={s.datePill}>
              <Ionicons name="calendar-outline" size={13} color={D.primary} />
              <Text style={s.datePillText}>{prettyDate(attendanceDate)}</Text>
            </View>
          </View>
        </View>

        <View style={s.contentArea}>
          {locked && (
            <View style={s.lockBanner}>
              <Ionicons name="lock-closed" size={15} color="#15803D" />
              <Text style={s.lockBannerText}>Attendance submitted &amp; locked for today.</Text>
            </View>
          )}

          {/* Stats */}
          <View style={s.statsRow}>
            {[
              { label: "Present", count: stats.present, color: "#15803D", bg: "#F0FDF4" },
              { label: "Absent", count: stats.absent, color: "#B91C1C", bg: "#FEF2F2" },
              { label: "Leave", count: stats.leave, color: "#B45309", bg: "#FEF3C7" },
              { label: "Unmarked", count: stats.unmarked, color: D.outline, bg: D.surfaceLow },
            ].map((st) => (
              <View key={st.label} style={[s.statChip, { backgroundColor: st.bg }]}>
                <Text style={[s.statCount, { color: st.color }]}>{st.count}</Text>
                <Text style={[s.statLabel, { color: st.color }]}>{st.label}</Text>
              </View>
            ))}
          </View>

          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>{loading ? "Loading…" : `${roster.length} students`}</Text>
            {!loading && !locked && roster.length > 0 && (
              <AnimatedPressable style={s.markAllBtn} onPress={markAllPresent}>
                <Ionicons name="checkmark-done" size={14} color={D.primary} />
                <Text style={s.markAllText}>Mark all present</Text>
              </AnimatedPressable>
            )}
          </View>

          {loading && (
            <View style={[s.card, { padding: 28, alignItems: "center" }]}>
              <ActivityIndicator color={D.primary} />
              <Text style={{ marginTop: 12, fontSize: 13, fontFamily: D.font, color: D.outline }}>Loading roster…</Text>
            </View>
          )}

          {!loading && roster.length === 0 && (
            <View style={[s.card, { padding: 24, alignItems: "center" }]}>
              <Ionicons name="people-outline" size={32} color={D.surfaceHigh} />
              <Text style={{ marginTop: 10, fontSize: 13, fontFamily: D.font, color: D.outline }}>No students found for this batch.</Text>
            </View>
          )}

          {!loading && roster.length > 0 && (
            <View style={s.card}>
              {roster.map((st, i) => {
                const status = draft[st.userId];
                const onLeave = leaveUserIds.has(st.userId);
                return (
                  <View key={st.userId} style={[s.studentRow, i < roster.length - 1 && s.divider]}>
                    <AvatarCircle name={st.name} size={38} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={s.studentName} numberOfLines={1}>{st.name}</Text>
                      <Text style={s.studentMeta} numberOfLines={1}>
                        {st.rollNumber ? `Roll ${st.rollNumber}` : st.className}
                      </Text>
                    </View>
                    {onLeave ? (
                      <View style={s.leaveBadge}>
                        <Ionicons name="airplane-outline" size={13} color="#B45309" />
                        <Text style={s.leaveBadgeText}>On leave</Text>
                      </View>
                    ) : (
                      <View style={s.statusBtns}>
                        {(["present", "absent"] as AttendanceStatus[]).map((opt) => {
                          const active = status === opt;
                          const cfg = opt === "present"
                            ? { icon: "checkmark" as const, activeBg: "#15803D", inactiveText: "#15803D", inactiveBg: "#F0FDF4" }
                            : { icon: "close" as const, activeBg: "#B91C1C", inactiveText: "#B91C1C", inactiveBg: "#FEF2F2" };
                          return (
                            <TouchableOpacity
                              key={opt}
                              style={[
                                s.attBtn,
                                { backgroundColor: active ? cfg.activeBg : cfg.inactiveBg },
                                locked && !active && { opacity: 0.4 },
                              ]}
                              onPress={() => setStatus(st.userId, opt)}
                              disabled={locked}
                            >
                              <Ionicons name={cfg.icon} size={18} color={active ? "#fff" : cfg.inactiveText} />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit bar */}
      {!loading && !locked && roster.length > 0 && (
        <View style={[s.submitBar, { paddingBottom: Math.max(insets.bottom, 12) + 84 }]}>
          <AnimatedPressable style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={() => void submit()} disabled={submitting}>
            <Ionicons name="lock-closed-outline" size={17} color="#fff" />
            <Text style={s.submitText}>{submitting ? "Submitting…" : "Submit & Lock"}</Text>
          </AnimatedPressable>
        </View>
      )}

      {/* Batch picker */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Batch</Text>
            {classNames.map((b) => (
              <Pressable
                key={b}
                style={[s.modalOption, b === selectedClassName && s.modalOptionActive]}
                onPress={() => { setSelectedClassName(b); setPickerOpen(false); }}
              >
                <Text style={[s.modalOptionText, b === selectedClassName && { color: D.primary, fontFamily: D.fontBold }]}>{b}</Text>
                {b === selectedClassName && <Ionicons name="checkmark" size={16} color={D.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 16, backgroundColor: D.bg },
  pageTitle: { fontSize: 26, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.6, marginBottom: 14 },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 8 },
  batchDropdown: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  batchDropdownText: { flex: 1, fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  datePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, flexShrink: 0 },
  datePillText: { fontSize: 12, fontWeight: "700", fontFamily: D.fontSemiBold, color: D.primary },
  contentArea: { paddingHorizontal: 18 },
  lockBanner: { flexDirection: "row", alignItems: "center", gap: 9, padding: 12, borderRadius: 12, backgroundColor: "#F0FDF4", marginBottom: 16 },
  lockBannerText: { flex: 1, fontSize: 12.5, fontFamily: D.fontSemiBold, color: "#15803D" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statChip: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", gap: 2 },
  statCount: { fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, letterSpacing: -0.4 },
  statLabel: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.3, textTransform: "uppercase" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  markAllText: { fontSize: 11.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  studentName: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  studentMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 2 },
  statusBtns: { flexDirection: "row", gap: 8, flexShrink: 0 },
  attBtn: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  leaveBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 999, backgroundColor: "#FEF3C7", flexShrink: 0 },
  leaveBadgeText: { fontSize: 11.5, fontWeight: "700", fontFamily: D.fontBold, color: "#B45309" },
  submitBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 18, paddingTop: 12, backgroundColor: D.bg },
  submitBtn: { height: 52, borderRadius: 18, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  submitText: { fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  modalTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginBottom: 16, letterSpacing: -0.2 },
  modalOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  modalOptionActive: { backgroundColor: D.surfaceLow, marginHorizontal: -18, paddingHorizontal: 18 },
  modalOptionText: { fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface },
});
