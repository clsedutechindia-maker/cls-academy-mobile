import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { submitTeacherLeaveRequest } from "../../lib/erp";
import { useSession } from "../../providers/session";

const leaveTypes = ["Casual Leave", "Sick Leave", "Personal Leave", "Emergency Leave"];

function todayIso(): string {
  const d = new Date();
  return d.toISOString().split("T")[0]!;
}

export function HTNewLeaveScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const [selectedType, setSelectedType] = useState("Casual Leave");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!profile) return;
    if (!reason.trim()) {
      Alert.alert("Missing Info", "Enter reason for leave.");
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert("Missing Info", "Enter start and end dates (YYYY-MM-DD).");
      return;
    }
    setSubmitting(true);
    try {
      await submitTeacherLeaveRequest({ profile, startDate, endDate, reason, leaveType: selectedType });
      Alert.alert("Submitted", "Leave request submitted for admin approval.", [
        { text: "OK", onPress: () => navigateBack(router) },
      ]);
    } catch {
      Alert.alert("Error", "Could not submit request. Try again.");
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
        <Text style={s.navTitle}>Apply for Leave</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={s.fieldLabel}>Leave Type</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
          {leaveTypes.map((t) => (
            <AnimatedPressable key={t} style={[s.typeChip, t === selectedType && s.typeChipActive]} onPress={() => setSelectedType(t)}>
              <Text style={[s.typeText, t === selectedType && { color: D.primary }]}>{t}</Text>
            </AnimatedPressable>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>From Date</Text>
            <TextInput
              style={s.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={D.outline}
              autoCapitalize="none"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>To Date</Text>
            <TextInput
              style={s.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={D.outline}
              autoCapitalize="none"
            />
          </View>
        </View>

        <Text style={[s.fieldLabel, { marginTop: 4 }]}>Reason</Text>
        <TextInput
          style={[s.input, s.inputMulti]}
          value={reason}
          onChangeText={setReason}
          placeholder="Describe reason for leave…"
          placeholderTextColor={D.outline}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={s.infoBanner}>
          <Ionicons name="information-circle-outline" size={14} color={D.primary} />
          <Text style={s.infoText}>Leave request will be visible to the school admin for approval.</Text>
        </View>
      </ScrollView>

      <View style={s.actionBar}>
        <AnimatedPressable style={s.cancelBtn} onPress={() => navigateBack(router)}>
          <Text style={s.cancelText}>Cancel</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[s.submitBtn, submitting && { opacity: 0.6 }]} onPress={() => void handleSubmit()} disabled={submitting}>
          <Ionicons name="paper-plane-outline" size={16} color="#fff" />
          <Text style={s.submitText}>{submitting ? "Submitting…" : "Submit Request"}</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fieldLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 7 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium, marginBottom: 16 },
  inputMulti: { minHeight: 90, textAlignVertical: "top" },
  typeChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  typeChipActive: { backgroundColor: D.surfaceLow, borderColor: D.primary },
  typeText: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 14, borderRadius: 16, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  infoText: { flex: 1, fontSize: 12.5, color: D.primary, fontWeight: "500", fontFamily: D.fontMedium, lineHeight: 18 },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 96, backgroundColor: D.bg },
  cancelBtn: { width: 80, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  submitBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  submitText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
});
