import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const impacts = [
  "Batch enrollment · NEET 11-B",
  "App access and student login",
  "Bus route assignment · Route 4",
  "Fee records (archived, not deleted)",
];

export function HTRemoveStudentScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Back</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Remove Student</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        {/* Warning visual */}
        <View style={s.warningSection}>
          <View style={s.trashIcon}>
            <Ionicons name="trash-outline" size={32} color="#B91C1C" />
          </View>

          <View style={s.identityRow}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#EC4899", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: "#fff" }}>AV</Text>
            </View>
            <View>
              <Text style={s.studentName}>Aanya Verma</Text>
              <Text style={s.studentMeta}>Roll 043 · NEET 11-B</Text>
            </View>
          </View>

          <Text style={s.warningTitle}>Remove this student?</Text>
          <Text style={s.warningBody}>
            Aanya will be removed from NEET 11-B and her app access will be revoked.
            Admin will be notified. This action cannot be undone.
          </Text>
        </View>

        {/* Impact list */}
        <View style={s.impactBox}>
          <Text style={s.impactTitle}>WILL BE REMOVED</Text>
          {impacts.map((item, i) => (
            <View key={i} style={[s.impactRow, i > 0 && { borderTopWidth: 1, borderTopColor: "#FECACA" }]}>
              <View style={s.impactDot} />
              <Text style={s.impactText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={{ gap: 10, marginTop: 24 }}>
          <AnimatedPressable style={s.removeBtn} onPress={() => router.back()}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={s.removeBtnText}>Yes, Remove Student</Text>
          </AnimatedPressable>
          <AnimatedPressable style={s.cancelBtn} onPress={() => router.back()}>
            <Text style={s.cancelText}>Cancel</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 10, backgroundColor: D.bg },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingRight: 10, paddingLeft: 6, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, height: 38 },
  backText: { fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  headerTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  warningSection: { alignItems: "center", paddingVertical: 24, textAlign: "center" },
  trashIcon: { width: 76, height: 76, borderRadius: 26, backgroundColor: "#FEF2F2", borderWidth: 2, borderColor: "#FECACA", alignItems: "center", justifyContent: "center" },
  identityRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 },
  studentName: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  studentMeta: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant, marginTop: 2 },
  warningTitle: { marginTop: 16, fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.4, lineHeight: 26, textAlign: "center" },
  warningBody: { marginTop: 8, fontSize: 13, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 21, letterSpacing: -0.1, textAlign: "center" },
  impactBox: { padding: 16, borderRadius: 20, backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", marginTop: 4 },
  impactTitle: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, color: "#B91C1C", letterSpacing: 0.5, marginBottom: 12 },
  impactRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 },
  impactDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#EF4444", flexShrink: 0 },
  impactText: { fontSize: 13, fontFamily: D.font, color: "#7F1D1D", letterSpacing: -0.1 },
  removeBtn: { height: 54, borderRadius: 16, backgroundColor: "#EF4444", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: "#EF4444", shadowOpacity: 0.3, shadowRadius: 22, shadowOffset: { width: 0, height: 8 } },
  removeBtnText: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
  cancelBtn: { height: 54, borderRadius: 16, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 15, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface, letterSpacing: -0.2 },
});
