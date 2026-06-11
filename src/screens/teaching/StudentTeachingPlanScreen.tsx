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
import { listTeachingPlansForStudent } from "../../lib/erp";
import type { TeachingPlanRecord } from "../../shared";
import { TeachingPlanCard } from "./TeachingPlanCard";
import { formatMonthLabel } from "./teachingPlanShared";

export function StudentTeachingPlanScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [subject, setSubject] = useState<string>("All");

  const { data, loading, error, reload } = useResource(
    async () => (profile ? listTeachingPlansForStudent(profile) : []),
    [profile?.userId, profile?.classId],
  );

  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const plans = data ?? [];
  const subjects = ["All", ...Array.from(new Set(plans.map((p) => p.subjectName).filter(Boolean)))];
  const shown = plans.filter((p) => subject === "All" || p.subjectName === subject);
  const months = Array.from(new Set(shown.map((p) => p.monthKey))).sort((a, b) => b.localeCompare(a));

  function openDetail(plan: TeachingPlanRecord) {
    router.push({ pathname: "/(student)/teaching-plan-detail" as never, params: { id: plan.id, g: "(student)" } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.title}>Teaching Plan</Text>
        </View>
        {subjects.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
            {subjects.map((sub) => {
              const active = sub === subject;
              return (
                <AnimatedPressable
                  key={sub}
                  style={[s.chip, { backgroundColor: active ? D.primary : D.surface, borderColor: active ? D.primary : D.outlineVariant }]}
                  onPress={() => setSubject(sub)}
                >
                  <Text style={[s.chipText, { color: active ? "#fff" : D.onSurfaceVariant }]}>{sub}</Text>
                </AnimatedPressable>
              );
            })}
          </ScrollView>
        )}
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
            <Text style={s.emptyText}>No teaching plans published yet.</Text>
          </View>
        )}
        {months.map((month) => (
          <View key={month}>
            <Text style={s.monthLabel}>{formatMonthLabel(month)}</Text>
            {shown.filter((p) => p.monthKey === month).map((plan) => (
              <TeachingPlanCard key={plan.id} plan={plan} onPress={() => openDetail(plan)} />
            ))}
          </View>
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
  monthLabel: { fontSize: 11, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10, marginTop: 6 },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
  errText: { fontFamily: D.font, color: D.error, fontSize: 13, padding: 16 },
});
