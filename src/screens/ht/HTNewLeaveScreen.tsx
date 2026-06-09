import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const leaveTypes = ["Casual Leave", "Sick Leave", "Personal Leave", "Emergency Leave"];

function Field({ label, value, placeholder, focused, multiline, hasChevron }: { label: string; value?: string; placeholder?: string; focused?: boolean; multiline?: boolean; hasChevron?: boolean }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.fieldBox, focused && s.fieldFocused, multiline && { minHeight: 80, alignItems: "flex-start", paddingTop: 14 }]}>
        <Text style={[s.fieldText, !value && { color: D.outline }]}>{value || placeholder || ""}</Text>
        {hasChevron && <Ionicons name="chevron-down" size={14} color={D.outline} />}
      </View>
    </View>
  );
}

export function HTNewLeaveScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Leave</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Apply for Leave</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={s.fieldLabel}>Leave Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {leaveTypes.map((t) => (
            <AnimatedPressable key={t} style={[s.typeChip, t === "Casual Leave" && s.typeChipActive]}>
              <Text style={[s.typeText, t === "Casual Leave" && { color: D.primary }]}>{t}</Text>
            </AnimatedPressable>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="From Date" value="Jun 25, 2026" hasChevron /></View>
          <View style={{ flex: 1 }}><Field label="To Date" value="Jun 25, 2026" hasChevron /></View>
        </View>

        <Field label="Reason" placeholder="Describe reason for leave…" multiline />

        <View style={s.infoBanner}>
          <Ionicons name="information-circle-outline" size={14} color={D.primary} />
          <Text style={s.infoText}>Leave request will be visible to the school admin for approval.</Text>
        </View>
      </ScrollView>

      <View style={s.actionBar}>
        <AnimatedPressable style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancel</Text>
        </AnimatedPressable>
        <AnimatedPressable style={s.submitBtn}>
          <Ionicons name="paper-plane-outline" size={16} color="#fff" />
          <Text style={s.submitText}>Submit Request</Text>
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
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 14, borderRadius: 16, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  infoText: { flex: 1, fontSize: 12.5, color: D.primary, fontWeight: "500", fontFamily: D.fontMedium, lineHeight: 18 },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 30, backgroundColor: D.bg },
  cancelBtn: { width: 80, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  submitBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  submitText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
});
