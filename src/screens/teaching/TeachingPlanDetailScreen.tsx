import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import {
  approveTeachingPlan,
  deleteTeachingPlan,
  getTeachingPlanById,
  rejectTeachingPlan,
  submitTeachingPlan,
} from "../../lib/erp";
import { STATUS_META, formatDayDate, formatWeekRange } from "./teachingPlanShared";
import { exportTeachingPlanPdf } from "./teachingPlanPdf";

export function TeachingPlanDetailScreen() {
  const insets = useSafeAreaInsets();
  const { authUser, profile, adminRecord, role } = useSession();
  const isAdmin = Boolean(adminRecord);
  const isStudent = role === "student";
  const params = useLocalSearchParams<{ id?: string; g?: string }>();
  const planId = typeof params.id === "string" ? params.id : "";
  const group = typeof params.g === "string" ? params.g : "(teacher)";

  const { data: plan, loading, error, reload } = useResource(() => getTeachingPlanById(planId), [planId]);

  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  async function onExport() {
    if (!plan) return;
    setExporting(true);
    try {
      await exportTeachingPlanPdf(plan);
    } catch {
      Alert.alert("Error", "Could not export PDF.");
    } finally {
      setExporting(false);
    }
  }

  const actor = { userId: authUser?.uid ?? "", name: profile?.name || authUser?.displayName || "Staff" };
  const isOwner = !isAdmin && plan?.teacherUserId === authUser?.uid;
  const status = plan ? STATUS_META[plan.status] : null;

  function openEditor() {
    router.push({ pathname: `/${group}/teaching-plan-editor` as never, params: { mode: "edit", id: planId } });
  }

  async function run(action: () => Promise<void>, successMsg: string, goBack = false) {
    setBusy(true);
    try {
      await action();
      if (goBack) {
        Alert.alert("Done", successMsg, [{ text: "OK", onPress: () => navigateBack(router) }]);
      } else {
        await reload();
        Alert.alert("Done", successMsg);
      }
    } catch {
      Alert.alert("Error", "Action failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete Plan", "Delete this draft?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void run(() => deleteTeachingPlan(planId), "Plan deleted.", true) },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={s.navHeader}>
        <View style={[s.navRow, { paddingTop: insets.top + 12 }]}>
          <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.navTitle}>Teaching Plan</Text>
          {plan ? (
            <AnimatedPressable style={s.navBack} onPress={() => void onExport()} disabled={exporting}>
              {exporting ? (
                <ActivityIndicator size="small" color={D.primary} />
              ) : (
                <Ionicons name="download-outline" size={19} color={D.primary} />
              )}
            </AnimatedPressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator color={D.primary} />
        </View>
      ) : error || !plan ? (
        <View style={{ padding: 18 }}>
          <Text style={{ fontFamily: D.font, color: D.error, fontSize: 13 }}>{error ?? "Plan not found."}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
          <View style={s.headerCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Text style={s.subject}>{plan.subjectName}</Text>
              {status && (
                <View style={[s.pill, { backgroundColor: status.bg }]}>
                  <Text style={[s.pillText, { color: status.fg }]}>{status.label}</Text>
                </View>
              )}
            </View>
            <Text style={s.unit}>{plan.unitName || "Weekly Plan"}</Text>
            <Text style={s.metaLine}>{plan.className}</Text>
            <Text style={s.metaLine}>{formatWeekRange(plan.weekStartDate, plan.weekEndDate)}</Text>
            {plan.teacherName ? <Text style={s.metaLine}>Faculty: {plan.teacherName}</Text> : null}
            {plan.classTime ? <Text style={s.metaLine}>Class Time: {plan.classTime}</Text> : null}
          </View>

          {plan.reviewNote && plan.status === "draft" ? (
            <View style={[s.note, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="alert-circle" size={16} color="#B91C1C" />
              <Text style={[s.noteText, { color: "#B91C1C" }]}>Returned by admin: {plan.reviewNote}</Text>
            </View>
          ) : null}

          {plan.rows.map((row, i) => (
            <View key={`${row.date}-${i}`} style={s.dayCard}>
              <View style={s.dayHead}>
                <Text style={s.dayName}>{row.day || "Day"}</Text>
                <Text style={s.dayDate}>{formatDayDate(row.date)}</Text>
              </View>
              <Text style={s.topics}>{row.topics || "—"}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Reject note modal */}
      <Modal visible={rejectOpen} transparent animationType="fade" onRequestClose={() => setRejectOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setRejectOpen(false)}>
          <Pressable style={s.modalSheet} onPress={() => {}}>
            <Text style={s.modalTitle}>Return for changes</Text>
            <TextInput
              style={[s.input, s.inputMulti]}
              value={rejectNote}
              onChangeText={setRejectNote}
              placeholder="What needs fixing?"
              placeholderTextColor={D.outline}
              multiline
              textAlignVertical="top"
            />
            <AnimatedPressable
              style={[s.rejectConfirm, !rejectNote.trim() && { opacity: 0.5 }]}
              disabled={!rejectNote.trim() || busy}
              onPress={() => {
                setRejectOpen(false);
                void run(() => rejectTeachingPlan(planId, actor, rejectNote), "Returned to teacher.");
                setRejectNote("");
              }}
            >
              <Text style={s.rejectConfirmText}>Return to Teacher</Text>
            </AnimatedPressable>
          </Pressable>
        </Pressable>
      </Modal>

      {!loading && plan && !isStudent && (
        <View style={s.actionBar}>
          {isAdmin ? (
            <>
              {plan.status === "submitted" && (
                <AnimatedPressable style={s.rejectBtn} onPress={() => setRejectOpen(true)} disabled={busy}>
                  <Text style={s.rejectText}>Return</Text>
                </AnimatedPressable>
              )}
              <AnimatedPressable style={s.secondaryBtn} onPress={openEditor} disabled={busy}>
                <Ionicons name="create-outline" size={16} color={D.onSurface} />
                <Text style={s.secondaryText}>Edit</Text>
              </AnimatedPressable>
              {plan.status !== "approved" && (
                <AnimatedPressable style={[s.primaryBtn, busy && { opacity: 0.6 }]} onPress={() => void run(() => approveTeachingPlan(planId, actor), "Plan approved.")} disabled={busy}>
                  <Ionicons name="checkmark" size={17} color="#fff" />
                  <Text style={s.primaryText}>Approve</Text>
                </AnimatedPressable>
              )}
            </>
          ) : isOwner ? (
            <>
              {plan.status === "draft" && (
                <AnimatedPressable style={s.iconDanger} onPress={confirmDelete} disabled={busy}>
                  <Ionicons name="trash-outline" size={18} color={D.error} />
                </AnimatedPressable>
              )}
              {plan.status !== "approved" && (
                <AnimatedPressable style={s.secondaryBtn} onPress={openEditor} disabled={busy}>
                  <Ionicons name="create-outline" size={16} color={D.onSurface} />
                  <Text style={s.secondaryText}>Edit</Text>
                </AnimatedPressable>
              )}
              {plan.status === "draft" && (
                <AnimatedPressable style={[s.primaryBtn, busy && { opacity: 0.6 }]} onPress={() => void run(() => submitTeachingPlan(planId, actor), "Submitted for review.")} disabled={busy}>
                  <Ionicons name="paper-plane-outline" size={16} color="#fff" />
                  <Text style={s.primaryText}>Submit</Text>
                </AnimatedPressable>
              )}
              {plan.status === "approved" && (
                <View style={[s.lockNote]}>
                  <Ionicons name="lock-closed" size={15} color="#15803D" />
                  <Text style={s.lockNoteText}>Approved & locked</Text>
                </View>
              )}
            </>
          ) : null}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  navHeader: { backgroundColor: D.bg },
  navRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12 },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
  headerCard: { backgroundColor: D.surface, borderRadius: 16, borderWidth: 1, borderColor: D.outlineVariant, padding: 16, gap: 4, marginBottom: 14 },
  subject: { fontSize: 10, fontFamily: D.fontBold, color: D.primary, letterSpacing: 0.5, textTransform: "uppercase" },
  unit: { fontSize: 17, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3, marginTop: 2 },
  metaLine: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 10.5, fontFamily: D.fontBold, letterSpacing: 0.2 },
  note: { flexDirection: "row", gap: 9, padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 14 },
  noteText: { flex: 1, fontSize: 12, fontFamily: D.fontSemiBold, lineHeight: 17 },
  dayCard: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, padding: 14, marginBottom: 10 },
  dayHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  dayName: { fontSize: 12.5, fontFamily: D.fontBold, color: D.onSurface },
  dayDate: { fontSize: 11, fontFamily: D.font, color: D.outline },
  topics: { fontSize: 13, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 20 },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 96, backgroundColor: D.bg },
  primaryBtn: { flex: 1.4, height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  primaryText: { fontSize: 13.5, fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
  secondaryBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  secondaryText: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface },
  rejectBtn: { width: 80, height: 54, borderRadius: 20, backgroundColor: D.errorBg, alignItems: "center", justifyContent: "center" },
  rejectText: { fontSize: 13, fontFamily: D.fontBold, color: "#B91C1C" },
  iconDanger: { width: 54, height: 54, borderRadius: 20, backgroundColor: D.errorBg, alignItems: "center", justifyContent: "center" },
  lockNote: { flex: 1, height: 54, borderRadius: 20, backgroundColor: "#DCFCE7", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  lockNoteText: { fontSize: 13, fontFamily: D.fontBold, color: "#15803D" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  modalTitle: { fontSize: 15, fontFamily: D.fontBold, color: D.onSurface, marginBottom: 14 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium },
  inputMulti: { minHeight: 90, textAlignVertical: "top", marginBottom: 14 },
  rejectConfirm: { height: 50, borderRadius: 16, backgroundColor: "#B91C1C", alignItems: "center", justifyContent: "center" },
  rejectConfirmText: { fontSize: 13.5, fontFamily: D.fontBold, color: "#fff" },
});
