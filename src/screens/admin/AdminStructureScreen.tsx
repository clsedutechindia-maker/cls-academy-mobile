import { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  ActionButton,
  Card,
  D,
  EmptyCard,
  ErrorCard,
  Field,
  Label,
  LoadingCard,
  MOBILE_BOTTOM_SPACING,
  Pill,
  ScreenHeader,
  SegmentedToggle,
} from "../../components/ui";
import { AnimatedPressable } from "../../components/motion";
import { DropdownButton, OptionSheet, type SheetOption } from "../schedule/scheduleEditorKit";
import { useResource } from "../../hooks/useResource";
import { navigateBack } from "../../lib/navigation";
import { showAlert } from "../../lib/alert";
import {
  createClass,
  createCourse,
  createSubject,
  listAllClassesForAdmin,
  listAllCoursesForAdmin,
  listAllSubjectsForAdmin,
  listCentres,
  renameOrgEntity,
  setOrgEntityActive,
  type CentreOption,
  type OrgEntityKind,
} from "../../lib/erp";
import type { ClassRecord, CourseRecord, SubjectRecord } from "../../shared";

type Tab = "classes" | "subjects" | "courses";

type StructureData = {
  classes: ClassRecord[];
  subjects: SubjectRecord[];
  courses: CourseRecord[];
  centres: CentreOption[];
};

const TAB_OPTIONS: { label: string; value: Tab }[] = [
  { label: "Batches", value: "classes" },
  { label: "Subjects", value: "subjects" },
  { label: "Courses", value: "courses" },
];

export function AdminStructureScreen() {
  const [tab, setTab] = useState<Tab>("classes");

  const { data, loading, error, reload } = useResource<StructureData>(async () => {
    const [classes, subjects, courses, centres] = await Promise.all([
      listAllClassesForAdmin(),
      listAllSubjectsForAdmin(),
      listAllCoursesForAdmin(),
      listCentres(),
    ]);
    return { classes, subjects, courses, centres };
  }, []);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Structure" onBack={() => navigateBack(router)} />

        <SegmentedToggle options={TAB_OPTIONS} selected={tab} onChange={setTab} />

        {loading && !data ? (
          <LoadingCard rows={4} />
        ) : error ? (
          <ErrorCard message={error} onRetry={() => void reload()} />
        ) : data ? (
          <>
            {tab === "classes" ? (
              <BatchTab data={data} onChanged={reload} />
            ) : tab === "subjects" ? (
              <CodedEntityTab kind="subjects" items={data.subjects} onChanged={reload} />
            ) : (
              <CodedEntityTab kind="courses" items={data.courses} onChanged={reload} />
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Batches (classes) -------------------------------------------------------

function BatchTab({ data, onChanged }: { data: StructureData; onChanged: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [centreId, setCentreId] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const centre = useMemo(
    () => data.centres.find((c) => c.centreId === centreId) ?? null,
    [data.centres, centreId],
  );
  const centreOptions: SheetOption[] = data.centres.map((c) => ({
    key: c.centreId,
    label: c.regionName ? `${c.centreName} · ${c.regionName}` : c.centreName,
  }));

  const onCreate = async () => {
    if (!name.trim()) return showAlert("Missing name", "Enter a batch name.");
    if (!centre) return showAlert("Missing centre", "Pick a centre for this batch.");
    setSaving(true);
    try {
      await createClass({ name, centre });
      setName("");
      setCentreId("");
      await onChanged();
      showAlert("Batch created", `"${name.trim()}" added under ${centre.centreName}.`);
    } catch (e) {
      showAlert("Could not create batch", e instanceof Error ? e.message : "Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <Card title="New batch" subtitle="A batch belongs to a centre. Centres are managed on the web.">
        <Label>Batch name</Label>
        <Field value={name} onChangeText={setName} placeholder="e.g. Class 11 JEE A" autoCapitalize="words" />
        <View style={{ height: 10 }} />
        <Label>Centre</Label>
        <DropdownButton
          value={centre ? (centre.regionName ? `${centre.centreName} · ${centre.regionName}` : centre.centreName) : ""}
          placeholder={data.centres.length ? "Select a centre" : "No centres — add one on the web"}
          onPress={() => data.centres.length > 0 && setSheetOpen(true)}
        />
        <View style={{ height: 14 }} />
        <ActionButton label={saving ? "Creating…" : "Create batch"} onPress={onCreate} disabled={saving} />
      </Card>

      <EntityList
        kind="classes"
        items={data.classes}
        subtitleFor={(c) => (c.centreName ? `${c.centreName}${c.regionName ? ` · ${c.regionName}` : ""}` : "Unassigned centre")}
        onChanged={onChanged}
      />

      <OptionSheet
        visible={sheetOpen}
        title="Select Centre"
        options={centreOptions}
        selectedKey={centreId}
        emptyText="No centres yet. Add one on the web."
        onSelect={setCentreId}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

// --- Subjects & courses (name + code) ---------------------------------------

function CodedEntityTab({
  kind,
  items,
  onChanged,
}: {
  kind: "subjects" | "courses";
  items: (SubjectRecord | CourseRecord)[];
  onChanged: () => Promise<void>;
}) {
  const isSubject = kind === "subjects";
  const noun = isSubject ? "subject" : "course";
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  const onCreate = async () => {
    if (!name.trim()) return showAlert("Missing name", `Enter a ${noun} name.`);
    setSaving(true);
    try {
      if (isSubject) await createSubject({ name, code });
      else await createCourse({ name, code });
      setName("");
      setCode("");
      await onChanged();
      showAlert(`${cap(noun)} created`, `"${name.trim()}" added.`);
    } catch (e) {
      showAlert(`Could not create ${noun}`, e instanceof Error ? e.message : "Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: 14 }}>
      <Card title={`New ${noun}`} subtitle={isSubject ? "e.g. Physics, Chemistry, Mathematics." : "Programs students enrol in, e.g. JEE, NEET."}>
        <Label>{cap(noun)} name</Label>
        <Field value={name} onChangeText={setName} placeholder={isSubject ? "e.g. Physics" : "e.g. JEE"} autoCapitalize="words" />
        <View style={{ height: 10 }} />
        <Label>Code (optional)</Label>
        <Field value={code} onChangeText={setCode} placeholder={isSubject ? "e.g. PHY" : "e.g. JEE"} autoCapitalize="characters" maxLength={12} />
        <View style={{ height: 14 }} />
        <ActionButton label={saving ? "Creating…" : `Create ${noun}`} onPress={onCreate} disabled={saving} />
      </Card>

      <EntityList
        kind={kind}
        items={items}
        subtitleFor={(item) => ("code" in item && item.code ? `Code: ${item.code}` : "No code")}
        onChanged={onChanged}
      />
    </View>
  );
}

// --- Shared list + row (rename + activate toggle) ---------------------------

type AnyEntity = { id: string; name: string; active: boolean };

function EntityList<T extends AnyEntity>({
  kind,
  items,
  subtitleFor,
  onChanged,
}: {
  kind: OrgEntityKind;
  items: T[];
  subtitleFor: (item: T) => string;
  onChanged: () => Promise<void>;
}) {
  if (items.length === 0) {
    return <EmptyCard title="Nothing yet" message="Create the first one above." />;
  }
  return (
    <Card title={`Existing (${items.length})`}>
      <View>
        {items.map((item) => (
          <EntityRow key={item.id} kind={kind} item={item} subtitle={subtitleFor(item)} onChanged={onChanged} />
        ))}
      </View>
    </Card>
  );
}

function EntityRow<T extends AnyEntity>({
  kind,
  item,
  subtitle,
  onChanged,
}: {
  kind: OrgEntityKind;
  item: T;
  subtitle: string;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);
  const [busy, setBusy] = useState(false);

  const saveRename = async () => {
    if (!draft.trim()) return showAlert("Missing name", "Name cannot be empty.");
    setBusy(true);
    try {
      await renameOrgEntity(kind, item.id, draft);
      setEditing(false);
      await onChanged();
    } catch (e) {
      showAlert("Could not rename", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async () => {
    setBusy(true);
    try {
      await setOrgEntityActive(kind, item.id, !item.active);
      await onChanged();
    } catch (e) {
      showAlert("Could not update", e instanceof Error ? e.message : "Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Field value={draft} onChangeText={setDraft} autoCapitalize="words" autoFocus />
        </View>
        <View style={styles.editActions}>
          <AnimatedPressable style={styles.iconBtn} onPress={() => { setEditing(false); setDraft(item.name); }} disabled={busy}>
            <Ionicons name="close" size={18} color={D.onSurfaceVariant} />
          </AnimatedPressable>
          <AnimatedPressable style={[styles.iconBtn, styles.iconBtnPrimary]} onPress={saveRename} disabled={busy}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={styles.rowTitle}>{item.name}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Pill label={item.active ? "Active" : "Inactive"} tone={item.active ? "success" : "danger"} />
      <AnimatedPressable style={styles.iconBtn} onPress={() => setEditing(true)} disabled={busy}>
        <Ionicons name="create-outline" size={17} color={D.primary} />
      </AnimatedPressable>
      <AnimatedPressable style={styles.iconBtn} onPress={toggleActive} disabled={busy}>
        <Ionicons name={item.active ? "eye-off-outline" : "eye-outline"} size={17} color={D.onSurfaceVariant} />
      </AnimatedPressable>
    </View>
  );
}

function cap(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: MOBILE_BOTTOM_SPACING },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: D.outlineVariant,
  },
  rowTitle: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.15 },
  rowSubtitle: { fontSize: 11, fontFamily: D.font, color: D.outline },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPrimary: { backgroundColor: D.primaryBtn, borderColor: D.primaryBtn },
  editActions: { flexDirection: "row", gap: 8 },
});
