import { useCallback } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listTeachingPlansForTeacher } from "../../lib/erp";
import type { TeachingPlanRecord } from "../../shared";
import { TeachingPlanCard } from "./TeachingPlanCard";
import { formatMonthLabel } from "./teachingPlanShared";

export function TeacherTeachingPlansScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const group = profile?.teacherRole === "head_teacher" ? "(head-teacher)" : "(teacher)";

  const { data, loading, error, reload } = useResource(
    async () => (profile ? listTeachingPlansForTeacher(profile) : []),
    [profile?.userId],
  );

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const plans = data ?? [];
  const months = Array.from(new Set(plans.map((p) => p.monthKey))).sort((a, b) => b.localeCompare(a));

  function openDetail(plan: TeachingPlanRecord) {
    router.push({ pathname: `/${group}/teaching-plan-detail` as never, params: { id: plan.id, g: group } });
  }

  function openNew() {
    router.push({ pathname: `/${group}/teaching-plan-editor` as never, params: { mode: "create" } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
          <Ionicons name="arrow-back" size={18} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.title}>Teaching Plans</Text>
        <AnimatedPressable style={s.addBtn} onPress={openNew}>
          <Ionicons name="add" size={20} color="#fff" />
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator color={D.primary} />
          </View>
        )}
        {error && <Text style={s.errText}>{error}</Text>}
        {!loading && !error && plans.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="book-outline" size={32} color={D.outline} />
            <Text style={s.emptyText}>No teaching plans yet. Tap + to create one.</Text>
          </View>
        )}
        {months.map((month) => (
          <View key={month}>
            <Text style={s.monthLabel}>{formatMonthLabel(month)}</Text>
            {plans.filter((p) => p.monthKey === month).map((plan) => (
              <TeachingPlanCard key={plan.id} plan={plan} onPress={() => openDetail(plan)} />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingBottom: 16 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 24, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: D.primaryBtn, alignItems: "center", justifyContent: "center" },
  monthLabel: { fontSize: 11, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10, marginTop: 6 },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
  errText: { fontFamily: D.font, color: D.error, fontSize: 13, padding: 16 },
});
