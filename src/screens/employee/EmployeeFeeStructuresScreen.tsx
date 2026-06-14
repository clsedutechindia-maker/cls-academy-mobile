import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { showAlert } from "../../lib/alert";
import { listEmployeeClasses } from "../../lib/erp";
import {
  listFeeStructures,
  upsertFeeStructure,
  deleteFeeStructure,
  assignFeeStructureToClass,
  type FeeInstallmentPlan,
  type FeeStructureRecord,
} from "../../lib/fees";

const money = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

type DraftInstallment = { label: string; amount: string; dueDateIso: string };

export function EmployeeFeeStructuresScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const { data, loading, error, reload } = useResource(
    async () => {
      if (!profile) return { structures: [] as FeeStructureRecord[], classes: [] as { id: string; name: string }[] };
      const [structures, classes] = await Promise.all([listFeeStructures(profile), listEmployeeClasses(profile)]);
      return { structures, classes: classes.map((c) => ({ id: c.id, name: c.name })) };
    },
    [profile?.userId],
  );

  const structures = data?.structures ?? [];
  const classes = data?.classes ?? [];

  const [editorOpen, setEditorOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [classId, setClassId] = useState("");
  const [installments, setInstallments] = useState<DraftInstallment[]>([{ label: "Installment 1", amount: "", dueDateIso: "" }]);
  const [saving, setSaving] = useState(false);

  function openEditor() {
    setTitle("");
    setAcademicYear("");
    setClassId(classes[0]?.id ?? "");
    setInstallments([{ label: "Installment 1", amount: "", dueDateIso: "" }]);
    setEditorOpen(true);
  }

  function addInstallment() {
    setInstallments((cur) => [...cur, { label: `Installment ${cur.length + 1}`, amount: "", dueDateIso: "" }]);
  }

  function updateInstallment(idx: number, key: keyof DraftInstallment, value: string) {
    setInstallments((cur) => cur.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  }

  function removeInstallment(idx: number) {
    setInstallments((cur) => (cur.length > 1 ? cur.filter((_, i) => i !== idx) : cur));
  }

  const draftTotal = installments.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  async function handleSave() {
    if (!profile) return;
    const cls = classes.find((c) => c.id === classId);
    if (!title.trim()) { showAlert("Title required", "Give the fee plan a title."); return; }
    if (!cls) { showAlert("Class required", "Pick a class for this plan."); return; }
    const plans: FeeInstallmentPlan[] = installments
      .filter((it) => Number(it.amount) > 0)
      .map((it) => ({ label: it.label.trim() || "Installment", amount: Number(it.amount), dueDateIso: it.dueDateIso.trim() }));
    if (plans.length === 0) { showAlert("Add installments", "Add at least one installment with an amount."); return; }

    setSaving(true);
    try {
      await upsertFeeStructure(profile, { classId: cls.id, className: cls.name, title: title.trim(), academicYear: academicYear.trim(), installments: plans });
      setEditorOpen(false);
      await reload();
      showAlert("Saved", "Fee plan created. Use 'Assign' to apply it to the batch.");
    } catch (e) {
      showAlert("Save failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAssign(structure: FeeStructureRecord) {
    if (!profile) return;
    try {
      const count = await assignFeeStructureToClass(profile, structure);
      showAlert("Assigned", count > 0 ? `Applied to ${count} new student${count !== 1 ? "s" : ""}.` : "All students in this batch already have this plan.");
    } catch (e) {
      showAlert("Assign failed", e instanceof Error ? e.message : "Try again.");
    }
  }

  function confirmDelete(structure: FeeStructureRecord) {
    showAlert("Delete fee plan", `Delete "${structure.title}"? Existing student fee records stay intact.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteFeeStructure(structure.id);
            await reload();
          } catch (e) {
            showAlert("Delete failed", e instanceof Error ? e.message : "Try again.");
          }
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <View style={[s.header, { paddingTop: insets.top + 16 }]}>
          <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.headerTitle}>Fee Plans</Text>
          <AnimatedPressable style={s.backBtn} onPress={openEditor}>
            <Ionicons name="add" size={22} color={D.primary} />
          </AnimatedPressable>
        </View>

        <View style={{ paddingHorizontal: 18 }}>
          {loading && <View style={[s.card, s.pad, { alignItems: "center" }]}><Text style={s.muted}>Loading…</Text></View>}
          {error && <View style={[s.card, s.pad]}><Text style={{ color: "#B91C1C", fontFamily: D.font, fontSize: 13 }}>{error}</Text></View>}
          {!loading && !error && structures.length === 0 && (
            <View style={[s.card, s.pad, { alignItems: "center" }]}>
              <Text style={s.muted}>No fee plans yet. Tap + to create one.</Text>
            </View>
          )}
          {structures.map((st) => (
            <View key={st.id} style={[s.card, s.pad, { marginBottom: 12 }]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={s.stTitle}>{st.title}</Text>
                  <Text style={s.stMeta}>{st.className}{st.academicYear ? ` · ${st.academicYear}` : ""} · {st.installments.length} installment{st.installments.length !== 1 ? "s" : ""}</Text>
                </View>
                <Text style={s.stTotal}>{money(st.totalAmount)}</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                <AnimatedPressable style={[s.actionBtn, { flex: 1 }]} onPress={() => handleAssign(st)}>
                  <Ionicons name="people-outline" size={16} color="#fff" />
                  <Text style={s.actionBtnText}>Assign to batch</Text>
                </AnimatedPressable>
                <Pressable style={s.deleteBtn} onPress={() => confirmDelete(st)}>
                  <Ionicons name="trash-outline" size={17} color="#B91C1C" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={editorOpen} transparent animationType="slide" onRequestClose={() => setEditorOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setEditorOpen(false)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.sheetTitle}>New Fee Plan</Text>

              <Text style={s.fieldLabel}>Title</Text>
              <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="e.g. Annual Tuition 2026" placeholderTextColor={D.outline} />

              <Text style={s.fieldLabel}>Academic Year (optional)</Text>
              <TextInput style={s.input} value={academicYear} onChangeText={setAcademicYear} placeholder="2026-27" placeholderTextColor={D.outline} />

              <Text style={s.fieldLabel}>Batch</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {classes.length === 0 && <Text style={s.muted}>No classes in your centre.</Text>}
                {classes.map((c) => {
                  const active = classId === c.id;
                  return (
                    <AnimatedPressable key={c.id} style={[s.modeChip, active && s.modeChipActive]} onPress={() => setClassId(c.id)}>
                      <Text style={[s.modeChipText, active && { color: "#fff" }]}>{c.name}</Text>
                    </AnimatedPressable>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
                <Text style={s.fieldLabel}>Installments · total {money(draftTotal)}</Text>
                <Pressable onPress={addInstallment}><Text style={s.addLink}>+ Add</Text></Pressable>
              </View>
              {installments.map((it, idx) => (
                <View key={idx} style={s.instCard}>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <TextInput style={[s.input, { flex: 1 }]} value={it.label} onChangeText={(v) => updateInstallment(idx, "label", v)} placeholder="Label" placeholderTextColor={D.outline} />
                    {installments.length > 1 && (
                      <Pressable style={s.deleteBtn} onPress={() => removeInstallment(idx)}>
                        <Ionicons name="close" size={17} color="#B91C1C" />
                      </Pressable>
                    )}
                  </View>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <TextInput style={[s.input, { flex: 1 }]} value={it.amount} onChangeText={(v) => updateInstallment(idx, "amount", v)} keyboardType="numeric" placeholder="Amount ₹" placeholderTextColor={D.outline} />
                    <TextInput style={[s.input, { flex: 1 }]} value={it.dueDateIso} onChangeText={(v) => updateInstallment(idx, "dueDateIso", v)} placeholder="Due YYYY-MM-DD" placeholderTextColor={D.outline} />
                  </View>
                </View>
              ))}

              <AnimatedPressable style={[s.actionBtn, { marginTop: 18, justifyContent: "center" }, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                    <Text style={s.actionBtnText}>Save Fee Plan</Text>
                  </>
                )}
              </AnimatedPressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  headerTitle: { fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  card: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant },
  pad: { padding: 16 },
  muted: { fontSize: 13, fontFamily: D.font, color: D.outline },
  stTitle: { fontSize: 14, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.2 },
  stMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 3 },
  stTotal: { fontSize: 14, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.primary },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: D.primary, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14 },
  actionBtnText: { color: "#fff", fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold },
  deleteBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: "88%" },
  sheetTitle: { fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginBottom: 8 },
  fieldLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.3, marginBottom: 8, marginTop: 14 },
  addLink: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  input: { borderWidth: 1, borderColor: D.outlineVariant, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, fontFamily: D.fontMedium, color: D.onSurface, backgroundColor: D.surface },
  instCard: { backgroundColor: D.surfaceLow, borderRadius: 12, padding: 12, marginTop: 10 },
  modeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  modeChipActive: { backgroundColor: D.primary, borderColor: D.primary },
  modeChipText: { fontSize: 12, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
});
