import { useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../lib/navigation";
import { showAlert } from "../lib/alert";
import { formatDateTimeLabel } from "../lib/date";
import { useResource } from "../hooks/useResource";
import {
  listAdminComplaints,
  markComplaintInReview,
  rejectComplaint,
  resolveComplaint,
} from "../lib/erp";
import type { StudentComplaintRecord } from "../lib/erp";
import { useSession } from "../providers/session";
import {
  ActionButton,
  Card,
  D,
  EmptyCard,
  ErrorCard,
  LoadingCard,
  MOBILE_BOTTOM_SPACING,
  Pill,
  SectionListItem,
} from "../components/ui";
import { AnimatedPressable } from "../components/motion";

function complaintTone(status: StudentComplaintRecord["status"]): "danger" | "warning" | "success" | "info" {
  if (status === "open") return "danger";
  if (status === "in_progress") return "warning";
  if (status === "resolved") return "success";
  return "info";
}

function complaintStatusLabel(status: StudentComplaintRecord["status"]) {
  if (status === "in_progress") return "In Progress";
  if (status === "resolved") return "Resolved";
  if (status === "rejected") return "Rejected";
  return "Open";
}

export function AdminComplaintDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const insets = useSafeAreaInsets();
  const { adminRecord } = useSession();

  const resource = useResource(
    async () => (adminRecord ? listAdminComplaints(adminRecord) : []),
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const complaint = useMemo(
    () => resource.data?.find((item) => item.id === id),
    [resource.data, id],
  );

  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isClosed = complaint?.status === "resolved" || complaint?.status === "rejected";

  async function runAction(action: () => Promise<void>, needReply: boolean) {
    if (submitting) return;
    if (needReply && !reply.trim()) {
      showAlert("Reply required", "Write a reply to the student before closing this complaint.");
      return;
    }
    setSubmitting(true);
    try {
      await action();
      setReply("");
      await resource.reload();
    } catch (err) {
      showAlert("Something went wrong", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={s.page}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: Math.max(insets.top + 14, 40) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.title} numberOfLines={2}>{complaint?.subject || "Complaint"}</Text>
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading complaint..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : !complaint ? (
          <EmptyCard title="Complaint not found" message="This complaint is not in your admin scope." />
        ) : (
          <>
            <View style={s.metaRow}>
              <Text style={s.metaText}>{complaint.studentName}</Text>
              <View style={s.metaDot} />
              <Text style={s.metaText}>{complaint.className || complaint.centreName || "Unknown class"}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaSub}>{formatDateTimeLabel(complaint.createdAtIso)}</Text>
              <Pill label={complaintStatusLabel(complaint.status)} tone={complaintTone(complaint.status)} />
            </View>

            <View style={s.bodyBox}>
              <Text style={s.bodyLabel}>COMPLAINT</Text>
              <Text style={s.bodyText}>{complaint.description || "No description provided."}</Text>
            </View>

            {complaint.attachments && complaint.attachments.length > 0 ? (
              <Card title="Attachments">
                {complaint.attachments.map((item) => (
                  <SectionListItem
                    key={item.url}
                    title={item.label}
                    subtitle={item.kind}
                    onPress={() => void Linking.openURL(item.url)}
                  />
                ))}
              </Card>
            ) : null}

            {complaint.adminReply ? (
              <View style={s.replyBox}>
                <View style={s.replyHeader}>
                  <View style={s.replyIconBox}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                  <Text style={s.replyTitle}>Your Reply</Text>
                </View>
                <Text style={s.replyText}>{complaint.adminReply}</Text>
              </View>
            ) : null}

            {isClosed ? (
              <View style={s.closedNote}>
                <Ionicons name="lock-closed-outline" size={15} color={D.outline} />
                <Text style={s.closedNoteText}>
                  This complaint is {complaintStatusLabel(complaint.status).toLowerCase()}. Reopen by marking it in review.
                </Text>
                <ActionButton
                  label="Mark In Review"
                  tone="secondary"
                  disabled={submitting}
                  onPress={() => void runAction(() => markComplaintInReview(complaint.id), false)}
                />
              </View>
            ) : (
              <View style={s.actionBox}>
                <Text style={s.bodyLabel}>REPLY TO STUDENT</Text>
                <TextInput
                  style={s.input}
                  placeholder="Write a reply…"
                  placeholderTextColor={D.outline}
                  value={reply}
                  onChangeText={setReply}
                  multiline
                  editable={!submitting}
                />
                <View style={{ gap: 10 }}>
                  <ActionButton
                    label={submitting ? "Saving…" : "Resolve & Send Reply"}
                    disabled={submitting}
                    onPress={() => void runAction(() => resolveComplaint(complaint.id, reply), true)}
                  />
                  <View style={s.actionRow}>
                    {complaint.status === "open" ? (
                      <View style={{ flex: 1 }}>
                        <ActionButton
                          label="Mark In Review"
                          tone="secondary"
                          disabled={submitting}
                          onPress={() => void runAction(() => markComplaintInReview(complaint.id), false)}
                        />
                      </View>
                    ) : null}
                    <View style={{ flex: 1 }}>
                      <ActionButton
                        label="Reject"
                        tone="danger"
                        disabled={submitting}
                        onPress={() => void runAction(() => rejectComplaint(complaint.id, reply), true)}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: D.bg },
  content: { paddingHorizontal: 18, gap: 14, paddingBottom: MOBILE_BOTTOM_SPACING },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  title: { flex: 1, fontSize: 20, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.4 },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "space-between" },
  metaText: { fontSize: 13, fontFamily: D.fontSemiBold, color: D.onSurface },
  metaSub: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: D.outline },

  bodyBox: {
    backgroundColor: D.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: D.outlineVariant, gap: 8,
  },
  bodyLabel: { fontSize: 10, fontFamily: D.fontExtraBold, letterSpacing: 0.6, color: D.outline },
  bodyText: { fontSize: 14, lineHeight: 21, fontFamily: D.font, color: D.onSurface },

  replyBox: {
    backgroundColor: "#F0FDF4", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#BBF7D0", gap: 8,
  },
  replyHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  replyIconBox: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: D.success,
    alignItems: "center", justifyContent: "center",
  },
  replyTitle: { fontSize: 12, fontFamily: D.fontExtraBold, color: "#15803D", letterSpacing: 0.3 },
  replyText: { fontSize: 14, lineHeight: 21, fontFamily: D.font, color: "#166534" },

  actionBox: {
    backgroundColor: D.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: D.outlineVariant, gap: 12,
  },
  input: {
    minHeight: 90, borderRadius: 12, padding: 12, textAlignVertical: "top",
    backgroundColor: D.bg, borderWidth: 1, borderColor: D.outlineVariant,
    fontSize: 14, fontFamily: D.font, color: D.onSurface,
  },
  actionRow: { flexDirection: "row", gap: 10 },

  closedNote: {
    backgroundColor: D.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: D.outlineVariant, gap: 12, alignItems: "flex-start",
  },
  closedNoteText: { fontSize: 13, lineHeight: 19, fontFamily: D.font, color: D.onSurfaceVariant },
});
