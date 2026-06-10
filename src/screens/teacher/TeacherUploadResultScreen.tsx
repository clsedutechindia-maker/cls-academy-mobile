import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listTeacherMappings, listTeacherStudents, saveTeacherResult } from "../../lib/erp";
import type { ClassSubjectRecord, UserProfileRecord } from "../../shared";

export function TeacherUploadResultScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [testName, setTestName] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [batchPickerOpen, setBatchPickerOpen] = useState(false);
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);

  const { data: mappings, loading: mappingsLoading } = useResource(
    async () => (profile ? listTeacherMappings(profile) : []),
    [profile?.userId],
  );

  const { data: allStudents, loading: studentsLoading } = useResource(
    async () => (profile ? listTeacherStudents(profile) : []),
    [profile?.userId],
  );

  const loading = mappingsLoading || studentsLoading;
  const batchNames = Array.from(new Set((mappings ?? []).map((m) => m.className).filter(Boolean)));
  const subjectsForBatch: ClassSubjectRecord[] = (mappings ?? []).filter((m) => m.className === selectedBatch);
  const studentsForBatch: UserProfileRecord[] = (allStudents ?? []).filter((s) => s.className === selectedBatch);
  const selectedMapping = subjectsForBatch.find((m) => m.id === selectedSubjectId) ?? null;
  const missingStudents = studentsForBatch.filter((s) => !marks[s.userId]?.trim());

  async function handleSubmit() {
    if (!profile) return;
    if (!selectedBatch) { Alert.alert("Missing field", "Select a batch."); return; }
    if (!selectedMapping) { Alert.alert("Missing field", "Select a subject."); return; }
    if (!testName.trim()) { Alert.alert("Missing field", "Enter a test name."); return; }
    const max = parseInt(totalMarks, 10);
    if (!totalMarks || isNaN(max) || max <= 0) { Alert.alert("Invalid", "Enter valid total marks."); return; }
    const studentsWithMarks = studentsForBatch.filter((s) => marks[s.userId]?.trim());
    if (studentsWithMarks.length === 0) { Alert.alert("No marks", "Enter marks for at least one student."); return; }

    setSubmitting(true);
    try {
      const invalidStudent = studentsWithMarks.find((s) => {
        const v = parseInt(marks[s.userId]!, 10);
        return isNaN(v) || v < 0 || v > max;
      });
      if (invalidStudent) {
        Alert.alert("Invalid marks", `Marks for ${invalidStudent.name} must be between 0 and ${max}.`);
        setSubmitting(false);
        return;
      }
      await Promise.all(
        studentsWithMarks.map((student) => {
          const scoreVal = parseInt(marks[student.userId]!, 10);
          if (isNaN(scoreVal)) return Promise.resolve();
          return saveTeacherResult({
            teacherProfile: profile,
            studentProfile: student,
            mapping: selectedMapping,
            assessmentCategory: "class_test",
            assessmentTitle: testName.trim(),
            score: scoreVal,
            maxScore: max,
            remarks: "",
          });
        }),
      );
      setSuccess(true);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to save results.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: D.bg, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Ionicons name="checkmark-circle" size={36} color="#15803D" />
        </View>
        <Text style={{ fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, marginBottom: 8 }}>Results Saved!</Text>
        <Text style={{ fontSize: 13, fontFamily: D.font, color: D.onSurfaceVariant, textAlign: "center", marginBottom: 24 }}>
          Results for {testName} uploaded successfully.
        </Text>
        <AnimatedPressable style={s.submitBtn} onPress={() => navigateBack(router)}>
          <Text style={s.submitText}>Back to Results</Text>
        </AnimatedPressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.navTitle}>Upload Result</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ padding: 32, alignItems: "center" }}>
            <ActivityIndicator color={D.primary} />
            <Text style={{ marginTop: 12, fontFamily: D.font, color: D.outline }}>Loading…</Text>
          </View>
        ) : (
          <>
            {/* Batch */}
            <View style={{ marginBottom: 14 }}>
              <Text style={s.fieldLabel}>Batch</Text>
              {batchNames.length === 0
                ? <Text style={{ fontFamily: D.font, color: D.outline, fontSize: 13 }}>No batches assigned.</Text>
                : (
                  <AnimatedPressable style={s.dropdownBtn} onPress={() => setBatchPickerOpen(true)}>
                    <Text style={[s.dropdownBtnText, { color: selectedBatch ? D.onSurface : D.outline }]}>
                      {selectedBatch || "Select batch…"}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={D.outline} />
                  </AnimatedPressable>
                )
              }
            </View>

            {/* Subject */}
            {selectedBatch !== "" && (
              <View style={{ marginBottom: 14 }}>
                <Text style={s.fieldLabel}>Subject</Text>
                <AnimatedPressable style={s.dropdownBtn} onPress={() => setSubjectPickerOpen(true)}>
                  <Text style={[s.dropdownBtnText, { color: selectedSubjectId ? D.onSurface : D.outline }]}>
                    {subjectsForBatch.find((m) => m.id === selectedSubjectId)?.subjectName || "Select subject…"}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={D.outline} />
                </AnimatedPressable>
              </View>
            )}

            {/* Test Name */}
            <View style={{ marginBottom: 14 }}>
              <Text style={s.fieldLabel}>Test Name</Text>
              <TextInput style={s.textInput} value={testName} onChangeText={setTestName} placeholder="e.g. Cell Division Unit Test" placeholderTextColor={D.outline} />
            </View>

            {/* Total Marks */}
            <View style={{ marginBottom: 14 }}>
              <Text style={s.fieldLabel}>Total Marks</Text>
              <TextInput style={s.textInput} value={totalMarks} onChangeText={setTotalMarks} placeholder="e.g. 50" placeholderTextColor={D.outline} keyboardType="numeric" />
            </View>

            {/* Student marks */}
            {selectedBatch !== "" && studentsForBatch.length > 0 && (
              <>
                <Text style={s.sectionLabel}>STUDENT MARKS · {studentsForBatch.length} STUDENTS</Text>
                <View style={s.card}>
                  <View style={[s.tableHeader, { backgroundColor: D.bg }]}>
                    <Text style={s.colLabel}>STUDENT</Text>
                    <Text style={[s.colLabel, { width: 80, textAlign: "center" }]}>MARKS{totalMarks ? ` / ${totalMarks}` : ""}</Text>
                  </View>
                  {studentsForBatch.map((st, i) => {
                    const initials = st.name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
                    return (
                      <View key={st.userId} style={[s.markRow, i < studentsForBatch.length - 1 && s.divider]}>
                        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: D.primary, alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" }}>{initials}</Text>
                        </View>
                        <Text style={{ flex: 1, fontSize: 13, fontWeight: "500", fontFamily: D.fontMedium, color: D.onSurface, letterSpacing: -0.1 }}>{st.name}</Text>
                        <TextInput
                          style={[s.marksInputField, marks[st.userId] ? s.marksInputFilled : s.marksInputEmpty]}
                          value={marks[st.userId] ?? ""}
                          onChangeText={(v) => setMarks((prev) => ({ ...prev, [st.userId]: v }))}
                          placeholder="—"
                          placeholderTextColor={D.outline}
                          keyboardType="numeric"
                          maxLength={4}
                        />
                      </View>
                    );
                  })}
                </View>
                {missingStudents.length > 0 && (
                  <View style={s.warnBanner}>
                    <Ionicons name="warning-outline" size={14} color="#92400E" />
                    <Text style={s.warnText}>{missingStudents.length} student{missingStudents.length > 1 ? "s" : ""} missing marks</Text>
                  </View>
                )}
              </>
            )}

            {selectedBatch !== "" && studentsForBatch.length === 0 && (
              <View style={[s.card, { padding: 20, alignItems: "center" }]}>
                <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No students in this batch.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Batch picker */}
      <Modal visible={batchPickerOpen} transparent animationType="fade" onRequestClose={() => setBatchPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setBatchPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Batch</Text>
            {batchNames.map((b) => (
              <Pressable key={b} style={[s.modalOption, b === selectedBatch && s.modalOptionActive]} onPress={() => { setSelectedBatch(b); setSelectedSubjectId(""); setMarks({}); setBatchPickerOpen(false); }}>
                <Text style={[s.modalOptionText, b === selectedBatch && { color: D.primary, fontFamily: D.fontBold }]}>{b}</Text>
                {b === selectedBatch && <Ionicons name="checkmark" size={16} color={D.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Subject picker */}
      <Modal visible={subjectPickerOpen} transparent animationType="fade" onRequestClose={() => setSubjectPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setSubjectPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Subject</Text>
            {subjectsForBatch.map((m) => (
              <Pressable key={m.id} style={[s.modalOption, m.id === selectedSubjectId && s.modalOptionActive]} onPress={() => { setSelectedSubjectId(m.id); setSubjectPickerOpen(false); }}>
                <Text style={[s.modalOptionText, m.id === selectedSubjectId && { color: D.primary, fontFamily: D.fontBold }]}>{m.subjectName}</Text>
                {m.id === selectedSubjectId && <Ionicons name="checkmark" size={16} color={D.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {!loading && (
        <View style={s.actionBar}>
          <AnimatedPressable style={s.cancelBtn} onPress={() => navigateBack(router)}>
            <Text style={s.cancelText}>Cancel</Text>
          </AnimatedPressable>
          <AnimatedPressable style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                <Text style={s.submitText}>Submit Results</Text>
              </>
            )}
          </AnimatedPressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  fieldLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 6 },
  textInput: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium, letterSpacing: -0.2 },
  dropdownBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface },
  dropdownBtnText: { fontSize: 13, fontFamily: D.fontMedium, flex: 1, letterSpacing: -0.2 },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  tableHeader: { flexDirection: "row", alignItems: "center", padding: 8, borderBottomWidth: 1, borderBottomColor: D.outlineVariant, paddingHorizontal: 14 },
  colLabel: { flex: 1, fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.4 },
  markRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  marksInputField: { width: 80, padding: 7, borderRadius: 10, textAlign: "center", fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: -0.2 },
  marksInputFilled: { backgroundColor: D.surfaceLow, borderWidth: 1.5, borderColor: D.primary, color: D.primary },
  marksInputEmpty: { backgroundColor: "#F8F8F8", borderWidth: 1, borderColor: D.outlineVariant, color: D.outline },
  warnBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A" },
  warnText: { fontSize: 12.5, color: "#92400E", fontWeight: "500", fontFamily: D.fontMedium },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 100, backgroundColor: D.bg },
  cancelBtn: { width: 80, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  submitBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  submitText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  modalTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginBottom: 16, letterSpacing: -0.2 },
  modalOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  modalOptionActive: { backgroundColor: D.surfaceLow, marginHorizontal: -18, paddingHorizontal: 18 },
  modalOptionText: { fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface },
});
