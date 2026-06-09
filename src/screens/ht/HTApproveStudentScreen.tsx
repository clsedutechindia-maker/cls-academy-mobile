import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

type FieldProps = { label: string; value?: string; placeholder?: string; focused?: boolean; half?: boolean };

function Field({ label, value, placeholder, focused }: FieldProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.fieldBox, focused && s.fieldFocused]}>
        <Text style={[s.fieldText, !value && { color: D.outline }]}>{value || placeholder || ""}</Text>
      </View>
    </View>
  );
}

export function HTApproveStudentScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Back</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Approve Student</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.pageTitle}>Approve Student</Text>
        {/* Info banner */}
        <View style={s.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color={D.primary} style={{ flexShrink: 0, marginTop: 1 }} />
          <Text style={s.infoText}>
            On submit, the student will be enrolled and admin will be notified via SMS and in-app.
          </Text>
        </View>

        <Field label="Full Name" value="Vikram Nair" />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Phone" value="+91 98001 23456" /></View>
          <View style={{ flex: 1 }}><Field label="Email" placeholder="student@email.com" /></View>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Class" value="Class XI" /></View>
          <View style={{ flex: 1 }}><Field label="Stream" value="NEET (PCB)" /></View>
        </View>

        <Field label="Batch" value="NEET 11-B · Ace" focused />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Roll No." placeholder="Auto-assign" /></View>
          <View style={{ flex: 1 }}><Field label="CLS ID" placeholder="Auto-generated" /></View>
        </View>

        <Field label="Bus Route" value="Route 4 · Civil Lines → CLS" />
        <Field label="Parent / Guardian" value="Suresh Nair" />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Parent Phone" value="+91 97001 55678" /></View>
          <View style={{ flex: 1 }}><Field label="Parent Email" placeholder="parent@email.com" /></View>
        </View>
      </ScrollView>

      {/* Sticky action bar */}
      <View style={s.actionBar}>
        <AnimatedPressable style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancel</Text>
        </AnimatedPressable>
        <AnimatedPressable style={s.submitBtn}>
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={s.submitText}>Submit & Notify Admin</Text>
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
  pageTitle: { fontSize: 22, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.7, marginBottom: 16 },
  infoBanner: { flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: 16, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.primaryFixed, marginBottom: 18 },
  infoText: { flex: 1, fontSize: 12.5, fontFamily: D.fontMedium, color: D.primary, lineHeight: 18, fontWeight: "500" },
  fieldLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 5 },
  fieldBox: { padding: 13, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface },
  fieldFocused: { borderWidth: 1.5, borderColor: D.primary, shadowColor: D.primary, shadowOpacity: 0.12, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  fieldText: { fontSize: 14, fontFamily: D.fontMedium, color: D.onSurface, letterSpacing: -0.2, fontWeight: "500" },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 14, paddingBottom: 30, backgroundColor: D.bg },
  cancelBtn: { width: 80, height: 54, borderRadius: 16, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  submitBtn: { flex: 1, height: 54, borderRadius: 16, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  submitText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
});
