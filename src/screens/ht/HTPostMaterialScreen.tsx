import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
import { listTeacherMappings, uploadMaterialFile, createMaterialRecord } from "../../lib/erp";

const materialTypes = ["Notes", "Solutions", "Diagrams", "Problems", "Reference"];

export function HTPostMaterialScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [links, setLinks] = useState<{ url: string; label: string }[]>([]);
  const [selectedType, setSelectedType] = useState("Notes");
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; mimeType?: string } | null>(null);
  const [batchPickerOpen, setBatchPickerOpen] = useState(false);
  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: mappings } = useResource(
    async () => {
      if (!profile) return [];
      return listTeacherMappings(profile);
    },
    [profile?.userId],
  );

  const batchNames = Array.from(new Set((mappings ?? []).map((m) => m.className).filter(Boolean)));
  const subjectsForBatch = (mappings ?? []).filter((m) => m.className === selectedBatch);
  const subjectNames = subjectsForBatch.map((m) => m.subjectName).filter(Boolean);

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
      Alert.alert("Error", "Could not open file picker.");
    }
  }

  async function handleSubmit() {
    if (!profile) return;
    if (!selectedBatch) { Alert.alert("Missing", "Select a batch."); return; }
    if (!selectedSubject) { Alert.alert("Missing", "Select a subject."); return; }
    if (!title.trim()) { Alert.alert("Missing", "Enter a title."); return; }
    if (!pickedFile) { Alert.alert("Missing", "Select a file to upload."); return; }

    const mapping = (mappings ?? []).find((m) => m.className === selectedBatch && m.subjectName === selectedSubject);

    setUploading(true);
    try {
      const fileUrl = await uploadMaterialFile(pickedFile, profile.userId);
      await createMaterialRecord({
        profile,
        classId: mapping?.classId ?? selectedBatch,
        className: selectedBatch,
        subjectId: mapping?.subjectId ?? selectedSubject,
        subjectName: selectedSubject,
        title: title.trim(),
        description: description.trim(),
        type: selectedType,
        fileUrl,
        fileName: pickedFile.name,
      });
      Alert.alert("Success", "Material posted successfully.", [{ text: "OK", onPress: () => navigateBack(router) }]);
    } catch (err) {
      Alert.alert("Upload failed", err instanceof Error ? err.message : "Unknown error.");
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

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Title */}
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

        {/* Description */}
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

        {/* Batch & Subject row */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Batch</Text>
            <AnimatedPressable style={s.fieldBox} onPress={() => setBatchPickerOpen(true)}>
              <Text style={[s.fieldText, !selectedBatch && { color: D.outline }]} numberOfLines={1}>{selectedBatch || "Select…"}</Text>
              <Ionicons name="chevron-down" size={14} color={D.outline} />
            </AnimatedPressable>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Subject</Text>
            <AnimatedPressable style={s.fieldBox} onPress={() => selectedBatch ? setSubjectPickerOpen(true) : Alert.alert("Select batch first")}>
              <Text style={[s.fieldText, !selectedSubject && { color: D.outline }]} numberOfLines={1}>{selectedSubject || "Select…"}</Text>
              <Ionicons name="chevron-down" size={14} color={D.outline} />
            </AnimatedPressable>
          </View>
        </View>

        {/* Type chips */}
        <Text style={s.fieldLabel}>Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {materialTypes.map((t) => (
            <AnimatedPressable key={t} style={[s.typeChip, t === selectedType && s.typeChipActive]} onPress={() => setSelectedType(t)}>
              <Text style={[s.typeText, t === selectedType && { color: D.primary }]}>{t}</Text>
            </AnimatedPressable>
          ))}
        </View>

        {/* Upload zone */}
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

        {/* Links */}
        <Text style={[s.fieldLabel, { marginBottom: 10 }]}>Links (optional)</Text>
        {links.map((link, i) => (
          <View key={i} style={s.linkRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <TextInput
                style={s.textInput}
                placeholder="Label (e.g. Reference sheet)"
                placeholderTextColor={D.outline}
                value={link.label}
                onChangeText={(v) => setLinks((prev) => prev.map((l, j) => j === i ? { ...l, label: v } : l))}
              />
              <TextInput
                style={s.textInput}
                placeholder="https://…"
                placeholderTextColor={D.outline}
                value={link.url}
                onChangeText={(v) => setLinks((prev) => prev.map((l, j) => j === i ? { ...l, url: v } : l))}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <AnimatedPressable style={s.removeLinkBtn} onPress={() => setLinks((prev) => prev.filter((_, j) => j !== i))}>
              <Ionicons name="close" size={16} color={D.outline} />
            </AnimatedPressable>
          </View>
        ))}
        <AnimatedPressable style={s.addLinkBtn} onPress={() => setLinks((prev) => [...prev, { url: "", label: "" }])}>
          <Ionicons name="add-circle-outline" size={15} color={D.primary} />
          <Text style={s.addLinkText}>Add link</Text>
        </AnimatedPressable>

        <View style={[s.infoBanner, { marginTop: 16 }]}>
          <Ionicons name="information-circle-outline" size={14} color={D.primary} />
          <Text style={s.infoText}>Material will be visible to all students in the selected batch.</Text>
        </View>
      </ScrollView>

      <View style={s.actionBar}>
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

      {/* Batch picker */}
      <Modal visible={batchPickerOpen} transparent animationType="fade" onRequestClose={() => setBatchPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setBatchPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Batch</Text>
            {batchNames.length === 0
              ? <Text style={{ fontFamily: D.font, color: D.outline, fontSize: 13 }}>No batches assigned.</Text>
              : batchNames.map((b) => (
                <Pressable
                  key={b}
                  style={[s.modalOption, b === selectedBatch && s.modalOptionActive]}
                  onPress={() => { setSelectedBatch(b); setSelectedSubject(""); setBatchPickerOpen(false); }}
                >
                  <Text style={[s.modalOptionText, b === selectedBatch && { color: D.primary, fontFamily: D.fontBold }]}>{b}</Text>
                  {b === selectedBatch && <Ionicons name="checkmark" size={16} color={D.primary} />}
                </Pressable>
              ))
            }
          </View>
        </Pressable>
      </Modal>

      {/* Subject picker */}
      <Modal visible={subjectPickerOpen} transparent animationType="fade" onRequestClose={() => setSubjectPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setSubjectPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Subject</Text>
            {subjectNames.map((sub) => (
              <Pressable
                key={sub}
                style={[s.modalOption, sub === selectedSubject && s.modalOptionActive]}
                onPress={() => { setSelectedSubject(sub ?? ""); setSubjectPickerOpen(false); }}
              >
                <Text style={[s.modalOptionText, sub === selectedSubject && { color: D.primary, fontFamily: D.fontBold }]}>{sub}</Text>
                {sub === selectedSubject && <Ionicons name="checkmark" size={16} color={D.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  fieldLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 7 },
  fieldBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  fieldText: { fontSize: 13, color: D.onSurface, letterSpacing: -0.2, fontWeight: "500", fontFamily: D.fontMedium, flex: 1 },
  textInput: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium, letterSpacing: -0.2 },
  linkRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 10 },
  removeLinkBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surfaceLow, alignItems: "center", justifyContent: "center", marginTop: 4 },
  addLinkBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, marginBottom: 4 },
  addLinkText: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.primary },
  typeChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  typeChipActive: { backgroundColor: D.surfaceLow, borderColor: D.surfaceHigh },
  typeText: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  uploadZone: { alignItems: "center", padding: 28, borderRadius: 20, borderWidth: 1.5, borderColor: D.surfaceHigh, borderStyle: "dashed", backgroundColor: D.surfaceLow, marginBottom: 16 },
  uploadIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: D.surface, alignItems: "center", justifyContent: "center", marginBottom: 12, shadowColor: D.primary, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  uploadTitle: { fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: D.primary, marginBottom: 4, textAlign: "center" },
  uploadSub: { fontSize: 12, fontFamily: D.font, color: D.outline },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 14, borderRadius: 16, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  infoText: { flex: 1, fontSize: 12.5, color: D.primary, fontWeight: "500", fontFamily: D.fontMedium, lineHeight: 18 },
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
