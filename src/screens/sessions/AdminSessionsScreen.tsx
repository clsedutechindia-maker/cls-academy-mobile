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
import { listAdminSessions } from "../../lib/erp";
import type { SessionSlotStatus } from "../../shared";
import { STATUS_META, formatSessionWhen, sessionTypeLabel } from "./sessionShared";

const FILTERS: { key: SessionSlotStatus | "all"; label: string }[] = [
  { key: "requested", label: "Requested" },
  { key: "confirmed", label: "Confirmed" },
  { key: "open", label: "Open" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

export function AdminSessionsScreen() {
  const insets = useSafeAreaInsets();
  const { adminRecord } = useSession();
  const [filter, setFilter] = useState<SessionSlotStatus | "all">("requested");

  const { data, loading, error, reload } = useResource(
    async () => (adminRecord ? listAdminSessions(adminRecord) : []),
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const all = data ?? [];
  const shown = all.filter((s) => filter === "all" || s.status === filter);

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.title}>Sessions</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
          {FILTERS.map((f) => {
            const active = f.key === filter;
            const count = f.key === "all" ? all.length : all.filter((x) => x.status === f.key).length;
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
        {loading && <View style={{ padding: 30, alignItems: "center" }}><ActivityIndicator color={D.primary} /></View>}
        {error && <Text style={s.errText}>{error}</Text>}
        {!loading && !error && shown.length === 0 && (
          <View style={s.empty}><Ionicons name="time-outline" size={30} color={D.outline} /><Text style={s.emptyText}>No sessions in this view.</Text></View>
        )}
        {shown.map((slot) => {
          const st = STATUS_META[slot.status];
          return (
            <View key={slot.id} style={s.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={s.type}>{slot.status === "open" ? "Open Slot" : sessionTypeLabel(slot.sessionType)}</Text>
                <View style={[s.pill, { backgroundColor: st.bg }]}><Text style={[s.pillText, { color: st.fg }]}>{st.label}</Text></View>
              </View>
              <Text style={s.teacher}>{slot.teacherName} · {slot.subjectName}</Text>
              {slot.bookedByName ? <Text style={s.student}>Student: {slot.bookedByName} · {slot.bookedClassName}</Text> : null}
              <Text style={s.when}>{formatSessionWhen(slot.date, slot.startTime, slot.endTime)}</Text>
              {slot.topic ? <Text style={s.topic}>“{slot.topic}”</Text> : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: D.fontBold },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, padding: 14, marginBottom: 10, gap: 4 },
  type: { fontSize: 9.5, fontFamily: D.fontBold, color: D.primary, letterSpacing: 0.5, textTransform: "uppercase" },
  teacher: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  student: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant },
  when: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant },
  topic: { fontSize: 12, fontFamily: D.font, color: D.outline, fontStyle: "italic", marginTop: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 10, fontFamily: D.fontBold, letterSpacing: 0.2 },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
  errText: { fontFamily: D.font, color: D.error, fontSize: 13, padding: 16 },
});
