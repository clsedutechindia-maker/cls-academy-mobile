import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from "react-native";
import { Card, EmptyCard, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING, SectionListItem, uiStyles, D } from "../components/ui";
import { formatDateTimeLabel } from "../lib/date";
import { createStudentComplaint, listStudentComplaints, type StudentComplaintRecord } from "../lib/erp";
import { useResource } from "../hooks/useResource";
import { useSession } from "../providers/session";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function StatusChip({ status }: { status: StudentComplaintRecord["status"] }) {
  const map: any = {
    open: { bg: "#FEF3C7", fg: "#B45309", l: "Pending" },
    in_progress: { bg: "#DBEAFE", fg: "#1D4ED8", l: "In Progress" },
    resolved: { bg: "#DCFCE7", fg: "#15803D", l: "Resolved" },
    rejected: { bg: "#FEE2E2", fg: "#B91C1C", l: "Rejected" },
  };
  const c = map[status] || map.open;
  return (
    <View style={[styles.statusChip, { backgroundColor: c.bg }]}>
      <Text style={[styles.statusChipText, { color: c.fg }]}>{c.l}</Text>
    </View>
  );
}

function useComplaintsResource() {
  const { profile } = useSession();
  const resource = useResource(async () => (profile ? listStudentComplaints(profile) : []), [profile?.userId]);
  return { profile, resource };
}

export function StudentComplaintsScreen() {
  const { resource } = useComplaintsResource();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.pageContent, { paddingTop: Math.max(insets.top + 24, 56) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </Pressable>
          <Text style={styles.topTitle}>Complaints</Text>
          <Pressable onPress={() => router.push("/(student)/new-complaint")} style={styles.plusBtn}>
            <Ionicons name="add" size={18} color={D.primary} />
          </Pressable>
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading complaints..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : !resource.data || resource.data.length === 0 ? (
          <EmptyCard title="No complaints yet" message="Tap + New to raise your first issue." />
        ) : (
          <View style={styles.listContainer}>
            {resource.data.map((complaint) => (
              <Pressable
                key={complaint.id}
                onPress={() => router.push(`/(student)/complaint-detail?id=${encodeURIComponent(complaint.id)}`)}
                style={styles.listItem}
              >
                <View style={styles.listHeaderRow}>
                  <Text style={styles.listSubjectText} numberOfLines={2}>
                    {complaint.subject}
                  </Text>
                  <StatusChip status={complaint.status} />
                </View>
                <Text style={[styles.listDateText, complaint.adminReply && { marginBottom: 8 }]}>
                  {formatDateTimeLabel(complaint.createdAtIso)}
                </Text>
                {complaint.adminReply ? (
                  <View style={styles.listReplyBox}>
                    <Text style={styles.listReplyLabel}>ADMIN REPLY</Text>
                    <Text style={styles.listReplyText} numberOfLines={2}>
                      {complaint.adminReply}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

export function StudentComplaintDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { resource } = useComplaintsResource();
  const insets = useSafeAreaInsets();
  const complaint = resource.data?.find((item) => item.id === id);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.pageContent, { paddingTop: Math.max(insets.top + 24, 56) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.detailTopHeader}>
          <Pressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </Pressable>
          <Text style={styles.detailTopTitle} numberOfLines={2}>
            {complaint?.subject || "Complaint Detail"}
          </Text>
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading complaint..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : !complaint ? (
          <EmptyCard title="Complaint not found" message="This complaint is not available for your account." />
        ) : (
          <>
            <View style={styles.detailMetaRow}>
              <Text style={styles.detailDateText}>{formatDateTimeLabel(complaint.createdAtIso)}</Text>
              <View style={styles.detailMetaDot} />
              <StatusChip status={complaint.status} />
            </View>

            <View style={styles.detailBodyBox}>
              <Text style={styles.detailBodyLabel}>YOUR COMPLAINT</Text>
              <Text style={styles.detailBodyText}>
                {complaint.description || "No complaint body provided."}
              </Text>
            </View>

            {complaint.adminReply ? (
              <View style={styles.detailReplyBox}>
                <View style={styles.detailReplyHeader}>
                  <View style={styles.detailReplyIconBox}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                  <Text style={styles.detailReplyTitle}>Admin Reply</Text>
                </View>
                <Text style={styles.detailReplyText}>{complaint.adminReply}</Text>
              </View>
            ) : null}

            {complaint.attachments && complaint.attachments.length > 0 ? (
              <Card title="Attachments">
                {complaint.attachments.map((item) => (
                  <SectionListItem key={item.url} title={item.label} subtitle={item.kind} onPress={() => void Linking.openURL(item.url)} />
                ))}
              </Card>
            ) : null}
          </>
        )}

      </ScrollView>
    </View>
  );
}

export function StudentNewComplaintScreen() {
  const { profile, resource } = useComplaintsResource();
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const canSubmit = !!profile && subject.trim().length > 2 && description.trim().length > 10 && !submitting;

  const submit = async () => {
    if (!profile || !canSubmit) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await createStudentComplaint({ profile, subject, description });
      await resource.reload();
      router.replace("/(student)/complaints");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.pageContent, { paddingTop: Math.max(insets.top + 24, 56) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </Pressable>
          <Text style={styles.topTitle}>New Complaint</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Subject</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            placeholder="Short, descriptive heading"
            placeholderTextColor={D.outline}
            style={[styles.fieldInput, styles.fieldInputFocused]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            value={description}
            onChangeText={(value) => setDescription(value.slice(0, 300))}
            placeholder="Describe the issue in detail..."
            placeholderTextColor={D.outline}
            multiline
            style={[styles.fieldInput, styles.fieldTextArea]}
          />
          <Text style={styles.charCountText}>{description.length} / 300</Text>
        </View>

        <View style={styles.infoBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#B45309" style={{ marginTop: 1 }} />
          <Text style={styles.infoBannerText}>
            Complaints are reviewed within 48 hours. Do not include personal data.
          </Text>
        </View>

        {feedback ? <Text style={uiStyles.muted}>{feedback}</Text> : null}

        <Pressable onPress={submit} disabled={!canSubmit} style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}>
          <Text style={styles.submitBtnText}>{submitting ? "Submitting..." : "Submit complaint"}</Text>
        </Pressable>

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
    alignItems: "flex-start",
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
  detailTopTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: "800",
    fontFamily: D.fontExtraBold,
    color: D.onSurface,
    letterSpacing: -0.4,
    lineHeight: 23,
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
  statusChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexShrink: 0,
  },
  statusChipText: {
    fontSize: 11.5,
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  listSubjectText: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: "700", fontFamily: D.fontBold,
    color: D.onSurface,
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  listDateText: {
    fontSize: 11.5,
    color: D.onSurfaceVariant,
  },
  listReplyBox: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  listReplyLabel: {
    fontSize: 10.5,
    fontWeight: "700", fontFamily: D.fontBold,
    color: "#15803D",
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  listReplyText: {
    fontSize: 12.5,
    color: "#166534",
    lineHeight: 18,
  },
  detailMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  detailDateText: {
    fontSize: 12.5,
    color: D.onSurfaceVariant,
  },
  detailMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: D.onSurfaceVariant,
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
  detailReplyBox: {
    paddingVertical: 16,
    paddingHorizontal: 14,
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginBottom: 14,
  },
  detailReplyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  detailReplyIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#22C55E",
  },
  detailReplyTitle: {
    fontSize: 13,
    fontWeight: "700", fontFamily: D.fontBold,
    color: "#166534",
  },
  detailReplyText: {
    fontSize: 13.5,
    color: "#166534",
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    color: "#4B5563", // INK_2 approx
    marginBottom: 6,
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
  fieldInputFocused: {
    borderWidth: 1.5,
    borderColor: D.primary,
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
  infoBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 20,
    flexDirection: "row",
    gap: 10,
  },
  infoBannerText: {
    fontSize: 12.5,
    color: "#92400E",
    lineHeight: 18,
    flex: 1,
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
