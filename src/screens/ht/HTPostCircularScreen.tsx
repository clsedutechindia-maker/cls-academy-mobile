import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const tags = ["Exam", "Holiday", "PTM", "Fees", "General"];
const audiences = ["All Students", "NEET 11-B", "NEET 11-A", "NEET 12-A", "All Staff"];

function Field({ label, value, placeholder, focused, multiline }: { label: string; value?: string; placeholder?: string; focused?: boolean; multiline?: boolean }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.fieldBox, focused && s.fieldFocused, multiline && { minHeight: 90, alignItems: "flex-start", paddingTop: 14 }]}>
        <Text style={[s.fieldText, !value && { color: D.outline }]}>{value || placeholder || ""}</Text>
      </View>
    </View>
  );
}

export function HTPostCircularScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Circulars</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Post Circular</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Field label="Title" value="JEE Mock #14 — schedule released" focused />
        <Field label="Body" value="Computer-based test will be held in Hall C on Saturday, Jun 14 at 1:30 PM. Students must carry their hall tickets and report 30 minutes early." multiline />

        <Text style={s.fieldLabel}>Tag</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {tags.map((t) => (
            <AnimatedPressable key={t} style={[s.tagChip, t === "Exam" && s.tagChipActive]}>
              <Text style={[s.tagText, t === "Exam" && { color: D.primary }]}>{t}</Text>
            </AnimatedPressable>
          ))}
        </View>

        <Text style={s.fieldLabel}>Audience</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {audiences.map((a) => (
            <AnimatedPressable key={a} style={[s.tagChip, a === "NEET 11-B" && s.tagChipActive]}>
              <Text style={[s.tagText, a === "NEET 11-B" && { color: D.primary }]}>{a}</Text>
            </AnimatedPressable>
          ))}
        </View>

        {/* Attachment */}
        <Text style={s.fieldLabel}>Attachment (optional)</Text>
        <AnimatedPressable style={s.attachBox}>
          <Ionicons name="attach" size={18} color={D.primary} />
          <Text style={s.attachText}>Tap to attach PDF or image</Text>
        </AnimatedPressable>
      </ScrollView>

      <View style={s.actionBar}>
        <AnimatedPressable style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancel</Text>
        </AnimatedPressable>
        <AnimatedPressable style={s.submitBtn}>
          <Ionicons name="megaphone-outline" size={16} color="#fff" />
          <Text style={s.submitText}>Post Circular</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 10, backgroundColor: D.bg },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingRight: 10, paddingLeft: 6, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, height: 38 },
  backText: { fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  headerTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  fieldLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 7 },
  fieldBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  fieldFocused: { borderWidth: 1.5, borderColor: D.primary },
  fieldText: { fontSize: 13, color: D.onSurface, letterSpacing: -0.2, fontWeight: "500", fontFamily: D.fontMedium, flex: 1 },
  tagChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  tagChipActive: { backgroundColor: D.surfaceLow, borderColor: D.surfaceHigh },
  tagText: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  attachBox: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 18, borderRadius: 16, borderWidth: 1.5, borderColor: D.surfaceHigh, borderStyle: "dashed", backgroundColor: D.surfaceLow },
  attachText: { fontSize: 13, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.primary },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 30, backgroundColor: D.bg },
  cancelBtn: { width: 80, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  submitBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  submitText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
});
