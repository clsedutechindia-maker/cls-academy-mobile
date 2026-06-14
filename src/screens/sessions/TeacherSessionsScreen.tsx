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
import { completeSession, listTeacherSessionSlots } from "../../lib/erp";
import { showAlert } from "../../lib/alert";
import { STATUS_META, formatSessionWhen, sessionTypeLabel } from "./sessionShared";

export function TeacherSessionsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const slotsRes = useResource(
    async () => (profile ? listTeacherSessionSlots(profile) : []),
    [profile?.userId],
  );
  const slots = slotsRes.data ?? [];
  const actor = { userId: profile?.userId ?? "", name: profile?.name || "Teacher" };

  useFocusEffect(useCallback(() => { void slotsRes.reload(); }, [slotsRes.reload]));

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = slots.filter((s) => s.status !== "completed" && s.date >= today)
    .sort((a, b) => `${a.date}-${a.startTime}`.localeCompare(`${b.date}-${b.startTime}`));
  const past = slots.filter((s) => s.status === "completed" || s.date < today)
    .sort((a, b) => `${b.date}-${b.startTime}`.localeCompare(`${a.date}-${a.startTime}`));

  async function markDone(id: string) {
    try {
      await completeSession(id, actor);
      await slotsRes.reload();
    } catch {
      showAlert("Error", "Could not mark complete. Try again.");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.title}>Sessions</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {slotsRes.loading && (
          <View style={{ padding: 30, alignItems: "center" }}><ActivityIndicator color={D.primary} /></View>
        )}

        {!slotsRes.loading && upcoming.length === 0 && past.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="calendar-outline" size={30} color={D.outline} />
            <Text style={s.emptyText}>No sessions assigned yet.</Text>
          </View>
        )}

        {!slotsRes.loading && upcoming.length > 0 && (
          <>
            <Text style={s.sectionLabel}>UPCOMING</Text>
            {upcoming.map((slot) => {
              const st = STATUS_META[slot.status];
              const booked = !!slot.bookedByName;
              return (
                <View key={slot.id} style={s.card}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Text style={s.cardType}>
                      {booked ? sessionTypeLabel(slot.sessionType) : "Open Slot"}
                    </Text>
                    <View style={[s.pill, { backgroundColor: st.bg }]}>
                      <Text style={[s.pillText, { color: st.fg }]}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={s.cardWhen}>{formatSessionWhen(slot.date, slot.startTime, slot.endTime)}</Text>
                  <Text style={s.cardMeta}>{slot.subjectName}{slot.locationNote ? ` · ${slot.locationNote}` : ""}</Text>
                  {booked && (
                    <Text style={s.cardStudent}>{slot.bookedByName} · {slot.bookedClassName}</Text>
                  )}
                  {slot.topic ? <Text style={s.cardTopic}>"{slot.topic}"</Text> : null}
                  {slot.status === "confirmed" && (
                    <AnimatedPressable style={s.doneBtn} onPress={() => void markDone(slot.id)}>
                      <Ionicons name="checkmark-done" size={14} color={D.primary} />
                      <Text style={s.doneBtnText}>Mark complete</Text>
                    </AnimatedPressable>
                  )}
                </View>
              );
            })}
          </>
        )}

        {!slotsRes.loading && past.length > 0 && (
          <>
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>PAST</Text>
            <View style={s.listCard}>
              {past.map((slot, i) => {
                const st = STATUS_META[slot.status];
                return (
                  <View key={slot.id} style={[s.listRow, i < past.length - 1 && s.divider]}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.listWhen}>{formatSessionWhen(slot.date, slot.startTime, slot.endTime)}</Text>
                      <Text style={s.listMeta}>
                        {slot.subjectName}
                        {slot.bookedByName ? ` · ${slot.bookedByName}` : ""}
                      </Text>
                    </View>
                    <View style={[s.pill, { backgroundColor: st.bg }]}>
                      <Text style={[s.pillText, { color: st.fg }]}>{st.label}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 14 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 24, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  sectionLabel: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.6, marginBottom: 10, marginTop: 4 },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, padding: 14, marginBottom: 10, gap: 4 },
  cardType: { fontSize: 9.5, fontFamily: D.fontBold, color: D.primary, letterSpacing: 0.5, textTransform: "uppercase" },
  cardWhen: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  cardMeta: { fontSize: 11.5, fontFamily: D.font, color: D.onSurfaceVariant },
  cardStudent: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.onSurface, marginTop: 2 },
  cardTopic: { fontSize: 12, fontFamily: D.font, color: D.outline, fontStyle: "italic", marginTop: 2 },
  doneBtn: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", marginTop: 10, backgroundColor: D.surfaceLow, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  doneBtnText: { fontSize: 12, fontFamily: D.fontBold, color: D.primary },
  listCard: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  listRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  listWhen: { fontSize: 12.5, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  listMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 3 },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 10, fontFamily: D.fontBold, letterSpacing: 0.2 },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
});
