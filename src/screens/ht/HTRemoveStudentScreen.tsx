import { Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { removeStudentFromCentre } from "../../lib/erp";

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "?";
}

export function HTRemoveStudentScreen() {
  const insets = useSafeAreaInsets();
  const { userId, name } = useLocalSearchParams<{ userId: string; name: string }>();
  const [removing, setRemoving] = useState(false);

  const displayName = name || "Unknown Student";

  async function handleRemove() {
    if (!userId) {
      Alert.alert("Error", "Student ID not found.");
      return;
    }
    setRemoving(true);
    try {
      await removeStudentFromCentre(userId);
      Alert.alert("Removed", `${displayName} has been removed and their access revoked.`, [
        { text: "OK", onPress: () => navigateBack(router) },
      ]);
    } catch {
      Alert.alert("Error", "Could not remove student. Try again.");
      setRemoving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.navTitle}>Remove Student</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={{ flex: 1, padding: 20 }}>
        <View style={s.warningSection}>
          <View style={s.trashIcon}>
            <Ionicons name="trash-outline" size={32} color="#B91C1C" />
          </View>

          <View style={s.identityRow}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#EC4899", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: "#fff" }}>{initials(displayName)}</Text>
            </View>
            <View>
              <Text style={s.studentName}>{displayName}</Text>
            </View>
          </View>

          <Text style={s.warningTitle}>Remove this student?</Text>
          <Text style={s.warningBody}>
            {displayName} will be deactivated and their app access will be revoked. Admin will be notified. This action cannot be undone.
          </Text>
        </View>

        <View style={s.impactBox}>
          <Text style={s.impactTitle}>WILL BE AFFECTED</Text>
          {["Batch enrollment", "App access and student login", "Fee records (archived, not deleted)"].map((item, i) => (
            <View key={i} style={[s.impactRow, i > 0 && { borderTopWidth: 1, borderTopColor: "#FECACA" }]}>
              <View style={s.impactDot} />
              <Text style={s.impactText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 10, marginTop: 24 }}>
          <AnimatedPressable style={[s.removeBtn, removing && { opacity: 0.6 }]} onPress={() => void handleRemove()} disabled={removing}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={s.removeBtnText}>{removing ? "Removing…" : "Yes, Remove Student"}</Text>
          </AnimatedPressable>
          <AnimatedPressable style={s.cancelBtn} onPress={() => navigateBack(router)}>
            <Text style={s.cancelText}>Cancel</Text>
          </AnimatedPressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  warningSection: { alignItems: "center", paddingVertical: 24 },
  trashIcon: { width: 76, height: 76, borderRadius: 26, backgroundColor: "#FEF2F2", borderWidth: 2, borderColor: "#FECACA", alignItems: "center", justifyContent: "center" },
  identityRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20 },
  studentName: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
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
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
});
