import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCallback, useState } from "react";
import { D, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { useSession } from "../providers/session";
import { useResource } from "../hooks/useResource";
import { listAdminSchedule, listAdminScopedClasses } from "../lib/erp";
import { OptionSheet } from "./schedule/scheduleEditorKit";
import type { ClassTimetableRecord, ScheduleDayKey, TestScheduleRecord } from "../shared";

const DAY_KEYS: ScheduleDayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayDayKey(): ScheduleDayKey {
  const d = new Date().getDay();
  const map: Record<number, ScheduleDayKey> = { 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday", 6: "saturday" };
  return map[d] ?? "monday";
}

function formatDayLabel(key: ScheduleDayKey): string {
  const now = new Date();
  const map: Record<ScheduleDayKey, number> = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const target = map[key];
  const diff = target - now.getDay();
  const date = new Date(now);
  date.setDate(now.getDate() + diff);
  const dayName = key.charAt(0).toUpperCase() + key.slice(1);
  const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${dayName.toUpperCase()} · ${month} ${date.getDate()}`;
}

const subjectColorMap: Record<string, { color: string; bg: string }> = {
  Physics: { color: "#6366F1", bg: "#EEF2FF" },
  Chemistry: { color: "#0EA5E9", bg: "#F0F9FF" },
  Biology: { color: "#10B981", bg: "#F0FDF4" },
  Math: { color: "#F59E0B", bg: "#FEF3C7" },
};
function subjectStyle(name: string) {
  for (const key of Object.keys(subjectColorMap)) {
    if (name.includes(key)) return subjectColorMap[key]!;
  }
  return { color: D.primary, bg: D.surfaceLow };
}

function formatTime(t: string) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  if (h === undefined || m === undefined) return t;
  const ampm = h! >= 12 ? "PM" : "AM";
  const hour = h! % 12 || 12;
  return `${hour}:${String(m!).padStart(2, "0")} ${ampm}`;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function formatExamDate(dateStr: string) {
  if (!dateStr) return { mon: "—", day: "—" };
  const d = new Date(dateStr);
  return {
    mon: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
  };
}

export function AdminScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { adminRecord } = useSession();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDay, setSelectedDay] = useState<ScheduleDayKey>(todayDayKey());
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classSheet, setClassSheet] = useState(false);

  const { data, loading, error, reload } = useResource(
    async () => {
      if (!adminRecord) return { timetableEntries: [], tests: [] };
      return listAdminSchedule(adminRecord);
    },
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const classesResource = useResource(
    async () => {
      if (!adminRecord) return [];
      return listAdminScopedClasses(adminRecord);
    },
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const classes = classesResource.data ?? [];

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  if (classes.length > 0 && !selectedClassId) {
    setSelectedClassId(classes[0]!.id);
  }

  const selectedClass = classes.find((c) => c.id === selectedClassId) ?? null;

  const timetableEntries = (data?.timetableEntries ?? []).filter(
    (e) => !selectedClassId || e.classId === selectedClassId,
  );
  const tests = (data?.tests ?? []).filter((t) => !selectedClassId || t.classId === selectedClassId);

  const todaySlots = timetableEntries
    .filter((e) => e.dayKey === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const upcomingTests = tests
    .filter((t) => daysUntil(t.scheduleDate) >= 0)
    .sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));

  function openCreate() {
    if (!selectedClassId) return;
    if (activeTab === 0) {
      router.push({ pathname: "/(admin)/timetable-editor", params: { classId: selectedClassId, mode: "create", day: selectedDay } });
    } else {
      router.push({ pathname: "/(admin)/exam-editor", params: { classId: selectedClassId, mode: "create" } });
    }
  }

  function openEditSlot(entry: ClassTimetableRecord) {
    router.push({ pathname: "/(admin)/timetable-editor", params: { classId: entry.classId, entryId: entry.id, mode: "edit", day: entry.dayKey } });
  }

  function openEditExam(entry: TestScheduleRecord) {
    router.push({ pathname: "/(admin)/exam-editor", params: { classId: entry.classId, entryId: entry.id, mode: "edit" } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.pageTitle}>Schedule</Text>
        </View>
        {classes.length > 0 && (
          <View style={s.toolbar}>
            <AnimatedPressable style={s.classPick} onPress={() => setClassSheet(true)}>
              <Ionicons name="school-outline" size={15} color={D.primary} />
              <Text style={s.classPickText} numberOfLines={1}>{selectedClass ? selectedClass.name : "Select class"}</Text>
              <Ionicons name="chevron-down" size={14} color={D.outline} />
            </AnimatedPressable>
            <AnimatedPressable style={[s.addBtn, !selectedClassId && { opacity: 0.5 }]} onPress={openCreate} disabled={!selectedClassId}>
              <Ionicons name="add" size={20} color="#fff" />
            </AnimatedPressable>
          </View>
        )}
        <View style={s.segControl}>
          {["Timetable", "Exam Schedule"].map((t, i) => (
            <AnimatedPressable key={t} style={[s.segBtn, i === activeTab && s.segBtnActive]} onPress={() => setActiveTab(i)}>
              <Text style={[s.segText, { color: i === activeTab ? D.primary : D.onSurfaceVariant }]}>{t}</Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: MOBILE_BOTTOM_SPACING }} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator color={D.primary} />
            <Text style={{ marginTop: 12, fontFamily: D.font, color: D.outline, fontSize: 13 }}>Loading schedule…</Text>
          </View>
        )}

        {error && (
          <View style={[s.card, { padding: 16 }]}>
            <Text style={{ fontFamily: D.font, color: "#B91C1C", fontSize: 13 }}>{error}</Text>
          </View>
        )}

        {!loading && !error && activeTab === 0 && (
          <>
            <View style={{ flexDirection: "row", gap: 7, marginBottom: 18 }}>
              {DAY_KEYS.map((key, i) => {
                const active = key === selectedDay;
                return (
                  <AnimatedPressable
                    key={key}
                    style={[s.dayChip, { backgroundColor: active ? D.primary : D.surface, borderColor: active ? D.primary : D.outlineVariant }]}
                    onPress={() => setSelectedDay(key)}
                  >
                    <Text style={[s.dayText, { color: active ? "#fff" : D.onSurfaceVariant }]}>{DAY_LABELS[i]}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>

            <Text style={s.sectionLabel}>{formatDayLabel(selectedDay)}</Text>

            {todaySlots.length === 0 ? (
              <View style={[s.card, { padding: 24, alignItems: "center" }]}>
                <Ionicons name="calendar-outline" size={32} color={D.outline} />
                <Text style={{ marginTop: 10, fontFamily: D.font, color: D.outline, fontSize: 13 }}>No classes scheduled.</Text>
              </View>
            ) : (
              <View style={s.card}>
                {todaySlots.map((sl, i) => {
                  const sc = subjectStyle(sl.subjectName);
                  return (
                    <AnimatedPressable key={sl.id} style={[s.slotRow, i < todaySlots.length - 1 && s.divider]} onPress={() => openEditSlot(sl)}>
                      <View style={s.slotTimeBlock}>
                        <Text style={s.slotTime}>{formatTime(sl.startTime)}</Text>
                        {sl.endTime && <Text style={s.slotHall}>{formatTime(sl.endTime)}</Text>}
                      </View>
                      <View style={[s.accentLine, { backgroundColor: sc.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.slotSubjectTag, { color: sc.color }]}>{sl.subjectName.toUpperCase()}</Text>
                        <Text style={s.slotSubject}>{sl.className}</Text>
                        {sl.notes ? <Text style={s.slotMeta}>{sl.notes}</Text> : null}
                      </View>
                      {sl.teacherName ? <Text style={s.teacherLabel}>{sl.teacherName}</Text> : null}
                    </AnimatedPressable>
                  );
                })}
              </View>
            )}
          </>
        )}

        {!loading && !error && activeTab === 1 && (
          <>
            <Text style={s.sectionLabel}>UPCOMING · {upcomingTests.length} EXAM{upcomingTests.length !== 1 ? "S" : ""}</Text>
            {upcomingTests.length === 0 ? (
              <View style={[s.card, { padding: 24, alignItems: "center" }]}>
                <Ionicons name="document-text-outline" size={32} color={D.outline} />
                <Text style={{ marginTop: 10, fontFamily: D.font, color: D.outline, fontSize: 13 }}>No upcoming exams.</Text>
              </View>
            ) : (
              <View style={s.card}>
                {upcomingTests.map((e, i) => {
                  const sc = subjectStyle(e.subjectName);
                  const { mon, day } = formatExamDate(e.scheduleDate);
                  const dl = daysUntil(e.scheduleDate);
                  return (
                    <AnimatedPressable key={e.id} style={[s.examRow, i < upcomingTests.length - 1 && s.divider]} onPress={() => openEditExam(e)}>
                      <View style={s.datePill}>
                        <Text style={[s.datePillMon, { color: D.outline }]}>{mon}</Text>
                        <Text style={[s.datePillDay, { color: D.onSurface }]}>{day}</Text>
                      </View>
                      <View style={[s.accentLine, { backgroundColor: sc.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[s.subjInline, { color: sc.color }]}>{e.subjectName.toUpperCase()}</Text>
                        <Text style={s.examName}>{e.assessmentTitle}</Text>
                        <Text style={s.examBatch}>{e.className}</Text>
                      </View>
                      <Text style={[s.daysLeft, { color: dl <= 3 ? "#B45309" : D.outline }]}>
                        {dl === 0 ? "Today" : dl === 1 ? "Tomorrow" : `in ${dl}d`}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <OptionSheet
        visible={classSheet}
        title="Select Class"
        options={classes.map((c) => ({ key: c.id, label: c.name }))}
        selectedKey={selectedClassId}
        emptyText="No classes in your scope."
        onSelect={setSelectedClassId}
        onClose={() => setClassSheet(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 16, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },
  pageTitle: { fontSize: 24, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  classPick: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  classPickText: { flex: 1, fontSize: 13, fontFamily: D.fontSemiBold, color: D.onSurface, letterSpacing: -0.1 },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: D.primaryBtn, alignItems: "center", justifyContent: "center" },
  segControl: { flexDirection: "row", padding: 3, borderRadius: 10, backgroundColor: D.surfaceLow },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  segBtnActive: { backgroundColor: D.surface, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segText: { fontSize: 11, fontFamily: D.fontBold, letterSpacing: -0.1 },
  dayChip: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  dayText: { fontSize: 12, fontFamily: D.fontBold },
  sectionLabel: { fontSize: 11, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: D.surface },
  slotTimeBlock: { width: 68, flexShrink: 0 },
  slotTime: { fontSize: 11, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.2 },
  slotHall: { fontSize: 9.5, color: D.outline, marginTop: 3, fontFamily: D.font },
  accentLine: { width: 3, height: 40, borderRadius: 2, flexShrink: 0 },
  slotSubjectTag: { fontSize: 9, fontFamily: D.fontBold, letterSpacing: 0.5, marginBottom: 2 },
  slotSubject: { fontSize: 12, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  slotMeta: { fontSize: 9.5, fontFamily: D.font, color: D.outline, marginTop: 3 },
  teacherLabel: { fontSize: 11, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, flexShrink: 0 },
  examRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
  datePill: { width: 40, alignItems: "center", flexShrink: 0 },
  datePillMon: { fontSize: 9, fontFamily: D.fontBold, letterSpacing: 0.4, textTransform: "uppercase" },
  datePillDay: { fontSize: 16, fontFamily: D.fontExtraBold, letterSpacing: -0.4, lineHeight: 20 },
  subjInline: { fontSize: 9, fontFamily: D.fontBold, letterSpacing: 0.5, marginBottom: 2 },
  examName: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  examBatch: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 1 },
  daysLeft: { fontSize: 12, fontFamily: D.fontBold, flexShrink: 0 },
});
