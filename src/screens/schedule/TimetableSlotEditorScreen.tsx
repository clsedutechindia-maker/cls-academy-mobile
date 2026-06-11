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
  deleteClassTimetableEntry,
  getClassById,
  getClassTimetableEntryById,
  listClassSubjectsForClass,
  saveClassTimetableEntry,
} from "../../lib/erp";
import { defaultTimetableSlots, scheduleDayOptions, type ScheduleDayKey } from "../../shared";
import {
  DropdownButton,
  EditorActionBar,
  FieldLabel,
  OptionSheet,
  TimeField,
  kit,
} from "./scheduleEditorKit";

export function TimetableSlotEditorScreen() {
  const insets = useSafeAreaInsets();
  const { authUser, profile } = useSession();
  const params = useLocalSearchParams<{ classId?: string; entryId?: string; mode?: string; day?: string }>();
  const classId = typeof params.classId === "string" ? params.classId : "";
  const entryId = typeof params.entryId === "string" ? params.entryId : "";
  const isEdit = params.mode === "edit" && Boolean(entryId);

  const { data, loading, error } = useResource(async () => {
    const [classRecord, mappings, entry] = await Promise.all([
      getClassById(classId),
      listClassSubjectsForClass(classId),
      isEdit ? getClassTimetableEntryById(entryId) : Promise.resolve(null),
    ]);
    return { classRecord, mappings, entry };
  }, [classId, entryId, isEdit]);

  const mappings = data?.mappings ?? [];
  const entry = data?.entry ?? null;

  const initialDay = ((): ScheduleDayKey => {
    const fromParam = scheduleDayOptions.find((option) => option.value === params.day)?.value;
    return entry?.dayKey ?? fromParam ?? "monday";
  })();

  const [dayKey, setDayKey] = useState<ScheduleDayKey>(initialDay);
  const [slotLabel, setSlotLabel] = useState(entry?.slotLabel ?? defaultTimetableSlots[0]!.slotLabel);
  const [startTime, setStartTime] = useState(entry?.startTime ?? defaultTimetableSlots[0]!.startTime);
  const [endTime, setEndTime] = useState(entry?.endTime ?? defaultTimetableSlots[0]!.endTime);
  const [mappingId, setMappingId] = useState(
    entry ? mappings.find((m) => m.subjectId === entry.subjectId)?.id ?? "" : "",
  );
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [subjectSheet, setSubjectSheet] = useState(false);
  const [slotSheet, setSlotSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Populate from loaded entry once data arrives (useState init runs before fetch resolves).
  if (data && !hydrated) {
    setHydrated(true);
    if (entry) {
      setDayKey(entry.dayKey);
      setSlotLabel(entry.slotLabel || defaultTimetableSlots[0]!.slotLabel);
      setStartTime(entry.startTime || defaultTimetableSlots[0]!.startTime);
      setEndTime(entry.endTime || defaultTimetableSlots[0]!.endTime);
      setMappingId(mappings.find((m) => m.subjectId === entry.subjectId)?.id ?? "");
    }
  }

  const selectedMapping = useMemo(() => mappings.find((m) => m.id === mappingId) ?? null, [mappings, mappingId]);
  const classRecord = data?.classRecord ?? null;

  async function handleSave() {
    if (!classRecord) {
      Alert.alert("Error", "Class not found.");
      return;
    }
    if (!selectedMapping) {
      Alert.alert("Missing Info", "Select a subject.");
      return;
    }
    if (!slotLabel.trim()) {
      Alert.alert("Missing Info", "Enter a period label.");
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
      const newId = await saveClassTimetableEntry({
        classRecord,
        dayKey,
        slotLabel,
        startTime,
        endTime,
        mapping: selectedMapping,
        notes,
        actor: { userId: authUser?.uid ?? "", name: profile?.name || authUser?.displayName || "Staff" },
      });
      if (isEdit && entryId && entryId !== newId) {
        await deleteClassTimetableEntry(entryId);
      }
      Alert.alert("Saved", "Timetable updated.", [{ text: "OK", onPress: () => navigateBack(router) }]);
    } catch {
      Alert.alert("Error", "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    Alert.alert("Delete Period", "Remove this period from the timetable?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setSaving(true);
          deleteClassTimetableEntry(entryId)
            .then(() => Alert.alert("Deleted", "Period removed.", [{ text: "OK", onPress: () => navigateBack(router) }]))
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
        <Text style={kit.navTitle}>{isEdit ? "Edit Period" : "Add Period"}</Text>
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

          <FieldLabel>Day</FieldLabel>
          <View style={[kit.dayChipRow, { marginBottom: 18 }]}>
            {scheduleDayOptions.map((option) => {
              const active = option.value === dayKey;
              return (
                <AnimatedPressable
                  key={option.value}
                  style={[kit.dayChip, active && kit.dayChipActive]}
                  onPress={() => setDayKey(option.value)}
                >
                  <Text style={[kit.dayChipText, active && kit.dayChipTextActive]}>{option.label.slice(0, 3)}</Text>
                </AnimatedPressable>
              );
            })}
          </View>

          <FieldLabel>Period</FieldLabel>
          <View style={{ marginBottom: 18 }}>
            <DropdownButton value={slotLabel} placeholder="Select period" onPress={() => setSlotSheet(true)} />
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

          <FieldLabel>Topic / Notes</FieldLabel>
          <TextInput
            style={[kit.input, kit.inputMulti]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional topic or note…"
            placeholderTextColor={D.outline}
            multiline
            textAlignVertical="top"
          />
        </ScrollView>
      )}

      <OptionSheet
        visible={slotSheet}
        title="Select Period"
        options={defaultTimetableSlots.map((slot) => ({ key: slot.slotLabel, label: `${slot.slotLabel} · ${slot.startTime}–${slot.endTime}` }))}
        selectedKey={slotLabel}
        onSelect={(key) => {
          const slot = defaultTimetableSlots.find((item) => item.slotLabel === key);
          if (slot) {
            setSlotLabel(slot.slotLabel);
            setStartTime(slot.startTime);
            setEndTime(slot.endTime);
          }
        }}
        onClose={() => setSlotSheet(false)}
      />

      <OptionSheet
        visible={subjectSheet}
        title="Select Subject"
        options={mappings.map((mapping) => ({ key: mapping.id, label: mapping.subjectName }))}
        selectedKey={mappingId}
        emptyText="No subjects mapped to this class."
        onSelect={setMappingId}
        onClose={() => setSubjectSheet(false)}
      />

      {!loading && classRecord && (
        <EditorActionBar
          onCancel={() => navigateBack(router)}
          onSave={() => void handleSave()}
          onDelete={isEdit ? handleDelete : undefined}
          saving={saving}
          saveLabel={isEdit ? "Save Changes" : "Add Period"}
        />
      )}
    </View>
  );
}
