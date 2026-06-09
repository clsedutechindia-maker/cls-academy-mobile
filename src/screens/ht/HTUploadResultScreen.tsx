import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const studentMarks = [
  { n: "Aanya Verma", marks: "47" },
  { n: "Arjun Singh", marks: "31" },
  { n: "Karthik Reddy", marks: "38" },
  { n: "Meera Patel", marks: "" },
  { n: "Priya Joshi", marks: "28" },
  { n: "Rahul Sharma", marks: "44" },
  { n: "Sahil Kumar", marks: "36" },
];

type FieldProps = { label: string; value?: string; placeholder?: string; focused?: boolean; half?: boolean };
function Field({ label, value, placeholder, focused }: FieldProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={[s.fieldBox, focused && s.fieldFocused]}>
        <Text style={[s.fieldText, !value && { color: D.outline }]}>{value || placeholder || ""}</Text>
        {!value && <Ionicons name="chevron-down" size={14} color={D.outline} />}
      </View>
    </View>
  );
}

export function HTUploadResultScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Results</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Upload Result</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Upload Result</Text>
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <View style={{ flex: 1 }}><Field label="Batch" value="NEET 11-B" /></View>
          <View style={{ flex: 1 }}><Field label="Subject" value="Biology" focused /></View>
        </View>
        <Field label="Test Name" value="Cell Division Unit Test" />
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <View style={{ flex: 1 }}><Field label="Total Marks" value="50" /></View>
          <View style={{ flex: 1 }}><Field label="Test Date" value="Jun 5, 2026" /></View>
        </View>

        <Text style={s.sectionLabel}>STUDENT MARKS · {studentMarks.length} STUDENTS</Text>
        <View style={s.card}>
          <View style={[s.tableHeader, { backgroundColor: D.bg }]}>
            <Text style={s.colLabel}>STUDENT</Text>
            <Text style={[s.colLabel, { width: 80, textAlign: "center" }]}>MARKS / 50</Text>
          </View>
          {studentMarks.map((st, i) => (
            <View key={st.n} style={[s.markRow, i < studentMarks.length - 1 && s.divider]}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#6366F1", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" }}>{st.n.split(" ").map((w) => w[0]).join("")}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: "500", fontFamily: D.fontMedium, color: D.onSurface, letterSpacing: -0.1 }}>{st.n}</Text>
              <View style={[s.marksInput, st.marks ? s.marksInputFilled : s.marksInputEmpty]}>
                <Text style={[s.marksText, { color: st.marks ? D.primary : D.outline }]}>{st.marks || "—"}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Missing marks warning */}
        <View style={s.warnBanner}>
          <Ionicons name="warning-outline" size={14} color="#92400E" />
          <Text style={s.warnText}>1 student's marks missing — Meera Patel</Text>
        </View>
      </ScrollView>

      <View style={s.actionBar}>
        <AnimatedPressable style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancel</Text>
        </AnimatedPressable>
        <AnimatedPressable style={s.submitBtn}>
          <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
          <Text style={s.submitText}>Submit Results</Text>
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
  fieldLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 5 },
  fieldBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  fieldFocused: { borderWidth: 1.5, borderColor: D.primary },
  fieldText: { fontSize: 13, color: D.onSurface, letterSpacing: -0.2, fontWeight: "500", fontFamily: D.fontMedium },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  tableHeader: { flexDirection: "row", alignItems: "center", padding: 8, borderBottomWidth: 1, borderBottomColor: D.outlineVariant, paddingHorizontal: 14 },
  colLabel: { flex: 1, fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.4 },
  markRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, paddingHorizontal: 14 },
  marksInput: { width: 80, padding: 7, borderRadius: 10, alignItems: "center" },
  marksInputFilled: { backgroundColor: D.surfaceLow, borderWidth: 1.5, borderColor: D.surfaceHigh },
  marksInputEmpty: { backgroundColor: "#F8F8F8", borderWidth: 1, borderColor: D.outlineVariant },
  marksText: { fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: -0.2 },
  warnBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A" },
  warnText: { fontSize: 12.5, color: "#92400E", fontWeight: "500", fontFamily: D.fontMedium },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 30, backgroundColor: D.bg },
  cancelBtn: { width: 80, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  submitBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  submitText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
});
