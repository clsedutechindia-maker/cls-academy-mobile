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
import {
  listEmployeeClasses,
  listClassSubjectsForClass,
  listStudentsForClass,
  saveEmployeeResult,
} from "../../lib/erp";
import type { ClassRecord, ClassSubjectRecord, UserProfileRecord, ResultAssessmentCategory } from "../../shared";
import { showAlert } from "../../lib/alert";

const CATEGORIES: { label: string; value: ResultAssessmentCategory }[] = [
  { label: "Class Test", value: "class_test" },
  { label: "Quarterly Exam", value: "quarterly_exam" },
  { label: "Midterm", value: "midterm" },
  { label: "Final Exam", value: "final" },
];

export function EmployeeUploadResultScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<ClassSubjectRecord | null>(null);
  const [assessmentCategory, setAssessmentCategory] = useState<ResultAssessmentCategory>("class_test");
  const [testName, setTestName] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);

  const { data: classes, loading: classesLoading } = useResource(
    async () => (profile ? listEmployeeClasses(profile) : []),
    [profile?.userId],
  );

  const { data: subjects, loading: subjectsLoading } = useResource(
    async () => (selectedClass ? listClassSubjectsForClass(selectedClass.id) : []),
    [selectedClass?.id],
  );

  const { data: students, loading: studentsLoading } = useResource(
    async () => (selectedClass ? listStudentsForClass(selectedClass.id) : []),
    [selectedClass?.id],
  );

  const loading = classesLoading;
  const missingStudents = (students ?? []).filter((s: UserProfileRecord) => !marks[s.userId]?.trim());

  async function handleSubmit() {
    if (!profile) return;
    if (!selectedClass) { showAlert("Missing", "Select a class."); return; }
    if (!selectedSubject) { showAlert("Missing", "Select a subject."); return; }
    if (!testName.trim()) { showAlert("Missing", "Enter an assessment name."); return; }
    const max = parseInt(totalMarks, 10);
    if (!totalMarks || isNaN(max) || max <= 0) { showAlert("Invalid", "Enter valid total marks."); return; }
    const studentsWithMarks = (students ?? []).filter((s: UserProfileRecord) => marks[s.userId]?.trim());
    if (studentsWithMarks.length === 0) { showAlert("No marks", "Enter marks for at least one student."); return; }

    setSubmitting(true);
    try {
      const invalidStudent = studentsWithMarks.find((s: UserProfileRecord) => {
        const v = parseInt(marks[s.userId]!, 10);
        return isNaN(v) || v < 0 || v > max;
      });
      if (invalidStudent) {
        showAlert("Invalid marks", `Marks for ${invalidStudent.name} must be 0–${max}.`);
        setSubmitting(false);
        return;
      }
      await Promise.all(
        studentsWithMarks.map((student: UserProfileRecord) => {
          const scoreVal = parseInt(marks[student.userId]!, 10);
          if (isNaN(scoreVal)) return Promise.resolve();
          return saveEmployeeResult({
            employeeProfile: profile,
            studentProfile: student,
            classSubject: selectedSubject,
            assessmentCategory,
            assessmentTitle: testName.trim(),
            score: scoreVal,
            maxScore: max,
            remarks: "",
          });
        }),
      );
      setSuccess(true);
    } catch (err) {
      showAlert("Error", err instanceof Error ? err.message : "Failed to save results.");
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
          Results for {testName} uploaded to {selectedClass?.name}.
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
          </View>
        ) : (
          <>
            {/* Class */}
            <View style={{ marginBottom: 14 }}>
              <Text style={s.fieldLabel}>Class / Batch</Text>
              {(classes ?? []).length === 0
                ? <Text style={{ fontFamily: D.font, color: D.outline, fontSize: 13 }}>No classes in your centre.</Text>
                : (
                  <AnimatedPressable style={s.dropdownBtn} onPress={() => setClassPickerOpen(true)}>
                    <Text style={[s.dropdownBtnText, { color: selectedClass ? D.onSurface : D.outline }]}>
                      {selectedClass?.name || "Select class…"}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={D.outline} />
                  </AnimatedPressable>
                )
              }
            </View>

            {/* Subject */}
            <View style={{ marginBottom: 14 }}>
              <Text style={s.fieldLabel}>Subject</Text>
              {!selectedClass ? (
                <View style={[s.dropdownBtn, { opacity: 0.45 }]}>
                  <Text style={[s.dropdownBtnText, { color: D.outline }]}>Select class first…</Text>
                  <Ionicons name="chevron-down" size={14} color={D.outline} />
                </View>
              ) : subjectsLoading ? (
                <View style={s.dropdownBtn}><ActivityIndicator color={D.primary} size="small" /></View>
              ) : (subjects ?? []).length === 0 ? (
                <View style={[s.dropdownBtn, { opacity: 0.45 }]}>
                  <Text style={[s.dropdownBtnText, { color: D.outline }]}>No subjects for this class</Text>
                </View>
              ) : (
                <AnimatedPressable style={s.dropdownBtn} onPress={() => setSubjectPickerOpen(true)}>
                  <Text style={[s.dropdownBtnText, { color: selectedSubject ? D.onSurface : D.outline }]}>
                    {selectedSubject?.subjectName || "Select subject…"}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={D.outline} />
                </AnimatedPressable>
              )}
            </View>

            {/* Assessment Category */}
            <View style={{ marginBottom: 14 }}>
              <Text style={s.fieldLabel}>Assessment Type</Text>
              <AnimatedPressable style={s.dropdownBtn} onPress={() => setCategoryPickerOpen(true)}>
                <Text style={[s.dropdownBtnText, { color: D.onSurface }]}>
                  {CATEGORIES.find((c) => c.value === assessmentCategory)?.label ?? "Class Test"}
                </Text>
                <Ionicons name="chevron-down" size={14} color={D.outline} />
              </AnimatedPressable>
            </View>

            {/* Assessment Name */}
            <View style={{ marginBottom: 14 }}>
              <Text style={s.fieldLabel}>Assessment Name</Text>
              <TextInput style={s.textInput} value={testName} onChangeText={setTestName} placeholder="e.g. Unit 3 Class Test" placeholderTextColor={D.outline} />
            </View>

            {/* Total Marks */}
            <View style={{ marginBottom: 14 }}>
              <Text style={s.fieldLabel}>Total Marks</Text>
              <TextInput style={s.textInput} value={totalMarks} onChangeText={setTotalMarks} placeholder="e.g. 100" placeholderTextColor={D.outline} keyboardType="numeric" />
            </View>

            {/* Teacher info */}
            {selectedSubject?.teacherName ? (
              <View style={s.teacherBanner}>
                <Ionicons name="person-outline" size={14} color="#0369A1" />
                <Text style={s.teacherBannerText}>Subject teacher: {selectedSubject.teacherName}</Text>
              </View>
            ) : null}

            {/* Student marks */}
            {selectedClass && !studentsLoading && (students ?? []).length > 0 && (
              <>
                <Text style={s.sectionLabel}>STUDENT MARKS · {(students ?? []).length} STUDENTS</Text>
                <View style={s.card}>
                  <View style={[s.tableHeader, { backgroundColor: D.bg }]}>
                    <Text style={s.colLabel}>STUDENT</Text>
                    <Text style={[s.colLabel, { width: 80, textAlign: "center" }]}>MARKS{totalMarks ? ` / ${totalMarks}` : ""}</Text>
                  </View>
                  {(students ?? []).map((st: UserProfileRecord, i: number) => {
                    const initials = st.name.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
                    return (
                      <View key={st.userId} style={[s.markRow, i < (students ?? []).length - 1 && s.divider]}>
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

            {selectedClass && studentsLoading && (
              <View style={{ padding: 20, alignItems: "center" }}><ActivityIndicator color={D.primary} /></View>
            )}

            {selectedClass && !studentsLoading && (students ?? []).length === 0 && (
              <View style={[s.card, { padding: 20, alignItems: "center" }]}>
                <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No students in this class.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Class picker */}
      <Modal visible={classPickerOpen} transparent animationType="fade" onRequestClose={() => setClassPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setClassPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Class</Text>
            {(classes ?? []).map((c: ClassRecord) => (
              <Pressable key={c.id} style={[s.modalOption, c.id === selectedClass?.id && s.modalOptionActive]}
                onPress={() => { setSelectedClass(c); setSelectedSubject(null); setMarks({}); setClassPickerOpen(false); }}>
                <Text style={[s.modalOptionText, c.id === selectedClass?.id && { color: D.primary, fontFamily: D.fontBold }]}>{c.name}</Text>
                {c.id === selectedClass?.id && <Ionicons name="checkmark" size={16} color={D.primary} />}
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
            {(subjects ?? []).map((m: ClassSubjectRecord) => (
              <Pressable key={m.id} style={[s.modalOption, m.id === selectedSubject?.id && s.modalOptionActive]}
                onPress={() => { setSelectedSubject(m); setSubjectPickerOpen(false); }}>
                <View>
                  <Text style={[s.modalOptionText, m.id === selectedSubject?.id && { color: D.primary, fontFamily: D.fontBold }]}>{m.subjectName}</Text>
                  {m.teacherName ? <Text style={{ fontSize: 10.5, color: D.outline, fontFamily: D.font, marginTop: 2 }}>Teacher: {m.teacherName}</Text> : null}
                </View>
                {m.id === selectedSubject?.id && <Ionicons name="checkmark" size={16} color={D.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Category picker */}
      <Modal visible={categoryPickerOpen} transparent animationType="fade" onRequestClose={() => setCategoryPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setCategoryPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Assessment Type</Text>
            {CATEGORIES.map((c) => (
              <Pressable key={c.value} style={[s.modalOption, c.value === assessmentCategory && s.modalOptionActive]}
                onPress={() => { setAssessmentCategory(c.value); setCategoryPickerOpen(false); }}>
                <Text style={[s.modalOptionText, c.value === assessmentCategory && { color: D.primary, fontFamily: D.fontBold }]}>{c.label}</Text>
                {c.value === assessmentCategory && <Ionicons name="checkmark" size={16} color={D.primary} />}
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
  teacherBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, backgroundColor: "#E0F2FE", borderWidth: 1, borderColor: "#BAE6FD", marginBottom: 14 },
  teacherBannerText: { fontSize: 12, fontFamily: D.fontMedium, color: "#0369A1" },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12, marginTop: 8 },
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
