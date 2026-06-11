import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import {
  deleteTeachingPlan,
  getTeachingPlanById,
  listTeacherMappings,
  listTeachingPlansForTeacher,
  saveTeachingPlan,
  submitTeachingPlan,
  type TeachingPlanInput,
} from "../../lib/erp";
import type { ClassSubjectRecord, TeachingPlanRecord, TeachingPlanRow } from "../../shared";
import { DropdownButton, FieldLabel, OptionSheet, kit } from "../schedule/scheduleEditorKit";
import { addDays, buildWeekRows, dayLabelForDate, firstOpenWeekStart, formatDayDate, formatWeekRange, monthKeyOf } from "./teachingPlanShared";
import { WeekCalendarPicker } from "./WeekCalendarPicker";

export function TeachingPlanEditorScreen() {
  const insets = useSafeAreaInsets();
  const { authUser, profile, adminRecord } = useSession();
  const isAdmin = Boolean(adminRecord);
  const params = useLocalSearchParams<{ mode?: string; id?: string }>();
  const planId = typeof params.id === "string" ? params.id : "";
  const isEdit = params.mode === "edit" && Boolean(planId);

  const { data, loading, error } = useResource(async () => {
    const [mappings, myPlans, plan] = await Promise.all([
      !isAdmin && profile ? listTeacherMappings(profile) : Promise.resolve([] as ClassSubjectRecord[]),
      !isAdmin && profile ? listTeachingPlansForTeacher(profile) : Promise.resolve([] as TeachingPlanRecord[]),
      isEdit ? getTeachingPlanById(planId) : Promise.resolve(null),
    ]);
    return { mappings, myPlans, plan };
  }, [planId, isEdit, isAdmin, profile?.userId]);

  const mappings = data?.mappings ?? [];
  const myPlans = data?.myPlans ?? [];
  const plan = data?.plan ?? null;

  const [mappingId, setMappingId] = useState("");
  const [weekStart, setWeekStart] = useState("");
  const [unitName, setUnitName] = useState("");
  const [classTime, setClassTime] = useState("");
  const [rows, setRows] = useState<TeachingPlanRow[]>([]);
  const [subjectSheet, setSubjectSheet] = useState(false);
  const [weekSheet, setWeekSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [autoWeekFor, setAutoWeekFor] = useState("");

  if (data && !hydrated) {
    setHydrated(true);
    if (plan) {
      setMappingId(plan.classSubjectId);
      setWeekStart(plan.weekStartDate);
      setUnitName(plan.unitName);
      setClassTime(plan.classTime);
      setRows(plan.rows.length > 0 ? plan.rows : buildWeekRows(plan.weekStartDate));
      setAutoWeekFor(plan.classSubjectId);
    }
  }

  const selectedMapping = useMemo(() => mappings.find((m) => m.id === mappingId) ?? null, [mappings, mappingId]);
  const locked = isEdit && plan?.status === "approved" && !isAdmin;

  // Weeks already taken for the selected class+subject (excluding the plan being edited).
  const takenWeekStarts = useMemo(() => {
    const set = new Set<string>();
    if (!mappingId) return set;
    for (const p of myPlans) {
      if (p.classSubjectId === mappingId && p.id !== planId) set.add(p.weekStartDate);
    }
    return set;
  }, [myPlans, mappingId, planId]);

  // On create, once a class+subject is chosen, default to the next open week.
  if (!isAdmin && !isEdit && mappingId && mappingId !== autoWeekFor) {
    setAutoWeekFor(mappingId);
    const monday = firstOpenWeekStart(takenWeekStarts);
    setWeekStart(monday);
    setRows(buildWeekRows(monday));
  }

  function onWeekStartChange(value: string) {
    setWeekStart(value);
    if (rows.length === 0 || rows.every((r) => !r.topics.trim())) {
      setRows(buildWeekRows(value));
    }
  }

  function updateRow(index: number, patch: Partial<TeachingPlanRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    const last = rows[rows.length - 1];
    const nextDate = last?.date ? addDays(last.date, 1) : weekStart;
    setRows((prev) => [...prev, { date: nextDate, day: dayLabelForDate(nextDate), topics: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function buildInput(status: "draft"): TeachingPlanInput | null {
    const sortedRows = [...rows]
      .filter((row) => row.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((row) => ({ date: row.date, day: dayLabelForDate(row.date) || row.day, topics: row.topics }));
    if (sortedRows.length === 0) {
      Alert.alert("Missing Info", "Add at least one day with topics.");
      return null;
    }
    const weekEnd = sortedRows[sortedRows.length - 1]!.date;

    if (isAdmin && plan) {
      return {
        classId: plan.classId,
        className: plan.className,
        classSubjectId: plan.classSubjectId,
        subjectId: plan.subjectId,
        subjectName: plan.subjectName,
        teacherUserId: plan.teacherUserId,
        teacherName: plan.teacherName,
        centreId: plan.centreId,
        centreName: plan.centreName,
        regionId: plan.regionId,
        regionName: plan.regionName,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        monthKey: monthKeyOf(weekStart),
        unitName,
        classTime,
        rows: sortedRows,
        status: plan.status,
        reviewNote: plan.reviewNote,
        submittedAtIso: plan.submittedAtIso,
        approvedByUserId: plan.approvedByUserId,
        approvedByName: plan.approvedByName,
        approvedAtIso: plan.approvedAtIso,
        createdAtIso: plan.createdAtIso,
      };
    }

    if (!selectedMapping) {
      Alert.alert("Missing Info", "Select a class & subject.");
      return null;
    }
    return {
      classId: selectedMapping.classId,
      className: selectedMapping.className,
      classSubjectId: selectedMapping.id,
      subjectId: selectedMapping.subjectId,
      subjectName: selectedMapping.subjectName,
      teacherUserId: selectedMapping.teacherUserId || authUser?.uid || "",
      teacherName: selectedMapping.teacherName || profile?.name || "Teacher",
      centreId: selectedMapping.centreId,
      centreName: selectedMapping.centreName,
      regionId: selectedMapping.regionId,
      regionName: selectedMapping.regionName,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      monthKey: monthKeyOf(weekStart),
      unitName,
      classTime,
      rows: sortedRows,
      status,
      reviewNote: plan?.reviewNote ?? "",
      createdAtIso: plan?.createdAtIso,
    };
  }

  const actor = { userId: authUser?.uid ?? "", name: profile?.name || authUser?.displayName || "Staff" };

  async function persist(submit: boolean) {
    if (!weekStart) {
      Alert.alert("Missing Info", "Pick the week start date.");
      return;
    }
    if (!unitName.trim()) {
      Alert.alert("Missing Info", "Enter a unit name.");
      return;
    }
    const input = buildInput("draft");
    if (!input) return;
    setSaving(true);
    try {
      const newId = await saveTeachingPlan(input, actor);
      if (isEdit && planId && planId !== newId) {
        await deleteTeachingPlan(planId);
      }
      if (submit) {
        await submitTeachingPlan(newId, actor);
      }
      Alert.alert(
        submit ? "Submitted" : "Saved",
        submit ? "Plan submitted for admin review." : "Plan saved as draft.",
        [{ text: "OK", onPress: () => navigateBack(router) }],
      );
    } catch {
      Alert.alert("Error", "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert("Delete Plan", "Delete this draft plan?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setSaving(true);
          deleteTeachingPlan(planId)
            .then(() => Alert.alert("Deleted", "Plan removed.", [{ text: "OK", onPress: () => navigateBack(router) }]))
            .catch(() => Alert.alert("Error", "Could not delete. Try again."))
            .finally(() => setSaving(false));
        },
      },
    ]);
  }

  const title = isAdmin ? "Edit Plan" : isEdit ? "Edit Teaching Plan" : "New Teaching Plan";

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[kit.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={kit.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={kit.navTitle}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator color={D.primary} />
        </View>
      ) : error ? (
        <View style={{ padding: 18 }}>
          <Text style={{ fontFamily: D.font, color: D.error, fontSize: 13 }}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
          {locked ? (
            <View style={[s.note, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name="lock-closed" size={16} color="#15803D" />
              <Text style={[s.noteText, { color: "#15803D" }]}>Approved & locked — contact admin to edit.</Text>
            </View>
          ) : null}
          {plan?.reviewNote && plan.status === "draft" ? (
            <View style={[s.note, { backgroundColor: "#FEE2E2" }]}>
              <Ionicons name="alert-circle" size={16} color="#B91C1C" />
              <Text style={[s.noteText, { color: "#B91C1C" }]}>Returned by admin: {plan.reviewNote}</Text>
            </View>
          ) : null}

          {isAdmin && plan ? (
            <View style={kit.classBanner}>
              <Ionicons name="school-outline" size={16} color={D.primary} />
              <Text style={kit.classBannerText}>{plan.className} · {plan.subjectName}</Text>
            </View>
          ) : (
            <>
              <FieldLabel>Class & Subject</FieldLabel>
              <View style={{ marginBottom: 18 }}>
                <DropdownButton
                  value={selectedMapping ? `${selectedMapping.className} · ${selectedMapping.subjectName}` : ""}
                  placeholder="Select class & subject"
                  onPress={() => !locked && setSubjectSheet(true)}
                />
              </View>
            </>
          )}

          <FieldLabel>Week</FieldLabel>
          <View style={{ marginBottom: 18 }}>
            <DropdownButton
              value={weekStart ? formatWeekRange(weekStart, addDays(weekStart, 5)) : ""}
              placeholder="Select week"
              onPress={() => !locked && setWeekSheet(true)}
            />
          </View>

          <FieldLabel>Unit Name</FieldLabel>
          <TextInput
            style={[kit.input, { marginBottom: 18 }]}
            value={unitName}
            onChangeText={setUnitName}
            placeholder="e.g. Reflection and Refraction of Light"
            placeholderTextColor={D.outline}
            editable={!locked}
          />

          <FieldLabel>Class Time (optional)</FieldLabel>
          <TextInput
            style={[kit.input, { marginBottom: 18 }]}
            value={classTime}
            onChangeText={setClassTime}
            placeholder="e.g. 05:00 PM – 06:30 PM"
            placeholderTextColor={D.outline}
            editable={!locked}
          />

          <FieldLabel>Daily Topics</FieldLabel>
          {rows.map((row, i) => (
            <View key={`${row.date}-${i}`} style={s.dayRow}>
              <View style={s.dayHead}>
                <Text style={s.dayName}>{dayLabelForDate(row.date) || row.day || "Day"}</Text>
                <Text style={s.dayDate}>{formatDayDate(row.date)}</Text>
                {!locked && (
                  <AnimatedPressable onPress={() => removeRow(i)} style={s.removeBtn}>
                    <Ionicons name="close" size={15} color={D.outline} />
                  </AnimatedPressable>
                )}
              </View>
              <TextInput
                style={[kit.input, kit.inputMulti]}
                value={row.topics}
                onChangeText={(v) => updateRow(i, { topics: v })}
                placeholder="1. Topic…&#10;2. Topic…"
                placeholderTextColor={D.outline}
                multiline
                textAlignVertical="top"
                editable={!locked}
              />
            </View>
          ))}
          {!locked && (
            <AnimatedPressable style={s.addRow} onPress={addRow}>
              <Ionicons name="add-circle-outline" size={16} color={D.primary} />
              <Text style={s.addRowText}>Add day</Text>
            </AnimatedPressable>
          )}
        </ScrollView>
      )}

      <OptionSheet
        visible={subjectSheet}
        title="Class & Subject"
        options={mappings.map((m) => ({ key: m.id, label: `${m.className} · ${m.subjectName}` }))}
        selectedKey={mappingId}
        emptyText="No subjects assigned to you."
        onSelect={setMappingId}
        onClose={() => setSubjectSheet(false)}
      />

      <WeekCalendarPicker
        visible={weekSheet}
        initialWeekStart={weekStart}
        takenWeekStarts={takenWeekStarts}
        onSelect={onWeekStartChange}
        onClose={() => setWeekSheet(false)}
      />

      {!loading && !error && !locked && (
        <View style={kit.actionBar}>
          {isEdit && !isAdmin && plan?.status === "draft" ? (
            <AnimatedPressable style={kit.deleteBtn} onPress={handleDelete} disabled={saving}>
              <Ionicons name="trash-outline" size={18} color={D.error} />
            </AnimatedPressable>
          ) : (
            <AnimatedPressable style={kit.cancelBtn} onPress={() => navigateBack(router)}>
              <Text style={kit.cancelText}>Cancel</Text>
            </AnimatedPressable>
          )}
          {isAdmin ? (
            <AnimatedPressable style={[kit.saveBtn, saving && { opacity: 0.6 }]} onPress={() => void persist(false)} disabled={saving}>
              <Ionicons name="checkmark" size={17} color="#fff" />
              <Text style={kit.saveText}>{saving ? "Saving…" : "Save Changes"}</Text>
            </AnimatedPressable>
          ) : (
            <>
              <AnimatedPressable style={[s.draftBtn, saving && { opacity: 0.6 }]} onPress={() => void persist(false)} disabled={saving}>
                <Text style={s.draftText}>Save Draft</Text>
              </AnimatedPressable>
              <AnimatedPressable style={[kit.saveBtn, { flex: 1.4 }, saving && { opacity: 0.6 }]} onPress={() => void persist(true)} disabled={saving}>
                <Ionicons name="paper-plane-outline" size={16} color="#fff" />
                <Text style={kit.saveText}>{saving ? "…" : "Submit"}</Text>
              </AnimatedPressable>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  note: { flexDirection: "row", gap: 9, padding: 12, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  noteText: { flex: 1, fontSize: 12, fontFamily: D.fontSemiBold, lineHeight: 17 },
  dayRow: { marginBottom: 14 },
  dayHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 7 },
  dayName: { fontSize: 12.5, fontFamily: D.fontBold, color: D.onSurface },
  dayDate: { fontSize: 11, fontFamily: D.font, color: D.outline, flex: 1 },
  removeBtn: { width: 26, height: 26, borderRadius: 8, backgroundColor: D.surfaceLow, alignItems: "center", justifyContent: "center" },
  addRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, borderStyle: "dashed", backgroundColor: D.surface },
  addRowText: { fontSize: 12.5, fontFamily: D.fontBold, color: D.primary },
  draftBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  draftText: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface },
});
