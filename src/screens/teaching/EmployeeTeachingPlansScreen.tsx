import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listTeachingPlansForEmployee } from "../../lib/erp";
import type { TeachingPlanRecord, TeachingPlanStatus } from "../../shared";
import { TeachingPlanCard } from "./TeachingPlanCard";

const FILTERS: { key: TeachingPlanStatus | "all"; label: string }[] = [
  { key: "submitted", label: "In Review" },
  { key: "approved", label: "Approved" },
  { key: "draft", label: "Drafts" },
  { key: "all", label: "All" },
];

export function EmployeeTeachingPlansScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [filter, setFilter] = useState<TeachingPlanStatus | "all">("submitted");

  const { data, loading, error, reload } = useResource(
    async () => (profile ? listTeachingPlansForEmployee(profile) : []),
    [profile?.userId],
  );

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const plans = data ?? [];
  const shown = plans.filter((p) => filter === "all" || p.status === filter);

  function openDetail(plan: TeachingPlanRecord) {
    router.push({ pathname: "/(employee)/teaching-plan-detail" as never, params: { id: plan.id, g: "(employee)" } });
  }

  function openNew() {
    router.push({ pathname: "/(employee)/teaching-plan-editor" as never, params: { mode: "create" } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.title}>Teaching Plans</Text>
          <AnimatedPressable style={s.addBtn} onPress={openNew}>
            <Ionicons name="add" size={20} color="#fff" />
          </AnimatedPressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingBottom: 12 }}>
          {FILTERS.map((f) => (
            <AnimatedPressable
              key={f.key}
              style={[s.filterChip, filter === f.key && s.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[s.filterText, { color: filter === f.key ? "#fff" : D.onSurfaceVariant }]}>{f.label}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator color={D.primary} />
          </View>
        )}
        {error && <Text style={s.errText}>{error}</Text>}
        {!loading && !error && shown.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="book-outline" size={32} color={D.outline} />
            <Text style={s.emptyText}>
              {filter === "all" ? "No teaching plans in your centre." : `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} plans.`}
            </Text>
          </View>
        )}
        {shown.map((plan) => (
          <TeachingPlanCard key={plan.id} plan={plan} onPress={() => openDetail(plan)} />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 20, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.4 },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.primaryBtn, alignItems: "center", justifyContent: "center" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  filterChipActive: { backgroundColor: D.primary, borderColor: D.primary },
  filterText: { fontSize: 12, fontWeight: "600", fontFamily: D.fontSemiBold },
  errText: { fontSize: 13, fontFamily: D.font, color: "#B91C1C", padding: 16 },
  empty: { alignItems: "center", padding: 48, gap: 12 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
});
