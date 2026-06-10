import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useEffect, useMemo, useState } from "react";
import { Linking, StyleSheet, Text, TextInput, View, Pressable, ScrollView } from "react-native";
import { Card, EmptyCard, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING, SectionListItem, uiStyles, D } from "../components/ui";
import { formatDateTimeLabel } from "../lib/date";
import {
  createStudentDoubt,
  createStudentDoubtReply,
  listClassSubjectsForStudent,
  listStudentDoubtReplies,
  listStudentDoubts,
  type StudentDoubtRecord,
} from "../lib/erp";
import { useResource } from "../hooks/useResource";
import { useSession } from "../providers/session";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SUBJ_COLORS_D: Record<string, { c: string; light: string }> = {
  Physics: { c: "#EA580C", light: "#FFEDD5" },
  Chemistry: { c: "#2563EB", light: "#DBEAFE" },
  Biology: { c: "#059669", light: "#D1FAE5" },
  Maths: { c: "#7C3AED", light: "#EDE9FE" },
};

function getSubjectColors(subjectName: string) {
  for (const key of Object.keys(SUBJ_COLORS_D)) {
    if (subjectName.includes(key)) return SUBJ_COLORS_D[key];
  }
  return { c: "#6B7280", light: "#F3F4F6" };
}

function DSubjChip({ s }: { s: string }) {
  const t = getSubjectColors(s);
  return (
    <View style={[styles.sChip, { backgroundColor: t.light }]}>
      <View style={[styles.sChipDot, { backgroundColor: t.c }]} />
      <Text style={[styles.sChipText, { color: t.c }]}>{s}</Text>
    </View>
  );
}

function DoubtStatusChip({ status }: { status: StudentDoubtRecord["status"] }) {
  const map: any = {
    open: { bg: "#FEF3C7", fg: "#B45309", l: "Pending" },
    replied: { bg: "#DCFCE7", fg: "#15803D", l: "Answered" },
    resolved: { bg: "#DCFCE7", fg: "#15803D", l: "Resolved" },
  };
  const c = map[status] || map.open;
  return (
    <View style={[styles.statusChip, { backgroundColor: c.bg }]}>
      <Text style={[styles.statusChipText, { color: c.fg }]}>{c.l}</Text>
    </View>
  );
}

function useDoubtsResource() {
  const { profile } = useSession();
  const resource = useResource(async () => {
    if (!profile) return { doubts: [], mappings: [] };
    const [doubts, mappings] = await Promise.all([listStudentDoubts(profile), listClassSubjectsForStudent(profile)]);
    return { doubts, mappings };
  }, [profile?.userId, profile?.classId]);
  return { profile, resource };
}

export function StudentDoubtsScreen() {
  const { resource } = useDoubtsResource();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.pageContent, { paddingTop: Math.max(insets.top + 24, 56) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </Pressable>
          <Text style={styles.topTitle}>Doubts</Text>
          <Pressable onPress={() => router.push("/(student)/submit-doubt")} style={styles.plusBtn}>
            <Ionicons name="add" size={18} color={D.primary} />
          </Pressable>
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading doubts..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : !resource.data || resource.data.doubts.length === 0 ? (
          <EmptyCard title="No doubts yet" message="Tap + New to send your first doubt to a teacher." />
        ) : (
          <View style={styles.listContainer}>
            {resource.data.doubts.map((doubt) => (
              <Pressable
                key={doubt.id}
                onPress={() => router.push(`/(student)/doubt-detail?id=${encodeURIComponent(doubt.id)}`)}
                style={styles.listItem}
              >
                <View style={styles.listHeaderRow}>
                  <DSubjChip s={doubt.subjectName || "General"} />
                  <DoubtStatusChip status={doubt.status} />
                </View>
                <Text style={styles.listPreviewText} numberOfLines={2}>
                  {doubt.questionText}
                </Text>
                <View style={styles.listMetaRow}>
                  <Text style={styles.listMetaText}>{doubt.teacherName || "Teacher pending"}</Text>
                  <View style={styles.listMetaDot} />
                  <Text style={styles.listMetaTextLight}>{formatDateTimeLabel(doubt.createdAtIso)}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

export function StudentDoubtDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { profile, resource } = useDoubtsResource();
  const doubt = resource.data?.doubts.find((item) => item.id === id);
  const replies = useResource(async () => (id ? listStudentDoubtReplies(id) : []), [id]);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canReply = !!profile && !!doubt && replyText.trim().length > 2 && !submitting;
  const insets = useSafeAreaInsets();

  const submitReply = async () => {
    if (!profile || !doubt || !canReply) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await createStudentDoubtReply({ profile, doubtId: doubt.id, replyText });
      setReplyText("");
      await replies.reload();
      await resource.reload();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to send reply.");
    } finally {
      setSubmitting(false);
    }
  };

  const sc = doubt ? getSubjectColors(doubt.subjectName || "General") : null;

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.pageContent, { paddingTop: Math.max(insets.top + 24, 56) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.detailTopHeader}>
          <Pressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </Pressable>
          <View style={{ flex: 1 }}>
            {!resource.loading && doubt ? <DSubjChip s={doubt.subjectName || "General"} /> : <Text style={styles.topTitle}>Doubt Detail</Text>}
          </View>
          {!resource.loading && doubt ? <DoubtStatusChip status={doubt.status} /> : <View style={styles.headerSpacer} />}
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading doubt..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : !doubt || !sc ? (
          <EmptyCard title="Doubt not found" message="This doubt is not available for your account." />
        ) : (
          <>
            <View style={styles.detailMetaRow}>
              <Text style={styles.detailMetaText}>{doubt.teacherName || "Teacher pending"}</Text>
              <View style={styles.detailMetaDot} />
              <Text style={styles.detailMetaTextLight}>{formatDateTimeLabel(doubt.createdAtIso)}</Text>
            </View>

            <View style={styles.detailBodyBox}>
              <Text style={styles.detailBodyLabel}>YOUR DOUBT</Text>
              <Text style={styles.detailBodyText}>{doubt.questionText}</Text>
              {doubt.attachmentUrl ? (
                <View style={{ marginTop: 14 }}>
                  <SectionListItem title={doubt.attachmentName || "Attachment"} subtitle="Open attachment" onPress={() => void Linking.openURL(doubt.attachmentUrl!)} />
                </View>
              ) : null}
            </View>

            {replies.loading ? (
              <LoadingCard label="Loading replies..." rows={2} />
            ) : replies.error ? (
              <ErrorCard message={replies.error} onRetry={() => void replies.reload()} />
            ) : replies.data && replies.data.length > 0 ? (
              <View style={{ gap: 14, marginBottom: 14 }}>
                {replies.data.map((reply) => {
                  const isTeacher = reply.authorRole === "teacher";
                  return isTeacher ? (
                    <View key={reply.id} style={[styles.teacherReplyBox, { backgroundColor: sc.light, borderColor: sc.c + "33" }]}>
                      <View style={styles.teacherReplyHeader}>
                        <View style={[styles.teacherReplyIconBox, { backgroundColor: sc.c }]}>
                          <Ionicons name="person-outline" size={14} color="#fff" />
                        </View>
                        <Text style={[styles.teacherReplyTitle, { color: sc.c }]}>{reply.authorName || "Teacher"}</Text>
                      </View>
                      <Text style={styles.teacherReplyText}>{reply.replyText}</Text>
                    </View>
                  ) : (
                    <View key={reply.id} style={styles.studentReplyBox}>
                      <Text style={styles.studentReplyTitle}>You</Text>
                      <Text style={styles.studentReplyText}>{reply.replyText}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {doubt.status === "resolved" ? null : (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Follow Up</Text>
                  <TextInput
                    value={replyText}
                    onChangeText={(value) => setReplyText(value.slice(0, 300))}
                    placeholder="Type a follow-up question..."
                    placeholderTextColor={D.outline}
                    multiline
                    style={[styles.fieldInput, styles.fieldTextArea]}
                  />
                  <Text style={styles.charCountText}>{replyText.length} / 300</Text>
                </View>
                {feedback ? <Text style={uiStyles.muted}>{feedback}</Text> : null}
                <Pressable onPress={submitReply} disabled={!canReply} style={[styles.submitBtn, !canReply && styles.submitBtnDisabled]}>
                  <Text style={styles.submitBtnText}>{submitting ? "Sending..." : "Send follow-up"}</Text>
                </Pressable>
              </>
            )}
          </>
        )}

      </ScrollView>
    </View>
  );
}

export function StudentSubmitDoubtScreen() {
  const { profile, resource } = useDoubtsResource();
  const insets = useSafeAreaInsets();
  const [selectedMappingId, setSelectedMappingId] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedMappingId && resource.data?.mappings[0]) setSelectedMappingId(resource.data.mappings[0].id);
  }, [resource.data?.mappings, selectedMappingId]);

  const selectedMapping = useMemo(
    () => resource.data?.mappings.find((mapping) => mapping.id === selectedMappingId) ?? resource.data?.mappings[0],
    [resource.data?.mappings, selectedMappingId],
  );
  const canSubmit = !!profile && !!selectedMapping && questionText.trim().length > 10 && !submitting;

  const submit = async () => {
    if (!profile || !selectedMapping || !canSubmit) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await createStudentDoubt({ profile, mapping: selectedMapping, questionText });
      await resource.reload();
      router.replace("/(student)/doubts");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to submit doubt.");
    } finally {
      setSubmitting(false);
    }
  };

  // Group mappings by subject name
  const subjectsMap = useMemo(() => {
    if (!resource.data) return new Map<string, any[]>();
    const map = new Map<string, any[]>();
    for (const m of resource.data.mappings) {
      const subj = m.subjectName || "General";
      if (!map.has(subj)) map.set(subj, []);
      map.get(subj)!.push(m);
    }
    return map;
  }, [resource.data]);

  const subjKeys = Array.from(subjectsMap.keys());
  const selSubjName = selectedMapping?.subjectName || subjKeys[0] || "General";
  const selTeachers = subjectsMap.get(selSubjName) || [];

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.pageContent, { paddingTop: Math.max(insets.top + 24, 56) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </Pressable>
          <Text style={styles.topTitle}>Submit Doubt</Text>
          <View style={styles.headerSpacer} />
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading subjects..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : resource.data?.mappings.length === 0 ? (
          <EmptyCard title="No teachers assigned" message="No subject-teacher mapping has been assigned to your class yet." />
        ) : (
          <>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Subject</Text>
            <View style={styles.chipsRow}>
              {subjKeys.map((s) => {
                const sc = getSubjectColors(s);
                const isSel = s === selSubjName;
                const firstMapping = subjectsMap.get(s)?.[0];
                return (
                  <Pressable
                    key={s}
                    onPress={() => firstMapping && setSelectedMappingId(firstMapping.id)}
                    style={[styles.pickerChip, isSel && { backgroundColor: sc.c, borderColor: sc.c }]}
                  >
                    <Text style={[styles.pickerChipText, isSel && { color: "#fff" }]}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Teacher</Text>
            <View style={styles.chipsRow}>
              {selTeachers.map((t: any) => {
                const isSel = t.id === selectedMappingId;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => setSelectedMappingId(t.id)}
                    style={[styles.pickerChip, isSel && styles.pickerChipActive]}
                  >
                    <Text style={[styles.pickerChipText, isSel && styles.pickerChipTextActive]}>
                      {t.teacherName || "Pending"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Your doubt</Text>
            <TextInput
              value={questionText}
              onChangeText={(value) => setQuestionText(value.slice(0, 300))}
              placeholder="Type your doubt clearly..."
              placeholderTextColor={D.outline}
              multiline
              style={[styles.fieldInput, styles.fieldTextArea]}
            />
            <Text style={styles.charCountText}>{questionText.length} / 300</Text>
          </View>

          {selectedMapping ? (
            <View style={styles.infoBannerBlue}>
              <Text style={styles.infoBannerBlueText}>
                Your doubt will be sent to <Text style={{ fontWeight: "700" }}>{selectedMapping.teacherName || "the assigned teacher"}</Text> and answered within 24 hours.
              </Text>
            </View>
          ) : null}

          {feedback ? <Text style={uiStyles.muted}>{feedback}</Text> : null}

          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          >
            <Text style={styles.submitBtnText}>{submitting ? "Submitting..." : "Submit doubt"}</Text>
          </Pressable>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: D.bg,
  },
  pageContent: {
    paddingHorizontal: 16,
    paddingBottom: MOBILE_BOTTOM_SPACING,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  detailTopHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  topTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    fontFamily: D.fontExtraBold,
    color: D.onSurface,
    letterSpacing: -0.5,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: D.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  plusBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: D.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  sChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
  },
  sChipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  sChipText: {
    fontSize: 11,
    fontWeight: "700", fontFamily: D.fontBold,
    letterSpacing: 0.3,
  },
  statusChip: {
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 8,
    flexShrink: 0,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700", fontFamily: D.fontBold,
    letterSpacing: 0.3,
  },
  listContainer: {
    flexDirection: "column",
    gap: 10,
  },
  listItem: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: D.outlineVariant,
  },
  listHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  listPreviewText: {
    fontSize: 14,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    color: D.onSurface,
    lineHeight: 19,
    letterSpacing: -0.1,
    marginBottom: 6,
  },
  listMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  listMetaText: {
    fontSize: 12,
    color: "#4B5563",
  },
  listMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: D.onSurfaceVariant,
  },
  listMetaTextLight: {
    fontSize: 12,
    color: D.onSurfaceVariant,
  },
  detailHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  detailMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  detailMetaText: {
    fontSize: 12.5,
    color: "#4B5563",
  },
  detailMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: D.onSurfaceVariant,
  },
  detailMetaTextLight: {
    fontSize: 12,
    color: D.onSurfaceVariant,
  },
  detailBodyBox: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    marginBottom: 14,
  },
  detailBodyLabel: {
    fontSize: 11,
    fontWeight: "700", fontFamily: D.fontBold,
    color: D.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  detailBodyText: {
    fontSize: 13.5,
    color: D.onSurface,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  teacherReplyBox: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  teacherReplyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  teacherReplyIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  teacherReplyTitle: {
    fontSize: 13,
    fontWeight: "700", fontFamily: D.fontBold,
  },
  teacherReplyText: {
    fontSize: 13.5,
    color: D.onSurface,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  studentReplyBox: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: D.outlineVariant,
  },
  studentReplyTitle: {
    fontSize: 13,
    fontWeight: "700", fontFamily: D.fontBold,
    color: D.onSurface,
    marginBottom: 10,
  },
  studentReplyText: {
    fontSize: 13.5,
    color: D.onSurface,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    color: "#4B5563",
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickerChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: D.outlineVariant,
  },
  pickerChipActive: {
    backgroundColor: "#6D28D9",
    borderColor: "#6D28D9",
  },
  pickerChipText: {
    fontSize: 13,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    color: "#4B5563",
  },
  pickerChipTextActive: {
    color: "#fff",
  },
  fieldInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: D.outlineVariant,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14.5,
    color: D.onSurface,
    height: 52,
  },
  fieldTextArea: {
    height: "auto",
    minHeight: 110,
    paddingVertical: 13,
    textAlignVertical: "top",
    lineHeight: 20,
  },
  charCountText: {
    textAlign: "right",
    fontSize: 11,
    color: D.onSurfaceVariant,
    marginTop: 8,
    fontWeight: "500",
  },
  infoBannerBlue: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F5F3FF", // PURPLE_50
    borderWidth: 1,
    borderColor: "#DDD6FE", // PURPLE_200
    marginBottom: 20,
  },
  infoBannerBlueText: {
    fontSize: 12.5,
    color: "#5B21B6",
    lineHeight: 18,
  },
  submitBtn: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    backgroundColor: "#6D28D9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700", fontFamily: D.fontBold,
    letterSpacing: -0.2,
  },
});
