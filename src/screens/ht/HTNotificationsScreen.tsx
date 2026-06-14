import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useCachedResource } from "../../hooks/useResource";
import { listDoubtsForTeacher, listStudentLeaveRequestsForTeacher, listTeacherSessionSlots, listTeachingPlansForTeacher, type StudentLeaveRequestRecord } from "../../lib/erp";
import type { SessionSlotRecord, TeachingPlanRecord } from "../../shared";

function relativeTime(isoStr: string) {
  if (!isoStr) return "—";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function HTNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const { data, loading, error } = useCachedResource(
    `notif-staff:${profile?.userId ?? "anon"}`,
    async () => {
      if (!profile) {
        return {
          doubts: [],
          studentLeaves: [] as StudentLeaveRequestRecord[],
          sessionRequests: [] as SessionSlotRecord[],
          planUpdates: [] as TeachingPlanRecord[],
        };
      }
      const [doubts, studentLeaves, slots, plans] = await Promise.all([
        listDoubtsForTeacher(profile),
        listStudentLeaveRequestsForTeacher(profile),
        listTeacherSessionSlots(profile),
        listTeachingPlansForTeacher(profile),
      ]);
      const sessionRequests = slots.filter((slot) => slot.status === "requested");
      const planUpdates = plans.filter((plan) => plan.status === "approved" || (plan.status === "draft" && !!plan.reviewNote));
      return { doubts, studentLeaves, sessionRequests, planUpdates };
    },
    [profile?.userId],
  );

  const doubts = data?.doubts ?? [];
  const studentLeaves = (data?.studentLeaves ?? []).filter((l) => l.status === "pending");
  const sessionRequests = data?.sessionRequests ?? [];
  const planUpdates = data?.planUpdates ?? [];
  const openDoubts = doubts.filter((d) => d.status === "open");
  const repliedDoubts = doubts.filter((d) => d.status !== "open");

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.navTitle}>Notifications</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={[s.card, { padding: 20, alignItems: "center" }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>Loading…</Text>
          </View>
        )}

        {error && (
          <View style={[s.card, { padding: 16 }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: "#B91C1C" }}>{error}</Text>
          </View>
        )}

        {!loading && !error && (
          <>
            {/* Pending student leave requests */}
            {studentLeaves.length > 0 && (
              <>
                <Text style={s.sectionLabel}>STUDENT LEAVES · {studentLeaves.length}</Text>
                <View style={[s.card, { marginBottom: 18 }]}>
                  {studentLeaves.map((l, i) => (
                    <AnimatedPressable
                      key={l.id}
                      style={[s.notifRow, i < studentLeaves.length - 1 && s.divider]}
                      onPress={() => router.push("/(team)/leave")}
                    >
                      <View style={[s.notifIcon, { backgroundColor: "#FEF3C7" }]}>
                        <Ionicons name="calendar-outline" size={16} color="#D97706" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.notifTitle}>Leave request — {l.studentName}</Text>
                        <Text style={s.notifMsg} numberOfLines={2}>{l.className} · {l.startDate}{l.endDate !== l.startDate ? ` to ${l.endDate}` : ""} · {l.reason}</Text>
                        <Text style={s.notifTime}>{relativeTime(l.requestedAtIso)}</Text>
                      </View>
                      <View style={s.newDot} />
                    </AnimatedPressable>
                  ))}
                </View>
              </>
            )}

            {/* Pending session requests */}
            {sessionRequests.length > 0 && (
              <>
                <Text style={s.sectionLabel}>SESSION REQUESTS · {sessionRequests.length}</Text>
                <View style={[s.card, { marginBottom: 18 }]}>
                  {sessionRequests.map((slot, i) => (
                    <AnimatedPressable
                      key={slot.id}
                      style={[s.notifRow, i < sessionRequests.length - 1 && s.divider]}
                      onPress={() => router.push("/(team)/sessions")}
                    >
                      <View style={[s.notifIcon, { backgroundColor: "#EEF2FF" }]}>
                        <Ionicons name="calendar-outline" size={16} color="#6366F1" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.notifTitle}>Session request — {slot.bookedByName || "Student"}</Text>
                        <Text style={s.notifMsg} numberOfLines={2}>{slot.subjectName || "Doubt session"} · {slot.date} {slot.startTime}</Text>
                        <Text style={s.notifTime}>{relativeTime(slot.updatedAtIso || slot.createdAtIso)}</Text>
                      </View>
                      <View style={s.newDot} />
                    </AnimatedPressable>
                  ))}
                </View>
              </>
            )}

            {/* Teaching plan status updates */}
            {planUpdates.length > 0 && (
              <>
                <Text style={s.sectionLabel}>PLAN UPDATES · {planUpdates.length}</Text>
                <View style={[s.card, { marginBottom: 18 }]}>
                  {planUpdates.slice(0, 10).map((plan, i) => {
                    const approved = plan.status === "approved";
                    return (
                      <AnimatedPressable
                        key={plan.id}
                        style={[s.notifRow, i < Math.min(planUpdates.length, 10) - 1 && s.divider]}
                        onPress={() => router.push({ pathname: "/(team)/teaching-plan-detail", params: { planId: plan.id } })}
                      >
                        <View style={[s.notifIcon, { backgroundColor: approved ? "#DCFCE7" : "#FEE2E2" }]}>
                          <Ionicons name={approved ? "checkmark-circle-outline" : "alert-circle-outline"} size={16} color={approved ? "#15803D" : "#B91C1C"} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.notifTitle}>Teaching plan {approved ? "approved" : "needs changes"}</Text>
                          <Text style={s.notifMsg} numberOfLines={2}>{plan.subjectName} · week of {plan.weekStartDate}{!approved && plan.reviewNote ? ` · ${plan.reviewNote}` : ""}</Text>
                          <Text style={s.notifTime}>{relativeTime(plan.approvedAtIso || plan.updatedAtIso)}</Text>
                        </View>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </>
            )}

            {/* New / unanswered doubts */}
            {openDoubts.length > 0 && (
              <>
                <Text style={s.sectionLabel}>NEW · {openDoubts.length}</Text>
                <View style={[s.card, { marginBottom: 18 }]}>
                  {openDoubts.map((d, i) => (
                    <AnimatedPressable
                      key={d.id}
                      style={[s.notifRow, i < openDoubts.length - 1 && s.divider]}
                      onPress={() =>
                        router.push({
                          pathname: "/(team)/doubt-detail",
                          params: { doubtId: d.id },
                        })
                      }
                    >
                      <View style={[s.notifIcon, { backgroundColor: "#EEF2FF" }]}>
                        <Ionicons name="help-circle-outline" size={16} color="#6366F1" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.notifTitle}>New doubt from {d.studentName}</Text>
                        <Text style={s.notifMsg} numberOfLines={2}>{d.subjectName} · {d.questionText}</Text>
                        <Text style={s.notifTime}>{relativeTime(d.createdAtIso)}</Text>
                      </View>
                      <View style={s.newDot} />
                    </AnimatedPressable>
                  ))}
                </View>
              </>
            )}

            {/* Replied doubts */}
            {repliedDoubts.length > 0 && (
              <>
                <Text style={s.sectionLabel}>RECENT ACTIVITY · {repliedDoubts.length}</Text>
                <View style={s.card}>
                  {repliedDoubts.slice(0, 10).map((d, i) => (
                    <AnimatedPressable
                      key={d.id}
                      style={[s.notifRow, { opacity: 0.75 }, i < Math.min(repliedDoubts.length, 10) - 1 && s.divider]}
                      onPress={() =>
                        router.push({
                          pathname: "/(team)/doubt-detail",
                          params: { doubtId: d.id },
                        })
                      }
                    >
                      <View style={[s.notifIcon, { backgroundColor: "#DCFCE7" }]}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#15803D" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.notifTitle}>
                          Doubt {d.status === "resolved" ? "resolved" : "answered"} — {d.studentName}
                        </Text>
                        <Text style={s.notifMsg} numberOfLines={1}>{d.subjectName} · {d.questionText}</Text>
                        <Text style={s.notifTime}>{relativeTime(d.updatedAtIso || d.createdAtIso)}</Text>
                      </View>
                    </AnimatedPressable>
                  ))}
                </View>
              </>
            )}

            {studentLeaves.length === 0 && openDoubts.length === 0 && repliedDoubts.length === 0 && sessionRequests.length === 0 && planUpdates.length === 0 && (
              <View style={[s.card, { padding: 32, alignItems: "center" }]}>
                <Ionicons name="notifications-off-outline" size={32} color={D.outline} style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginBottom: 4 }}>No notifications</Text>
                <Text style={{ fontSize: 12, fontFamily: D.font, color: D.outline, textAlign: "center" }}>You're all caught up! New doubts and activity will appear here.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  notifRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  notifIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifTitle: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  notifMsg: { fontSize: 11.5, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 17, marginTop: 2 },
  notifTime: { fontSize: 10.5, fontFamily: D.font, color: D.outline, marginTop: 4 },
  newDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: D.primary, marginTop: 6, flexShrink: 0 },
});
