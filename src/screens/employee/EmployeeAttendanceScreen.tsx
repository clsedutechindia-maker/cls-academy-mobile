import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  listStudentsForClass,
  listEmployeeClasses,
  lockAttendanceForDay,
  saveAttendanceBatch,
} from "../../lib/erp";
import { getTodayDateValue } from "../../lib/date";
import { showAlert } from "../../lib/alert";
import type { AttendanceStatus, ClassRecord, UserProfileRecord } from "../../shared";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function prettyDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(`${value}T00:00:00`);
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  return `${wd}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function EmployeeAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null);
  const attendanceDate = getTodayDateValue();

  const { data: classes, loading: classesLoading } = useResource(
    async () => {
      if (!profile) return [];
      return listEmployeeClasses(profile);
    },
    [profile?.userId],
  );

  // Auto-select first class
  useEffect(() => {
    if (!selectedClass && classes && classes.length > 0) {
      setSelectedClass(classes[0]!);
    }
  }, [classes]);

  const selectedClassId = selectedClass?.id ?? "";

  const { data: students, loading: studentsLoading } = useResource(
    async () => (selectedClassId ? listStudentsForClass(selectedClassId) : []),
    [selectedClassId],
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

  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({});
  useEffect(() => {
    if (!bundle) return;
    const next: Record<string, AttendanceStatus> = {};
    for (const r of bundle.records) next[r.studentUserId] = r.status;
    for (const id of leaveUserIds) next[id] = "leave";
    setDraft(next);
  }, [bundle, leaveUserIds]);

  const loading = classesLoading || studentsLoading || bundleLoading;
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
    if (!profile || locked || !selectedClassId) return;
    const unmarked = roster.filter((st) => !draft[st.userId]);
    if (unmarked.length > 0) {
      showAlert("Incomplete", `${unmarked.length} student${unmarked.length > 1 ? "s" : ""} still unmarked.`);
      return;
    }
    showAlert("Submit Attendance", "Lock today's attendance? It cannot be changed after this.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Submit & Lock",
        onPress: async () => {
          setSubmitting(true);
          try {
            const entries = roster.map((st: UserProfileRecord) => ({ student: st, status: draft[st.userId]! }));
            await saveAttendanceBatch({ teacherProfile: profile, entries, attendanceDate });
            await lockAttendanceForDay(selectedClassId, attendanceDate, { userId: profile.userId, name: profile.name || "Employee" });
            await reloadBundle();
            showAlert("Submitted", "Attendance locked for today.");
          } catch {
            showAlert("Error", "Could not submit. Try again.");
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
        <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
          <Text style={s.pageTitle}>Attendance</Text>
          <View style={s.toolbar}>
            {(classes ?? []).length > 0 ? (
              <AnimatedPressable style={s.batchDropdown} onPress={() => setPickerOpen(true)}>
                <Ionicons name="people-outline" size={14} color={D.primary} />
                <Text style={s.batchDropdownText} numberOfLines={1}>{selectedClass?.name || "Select class"}</Text>
                <Ionicons name="chevron-down" size={13} color={D.outline} />
              </AnimatedPressable>
            ) : (
              <View style={s.batchDropdown}>
                <Ionicons name="people-outline" size={14} color={D.primary} />
                <Text style={s.batchDropdownText} numberOfLines={1}>No classes</Text>
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
              <Text style={s.lockBannerText}>Attendance submitted and locked for today.</Text>
            </View>
          )}

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
            </View>
          )}

          {!loading && roster.length === 0 && (
            <View style={[s.card, { padding: 24, alignItems: "center" }]}>
              <Ionicons name="people-outline" size={32} color={D.surfaceHigh} />
              <Text style={{ marginTop: 10, fontSize: 13, fontFamily: D.font, color: D.outline }}>No students in this class.</Text>
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
                            ? { icon: "checkmark" as const, activeBg: "#15803D", inactiveBg: "#F0FDF4", inactiveText: "#15803D" }
                            : { icon: "close" as const, activeBg: "#B91C1C", inactiveBg: "#FEF2F2", inactiveText: "#B91C1C" };
                          return (
                            <TouchableOpacity
                              key={opt}
                              style={[s.attBtn, { backgroundColor: active ? cfg.activeBg : cfg.inactiveBg }, locked && !active && { opacity: 0.4 }]}
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

      {!loading && !locked && roster.length > 0 && (
        <View style={s.submitBar}>
          <AnimatedPressable style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={() => void submit()} disabled={submitting}>
            <Ionicons name="lock-closed-outline" size={17} color="#fff" />
            <Text style={s.submitText}>{submitting ? "Submitting…" : "Submit & Lock"}</Text>
          </AnimatedPressable>
        </View>
      )}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Class</Text>
            {(classes ?? []).map((c: ClassRecord) => (
              <Pressable
                key={c.id}
                style={[s.modalOption, c.id === selectedClass?.id && s.modalOptionActive]}
                onPress={() => { setSelectedClass(c); setDraft({}); setPickerOpen(false); }}
              >
                <Text style={[s.modalOptionText, c.id === selectedClass?.id && { color: D.primary, fontFamily: D.fontBold }]}>{c.name}</Text>
                {c.id === selectedClass?.id && <Ionicons name="checkmark" size={16} color={D.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 12, backgroundColor: D.bg },
  pageTitle: { fontSize: 26, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.7, marginBottom: 12 },
  toolbar: { flexDirection: "row", gap: 8, alignItems: "center" },
  batchDropdown: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  batchDropdownText: { flex: 1, fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  datePill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  datePillText: { fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.primary },
  contentArea: { paddingHorizontal: 18, paddingTop: 16 },
  lockBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0", marginBottom: 16 },
  lockBannerText: { fontSize: 13, fontFamily: D.fontMedium, color: "#15803D", flex: 1 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statChip: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  statCount: { fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, letterSpacing: -0.4 },
  statLabel: { fontSize: 8.5, fontWeight: "600", fontFamily: D.fontSemiBold, marginTop: 2, letterSpacing: 0.2 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: D.surfaceLow },
  markAllText: { fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.primary },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  studentName: { fontSize: 13, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface, letterSpacing: -0.1 },
  studentMeta: { fontSize: 10.5, color: D.outline, marginTop: 2, fontFamily: D.font },
  leaveBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "#FEF3C7" },
  leaveBadgeText: { fontSize: 10.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: "#B45309" },
  statusBtns: { flexDirection: "row", gap: 6 },
  attBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  submitBar: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: 100, backgroundColor: D.bg },
  submitBtn: { height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitText: { fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  modalTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginBottom: 16, letterSpacing: -0.2 },
  modalOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  modalOptionActive: { backgroundColor: D.surfaceLow, marginHorizontal: -18, paddingHorizontal: 18 },
  modalOptionText: { fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface },
});
