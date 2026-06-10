import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listDoubtsForTeacher, replyToDoubtAsTeacher, listStudentDoubtReplies } from "../../lib/erp";

function relativeTime(isoStr: string) {
  if (!isoStr) return "—";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function HTDoubtDetailScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const params = useLocalSearchParams<{ doubtId: string }>();
  const doubtId = params.doubtId ?? "";

  const scrollRef = useRef<ScrollView>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { data: doubts, loading: doubtsLoading } = useResource(
    async () => {
      if (!profile) return [];
      return listDoubtsForTeacher(profile);
    },
    [profile?.userId],
  );

  const doubt = (doubts ?? []).find((d) => d.id === doubtId) ?? null;

  const { data: replies, loading: repliesLoading, reload: reloadReplies } = useResource(
    async () => {
      if (!doubtId) return [];
      return listStudentDoubtReplies(doubtId);
    },
    [doubtId],
  );

  const loading = doubtsLoading || repliesLoading;

  async function handleSend() {
    if (!profile || !doubtId) return;
    if (!replyText.trim()) { Alert.alert("Empty reply", "Type a reply before sending."); return; }
    setSending(true);
    try {
      await replyToDoubtAsTeacher({ profile, doubtId, replyText });
      setReplyText("");
      setSent(true);
      void reloadReplies();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "Failed to send reply.");
    } finally {
      setSending(false);
    }
  }

  const subjectBg = "#EEF2FF";
  const subjectColor = "#6366F1";
  const initials = doubt?.studentName.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase() || "??";

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.navTitle}>Doubt</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading && !doubt && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={D.primary} />
        </View>
      )}

      {!loading && !doubt && (
        <View style={{ flex: 1, padding: 24 }}>
          <Text style={{ fontFamily: D.font, color: "#B91C1C" }}>Doubt not found.</Text>
        </View>
      )}

      {doubt && (
        <>
          <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
            {/* Student card */}
            <View style={s.studentCard}>
              <View style={[s.avatar, { backgroundColor: D.primary }]}>
                <Text style={s.avatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.studentName}>{doubt.studentName}</Text>
                <Text style={s.studentMeta}>{doubt.studentClassName}</Text>
              </View>
              <View style={[s.subjectBadge, { backgroundColor: subjectBg }]}>
                <Text style={[s.subjectBadgeText, { color: subjectColor }]}>{doubt.subjectName}</Text>
              </View>
            </View>

            {/* Question bubble */}
            <View style={s.questionCard}>
              <View style={s.qHeader}>
                <Ionicons name="help-circle" size={16} color={D.primary} />
                <Text style={s.qLabel}>Question</Text>
                <Text style={s.qTime}>{relativeTime(doubt.createdAtIso)}</Text>
              </View>
              <Text style={s.questionText}>{doubt.questionText}</Text>
            </View>

            {/* Existing replies */}
            {(replies ?? []).length > 0 && (
              <>
                <Text style={s.sectionLabel}>REPLIES</Text>
                <View style={[s.card, { marginBottom: 16 }]}>
                  {(replies ?? []).map((rep, i) => (
                    <View key={rep.id} style={[s.replyRow, i < (replies?.length ?? 0) - 1 && s.divider]}>
                      <View style={[s.replyAvatar, { backgroundColor: rep.authorRole === "teacher" ? D.primary : "#EC4899" }]}>
                        <Ionicons name={rep.authorRole === "teacher" ? "person" : "person-outline"} size={12} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                          <Text style={s.repAuthor}>{rep.authorName} <Text style={{ color: D.outline, fontSize: 10 }}>({rep.authorRole})</Text></Text>
                          <Text style={s.repTime}>{relativeTime(rep.createdAtIso)}</Text>
                        </View>
                        <Text style={s.repText}>{rep.replyText}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {sent && (
              <View style={{ padding: 16, borderRadius: 20, backgroundColor: "#F0FDF4", borderWidth: 1.5, borderColor: "#86EFAC", alignItems: "center", marginBottom: 16, gap: 6 }}>
                <Ionicons name="checkmark-circle" size={28} color="#16A34A" />
                <Text style={{ fontFamily: D.fontBold, color: "#15803D", fontSize: 14 }}>Reply sent!</Text>
                <Text style={{ fontFamily: D.font, color: "#4ADE80", fontSize: 12, textAlign: "center" }}>The student will be notified of your reply.</Text>
              </View>
            )}

            {/* Reply area */}
            {(doubt.status === "open" || doubt.status === "replied") && (
              <>
                <Text style={s.sectionLabel}>{sent ? "SEND ANOTHER REPLY" : "YOUR REPLY"}</Text>
                <TextInput
                  style={s.replyBox}
                  value={replyText}
                  onChangeText={(text) => {
                    setReplyText(text);
                    if (sent) setSent(false);
                  }}
                  placeholder="Type your reply here…"
                  placeholderTextColor={D.outline}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
              </>
            )}

            {doubt.status === "resolved" && !sent && (
              <View style={[s.card, { padding: 16, alignItems: "center", marginTop: 8 }]}>
                <Text style={{ fontFamily: D.fontSemiBold, color: "#15803D", fontSize: 13 }}>This doubt is marked resolved.</Text>
              </View>
            )}
          </ScrollView>

          {(doubt.status === "open" || doubt.status === "replied") && (
            <View style={s.actionBar}>
              <AnimatedPressable style={s.cancelBtn} onPress={() => navigateBack(router)}>
                <Text style={s.cancelText}>Skip</Text>
              </AnimatedPressable>
              <AnimatedPressable style={[s.replyBtn, sending && { opacity: 0.6 }]} onPress={handleSend} disabled={sending}>
                {sending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={15} color="#fff" />
                    <Text style={s.replyBtnText}>Send Reply</Text>
                  </>
                )}
              </AnimatedPressable>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  studentCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 16, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" },
  studentName: { fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  studentMeta: { fontSize: 12, fontFamily: D.font, color: D.outline, marginTop: 2 },
  subjectBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  subjectBadgeText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold },
  questionCard: { padding: 16, borderRadius: 20, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, marginBottom: 18 },
  qHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  qLabel: { flex: 1, fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  qTime: { fontSize: 11, fontFamily: D.font, color: D.outline },
  questionText: { fontSize: 14, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 22, letterSpacing: -0.1 },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  replyRow: { flexDirection: "row", gap: 10, padding: 14, alignItems: "flex-start" },
  replyAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  repAuthor: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  repTime: { fontSize: 10, fontFamily: D.font, color: D.outline },
  repText: { fontSize: 13, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 20 },
  replyBox: { minHeight: 130, padding: 16, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 14, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1, fontSize: 13, fontFamily: D.font, color: D.onSurface, lineHeight: 22 },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 100, backgroundColor: D.bg },
  cancelBtn: { width: 80, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  replyBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  replyBtnText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
  navAction: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
});
