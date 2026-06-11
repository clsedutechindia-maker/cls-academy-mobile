import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import {
  deleteTestSchedule,
  getClassById,
  getTestScheduleById,
  listClassSubjectsForClass,
  saveTestSchedule,
} from "../../lib/erp";
import type { ResultAssessmentCategory } from "../../shared";
import {
  DateField,
  DropdownButton,
  EditorActionBar,
  FieldLabel,
  OptionSheet,
  TimeField,
  kit,
} from "./scheduleEditorKit";

const CATEGORY_OPTIONS: { key: ResultAssessmentCategory; label: string }[] = [
  { key: "class_test", label: "Class Test" },
  { key: "quarterly_exam", label: "Quarterly Exam" },
  { key: "midterm", label: "Midterm" },
  { key: "final", label: "Final Exam" },
];

function categoryLabel(key: ResultAssessmentCategory): string {
  return CATEGORY_OPTIONS.find((option) => option.key === key)?.label ?? "Class Test";
}

function todayValue(): string {
  return new Date().toISOString().split("T")[0]!;
}

export function ExamScheduleEditorScreen() {
  const insets = useSafeAreaInsets();
  const { authUser, profile } = useSession();
  const params = useLocalSearchParams<{ classId?: string; entryId?: string; mode?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const entryId = typeof params.entryId === "string" ? params.entryId : "";
  const isEdit = params.mode === "edit" && Boolean(entryId);

  const { data, loading, error } = useResource(async () => {
    const [classRecord, mappings, entry] = await Promise.all([
      getClassById(classId),
      listClassSubjectsForClass(classId),
      isEdit ? getTestScheduleById(entryId) : Promise.resolve(null),
    ]);
    return { classRecord, mappings, entry };
  }, [classId, entryId, isEdit]);

  const mappings = data?.mappings ?? [];
  const entry = data?.entry ?? null;
  const classRecord = data?.classRecord ?? null;

  const [mappingId, setMappingId] = useState("");
  const [category, setCategory] = useState<ResultAssessmentCategory>("class_test");
  const [title, setTitle] = useState("");
  const [scheduleDate, setScheduleDate] = useState(todayValue());
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("11:00");
  const [notes, setNotes] = useState("");
  const [subjectSheet, setSubjectSheet] = useState(false);
  const [categorySheet, setCategorySheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  if (data && !hydrated) {
    setHydrated(true);
    if (entry) {
      setMappingId(entry.classSubjectId || mappings.find((m) => m.subjectId === entry.subjectId)?.id || "");
      setCategory(entry.assessmentCategory);
      setTitle(entry.assessmentTitle);
      setScheduleDate(entry.scheduleDate || todayValue());
      setStartTime(entry.startTime || "10:00");
      setEndTime(entry.endTime || "11:00");
      setNotes(entry.notes);
    }
  }

  const selectedMapping = useMemo(() => mappings.find((m) => m.id === mappingId) ?? null, [mappings, mappingId]);

  async function handleSave() {
    if (!classRecord) {
      Alert.alert("Error", "Class not found.");
      return;
    }
    if (!selectedMapping) {
      Alert.alert("Missing Info", "Select a subject.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Missing Info", "Enter an assessment title.");
      return;
    }
    if (!scheduleDate) {
      Alert.alert("Missing Info", "Pick a date.");
      return;
    }
    if (!startTime || !endTime) {
      Alert.alert("Missing Info", "Set start and end time.");
      return;
    }
    if (endTime <= startTime) {
      Alert.alert("Invalid Time", "End time must be after start time.");
      return;
    }
    setSaving(true);
    try {
      const newId = await saveTestSchedule({
        classRecord,
        mapping: selectedMapping,
        assessmentCategory: category,
        assessmentTitle: title,
        scheduleDate,
        startTime,
        endTime,
        notes,
        actor: { userId: authUser?.uid ?? "", name: profile?.name || authUser?.displayName || "Staff" },
      });
      if (isEdit && entryId && entryId !== newId) {
        await deleteTestSchedule(entryId);
      }
      Alert.alert("Saved", "Exam schedule updated.", [{ text: "OK", onPress: () => navigateBack(router) }]);
    } catch {
      Alert.alert("Error", "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert("Delete Exam", "Remove this exam from the schedule?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setSaving(true);
          deleteTestSchedule(entryId)
            .then(() => Alert.alert("Deleted", "Exam removed.", [{ text: "OK", onPress: () => navigateBack(router) }]))
            .catch(() => Alert.alert("Error", "Could not delete. Try again."))
            .finally(() => setSaving(false));
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[kit.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={kit.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={kit.navTitle}>{isEdit ? "Edit Exam" : "Add Exam"}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator color={D.primary} />
        </View>
      ) : error || !classRecord ? (
        <View style={{ padding: 18 }}>
          <Text style={{ fontFamily: D.font, color: D.error, fontSize: 13 }}>{error ?? "Class not found."}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
          <View style={kit.classBanner}>
            <Ionicons name="school-outline" size={16} color={D.primary} />
            <Text style={kit.classBannerText}>{classRecord.name}</Text>
          </View>

          <FieldLabel>Subject</FieldLabel>
          <View style={{ marginBottom: 4 }}>
            <DropdownButton
              value={selectedMapping?.subjectName ?? ""}
              placeholder="Select subject"
              onPress={() => setSubjectSheet(true)}
            />
          </View>
          {selectedMapping?.teacherName ? (
            <Text style={{ fontSize: 11.5, fontFamily: D.font, color: D.outline, marginBottom: 18 }}>
              Teacher: {selectedMapping.teacherName}
            </Text>
          ) : (
            <View style={{ marginBottom: 18 }} />
          )}

          <FieldLabel>Assessment Type</FieldLabel>
          <View style={{ marginBottom: 18 }}>
            <DropdownButton value={categoryLabel(category)} placeholder="Select type" onPress={() => setCategorySheet(true)} />
          </View>

          <FieldLabel>Title</FieldLabel>
          <TextInput
            style={[kit.input, { marginBottom: 18 }]}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Electrostatics Unit Test"
            placeholderTextColor={D.outline}
          />

          <FieldLabel>Date</FieldLabel>
          <View style={{ marginBottom: 18 }}>
            <DateField value={scheduleDate} onChange={setScheduleDate} />
          </View>

          <View style={[kit.row, { marginBottom: 18 }]}>
            <View style={{ flex: 1 }}>
              <FieldLabel>Start</FieldLabel>
              <TimeField value={startTime} onChange={setStartTime} />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel>End</FieldLabel>
              <TimeField value={endTime} onChange={setEndTime} />
            </View>
          </View>

          <FieldLabel>Syllabus / Notes</FieldLabel>
          <TextInput
            style={[kit.input, kit.inputMulti]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional syllabus or instructions…"
            placeholderTextColor={D.outline}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      )}

      <OptionSheet
        visible={subjectSheet}
        title="Select Subject"
        options={mappings.map((mapping) => ({ key: mapping.id, label: mapping.subjectName }))}
        selectedKey={mappingId}
        emptyText="No subjects mapped to this class."
        onSelect={setMappingId}
        onClose={() => setSubjectSheet(false)}
      />

      <OptionSheet
        visible={categorySheet}
        title="Assessment Type"
        options={CATEGORY_OPTIONS.map((option) => ({ key: option.key, label: option.label }))}
        selectedKey={category}
        onSelect={(key) => setCategory(key as ResultAssessmentCategory)}
        onClose={() => setCategorySheet(false)}
      />

      {!loading && classRecord && (
        <EditorActionBar
          onCancel={() => navigateBack(router)}
          onSave={() => void handleSave()}
          onDelete={isEdit ? handleDelete : undefined}
          saving={saving}
          saveLabel={isEdit ? "Save Changes" : "Add Exam"}
        />
      )}
    </View>
  );
}
