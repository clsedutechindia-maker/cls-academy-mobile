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
import { listTeachingPlansForAdmin } from "../../lib/erp";
import type { TeachingPlanRecord, TeachingPlanStatus } from "../../shared";
import { TeachingPlanCard } from "./TeachingPlanCard";

const FILTERS: { key: TeachingPlanStatus | "all"; label: string }[] = [
  { key: "submitted", label: "In Review" },
  { key: "approved", label: "Approved" },
  { key: "draft", label: "Drafts" },
  { key: "all", label: "All" },
];

export function AdminTeachingPlansScreen() {
  const insets = useSafeAreaInsets();
  const { adminRecord } = useSession();
  const [filter, setFilter] = useState<TeachingPlanStatus | "all">("submitted");

  const { data, loading, error, reload } = useResource(
    async () => (adminRecord ? listTeachingPlansForAdmin(adminRecord) : []),
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const plans = data ?? [];
  const shown = plans.filter((p) => filter === "all" || p.status === filter);

  function openDetail(plan: TeachingPlanRecord) {
    router.push({ pathname: "/(admin)/teaching-plan-detail" as never, params: { id: plan.id, g: "(admin)" } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.title}>Teaching Plans</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          {FILTERS.map((f) => {
            const active = f.key === filter;
            const count = f.key === "all" ? plans.length : plans.filter((p) => p.status === f.key).length;
            return (
              <AnimatedPressable
                key={f.key}
                style={[s.chip, { backgroundColor: active ? D.primary : D.surface, borderColor: active ? D.primary : D.outlineVariant }]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[s.chipText, { color: active ? "#fff" : D.onSurfaceVariant }]}>{f.label} · {count}</Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator color={D.primary} />
          </View>
        )}
        {error && <Text style={s.errText}>{error}</Text>}
        {!loading && !error && shown.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="book-outline" size={32} color={D.outline} />
            <Text style={s.emptyText}>No plans in this view.</Text>
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
  header: { paddingHorizontal: 18, paddingBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: D.fontBold },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
  errText: { fontFamily: D.font, color: D.error, fontSize: 13, padding: 16 },
});
