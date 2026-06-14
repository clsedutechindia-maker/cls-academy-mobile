import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import {
  createSessionSlot,
  deleteSessionSlot,
  listEmployeeMappings,
  listEmployeeSessionSlots,
} from "../../lib/erp";
import { showAlert } from "../../lib/alert";
import type { ClassSubjectRecord, SessionSlotStatus } from "../../shared";
import { DateField, DropdownButton, FieldLabel, OptionSheet, TimeField } from "../schedule/scheduleEditorKit";
import { STATUS_META, formatSessionWhen, sessionTypeLabel } from "./sessionShared";

const FILTERS: { key: SessionSlotStatus | "all"; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "confirmed", label: "Booked" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

export function EmployeeSessionsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [filter, setFilter] = useState<SessionSlotStatus | "all">("open");
  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // create form
  const [mappingId, setMappingId] = useState("");
  const [teacherSheet, setTeacherSheet] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [locationNote, setLocationNote] = useState("");

  const slotsRes = useResource(
    async () => (profile ? listEmployeeSessionSlots(profile) : []),
    [profile?.userId, profile?.centreId],
  );
  const mappingsRes = useResource(
    async () => (profile ? listEmployeeMappings(profile) : []),
    [profile?.userId],
  );

  const slots = slotsRes.data ?? [];
  const mappings = mappingsRes.data ?? [];

  const uniqueTeacherMappings = useMemo<ClassSubjectRecord[]>(() => {
    const seen = new Set<string>();
    return mappings.filter((m) => {
      if (!m.teacherUserId) return false;
      const key = `${m.teacherUserId}__${m.subjectId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [mappings]);

  const selectedMapping = useMemo<ClassSubjectRecord | null>(
    () => uniqueTeacherMappings.find((m) => m.id === mappingId) ?? null,
    [uniqueTeacherMappings, mappingId],
  );

  useFocusEffect(useCallback(() => { void slotsRes.reload(); }, [slotsRes.reload]));

  const shown = filter === "all" ? slots : slots.filter((s) => s.status === filter);

  function openCreate() {
    setMappingId(uniqueTeacherMappings[0]?.id ?? "");
    setDate("");
    setStartTime("16:00");
    setEndTime("17:00");
    setLocationNote("");
    setCreateOpen(true);
  }

  async function handleCreate() {
    if (!selectedMapping) { showAlert("Missing Info", "Pick a teacher/subject."); return; }
    if (!date) { showAlert("Missing Info", "Pick a date."); return; }
    if (!startTime || !endTime || endTime <= startTime) { showAlert("Invalid Time", "End must be after start."); return; }
    if (!profile) return;
    setBusy(true);
    try {
      await createSessionSlot({
        teacherUserId: selectedMapping.teacherUserId || "",
        teacherName: selectedMapping.teacherName || "",
        subjectId: selectedMapping.subjectId,
        subjectName: selectedMapping.subjectName,
        centreId: selectedMapping.centreId,
        centreName: selectedMapping.centreName,
        regionId: selectedMapping.regionId,
        regionName: selectedMapping.regionName,
        date,
        startTime,
        endTime,
        locationNote,
        actor: { userId: profile.userId, name: profile.name || "Employee" },
      });
      setCreateOpen(false);
      await slotsRes.reload();
      showAlert("Created", "Session slot is now open for students.");
    } catch {
      showAlert("Error", "Could not create slot. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await deleteSessionSlot(id);
      await slotsRes.reload();
    } catch {
      showAlert("Error", "Could not delete slot.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.title}>Sessions</Text>
          <AnimatedPressable style={s.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={20} color="#fff" />
          </AnimatedPressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          {FILTERS.map((f) => {
            const active = f.key === filter;
            const count = f.key === "all" ? slots.length : slots.filter((x) => x.status === f.key).length;
            return (
              <AnimatedPressable
                key={f.key}
                style={[s.chip, { backgroundColor: active ? D.primary : D.surface, borderColor: active ? D.primary : D.outlineVariant }]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[s.chipText, { color: active ? "#fff" : D.onSurfaceVariant }]}>{f.label} · {count}</Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {slotsRes.loading && <View style={{ padding: 30, alignItems: "center" }}><ActivityIndicator color={D.primary} /></View>}
        {!slotsRes.loading && shown.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="time-outline" size={30} color={D.outline} />
            <Text style={s.emptyText}>No sessions here. Tap + to create a slot.</Text>
          </View>
        )}
        {shown.map((slot) => {
          const st = STATUS_META[slot.status];
          const booked = !!slot.bookedByName;
          return (
            <View key={slot.id} style={s.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={s.cardType}>{booked ? sessionTypeLabel(slot.sessionType) : "Open Slot"}</Text>
                <View style={[s.pill, { backgroundColor: st.bg }]}>
                  <Text style={[s.pillText, { color: st.fg }]}>{st.label}</Text>
                </View>
              </View>
              <Text style={s.cardTeacher}>{slot.teacherName} · {slot.subjectName}</Text>
              {booked && <Text style={s.cardStudent}>Student: {slot.bookedByName} · {slot.bookedClassName}</Text>}
              <Text style={s.cardWhen}>{formatSessionWhen(slot.date, slot.startTime, slot.endTime)}</Text>
              {slot.topic ? <Text style={s.cardTopic}>"{slot.topic}"</Text> : null}
              {slot.status === "open" && (
                <AnimatedPressable style={s.delBtn} onPress={() => void handleDelete(slot.id)} disabled={busy}>
                  <Ionicons name="trash-outline" size={14} color={D.error} />
                  <Text style={s.delText}>Delete</Text>
                </AnimatedPressable>
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setCreateOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <Text style={s.sheetTitle}>Create Session Slot</Text>

            <FieldLabel>Teacher / Subject</FieldLabel>
            <View style={{ marginBottom: 14 }}>
              <DropdownButton
                value={selectedMapping ? `${selectedMapping.teacherName} · ${selectedMapping.subjectName}` : ""}
                placeholder="Select teacher & subject"
                onPress={() => setTeacherSheet(true)}
              />
            </View>

            <FieldLabel>Date</FieldLabel>
            <View style={{ marginBottom: 14 }}><DateField value={date} onChange={setDate} /></View>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1 }}><FieldLabel>Start</FieldLabel><TimeField value={startTime} onChange={setStartTime} /></View>
              <View style={{ flex: 1 }}><FieldLabel>End</FieldLabel><TimeField value={endTime} onChange={setEndTime} /></View>
            </View>

            <FieldLabel>Location / Link (optional)</FieldLabel>
            <TextInput
              style={[s.input, { marginBottom: 16 }]}
              value={locationNote}
              onChangeText={setLocationNote}
              placeholder="e.g. Room 3 / Google Meet link"
              placeholderTextColor={D.outline}
            />

            <AnimatedPressable style={[s.createBtn, busy && { opacity: 0.6 }]} onPress={() => void handleCreate()} disabled={busy}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={s.createBtnText}>{busy ? "Creating…" : "Create Slot"}</Text>
            </AnimatedPressable>
          </Pressable>
        </Pressable>
      </Modal>

      <OptionSheet
        visible={teacherSheet}
        title="Teacher / Subject"
        options={uniqueTeacherMappings.map((m) => ({ key: m.id, label: `${m.teacherName} · ${m.subjectName}` }))}
        selectedKey={mappingId}
        emptyText="No teacher mappings for this centre."
        onSelect={setMappingId}
        onClose={() => setTeacherSheet(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 24, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: D.primaryBtn, alignItems: "center", justifyContent: "center" },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: D.fontBold },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, padding: 14, marginBottom: 10, gap: 4 },
  cardType: { fontSize: 9.5, fontFamily: D.fontBold, color: D.primary, letterSpacing: 0.5, textTransform: "uppercase" },
  cardTeacher: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  cardStudent: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant },
  cardWhen: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant },
  cardTopic: { fontSize: 12, fontFamily: D.font, color: D.outline, fontStyle: "italic", marginTop: 2 },
  delBtn: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", marginTop: 10, backgroundColor: D.errorBg, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  delText: { fontSize: 12, fontFamily: D.fontBold, color: D.error },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 10, fontFamily: D.fontBold, letterSpacing: 0.2 },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  sheetTitle: { fontSize: 15, fontFamily: D.fontBold, color: D.onSurface, marginBottom: 14 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium },
  createBtn: { height: 52, borderRadius: 18, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  createBtnText: { fontSize: 13.5, fontFamily: D.fontBold, color: "#fff" },
});
