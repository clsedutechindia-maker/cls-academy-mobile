import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { D } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { AdminStudentApprovalsScreen } from "./AdminStudentApprovalsScreen";
import { AdminTeacherApprovalsScreen } from "./AdminTeacherApprovalsScreen";

type Tab = "students" | "staff";

// Combines the student + staff approval queues behind one Operations card.
export function AdminApprovalsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === "staff" ? "staff" : "students");

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.headerSection, { paddingTop: insets.top + 16 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.pageTitle}>Approvals</Text>
        </View>
        <View style={s.segment}>
          {(["students", "staff"] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <AnimatedPressable key={t} style={[s.segmentBtn, active && s.segmentBtnActive]} onPress={() => setTab(t)}>
                <Text style={[s.segmentText, active && s.segmentTextActive]}>{t === "students" ? "Students" : "Staff"}</Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>

      {tab === "students" ? <AdminStudentApprovalsScreen embedded /> : <AdminTeacherApprovalsScreen embedded />}
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 12, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 24, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  segment: { flexDirection: "row", gap: 4, backgroundColor: D.surfaceLow, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: D.outlineVariant },
  segmentBtn: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 8 },
  segmentBtnActive: { backgroundColor: D.surface, shadowColor: D.primary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
  segmentText: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  segmentTextActive: { color: D.onSurface, fontFamily: D.fontBold },
});
