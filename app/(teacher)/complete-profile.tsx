import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../src/components/theme";
import { AnimatedPressable } from "../../src/components/motion";
import { useSession } from "../../src/providers/session";
import { showAlert } from "../../src/lib/alert";
import { firestoreDb } from "../../src/lib/firebase";
import { listAllClasses, listAllSubjects } from "../../src/lib/erp";
import { userProfilesCollectionName, type ClassRecord, type SubjectRecord } from "../../src/shared";

// Gate screen: an approved teacher lands here (via index + (teacher)/_layout) and
// cannot reach the dashboard until they pick the batches and subjects they teach
// (profileCompleted → true). Mirrors the student complete-profile flow.
export default function TeacherCompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const { authUser, profile, refresh } = useSession();

  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(profile?.teacherClassIds ?? []);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>(profile?.teacherSubjectIds ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [classList, subjectList] = await Promise.all([listAllClasses(), listAllSubjects()]);
        if (!alive) return;
        setClasses(classList);
        setSubjects(subjectList);
      } catch (err) {
        if (!alive) return;
        setLoadError(err instanceof Error ? err.message : "Could not load batches and subjects.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  function toggle(list: string[], setList: (next: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function save() {
    const userId = profile?.userId || authUser?.uid || "";
    if (!userId) {
      showAlert("Please sign in again", "We couldn't find your account. Sign out and back in, then try again.");
      return;
    }
    if (selectedClassIds.length === 0) return showAlert("Missing Info", "Select at least one batch.");
    if (selectedSubjectIds.length === 0) return showAlert("Missing Info", "Select at least one subject.");

    const classNames = selectedClassIds.map((id) => classById.get(id)?.name || "").filter(Boolean);
    const subjectNames = selectedSubjectIds.map((id) => subjectById.get(id)?.name || "").filter(Boolean);

    setSaving(true);
    try {
      await setDoc(
        doc(firestoreDb, userProfilesCollectionName, userId),
        {
          teacherClassIds: selectedClassIds,
          teacherClassNames: classNames,
          teacherSubjectIds: selectedSubjectIds,
          teacherSubjectNames: subjectNames,
          // Mirror snake_case keys so result-upload rules (which read either form) match.
          teacher_class_ids: selectedClassIds,
          teacher_class_names: classNames,
          teacher_subject_ids: selectedSubjectIds,
          teacher_subject_names: subjectNames,
          profileCompleted: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      await refresh();
      router.replace("/(teacher)/home");
    } catch (error) {
      setSaving(false);
      showAlert("Error", error instanceof Error ? error.message : "Could not save your profile. Try again.");
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: D.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <Text style={s.title}>Set Up Your Teaching</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.noteCard}>
          <Ionicons name="lock-closed-outline" size={16} color={D.primary} />
          <Text style={s.noteText}>
            Welcome{profile?.name ? `, ${profile.name}` : ""}! Pick the batches and subjects you teach to unlock your dashboard —
            it's required before you can use any other feature.
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={D.primary} />
          </View>
        ) : loadError ? (
          <Text style={s.errorText}>{loadError}</Text>
        ) : (
          <>
            <Text style={s.sectionLabel}>YOUR BATCHES</Text>
            {classes.length === 0 ? (
              <Text style={s.muted}>No batches available yet. Ask your admin to create classes.</Text>
            ) : (
              <View style={s.chipWrap}>
                {classes.map((c) => {
                  const active = selectedClassIds.includes(c.id);
                  return (
                    <AnimatedPressable
                      key={c.id}
                      style={[s.chip, active && s.chipActive]}
                      onPress={() => toggle(selectedClassIds, setSelectedClassIds, c.id)}
                    >
                      {active ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
                      <Text style={[s.chipText, active && s.chipTextActive]}>{c.name}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            )}

            <Text style={[s.sectionLabel, { marginTop: 22 }]}>YOUR SUBJECTS</Text>
            {subjects.length === 0 ? (
              <Text style={s.muted}>No subjects available yet. Ask your admin to create subjects.</Text>
            ) : (
              <View style={s.chipWrap}>
                {subjects.map((sub) => {
                  const active = selectedSubjectIds.includes(sub.id);
                  return (
                    <AnimatedPressable
                      key={sub.id}
                      style={[s.chip, active && s.chipActive]}
                      onPress={() => toggle(selectedSubjectIds, setSelectedSubjectIds, sub.id)}
                    >
                      {active ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
                      <Text style={[s.chipText, active && s.chipTextActive]}>{sub.name}</Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            )}

            <AnimatedPressable
              style={[s.submitBtn, saving && { opacity: 0.6 }]}
              onPress={() => void save()}
              disabled={saving}
            >
              <Ionicons name="checkmark" size={17} color="#fff" />
              <Text style={s.submitText}>{saving ? "Saving…" : "Save & Unlock Dashboard"}</Text>
            </AnimatedPressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 16 },
  title: { fontSize: 24, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: D.surfaceLow,
    marginBottom: 18,
  },
  noteText: { flex: 1, fontSize: 11.5, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 16 },
  sectionLabel: { fontSize: 11, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    backgroundColor: D.surface,
  },
  chipActive: { backgroundColor: D.primary, borderColor: D.primary },
  chipText: { fontSize: 13, fontFamily: D.fontSemiBold, color: D.onSurface },
  chipTextActive: { color: "#fff" },
  submitBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: D.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 28,
  },
  submitText: { fontSize: 14, fontFamily: D.fontBold, color: "#fff" },
  muted: { fontSize: 13, color: D.onSurfaceVariant },
  errorText: { fontSize: 12, color: "#B91C1C", marginTop: 12 },
});
