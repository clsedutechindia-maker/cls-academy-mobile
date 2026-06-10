import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { createCircular } from "../../lib/erp";
import { useSession } from "../../providers/session";

const tags = ["Exam", "Holiday", "PTM", "Fees", "General"];
const audiences = ["All Students", "NEET 11-B", "NEET 11-A", "NEET 12-A", "All Staff"];

export function HTPostCircularScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTag, setSelectedTag] = useState("General");
  const [selectedAudience, setSelectedAudience] = useState("All Students");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!profile) return;
    if (!title.trim()) {
      Alert.alert("Missing Info", "Enter a title for the circular.");
      return;
    }
    if (!body.trim()) {
      Alert.alert("Missing Info", "Enter circular body text.");
      return;
    }
    setSubmitting(true);
    try {
      await createCircular({ profile, title, body, tag: selectedTag, audience: selectedAudience });
      Alert.alert("Posted", "Circular posted successfully.", [
        { text: "OK", onPress: () => navigateBack(router) },
      ]);
    } catch {
      Alert.alert("Error", "Could not post circular. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.navTitle}>Post Circular</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={s.fieldLabel}>Title</Text>
        <TextInput
          style={s.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter circular title…"
          placeholderTextColor={D.outline}
        />

        <Text style={s.fieldLabel}>Body</Text>
        <TextInput
          style={[s.input, s.inputMulti]}
          value={body}
          onChangeText={setBody}
          placeholder="Enter circular details…"
          placeholderTextColor={D.outline}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />

        <Text style={s.fieldLabel}>Tag</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {tags.map((t) => (
            <AnimatedPressable key={t} style={[s.tagChip, t === selectedTag && s.tagChipActive]} onPress={() => setSelectedTag(t)}>
              <Text style={[s.tagText, t === selectedTag && { color: D.primary }]}>{t}</Text>
            </AnimatedPressable>
          ))}
        </View>

        <Text style={s.fieldLabel}>Audience</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {audiences.map((a) => (
            <AnimatedPressable key={a} style={[s.tagChip, a === selectedAudience && s.tagChipActive]} onPress={() => setSelectedAudience(a)}>
              <Text style={[s.tagText, a === selectedAudience && { color: D.primary }]}>{a}</Text>
            </AnimatedPressable>
          ))}
        </View>
      </ScrollView>

      <View style={s.actionBar}>
        <AnimatedPressable style={s.cancelBtn} onPress={() => navigateBack(router)}>
          <Text style={s.cancelText}>Cancel</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={() => void handleSubmit()} disabled={submitting}>
          <Ionicons name="megaphone-outline" size={16} color="#fff" />
          <Text style={s.submitText}>{submitting ? "Posting…" : "Post Circular"}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fieldLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 7 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium, marginBottom: 16 },
  inputMulti: { minHeight: 110, textAlignVertical: "top" },
  tagChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  tagChipActive: { backgroundColor: D.surfaceLow, borderColor: D.primary },
  tagText: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 30, backgroundColor: D.bg },
  cancelBtn: { width: 80, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  submitBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  submitText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
});
