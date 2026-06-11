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
  bookSessionSlot,
  cancelSessionBooking,
  listOpenSlotsForTeacher,
  listSessionTeachersForStudent,
  listStudentSessions,
  type SessionTeacherOption,
} from "../../lib/erp";
import type { SessionSlotRecord, SessionType } from "../../shared";
import { DropdownButton, OptionSheet, kit } from "../schedule/scheduleEditorKit";
import { STATUS_META, formatSessionWhen, sessionTypeLabel } from "./sessionShared";

export function StudentBookSessionScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [tab, setTab] = useState<"book" | "mine">("book");
  const [teacherKey, setTeacherKey] = useState("");
  const [teacherSheet, setTeacherSheet] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<SessionSlotRecord | null>(null);
  const [sessionType, setSessionType] = useState<SessionType>("doubt");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);

  const teachersRes = useResource(
    async () => (profile ? listSessionTeachersForStudent(profile) : []),
    [profile?.userId, profile?.classId],
  );
  const teachers = teachersRes.data ?? [];

  const selectedTeacher = useMemo<SessionTeacherOption | null>(
    () => teachers.find((t) => `${t.teacherUserId}__${t.subjectId}` === teacherKey) ?? null,
    [teachers, teacherKey],
  );

  const slotsRes = useResource(
    async () => (selectedTeacher ? listOpenSlotsForTeacher(selectedTeacher.teacherUserId) : []),
    [selectedTeacher?.teacherUserId],
  );
  const slots = slotsRes.data ?? [];

  const mineRes = useResource(
    async () => (profile ? listStudentSessions(profile) : []),
    [profile?.userId],
  );
  const mine = mineRes.data ?? [];

  const reloadSlots = slotsRes.reload;
  const reloadMine = mineRes.reload;
  useFocusEffect(useCallback(() => {
    void reloadSlots();
    void reloadMine();
  }, [reloadSlots, reloadMine]));

  async function confirmBooking() {
    if (!bookingSlot || !profile) return;
    if (!topic.trim()) {
      Alert.alert("Missing Info", "Add a short topic / what you need help with.");
      return;
    }
    setBusy(true);
    try {
      await bookSessionSlot({ slot: bookingSlot, sessionType, topic, student: profile });
      setBookingSlot(null);
      setTopic("");
      setSessionType("doubt");
      await slotsRes.reload();
      await mineRes.reload();
      Alert.alert("Requested", "Your session request was sent to the teacher.");
    } catch {
      Alert.alert("Error", "Could not book. The slot may have just been taken.");
    } finally {
      setBusy(false);
    }
  }

  function cancel(slot: SessionSlotRecord) {
    Alert.alert("Cancel Session", "Cancel this session request?", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel it",
        style: "destructive",
        onPress: async () => {
          if (!profile) return;
          setBusy(true);
          try {
            await cancelSessionBooking(slot.id, { userId: profile.userId, name: profile.name || "Student" });
            await mineRes.reload();
            await slotsRes.reload();
          } catch {
            Alert.alert("Error", "Could not cancel. Try again.");
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.title}>Sessions</Text>
        </View>
        <View style={s.seg}>
          {([["book", "Book"], ["mine", "My Sessions"]] as const).map(([k, label]) => (
            <AnimatedPressable key={k} style={[s.segBtn, tab === k && s.segBtnActive]} onPress={() => setTab(k)}>
              <Text style={[s.segText, { color: tab === k ? D.primary : D.onSurfaceVariant }]}>{label}</Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {tab === "book" ? (
          <>
            <Text style={s.label}>Teacher</Text>
            <View style={{ marginBottom: 18 }}>
              <DropdownButton
                value={selectedTeacher ? `${selectedTeacher.teacherName} · ${selectedTeacher.subjectName}` : ""}
                placeholder="Select a teacher"
                onPress={() => setTeacherSheet(true)}
              />
            </View>

            {!selectedTeacher ? (
              <View style={s.empty}>
                <Ionicons name="person-outline" size={30} color={D.outline} />
                <Text style={s.emptyText}>Pick a teacher to see their open slots.</Text>
              </View>
            ) : slotsRes.loading ? (
              <View style={{ padding: 30, alignItems: "center" }}><ActivityIndicator color={D.primary} /></View>
            ) : slots.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="calendar-outline" size={30} color={D.outline} />
                <Text style={s.emptyText}>No open slots from this teacher right now.</Text>
              </View>
            ) : (
              <View style={s.card}>
                {slots.map((slot, i) => (
                  <AnimatedPressable
                    key={slot.id}
                    style={[s.slotRow, i < slots.length - 1 && s.divider]}
                    onPress={() => { setBookingSlot(slot); setSessionType("doubt"); setTopic(""); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={s.slotWhen}>{formatSessionWhen(slot.date, slot.startTime, slot.endTime)}</Text>
                      {slot.locationNote ? <Text style={s.slotMeta}>{slot.locationNote}</Text> : null}
                    </View>
                    <View style={s.bookPill}><Text style={s.bookPillText}>Book</Text></View>
                  </AnimatedPressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {mineRes.loading ? (
              <View style={{ padding: 30, alignItems: "center" }}><ActivityIndicator color={D.primary} /></View>
            ) : mine.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="time-outline" size={30} color={D.outline} />
                <Text style={s.emptyText}>No sessions booked yet.</Text>
              </View>
            ) : (
              mine.map((slot) => {
                const st = STATUS_META[slot.status];
                const canCancel = slot.status === "requested" || slot.status === "confirmed";
                return (
                  <View key={slot.id} style={s.mineCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={s.mineType}>{sessionTypeLabel(slot.sessionType)}</Text>
                      <View style={[s.pill, { backgroundColor: st.bg }]}>
                        <Text style={[s.pillText, { color: st.fg }]}>{st.label}</Text>
                      </View>
                    </View>
                    <Text style={s.mineTeacher}>{slot.teacherName} · {slot.subjectName}</Text>
                    <Text style={s.mineWhen}>{formatSessionWhen(slot.date, slot.startTime, slot.endTime)}</Text>
                    {slot.topic ? <Text style={s.mineTopic}>“{slot.topic}”</Text> : null}
                    {canCancel && (
                      <AnimatedPressable style={s.cancelBtn} onPress={() => cancel(slot)} disabled={busy}>
                        <Text style={s.cancelText}>Cancel</Text>
                      </AnimatedPressable>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      <OptionSheet
        visible={teacherSheet}
        title="Select Teacher"
        options={teachers.map((t) => ({ key: `${t.teacherUserId}__${t.subjectId}`, label: `${t.teacherName} · ${t.subjectName}` }))}
        selectedKey={teacherKey}
        emptyText="No subject teachers found."
        onSelect={setTeacherKey}
        onClose={() => setTeacherSheet(false)}
      />

      {/* Booking modal */}
      <Modal visible={Boolean(bookingSlot)} transparent animationType="fade" onRequestClose={() => setBookingSlot(null)}>
        <Pressable style={s.modalOverlay} onPress={() => setBookingSlot(null)}>
          <Pressable style={s.modalSheet} onPress={() => {}}>
            <Text style={s.modalTitle}>Request Session</Text>
            {bookingSlot ? (
              <Text style={s.modalWhen}>{formatSessionWhen(bookingSlot.date, bookingSlot.startTime, bookingSlot.endTime)}</Text>
            ) : null}
            <Text style={s.label}>Type</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
              {(["doubt", "remedial"] as const).map((t) => (
                <AnimatedPressable
                  key={t}
                  style={[s.typeChip, sessionType === t && s.typeChipActive]}
                  onPress={() => setSessionType(t)}
                >
                  <Text style={[s.typeChipText, sessionType === t && { color: D.primary }]}>
                    {t === "doubt" ? "Doubt" : "Remedial"}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>
            <Text style={s.label}>Topic</Text>
            <TextInput
              style={[s.input, s.inputMulti]}
              value={topic}
              onChangeText={setTopic}
              placeholder="What do you need help with?"
              placeholderTextColor={D.outline}
              multiline
              textAlignVertical="top"
            />
            <AnimatedPressable style={[s.confirmBtn, busy && { opacity: 0.6 }]} onPress={() => void confirmBooking()} disabled={busy}>
              <Ionicons name="paper-plane-outline" size={16} color="#fff" />
              <Text style={s.confirmText}>{busy ? "Sending…" : "Send Request"}</Text>
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
  title: { fontSize: 24, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  seg: { flexDirection: "row", padding: 3, borderRadius: 10, backgroundColor: D.surfaceLow },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  segBtnActive: { backgroundColor: D.surface, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segText: { fontSize: 11.5, fontFamily: D.fontBold, letterSpacing: -0.1 },
  label: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 7 },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  slotWhen: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  slotMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 3 },
  bookPill: { backgroundColor: D.primaryBtn, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  bookPillText: { fontSize: 12, fontFamily: D.fontBold, color: "#fff" },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
  mineCard: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, padding: 14, marginBottom: 10, gap: 4 },
  mineType: { fontSize: 9.5, fontFamily: D.fontBold, color: D.primary, letterSpacing: 0.5, textTransform: "uppercase" },
  mineTeacher: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  mineWhen: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant },
  mineTopic: { fontSize: 12, fontFamily: D.font, color: D.outline, fontStyle: "italic", marginTop: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 10, fontFamily: D.fontBold, letterSpacing: 0.2 },
  cancelBtn: { alignSelf: "flex-start", marginTop: 8, backgroundColor: D.errorBg, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  cancelText: { fontSize: 12, fontFamily: D.fontBold, color: "#B91C1C" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  modalTitle: { fontSize: 15, fontFamily: D.fontBold, color: D.onSurface },
  modalWhen: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.primary, marginTop: 4, marginBottom: 14 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  typeChipActive: { backgroundColor: D.surfaceLow, borderColor: D.primary },
  typeChipText: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium },
  inputMulti: { minHeight: 80, textAlignVertical: "top", marginBottom: 16 },
  confirmBtn: { height: 52, borderRadius: 18, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  confirmText: { fontSize: 13.5, fontFamily: D.fontBold, color: "#fff" },
});
