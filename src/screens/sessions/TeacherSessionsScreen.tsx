import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import {
  completeSession,
  confirmSessionRequest,
  createSessionSlot,
  declineSessionRequest,
  deleteSessionSlot,
  listTeacherMappings,
  listTeacherSessionSlots,
} from "../../lib/erp";
import type { ClassSubjectRecord, SessionSlotRecord } from "../../shared";
import { DateField, DropdownButton, FieldLabel, OptionSheet, TimeField, kit } from "../schedule/scheduleEditorKit";
import { STATUS_META, formatSessionWhen, sessionTypeLabel } from "./sessionShared";

export function TeacherSessionsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [tab, setTab] = useState<"requests" | "slots">("requests");
  const [publishOpen, setPublishOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // publish form
  const [mappingId, setMappingId] = useState("");
  const [subjectSheet, setSubjectSheet] = useState(false);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [locationNote, setLocationNote] = useState("");

  // decline modal
  const [declineSlot, setDeclineSlot] = useState<SessionSlotRecord | null>(null);
  const [declineNote, setDeclineNote] = useState("");

  const slotsRes = useResource(
    async () => (profile ? listTeacherSessionSlots(profile) : []),
    [profile?.userId],
  );
  const mappingsRes = useResource(
    async () => (profile ? listTeacherMappings(profile) : []),
    [profile?.userId],
  );
  const slots = slotsRes.data ?? [];
  const mappings = mappingsRes.data ?? [];
  const selectedMapping = useMemo<ClassSubjectRecord | null>(
    () => mappings.find((m) => m.id === mappingId) ?? null,
    [mappings, mappingId],
  );

  const reloadSlots = slotsRes.reload;
  useFocusEffect(useCallback(() => { void reloadSlots(); }, [reloadSlots]));

  const requests = slots.filter((s) => s.status === "requested" || s.status === "confirmed");
  const mySlots = slots.filter((s) => s.status === "open" || s.status === "completed");
  const actor = { userId: profile?.userId ?? "", name: profile?.name || "Teacher" };

  async function run(fn: () => Promise<void>, ok: string) {
    setBusy(true);
    try {
      await fn();
      await slotsRes.reload();
      if (ok) Alert.alert("Done", ok);
    } catch {
      Alert.alert("Error", "Action failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!selectedMapping) { Alert.alert("Missing Info", "Pick a subject."); return; }
    if (!date) { Alert.alert("Missing Info", "Pick a date."); return; }
    if (!startTime || !endTime || endTime <= startTime) { Alert.alert("Invalid Time", "End must be after start."); return; }
    setBusy(true);
    try {
      await createSessionSlot({
        teacherUserId: selectedMapping.teacherUserId || actor.userId,
        teacherName: selectedMapping.teacherName || actor.name,
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
        actor,
      });
      setPublishOpen(false);
      setDate(""); setLocationNote("");
      await slotsRes.reload();
      Alert.alert("Published", "Slot is now open for students.");
    } catch {
      Alert.alert("Error", "Could not publish. Try again.");
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
          {tab === "slots" && (
            <AnimatedPressable style={s.addBtn} onPress={() => { setPublishOpen(true); setMappingId(mappings[0]?.id ?? ""); }}>
              <Ionicons name="add" size={20} color="#fff" />
            </AnimatedPressable>
          )}
        </View>
        <View style={s.seg}>
          {([["requests", "Requests"], ["slots", "My Slots"]] as const).map(([k, label]) => {
            const count = k === "requests" ? requests.filter((r) => r.status === "requested").length : 0;
            return (
              <AnimatedPressable key={k} style={[s.segBtn, tab === k && s.segBtnActive]} onPress={() => setTab(k)}>
                <Text style={[s.segText, { color: tab === k ? D.primary : D.onSurfaceVariant }]}>
                  {label}{count > 0 ? ` · ${count}` : ""}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {slotsRes.loading && <View style={{ padding: 30, alignItems: "center" }}><ActivityIndicator color={D.primary} /></View>}

        {!slotsRes.loading && tab === "requests" && (
          requests.length === 0 ? (
            <View style={s.empty}><Ionicons name="people-outline" size={30} color={D.outline} /><Text style={s.emptyText}>No session requests.</Text></View>
          ) : (
            requests.map((slot) => {
              const st = STATUS_META[slot.status];
              return (
                <View key={slot.id} style={s.reqCard}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={s.reqType}>{sessionTypeLabel(slot.sessionType)}</Text>
                    <View style={[s.pill, { backgroundColor: st.bg }]}><Text style={[s.pillText, { color: st.fg }]}>{st.label}</Text></View>
                  </View>
                  <Text style={s.reqStudent}>{slot.bookedByName} · {slot.bookedClassName}</Text>
                  <Text style={s.reqWhen}>{formatSessionWhen(slot.date, slot.startTime, slot.endTime)}</Text>
                  {slot.topic ? <Text style={s.reqTopic}>“{slot.topic}”</Text> : null}
                  <View style={s.actionRow}>
                    {slot.status === "requested" ? (
                      <>
                        <AnimatedPressable style={[s.pillBtn, s.rejectPill]} onPress={() => { setDeclineSlot(slot); setDeclineNote(""); }} disabled={busy}>
                          <Ionicons name="close" size={15} color="#B91C1C" />
                          <Text style={[s.pillBtnText, { color: "#B91C1C" }]}>Decline</Text>
                        </AnimatedPressable>
                        <AnimatedPressable style={[s.pillBtn, s.approvePill]} onPress={() => void run(() => confirmSessionRequest(slot.id, actor), "Confirmed.")} disabled={busy}>
                          <Ionicons name="checkmark" size={15} color="#fff" />
                          <Text style={[s.pillBtnText, { color: "#fff" }]}>Accept</Text>
                        </AnimatedPressable>
                      </>
                    ) : (
                      <AnimatedPressable style={[s.pillBtn, s.completePill]} onPress={() => void run(() => completeSession(slot.id, actor), "Marked complete.")} disabled={busy}>
                        <Ionicons name="checkmark-done" size={15} color={D.primary} />
                        <Text style={[s.pillBtnText, { color: D.primary }]}>Mark complete</Text>
                      </AnimatedPressable>
                    )}
                  </View>
                </View>
              );
            })
          )
        )}

        {!slotsRes.loading && tab === "slots" && (
          mySlots.length === 0 ? (
            <View style={s.empty}><Ionicons name="calendar-outline" size={30} color={D.outline} /><Text style={s.emptyText}>No slots yet. Tap + to publish availability.</Text></View>
          ) : (
            <View style={s.card}>
              {mySlots.map((slot, i) => {
                const st = STATUS_META[slot.status];
                return (
                  <View key={slot.id} style={[s.slotRow, i < mySlots.length - 1 && s.divider]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.slotWhen}>{formatSessionWhen(slot.date, slot.startTime, slot.endTime)}</Text>
                      <Text style={s.slotMeta}>{slot.subjectName}{slot.locationNote ? ` · ${slot.locationNote}` : ""}</Text>
                    </View>
                    <View style={[s.pill, { backgroundColor: st.bg }]}><Text style={[s.pillText, { color: st.fg }]}>{st.label}</Text></View>
                    {slot.status === "open" && (
                      <AnimatedPressable style={s.delBtn} onPress={() => void run(() => deleteSessionSlot(slot.id), "")} disabled={busy}>
                        <Ionicons name="trash-outline" size={16} color={D.error} />
                      </AnimatedPressable>
                    )}
                  </View>
                );
              })}
            </View>
          )
        )}
      </ScrollView>

      {/* Publish slot modal */}
      <Modal visible={publishOpen} transparent animationType="fade" onRequestClose={() => setPublishOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setPublishOpen(false)}>
          <Pressable style={s.modalSheet} onPress={() => {}}>
            <Text style={s.modalTitle}>Publish a Slot</Text>
            <FieldLabel>Subject</FieldLabel>
            <View style={{ marginBottom: 14 }}>
              <DropdownButton
                value={selectedMapping ? `${selectedMapping.className} · ${selectedMapping.subjectName}` : ""}
                placeholder="Select subject"
                onPress={() => setSubjectSheet(true)}
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
            <AnimatedPressable style={[s.confirmBtn, busy && { opacity: 0.6 }]} onPress={() => void publish()} disabled={busy}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={s.confirmText}>{busy ? "Publishing…" : "Publish Slot"}</Text>
            </AnimatedPressable>
          </Pressable>
        </Pressable>
      </Modal>

      <OptionSheet
        visible={subjectSheet}
        title="Select Subject"
        options={mappings.map((m) => ({ key: m.id, label: `${m.className} · ${m.subjectName}` }))}
        selectedKey={mappingId}
        emptyText="No subjects assigned."
        onSelect={setMappingId}
        onClose={() => setSubjectSheet(false)}
      />

      {/* Decline modal */}
      <Modal visible={Boolean(declineSlot)} transparent animationType="fade" onRequestClose={() => setDeclineSlot(null)}>
        <Pressable style={s.modalOverlay} onPress={() => setDeclineSlot(null)}>
          <Pressable style={s.modalSheet} onPress={() => {}}>
            <Text style={s.modalTitle}>Decline Request</Text>
            <Text style={s.declineHint}>Slot reopens for others. Add an optional reason.</Text>
            <TextInput
              style={[s.input, s.inputMulti]}
              value={declineNote}
              onChangeText={setDeclineNote}
              placeholder="Reason (optional)"
              placeholderTextColor={D.outline}
              multiline
              textAlignVertical="top"
            />
            <AnimatedPressable
              style={s.declineConfirm}
              disabled={busy}
              onPress={() => {
                const slot = declineSlot;
                setDeclineSlot(null);
                if (slot) void run(() => declineSessionRequest(slot.id, actor, declineNote), "Declined.");
              }}
            >
              <Text style={s.declineConfirmText}>Decline</Text>
            </AnimatedPressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 24, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: D.primaryBtn, alignItems: "center", justifyContent: "center" },
  seg: { flexDirection: "row", padding: 3, borderRadius: 10, backgroundColor: D.surfaceLow },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  segBtnActive: { backgroundColor: D.surface, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segText: { fontSize: 11.5, fontFamily: D.fontBold, letterSpacing: -0.1 },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  slotWhen: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  slotMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 3 },
  delBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: D.errorBg, alignItems: "center", justifyContent: "center" },
  reqCard: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, padding: 14, marginBottom: 10, gap: 4 },
  reqType: { fontSize: 9.5, fontFamily: D.fontBold, color: D.primary, letterSpacing: 0.5, textTransform: "uppercase" },
  reqStudent: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  reqWhen: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant },
  reqTopic: { fontSize: 12, fontFamily: D.font, color: D.outline, fontStyle: "italic", marginTop: 2 },
  actionRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 10 },
  pillBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 99 },
  approvePill: { backgroundColor: D.success },
  rejectPill: { backgroundColor: "#FEE2E2" },
  completePill: { backgroundColor: D.surfaceLow },
  pillBtnText: { fontSize: 12, fontFamily: D.fontBold },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 10, fontFamily: D.fontBold, letterSpacing: 0.2 },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  modalTitle: { fontSize: 15, fontFamily: D.fontBold, color: D.onSurface, marginBottom: 14 },
  declineHint: { fontSize: 12, fontFamily: D.font, color: D.outline, marginBottom: 12 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium },
  inputMulti: { minHeight: 80, textAlignVertical: "top", marginBottom: 14 },
  confirmBtn: { height: 52, borderRadius: 18, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  confirmText: { fontSize: 13.5, fontFamily: D.fontBold, color: "#fff" },
  declineConfirm: { height: 50, borderRadius: 16, backgroundColor: "#B91C1C", alignItems: "center", justifyContent: "center" },
  declineConfirmText: { fontSize: 13.5, fontFamily: D.fontBold, color: "#fff" },
});
