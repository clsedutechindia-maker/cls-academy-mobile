import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResource } from "../hooks/useResource";
import {
  approveAnnouncement,
  createAdminAnnouncement,
  listAdminAnnouncements,
} from "../lib/erp";
import { useSession } from "../providers/session";
import { ActionButton, Card, D, EmptyCard, ErrorCard, Field, Label, LoadingCard, MOBILE_BOTTOM_SPACING, Pill } from "../components/ui";
import { AnimatedPressable, Stagger } from "../components/motion";
import { formatDateTimeLabel } from "../lib/date";

export function AdminCircularsScreen() {
  const { adminRecord, authUser } = useSession();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTag, setSelectedTag] = useState("general");
  const [feedback, setFeedback] = useState<string | null>(null);

  const TAGS = ["general", "exam", "holiday", "ptm", "fees"];

  const resource = useResource(
    async () => (adminRecord ? listAdminAnnouncements(adminRecord) : []),
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const handleCreate = async () => {
    if (!adminRecord || !authUser || !title.trim() || !message.trim()) {
      setFeedback("Title and message are required.");
      return;
    }
    try {
      await createAdminAnnouncement({ admin: adminRecord, actorUserId: authUser.uid, title, message, tag: selectedTag });
      setTitle(""); setMessage(""); setSelectedTag("general");
      setFeedback("Circular submitted.");
      await resource.reload();
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Unable to submit.");
    }
  };

  const handleApprove = async (id: string) => {
    if (!adminRecord) return;
    try {
      await approveAnnouncement({ announcementId: id, admin: adminRecord });
      setFeedback("Circular approved.");
      await resource.reload();
    } catch (e) {
      setFeedback(e instanceof Error ? e.message : "Unable to approve.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.pageTitle}>Circulars</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: MOBILE_BOTTOM_SPACING, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        <Card title="New Circular" subtitle="Scope is inferred from your admin role.">
          <Label>Title</Label>
          <Field value={title} onChangeText={setTitle} placeholder="Notice title" />
          <Label>Message</Label>
          <Field value={message} onChangeText={setMessage} placeholder="Write the circular" multiline />
          <Label>Tag</Label>
          <View style={s.tagRow}>
            {TAGS.map((t) => (
              <AnimatedPressable
                key={t}
                style={[s.tagChip, selectedTag === t && s.tagChipActive]}
                onPress={() => setSelectedTag(t)}
              >
                <Text style={[s.tagText, selectedTag === t && s.tagTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
              </AnimatedPressable>
            ))}
          </View>
          {feedback ? (
            <Text style={{ color: feedback.includes("Unable") || feedback.includes("required") ? D.error : D.success, fontSize: 13, fontFamily: D.font }}>
              {feedback}
            </Text>
          ) : null}
          <ActionButton label="Submit" onPress={() => void handleCreate()} />
        </Card>

        {resource.loading ? (
          <LoadingCard label="Loading circulars…" />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : !resource.data || resource.data.length === 0 ? (
          <EmptyCard title="No circulars" message="Create the first circular above." />
        ) : (
          <Stagger>
            {resource.data.map((item) => (
              <Card
                key={item.id}
                title={item.title}
                subtitle={`${item.createdByName} · ${formatDateTimeLabel(item.createdAtIso)}`}
                right={<Pill label={item.status} tone={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : "warning"} />}
              >
                <Text style={{ color: D.onSurfaceVariant, fontSize: 14, lineHeight: 20, fontFamily: D.font }}>{item.message}</Text>
                {item.audienceScope ? (
                  <Text style={{ fontSize: 11, color: D.outline, fontFamily: D.font }}>Scope: {item.audienceScope}</Text>
                ) : null}
                {adminRecord?.role === "admin" && item.status === "pending" && (
                  <ActionButton label="Approve" onPress={() => void handleApprove(item.id)} />
                )}
              </Card>
            ))}
          </Stagger>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 12, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },
  pageTitle: { fontSize: 24, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 4 },
  tagChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  tagChipActive: { backgroundColor: D.surfaceLow, borderColor: D.primary },
  tagText: { fontSize: 12, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  tagTextActive: { color: D.primary },
});
