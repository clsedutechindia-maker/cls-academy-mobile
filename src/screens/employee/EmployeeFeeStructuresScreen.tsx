import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useMemo, useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { DateField, dateToValue } from "../schedule/scheduleEditorKit";
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

const FREQUENCIES: { label: string; months: number }[] = [
  { label: "Monthly", months: 1 },
  { label: "Every 2 months", months: 2 },
  { label: "Quarterly", months: 3 },
  { label: "Half-yearly", months: 6 },
];

// Add `months` to a YYYY-MM-DD date, clamping day-of-month overflow (e.g. Jan 31
// + 1 month → Feb 28, not Mar 3).
function addMonthsIso(iso: string, months: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const d = new Date(`${iso}T00:00:00`);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return dateToValue(d);
}

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
  const [totalAmount, setTotalAmount] = useState("");
  const [count, setCount] = useState(3);
  const [firstDueIso, setFirstDueIso] = useState("");
  const [intervalMonths, setIntervalMonths] = useState(1);
  const [installments, setInstallments] = useState<DraftInstallment[]>([]);
  const [saving, setSaving] = useState(false);

  function openEditor() {
    setTitle("");
    setAcademicYear("");
    setClassId(classes[0]?.id ?? "");
    setTotalAmount("");
    setCount(3);
    setFirstDueIso("");
    setIntervalMonths(1);
    setInstallments([]);
    setEditorOpen(true);
  }

  // Auto-generate installments whenever the inputs change: split the total evenly
  // (remainder lands on the last one) and space due dates by the chosen interval.
  useEffect(() => {
    if (!editorOpen) return;
    const total = Math.max(0, Math.round(Number(totalAmount) || 0));
    const n = Math.max(1, Math.min(60, Math.floor(count) || 1));
    const base = Math.floor(total / n);
    const remainder = total - base * n;
    const rows: DraftInstallment[] = Array.from({ length: n }, (_, i) => ({
      label: `Installment ${i + 1}`,
      amount: String(base + (i === n - 1 ? remainder : 0)),
      dueDateIso: firstDueIso ? addMonthsIso(firstDueIso, i * intervalMonths) : "",
    }));
    setInstallments(rows);
  }, [editorOpen, totalAmount, count, firstDueIso, intervalMonths]);

  function updateDueDate(idx: number, value: string) {
    setInstallments((cur) => cur.map((it, i) => (i === idx ? { ...it, dueDateIso: value } : it)));
  }

  const draftTotal = useMemo(
    () => installments.reduce((sum, it) => sum + (Number(it.amount) || 0), 0),
    [installments],
  );

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
      showAlert(
        "Drafts created",
        count > 0
          ? `Draft fees added for ${count} student${count !== 1 ? "s" : ""}. Open Fees to add discounts and publish each one.`
          : "All students in this batch already have this plan.",
      );
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

              <Text style={s.fieldLabel}>Total Amount</Text>
              <TextInput style={s.input} value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" placeholder="e.g. 60000" placeholderTextColor={D.outline} />

              <Text style={s.fieldLabel}>Number of Installments</Text>
              <View style={s.stepperRow}>
                <Pressable style={s.stepperBtn} onPress={() => setCount((c) => Math.max(1, c - 1))}>
                  <Ionicons name="remove" size={20} color={D.primary} />
                </Pressable>
                <Text style={s.stepperValue}>{count}</Text>
                <Pressable style={s.stepperBtn} onPress={() => setCount((c) => Math.min(60, c + 1))}>
                  <Ionicons name="add" size={20} color={D.primary} />
                </Pressable>
              </View>

              <Text style={s.fieldLabel}>First Due Date</Text>
              <DateField value={firstDueIso} onChange={setFirstDueIso} />

              {count > 1 && (
                <>
                  <Text style={s.fieldLabel}>Frequency</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {FREQUENCIES.map((f) => {
                      const active = intervalMonths === f.months;
                      return (
                        <AnimatedPressable key={f.months} style={[s.modeChip, active && s.modeChipActive]} onPress={() => setIntervalMonths(f.months)}>
                          <Text style={[s.modeChipText, active && { color: "#fff" }]}>{f.label}</Text>
                        </AnimatedPressable>
                      );
                    })}
                  </ScrollView>
                </>
              )}

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
                <Text style={s.fieldLabel}>Schedule · total {money(draftTotal)}</Text>
              </View>
              {installments.map((it, idx) => (
                <View key={idx} style={s.instRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.instLabel}>{it.label}</Text>
                    <Text style={s.instAmount}>{money(Number(it.amount) || 0)}</Text>
                  </View>
                  <View style={{ width: 150 }}>
                    <DateField value={it.dueDateIso} onChange={(v) => updateDueDate(idx, v)} minDate={idx === 0 ? undefined : installments[idx - 1]?.dueDateIso} />
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
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  stepperBtn: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  stepperValue: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, minWidth: 28, textAlign: "center" },
  instRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: D.surfaceLow, borderRadius: 12, padding: 12, marginTop: 10 },
  instLabel: { fontSize: 12, fontFamily: D.fontSemiBold, color: D.outline },
  instAmount: { fontSize: 15, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, marginTop: 2 },
  modeChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  modeChipActive: { backgroundColor: D.primary, borderColor: D.primary },
  modeChipText: { fontSize: 12, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
});
