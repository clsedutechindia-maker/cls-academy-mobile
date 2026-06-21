import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { showAlert } from "../../lib/alert";
import { confirmSessionRequest, rejectSessionRequest, type ScheduleActor } from "../../lib/erp";
import type { SessionSlotRecord } from "../../shared";
import { FieldLabel, TimeField } from "../schedule/scheduleEditorKit";

// Confirm (set time + optional location) / Reject (reason) actions for a pending
// session request. Shared by the office-staff and admin session queues.
export function SessionDecideActions({
  slot,
  actor,
  onDone,
}: {
  slot: SessionSlotRecord;
  actor: ScheduleActor;
  onDone: () => Promise<void> | void;
}) {
  const [mode, setMode] = useState<"confirm" | "reject" | null>(null);
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [locationNote, setLocationNote] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  function close() {
    setMode(null);
    setStartTime("16:00");
    setEndTime("17:00");
    setLocationNote("");
    setReason("");
  }

  async function doConfirm() {
    if (!startTime || !endTime || endTime <= startTime) {
      showAlert("Invalid time", "End must be after start.");
      return;
    }
    setBusy(true);
    try {
      await confirmSessionRequest(slot.id, actor, { startTime, endTime, locationNote });
      close();
      await onDone();
    } catch {
      showAlert("Error", "Could not confirm. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function doReject() {
    if (!reason.trim()) {
      showAlert("Reason needed", "Add a short reason so the student knows why.");
      return;
    }
    setBusy(true);
    try {
      await rejectSessionRequest(slot.id, actor, reason);
      close();
      await onDone();
    } catch {
      showAlert("Error", "Could not reject. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <View style={s.actions}>
        <AnimatedPressable style={[s.btn, s.confirmBtn]} onPress={() => setMode("confirm")}>
          <Ionicons name="checkmark" size={15} color="#fff" />
          <Text style={s.confirmText}>Confirm</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[s.btn, s.rejectBtn]} onPress={() => setMode("reject")}>
          <Ionicons name="close" size={15} color="#B91C1C" />
          <Text style={s.rejectText}>Reject</Text>
        </AnimatedPressable>
      </View>

      <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={s.overlay} onPress={close}>
          <Pressable style={s.sheet} onPress={() => {}}>
            {mode === "confirm" ? (
              <>
                <Text style={s.sheetTitle}>Confirm Session</Text>
                <Text style={s.sheetSub}>{slot.teacherName} · {slot.subjectName}</Text>
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
                <AnimatedPressable style={[s.submit, busy && { opacity: 0.6 }]} onPress={() => void doConfirm()} disabled={busy}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={s.submitText}>{busy ? "Confirming…" : "Confirm Session"}</Text>
                </AnimatedPressable>
              </>
            ) : (
              <>
                <Text style={s.sheetTitle}>Reject Request</Text>
                <Text style={s.sheetSub}>{slot.teacherName} · {slot.subjectName}</Text>
                <FieldLabel>Reason</FieldLabel>
                <TextInput
                  style={[s.input, s.inputMulti, { marginBottom: 16 }]}
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g. Teacher not available that day"
                  placeholderTextColor={D.outline}
                  multiline
                  textAlignVertical="top"
                />
                <AnimatedPressable style={[s.submit, s.submitReject, busy && { opacity: 0.6 }]} onPress={() => void doReject()} disabled={busy}>
                  <Ionicons name="close" size={16} color="#fff" />
                  <Text style={s.submitText}>{busy ? "Rejecting…" : "Reject Request"}</Text>
                </AnimatedPressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  confirmBtn: { backgroundColor: D.primary },
  confirmText: { fontSize: 12, fontFamily: D.fontBold, color: "#fff" },
  rejectBtn: { backgroundColor: D.errorBg },
  rejectText: { fontSize: 12, fontFamily: D.fontBold, color: "#B91C1C" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  sheetTitle: { fontSize: 15, fontFamily: D.fontBold, color: D.onSurface },
  sheetSub: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.primary, marginTop: 4, marginBottom: 14 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
  submit: { height: 52, borderRadius: 18, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  submitReject: { backgroundColor: "#B91C1C" },
  submitText: { fontSize: 13.5, fontFamily: D.fontBold, color: "#fff" },
});
