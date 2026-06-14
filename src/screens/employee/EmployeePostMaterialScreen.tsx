import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { showAlert } from "../../lib/alert";
import { listEmployeeClasses, listClassSubjectsForClass, uploadMaterialFile, createMaterialRecord } from "../../lib/erp";
import type { ClassRecord, ClassSubjectRecord } from "../../shared";

const materialTypes = ["Notes", "Solutions", "Diagrams", "Problems", "Reference"];

export function EmployeePostMaterialScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const [selectedClass, setSelectedClass] = useState<ClassRecord | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<ClassSubjectRecord | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState("Notes");
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: classes } = useResource(
    async () => {
      if (!profile) return [];
      return listEmployeeClasses(profile);
    },
    [profile?.userId],
  );

  const { data: subjects } = useResource(
    async () => {
      if (!selectedClass) return [];
      return listClassSubjectsForClass(selectedClass.id);
    },
    [selectedClass?.id],
  );

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*", "application/msword",
               "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0]!;
        setPickedFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? undefined });
      }
    } catch {
      showAlert("Error", "Could not open file picker.");
    }
  }

  async function handleSubmit() {
    if (!profile) return;
    if (!selectedClass) { showAlert("Missing", "Select a batch."); return; }
    if (!selectedSubject) { showAlert("Missing", "Select a subject."); return; }
    if (!title.trim()) { showAlert("Missing", "Enter a title."); return; }
    if (!pickedFile) { showAlert("Missing", "Select a file to upload."); return; }

    setUploading(true);
    try {
      const fileUrl = await uploadMaterialFile(pickedFile, profile.userId);
      await createMaterialRecord({
        profile,
        classId: selectedClass.id,
        className: selectedClass.name,
        subjectId: selectedSubject.subjectId,
        subjectName: selectedSubject.subjectName,
        title: title.trim(),
        description: description.trim(),
        type: selectedType,
        fileUrl,
        fileName: pickedFile.name,
      });
      showAlert("Success", "Material posted successfully.", [{ text: "OK", onPress: () => navigateBack(router) }]);
    } catch (err) {
      showAlert("Upload failed", err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.navTitle}>Post Material</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 200 }} showsVerticalScrollIndicator={false}>

        <View style={{ marginBottom: 16 }}>
          <Text style={s.fieldLabel}>Title</Text>
          <TextInput
            style={s.textInput}
            placeholder="Enter title…"
            placeholderTextColor={D.outline}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={s.fieldLabel}>Description (optional)</Text>
          <TextInput
            style={[s.textInput, { minHeight: 80, textAlignVertical: "top", paddingTop: 14 }]}
            placeholder="Add notes, context, or instructions…"
            placeholderTextColor={D.outline}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Batch</Text>
            <AnimatedPressable style={s.fieldBox} onPress={() => setClassPickerOpen(true)}>
              <Text style={[s.fieldText, !selectedClass && { color: D.outline }]} numberOfLines={1}>
                {selectedClass?.name || "Select…"}
              </Text>
              <Ionicons name="chevron-down" size={14} color={D.outline} />
            </AnimatedPressable>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Subject</Text>
            <AnimatedPressable
              style={s.fieldBox}
              onPress={() => selectedClass ? setSubjectPickerOpen(true) : showAlert("", "Select a batch first.")}
            >
              <Text style={[s.fieldText, !selectedSubject && { color: D.outline }]} numberOfLines={1}>
                {selectedSubject?.subjectName || "Select…"}
              </Text>
              <Ionicons name="chevron-down" size={14} color={D.outline} />
            </AnimatedPressable>
          </View>
        </View>

        <Text style={s.fieldLabel}>Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {materialTypes.map((t) => (
            <AnimatedPressable key={t} style={[s.typeChip, t === selectedType && s.typeChipActive]} onPress={() => setSelectedType(t)}>
              <Text style={[s.typeText, t === selectedType && { color: D.primary }]}>{t}</Text>
            </AnimatedPressable>
          ))}
        </View>

        <Text style={s.fieldLabel}>File</Text>
        <AnimatedPressable style={s.uploadZone} onPress={pickFile}>
          <View style={s.uploadIcon}>
            <Ionicons name={pickedFile ? "document-attach" : "cloud-upload-outline"} size={28} color={D.primary} />
          </View>
          {pickedFile ? (
            <>
              <Text style={s.uploadTitle} numberOfLines={1}>{pickedFile.name}</Text>
              <Text style={s.uploadSub}>Tap to replace</Text>
            </>
          ) : (
            <>
              <Text style={s.uploadTitle}>Tap to upload file</Text>
              <Text style={s.uploadSub}>PDF, images, or docs · max 20 MB</Text>
            </>
          )}
        </AnimatedPressable>

        <View style={[s.infoBanner, { marginTop: 8 }]}>
          <Ionicons name="information-circle-outline" size={14} color={D.primary} />
          <Text style={s.infoText}>Material visible to all students in selected batch.</Text>
        </View>
      </ScrollView>

      <View style={[s.actionBar, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
        <AnimatedPressable style={s.cancelBtn} onPress={() => navigateBack(router)}>
          <Text style={s.cancelText}>Cancel</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[s.submitBtn, uploading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="library-outline" size={16} color="#fff" />
              <Text style={s.submitText}>Post Material</Text>
            </>
          )}
        </AnimatedPressable>
      </View>

      <Modal visible={classPickerOpen} transparent animationType="fade" onRequestClose={() => setClassPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setClassPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Batch</Text>
            {(classes ?? []).length === 0
              ? <Text style={{ fontFamily: D.font, color: D.outline, fontSize: 13 }}>No classes in your centre.</Text>
              : (classes ?? []).map((c) => (
                <Pressable
                  key={c.id}
                  style={[s.modalOption, c.id === selectedClass?.id && s.modalOptionActive]}
                  onPress={() => { setSelectedClass(c); setSelectedSubject(null); setClassPickerOpen(false); }}
                >
                  <Text style={[s.modalOptionText, c.id === selectedClass?.id && { color: D.primary, fontFamily: D.fontBold }]}>
                    {c.name}
                  </Text>
                  {c.id === selectedClass?.id && <Ionicons name="checkmark" size={16} color={D.primary} />}
                </Pressable>
              ))
            }
          </View>
        </Pressable>
      </Modal>

      <Modal visible={subjectPickerOpen} transparent animationType="fade" onRequestClose={() => setSubjectPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setSubjectPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Subject</Text>
            {(subjects ?? []).length === 0
              ? <Text style={{ fontFamily: D.font, color: D.outline, fontSize: 13 }}>No subjects for this batch.</Text>
              : (subjects ?? []).map((sub) => (
                <Pressable
                  key={sub.id}
                  style={[s.modalOption, sub.id === selectedSubject?.id && s.modalOptionActive]}
                  onPress={() => { setSelectedSubject(sub); setSubjectPickerOpen(false); }}
                >
                  <Text style={[s.modalOptionText, sub.id === selectedSubject?.id && { color: D.primary, fontFamily: D.fontBold }]}>
                    {sub.subjectName}
                  </Text>
                  {sub.id === selectedSubject?.id && <Ionicons name="checkmark" size={16} color={D.primary} />}
                </Pressable>
              ))
            }
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  fieldLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 7 },
  fieldBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface },
  fieldText: { fontSize: 13, color: D.onSurface, letterSpacing: -0.2, fontWeight: "500", fontFamily: D.fontMedium, flex: 1 },
  textInput: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium, letterSpacing: -0.2 },
  typeChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  typeChipActive: { backgroundColor: D.surfaceLow, borderColor: D.surfaceHigh },
  typeText: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  uploadZone: { alignItems: "center", padding: 28, borderRadius: 20, borderWidth: 1.5, borderColor: D.surfaceHigh, borderStyle: "dashed", backgroundColor: D.surfaceLow, marginBottom: 16 },
  uploadIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: D.surface, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  uploadTitle: { fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: D.primary, marginBottom: 4, textAlign: "center" },
  uploadSub: { fontSize: 12, fontFamily: D.font, color: D.outline },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 14, borderRadius: 16, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  infoText: { flex: 1, fontSize: 12.5, color: D.primary, fontWeight: "500", fontFamily: D.fontMedium, lineHeight: 18 },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, backgroundColor: D.bg },
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
