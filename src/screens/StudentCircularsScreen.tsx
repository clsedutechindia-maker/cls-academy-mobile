import { router, useLocalSearchParams, useSegments } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useEffect, useMemo, useState } from "react";
import { Linking, StyleSheet, Text, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ErrorCard, LoadingCard, D, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { formatDateTimeLabel } from "../lib/date";
import { listAnnouncementsForProfile } from "../lib/erp";
import { useResource } from "../hooks/useResource";
import { useSession } from "../providers/session";
import { getReadCircularIds, markCircularRead } from "../lib/readStore";
import type { StudentAnnouncementRecord } from "../shared";

type AnnouncementItem = StudentAnnouncementRecord;

function useCircularsResource() {
  const { profile } = useSession();
  const resource = useResource(async (): Promise<AnnouncementItem[]> => (profile ? listAnnouncementsForProfile(profile) : []), [
    profile?.userId,
    profile?.regionId,
    profile?.centreId,
  ]);
  return { resource };
}

function isRecentEnough(createdAtIso: string) {
  const created = new Date(createdAtIso).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < 7 * 86_400_000;
}

function getCircularTag(title: string) {
  const t = title.toLowerCase();
  if (t.includes("exam") || t.includes("test") || t.includes("mock") || t.includes("wt")) return { tag: "EXAM", bg: "#FCE7F3", fg: "#9D174D" };
  if (t.includes("holiday") || t.includes("closed") || t.includes("leave")) return { tag: "HOLIDAY", bg: "#DCFCE7", fg: "#166534" };
  if (t.includes("fee") || t.includes("payment")) return { tag: "FEES", bg: "#FEE2E2", fg: "#991B1B" };
  if (t.includes("parent") || t.includes("ptm") || t.includes("guardian")) return { tag: "PARENT MEET", bg: "#FFEDD5", fg: "#9A3412" };
  if (t.includes("workshop") || t.includes("seminar") || t.includes("guest")) return { tag: "WORKSHOP", bg: "#E0E7FF", fg: "#3730A3" };
  return { tag: "NOTICE", bg: "#F3F4F6", fg: "#4B5563" };
}

export function StudentCircularsScreen() {
  const { resource } = useCircularsResource();
  const [filter, setFilter] = useState<"All" | "Unread">("All");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const segments = useSegments();

  useEffect(() => {
    getReadCircularIds().then(setReadIds);
  }, [segments.join(",")]);

  const circulars = resource.data ?? [];

  function isUnread(item: AnnouncementItem) {
    if (readIds.has(item.id)) return false;
    return isRecentEnough(item.updatedAtIso || item.createdAtIso);
  }

  const allCount = circulars.length;
  const unreadCount = circulars.filter((item: AnnouncementItem) => isUnread(item)).length;

  const handleCircularPress = async (id: string) => {
    await markCircularRead(id);
    setReadIds((prev) => { const next = new Set(prev); next.add(id); return next; });
    router.push(`/(student)/circular-detail?id=${encodeURIComponent(id)}`);
  };

  const filtered = useMemo(() => {
    return (circulars as AnnouncementItem[]).filter((item: AnnouncementItem) => {
      if (filter === "Unread") return isUnread(item);
      return true;
    }).sort((a: AnnouncementItem, b: AnnouncementItem) => {
      const left = a.updatedAtIso || a.createdAtIso;
      const right = b.updatedAtIso || b.createdAtIso;
      return right.localeCompare(left);
    });
  }, [circulars, filter, readIds]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Circulars</Text>
        <View style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={20} color={D.onSurface} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {[
          { label: "All", count: allCount },
          { label: "Unread", count: unreadCount },
        ].map((t) => {
          const isActive = filter === t.label;
          return (
            <AnimatedPressable key={t.label} onPress={() => setFilter(t.label as "All" | "Unread")}>
              <View style={[styles.tab, isActive && styles.tabActive]}>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{t.label}</Text>
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>{t.count}</Text>
                </View>
              </View>
            </AnimatedPressable>
          );
        })}
      </View>

      {/* List */}
      {resource.loading ? (
        <LoadingCard label="Loading circulars..." />
      ) : resource.error ? (
        <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No circulars found.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((item: AnnouncementItem) => {
            const unread = isUnread(item);
            const { tag, bg, fg } = getCircularTag(item.title);
            return (
              <AnimatedPressable key={item.id} onPress={() => void handleCircularPress(item.id)}>
                <View style={styles.card}>
                  {unread && <View style={styles.unreadDot} />}
                  <View style={styles.cardTopRow}>
                    <View style={[styles.tagWrap, { backgroundColor: bg }]}>
                      <Text style={[styles.tagText, { color: fg }]}>{tag}</Text>
                    </View>
                    <Text style={styles.cardDate}>{formatDateTimeLabel(item.createdAtIso)}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{item.message}</Text>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>
      )}

    </ScrollView>
  );
}

export function StudentCircularDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { resource } = useCircularsResource();
  const circular = resource.data?.find((item) => item.id === id);

  useEffect(() => {
    if (id) void markCircularRead(id);
  }, [id]);

  if (resource.loading) {
    return (
      <View style={styles.container}>
        <LoadingCard label="Loading circular..." />
      </View>
    );
  }

  if (!circular) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Circular not found.</Text>
        </View>
      </View>
    );
  }

  const { tag, bg, fg } = getCircularTag(circular.title);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <AnimatedPressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={styles.detailTitle}>{circular.title}</Text>
      </View>

      {/* Meta Strip */}
      <View style={styles.metaStrip}>
        <View style={[styles.tagWrap, { backgroundColor: bg }]}>
          <Text style={[styles.tagText, { color: fg }]}>{tag}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={D.outline} />
          <Text style={styles.metaItemText}>{circular.audienceScope === "all" ? "All Students" : circular.centreName || circular.regionName || "Scoped audience"}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={D.outline} />
          <Text style={styles.metaItemText}>{formatDateTimeLabel(circular.createdAtIso)}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.bodyBox}>
        <Text style={styles.boxLabel}>MESSAGE</Text>
        <Text style={styles.bodyText}>{circular.message || "No message body provided."}</Text>
      </View>

      {/* Attachments */}
      {circular.attachments.length > 0 && (
        <View style={styles.bodyBox}>
          <View style={styles.boxLabelRow}>
            <Ionicons name="document-attach-outline" size={14} color={D.outline} />
            <Text style={styles.boxLabel}>ATTACHMENTS</Text>
          </View>
          <View style={{ gap: 8 }}>
            {circular.attachments.map((f: { url: string; label: string; kind: string }, i: number) => (
              <AnimatedPressable key={i} onPress={() => void Linking.openURL(f.url)}>
                <View style={styles.attachmentItem}>
                  <View style={styles.attachmentIconBox}>
                    <Ionicons name="document-text" size={18} color="#fff" />
                  </View>
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentName} numberOfLines={1}>{f.label}</Text>
                    <Text style={styles.attachmentType}>{f.kind}</Text>
                  </View>
                  <View style={styles.attachmentDownload}>
                    <Ionicons name="arrow-forward" size={16} color={D.primaryBtn} />
                  </View>
                </View>
              </AnimatedPressable>
            ))}
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },
  content: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: MOBILE_BOTTOM_SPACING },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },

  tabsRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1, borderColor: D.outlineVariant },
  tabActive: { backgroundColor: D.primaryBtn, borderColor: D.primaryBtn },
  tabLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  tabLabelActive: { color: "#fff" },
  tabBadge: { paddingVertical: 1, paddingHorizontal: 6, borderRadius: 999, backgroundColor: D.primaryFixed },
  tabBadgeActive: { backgroundColor: "rgba(255,255,255,0.25)" },
  tabBadgeText: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primaryBtn },
  tabBadgeTextActive: { color: "#fff" },

  emptyWrap: { padding: 20, alignItems: "center" },
  emptyText: { color: D.outline },

  list: { gap: 10 },
  card: { position: "relative", backgroundColor: "#fff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: D.outlineVariant },
  unreadDot: { position: "absolute", top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: D.primaryBtn },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  tagWrap: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
  tagText: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.5 },
  cardDate: { fontSize: 11.5, color: D.outline },
  cardTitle: { fontSize: 14.5, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2, lineHeight: 19, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: D.onSurfaceVariant, lineHeight: 18, letterSpacing: -0.1 },

  detailHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 18 },
  detailTitle: { flex: 1, fontSize: 20, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.4, lineHeight: 24 },

  metaStrip: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: D.outlineVariant, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaItemText: { fontSize: 12.5, color: D.onSurfaceVariant, fontWeight: "500" },

  bodyBox: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: D.outlineVariant, paddingVertical: 16, paddingHorizontal: 14, marginBottom: 14 },
  boxLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  boxLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 10 },
  bodyText: { fontSize: 13.5, color: D.onSurface, lineHeight: 22, letterSpacing: -0.1 },

  attachmentItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" },
  attachmentIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#6B7280", alignItems: "center", justifyContent: "center" },
  attachmentInfo: { flex: 1 },
  attachmentName: { fontSize: 13, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface, letterSpacing: -0.1 },
  attachmentType: { fontSize: 11, color: D.outline, marginTop: 2 },
  attachmentDownload: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
});
