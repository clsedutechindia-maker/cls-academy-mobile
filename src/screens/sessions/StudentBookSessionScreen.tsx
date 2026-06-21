import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { showAlert } from "../../lib/alert";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import {
  cancelSessionRequest,
  createSessionRequest,
  listSessionTeachersForStudent,
  listStudentSessions,
  type SessionTeacherOption,
} from "../../lib/erp";
import type { SessionSlotRecord, SessionType } from "../../shared";
import { DateField, DropdownButton, OptionSheet, dateToValue } from "../schedule/scheduleEditorKit";
import { STATUS_META, formatRequestWhen, sessionTypeLabel } from "./sessionShared";

export function StudentBookSessionScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [tab, setTab] = useState<"book" | "mine">("book");
  const [teacherKey, setTeacherKey] = useState("");
  const [teacherSheet, setTeacherSheet] = useState(false);
  const [date, setDate] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("doubt");
  const [topic, setTopic] = useState("");
  const [busy, setBusy] = useState(false);

  const today = dateToValue(new Date());

  const teachersRes = useResource(
    async () => (profile ? listSessionTeachersForStudent(profile) : []),
    [profile?.userId, profile?.classId],
  );
  const teachers = teachersRes.data ?? [];

  const selectedTeacher = useMemo<SessionTeacherOption | null>(
    () => teachers.find((t) => `${t.teacherUserId}__${t.subjectId}` === teacherKey) ?? null,
    [teachers, teacherKey],
  );

  const mineRes = useResource(
    async () => (profile ? listStudentSessions(profile) : []),
    [profile?.userId],
  );
  const mine = mineRes.data ?? [];

  const reloadMine = mineRes.reload;
  useFocusEffect(useCallback(() => { void reloadMine(); }, [reloadMine]));

  async function submitRequest() {
    if (!profile) return;
    if (!selectedTeacher) {
      showAlert("Pick a teacher", "Choose which teacher you want a session with.");
      return;
    }
    if (!date) {
      showAlert("Pick a date", "Choose a preferred date for your session.");
      return;
    }
    if (!topic.trim()) {
      showAlert("Missing topic", "Add a short note on what you need help with.");
      return;
    }
    setBusy(true);
    try {
      await createSessionRequest({ teacher: selectedTeacher, date, sessionType, topic, student: profile });
      setTeacherKey("");
      setDate("");
      setTopic("");
      setSessionType("doubt");
      await mineRes.reload();
      setTab("mine");
      showAlert("Request sent", "Office staff will confirm a time or get back to you.");
    } catch {
      showAlert("Error", "Could not send the request. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function cancel(slot: SessionSlotRecord) {
    showAlert("Cancel request", "Cancel this session request?", [
      { text: "Keep", style: "cancel" },
      {
        text: "Cancel it",
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await cancelSessionRequest(slot.id);
            await mineRes.reload();
          } catch {
            showAlert("Error", "Could not cancel. Try again.");
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
          {([["book", "Request"], ["mine", "My Sessions"]] as const).map(([k, label]) => (
            <AnimatedPressable key={k} style={[s.segBtn, tab === k && s.segBtnActive]} onPress={() => setTab(k)}>
              <Text style={[s.segText, { color: tab === k ? D.primary : D.onSurfaceVariant }]}>{label}</Text>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {tab === "book" ? (
          <>
            <View style={s.note}>
              <Ionicons name="information-circle-outline" size={18} color={D.primary} />
              <Text style={s.noteText}>Request a session with any of your teachers. Office staff confirm the exact time or reply with a reason.</Text>
            </View>

            <Text style={s.label}>Teacher</Text>
            <View style={{ marginBottom: 16 }}>
              <DropdownButton
                value={selectedTeacher ? `${selectedTeacher.teacherName} · ${selectedTeacher.subjectName}` : ""}
                placeholder={teachersRes.loading ? "Loading teachers…" : "Select a teacher"}
                onPress={() => teachers.length > 0 && setTeacherSheet(true)}
              />
            </View>

            <Text style={s.label}>Preferred date</Text>
            <View style={{ marginBottom: 16 }}>
              <DateField value={date} onChange={setDate} minDate={today} />
            </View>

            <Text style={s.label}>Type</Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
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

            <AnimatedPressable style={[s.confirmBtn, busy && { opacity: 0.6 }]} onPress={() => void submitRequest()} disabled={busy}>
              <Ionicons name="paper-plane-outline" size={16} color="#fff" />
              <Text style={s.confirmText}>{busy ? "Sending…" : "Send Request"}</Text>
            </AnimatedPressable>
          </>
        ) : (
          <>
            {mineRes.loading ? (
              <View style={{ padding: 30, alignItems: "center" }}><ActivityIndicator color={D.primary} /></View>
            ) : mine.length === 0 ? (
              <View style={s.empty}>
                <Ionicons name="time-outline" size={30} color={D.outline} />
                <Text style={s.emptyText}>No session requests yet.</Text>
              </View>
            ) : (
              mine.map((slot) => {
                const st = STATUS_META[slot.status];
                const canCancel = slot.status === "requested";
                return (
                  <View key={slot.id} style={s.mineCard}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Text style={s.mineType}>{sessionTypeLabel(slot.sessionType)}</Text>
                      <View style={[s.pill, { backgroundColor: st.bg }]}>
                        <Text style={[s.pillText, { color: st.fg }]}>{st.label}</Text>
                      </View>
                    </View>
                    <Text style={s.mineTeacher}>{slot.teacherName} · {slot.subjectName}</Text>
                    <Text style={s.mineWhen}>{formatRequestWhen(slot.date, slot.startTime, slot.endTime)}</Text>
                    {slot.locationNote ? <Text style={s.mineMeta}>{slot.locationNote}</Text> : null}
                    {slot.topic ? <Text style={s.mineTopic}>“{slot.topic}”</Text> : null}
                    {slot.status === "rejected" && slot.declineNote ? (
                      <Text style={s.rejectNote}>Reason: {slot.declineNote}</Text>
                    ) : null}
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
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  seg: { flexDirection: "row", padding: 3, borderRadius: 10, backgroundColor: D.surfaceLow },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  segBtnActive: { backgroundColor: D.surface, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segText: { fontSize: 11.5, fontFamily: D.fontBold, letterSpacing: -0.1 },
  note: { flexDirection: "row", gap: 9, alignItems: "flex-start", backgroundColor: D.surfaceLow, borderRadius: 12, padding: 12, marginBottom: 18 },
  noteText: { flex: 1, fontSize: 11.5, lineHeight: 17, fontFamily: D.font, color: D.onSurfaceVariant },
  label: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 7 },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
  mineCard: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, padding: 14, marginBottom: 10, gap: 4 },
  mineType: { fontSize: 9.5, fontFamily: D.fontBold, color: D.primary, letterSpacing: 0.5, textTransform: "uppercase" },
  mineTeacher: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  mineWhen: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant },
  mineMeta: { fontSize: 11, fontFamily: D.font, color: D.outline },
  mineTopic: { fontSize: 12, fontFamily: D.font, color: D.outline, fontStyle: "italic", marginTop: 2 },
  rejectNote: { fontSize: 12, fontFamily: D.fontMedium, color: "#B91C1C", marginTop: 4 },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 10, fontFamily: D.fontBold, letterSpacing: 0.2 },
  cancelBtn: { alignSelf: "flex-start", marginTop: 8, backgroundColor: D.errorBg, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  cancelText: { fontSize: 12, fontFamily: D.fontBold, color: "#B91C1C" },
  typeChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  typeChipActive: { backgroundColor: D.surfaceLow, borderColor: D.primary },
  typeChipText: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium },
  inputMulti: { minHeight: 80, textAlignVertical: "top", marginBottom: 18 },
  confirmBtn: { height: 52, borderRadius: 18, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  confirmText: { fontSize: 13.5, fontFamily: D.fontBold, color: "#fff" },
});
