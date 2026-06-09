import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const materialTypes = ["Notes", "Solutions", "Diagrams", "Problems", "Reference"];

function Field({ label, value, placeholder, focused, hasChevron }: { label: string; value?: string; placeholder?: string; focused?: boolean; hasChevron?: boolean }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.fieldBox, focused && s.fieldFocused]}>
        <Text style={[s.fieldText, !value && { color: D.outline }]}>{value || placeholder || ""}</Text>
        {hasChevron && <Ionicons name="chevron-down" size={14} color={D.outline} />}
      </View>
    </View>
  );
}

export function HTPostMaterialScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Materials</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Post Material</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Field label="Title" value="Electrostatics Revision Notes" focused />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Batch" value="NEET 12-A" hasChevron /></View>
          <View style={{ flex: 1 }}><Field label="Subject" value="Physics" hasChevron /></View>
        </View>

        <Text style={s.fieldLabel}>Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {materialTypes.map((t) => (
            <AnimatedPressable key={t} style={[s.typeChip, t === "Notes" && s.typeChipActive]}>
              <Text style={[s.typeText, t === "Notes" && { color: D.primary }]}>{t}</Text>
            </AnimatedPressable>
          ))}
        </View>

        {/* Upload zone */}
        <Text style={s.fieldLabel}>File</Text>
        <AnimatedPressable style={s.uploadZone}>
          <View style={s.uploadIcon}>
            <Ionicons name="cloud-upload-outline" size={28} color={D.primary} />
          </View>
          <Text style={s.uploadTitle}>Tap to upload file</Text>
          <Text style={s.uploadSub}>PDF, images, or docs · max 20 MB</Text>
        </AnimatedPressable>

        <View style={s.infoBanner}>
          <Ionicons name="information-circle-outline" size={14} color={D.primary} />
          <Text style={s.infoText}>Material will be visible to all students in the selected batch.</Text>
        </View>
      </ScrollView>

      <View style={s.actionBar}>
        <AnimatedPressable style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancel</Text>
        </AnimatedPressable>
        <AnimatedPressable style={s.submitBtn}>
          <Ionicons name="library-outline" size={16} color="#fff" />
          <Text style={s.submitText}>Post Material</Text>
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
  typeChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  typeChipActive: { backgroundColor: D.surfaceLow, borderColor: D.surfaceHigh },
  typeText: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  uploadZone: { alignItems: "center", padding: 28, borderRadius: 20, borderWidth: 1.5, borderColor: D.surfaceHigh, borderStyle: "dashed", backgroundColor: D.surfaceLow, marginBottom: 16 },
  uploadIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: D.surface, alignItems: "center", justifyContent: "center", marginBottom: 12, shadowColor: D.primary, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  uploadTitle: { fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: D.primary, marginBottom: 4 },
  uploadSub: { fontSize: 12, fontFamily: D.font, color: D.outline },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 14, borderRadius: 16, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  infoText: { flex: 1, fontSize: 12.5, color: D.primary, fontWeight: "500", fontFamily: D.fontMedium, lineHeight: 18 },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 30, backgroundColor: D.bg },
  cancelBtn: { width: 80, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  submitBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  submitText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
});
