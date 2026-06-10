import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMemo, useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { AvatarCircle } from "../../components/ui";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listTeacherStudents, listTeacherAttendanceForClass, saveTeacherAttendance } from "../../lib/erp";
import { getTodayDateValue } from "../../lib/date";
import type { AttendanceStatus } from "../../shared";

export function TeacherAttendanceScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const attendanceDate = getTodayDateValue();

  const classNames: string[] = Array.from(new Set(profile?.teacherClassNames ?? [])).filter(Boolean) as string[];
  const classIds: string[] = Array.from(new Set(profile?.teacherClassIds ?? [])).filter(Boolean) as string[];

  // Map class name → class id
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

  const { data: attendanceRecords, loading: attLoading, reload: reloadAtt } = useResource(
    async () => {
      if (!selectedClassId) return [];
      return listTeacherAttendanceForClass(selectedClassId, attendanceDate);
    },
    [selectedClassId, attendanceDate],
  );

  const attMap = useMemo(
    () => new Map((attendanceRecords ?? []).map((r) => [r.studentUserId, r])),
    [attendanceRecords],
  );

  const loading = studentsLoading || attLoading;

  const stats = useMemo(() => {
    const s = { present: 0, absent: 0, leave: 0, unmarked: 0 };
    (students ?? []).forEach((st) => {
      const status = attMap.get(st.userId)?.status;
      if (status === "present") s.present++;
      else if (status === "absent") s.absent++;
      else if (status === "leave") s.leave++;
      else s.unmarked++;
    });
    return s;
  }, [students, attMap]);

  async function mark(studentUserId: string, status: AttendanceStatus) {
    if (!profile || savingKey) return;
    const student = (students ?? []).find((s) => s.userId === studentUserId);
    if (!student) return;
    setSavingKey(`${studentUserId}-${status}`);
    try {
      await saveTeacherAttendance({ teacherProfile: profile, studentProfile: student, status, attendanceDate });
      await reloadAtt();
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
          <View style={s.titleRow}>
            <Text style={s.pageTitle}>Attendance</Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              {classNames.length > 1 && (
                <AnimatedPressable style={s.batchDropdown} onPress={() => setPickerOpen(true)}>
                  <Text style={s.batchDropdownText} numberOfLines={1}>{selectedClassName || "Select"}</Text>
                  <Ionicons name="chevron-down" size={13} color={D.primary} />
                </AnimatedPressable>
              )}
              <View style={s.datePill}>
                <Ionicons name="calendar-outline" size={12} color={D.primary} />
                <Text style={s.datePillText}>{attendanceDate}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.contentArea}>
          {/* Stats row */}
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
            <Text style={s.sectionTitle}>
              {loading ? "Loading…" : `${(students ?? []).length} students`}
            </Text>
          </View>

          {loading && (
            <View style={[s.card, { padding: 28, alignItems: "center" }]}>
              <ActivityIndicator color={D.primary} />
              <Text style={{ marginTop: 12, fontSize: 13, fontFamily: D.font, color: D.outline }}>Loading roster…</Text>
            </View>
          )}

          {!loading && (students ?? []).length === 0 && (
            <View style={[s.card, { padding: 24, alignItems: "center" }]}>
              <Ionicons name="people-outline" size={32} color={D.surfaceHigh} />
              <Text style={{ marginTop: 10, fontSize: 13, fontFamily: D.font, color: D.outline }}>No students found for this batch.</Text>
            </View>
          )}

          {!loading && (students ?? []).length > 0 && (
            <View style={s.card}>
              {(students ?? []).map((st, i) => {
                const existing = attMap.get(st.userId)?.status;
                const isSaving = savingKey?.startsWith(st.userId);
                return (
                  <View key={st.userId} style={[s.studentRow, i < (students ?? []).length - 1 && s.divider]}>
                    <AvatarCircle name={st.name} size={34} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.studentName}>{st.name}</Text>
                      <Text style={s.studentMeta}>{st.rollNumber ? `Roll ${st.rollNumber}` : st.className}</Text>
                    </View>
                    {isSaving ? (
                      <ActivityIndicator size="small" color={D.primary} />
                    ) : (
                      <View style={s.statusBtns}>
                        {(["present", "absent", "leave"] as AttendanceStatus[]).map((status) => {
                          const active = existing === status;
                          const cfg = status === "present"
                            ? { label: "P", activeBg: "#15803D", activeText: "#fff", inactiveText: "#15803D", inactiveBg: "#F0FDF4" }
                            : status === "absent"
                            ? { label: "A", activeBg: "#B91C1C", activeText: "#fff", inactiveText: "#B91C1C", inactiveBg: "#FEF2F2" }
                            : { label: "L", activeBg: "#B45309", activeText: "#fff", inactiveText: "#B45309", inactiveBg: "#FEF3C7" };
                          return (
                            <TouchableOpacity
                              key={status}
                              style={[s.attBtn, { backgroundColor: active ? cfg.activeBg : cfg.inactiveBg }]}
                              onPress={() => void mark(st.userId, status)}
                              disabled={!!savingKey}
                            >
                              <Text style={[s.attBtnText, { color: active ? cfg.activeText : cfg.inactiveText }]}>{cfg.label}</Text>
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
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontSize: 28, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.7 },
  batchDropdown: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, maxWidth: 130 },
  batchDropdownText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.primary, flex: 1 },
  datePill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  datePillText: { fontSize: 10.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.primary },
  contentArea: { paddingHorizontal: 18 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statChip: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", gap: 2 },
  statCount: { fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, letterSpacing: -0.4 },
  statLabel: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.3, textTransform: "uppercase" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, paddingHorizontal: 14 },
  studentName: { fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  studentMeta: { fontSize: 10.5, fontFamily: D.font, color: D.outline, marginTop: 2 },
  statusBtns: { flexDirection: "row", gap: 6 },
  attBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  attBtnText: { fontSize: 11, fontWeight: "800", fontFamily: D.fontExtraBold },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  modalTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginBottom: 16, letterSpacing: -0.2 },
  modalOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  modalOptionActive: { backgroundColor: D.surfaceLow, marginHorizontal: -18, paddingHorizontal: 18 },
  modalOptionText: { fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface },
});
