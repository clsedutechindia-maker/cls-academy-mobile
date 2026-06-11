import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useMemo, useState } from "react";
import { Linking, StyleSheet, Text, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ErrorCard, LoadingCard, D, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { formatDateLabel } from "../lib/date";
import { listLearningResourcesForProfile, type AttachmentMeta } from "../lib/erp";
import { useResource } from "../hooks/useResource";
import { useSession } from "../providers/session";
import { subjectColor, subjectBgColor } from "./studentUtils";

function useMaterialsResource() {
  const { profile } = useSession();
  const resource = useResource(async () => (profile ? listLearningResourcesForProfile(profile) : []), [
    profile?.userId,
    profile?.regionId,
    profile?.centreId,
    profile?.classId,
  ]);
  return { resource };
}

function SubjectBadge({ subject }: { subject: string }) {
  const color = subjectColor(subject);
  const bg = subjectBgColor(subject);
  return (
    <View style={[styles.subjectBadge, { backgroundColor: bg }]}>
      <View style={[styles.subjectDot, { backgroundColor: color }]} />
      <Text style={[styles.subjectBadgeText, { color }]}>{subject}</Text>
    </View>
  );
}

export function StudentMaterialsScreen() {
  const { resource } = useMaterialsResource();
  const [subject, setSubject] = useState("All");

  const subjects = useMemo(() => {
    const names = new Set((resource.data ?? []).map((item) => item.subjectName || "General"));
    return ["All", ...Array.from(names).sort()];
  }, [resource.data]);

  const filtered = useMemo(() => {
    return [...(resource.data ?? [])]
      .filter((item) => {
        return subject === "All" || (item.subjectName || "General") === subject;
      })
      .sort((a, b) => {
        const left = a.updatedAtIso || a.createdAtIso;
        const right = b.updatedAtIso || b.createdAtIso;
        return right.localeCompare(left);
      });
  }, [resource.data, subject]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <AnimatedPressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={styles.headerTitle}>Materials</Text>
        <View style={styles.iconBtn}>
          <Ionicons name="search" size={20} color={D.onSurface} />
        </View>
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {subjects.map((item) => {
          const isActive = subject === item;
          return (
            <AnimatedPressable key={item} onPress={() => setSubject(item)}>
              <View style={[styles.filterChip, isActive && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>{item}</Text>
              </View>
            </AnimatedPressable>
          );
        })}
      </ScrollView>

      {/* List */}
      {resource.loading ? (
        <LoadingCard label="Loading materials..." />
      ) : resource.error ? (
        <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No materials found.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map((item) => {
            const hasAttachments = item.attachments.length > 0;
            const hasLinks = !!item.linkUrl;
            return (
              <AnimatedPressable key={item.id} onPress={() => router.push(`/(student)/material-detail?id=${encodeURIComponent(item.id)}`)}>
                <View style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <SubjectBadge subject={item.subjectName || "General"} />
                    <Text style={styles.cardDate}>{formatDateLabel(item.updatedAtIso || item.createdAtIso)}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <View style={styles.cardBottomRow}>
                    <Text style={styles.cardTeacher}>{item.createdByName || "Admin"}</Text>
                    <View style={styles.cardIconsRow}>
                      {hasAttachments && (
                        <View style={styles.attachmentBadge}>
                          <Ionicons name="document-attach-outline" size={13} color="#6B7280" />
                          <Text style={styles.attachmentBadgeText}>{item.attachments.length}</Text>
                        </View>
                      )}
                      {hasLinks && (
                        <View style={styles.linkBadge}>
                          <Ionicons name="link-outline" size={13} color="#2563EB" />
                          <Text style={styles.linkBadgeText}>1</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={14} color={D.outline} />
                    </View>
                  </View>
                </View>
              </AnimatedPressable>
            );
          })}
        </View>
      )}

    </ScrollView>
  );
}

export function StudentMaterialDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { resource } = useMaterialsResource();
  const material = resource.data?.find((item) => item.id === id);

  if (resource.loading) {
    return (
      <View style={styles.container}>
        <LoadingCard label="Loading material..." />
      </View>
    );
  }

  if (!material) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Material not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.detailHeader}>
        <AnimatedPressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={styles.detailTitle}>{material.title}</Text>
      </View>

      {/* Meta Strip */}
      <View style={styles.metaStrip}>
        <SubjectBadge subject={material.subjectName || "General"} />
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={14} color={D.outline} />
          <Text style={styles.metaItemText}>{material.createdByName || "Admin"}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={D.outline} />
          <Text style={styles.metaItemText}>{formatDateLabel(material.updatedAtIso || material.createdAtIso)}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.bodyBox}>
        <Text style={styles.boxLabel}>DESCRIPTION</Text>
        <Text style={styles.bodyText}>{material.description || "No description provided."}</Text>
      </View>

      {/* Attachments */}
      {material.attachments.length > 0 && (
        <View style={styles.bodyBox}>
          <View style={styles.boxLabelRow}>
            <Ionicons name="document-attach-outline" size={14} color={D.outline} />
            <Text style={styles.boxLabel}>ATTACHMENTS</Text>
          </View>
          <View style={{ gap: 8 }}>
            {material.attachments.map((f, i) => {
              const color = subjectColor(material.subjectName || "General");
              const bg = subjectBgColor(material.subjectName || "General");
              return (
                <AnimatedPressable key={i} onPress={() => void Linking.openURL(f.url)}>
                  <View style={[styles.attachmentItem, { backgroundColor: bg, borderColor: color + "22" }]}>
                    <View style={[styles.attachmentIconBox, { backgroundColor: color }]}>
                      <Ionicons name="document-text" size={18} color="#fff" />
                    </View>
                    <View style={styles.attachmentInfo}>
                      <Text style={styles.attachmentName} numberOfLines={1}>{f.label}</Text>
                      <Text style={styles.attachmentType}>PDF document</Text>
                    </View>
                    <View style={styles.attachmentDownload}>
                      <Ionicons name="arrow-down" size={16} color={color} />
                    </View>
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Links */}
      {material.linkUrl && (
        <View style={styles.bodyBox}>
          <View style={styles.boxLabelRow}>
            <Ionicons name="link-outline" size={14} color={D.outline} />
            <Text style={styles.boxLabel}>LINKS</Text>
          </View>
          <View style={{ gap: 8 }}>
            <AnimatedPressable onPress={() => void Linking.openURL(material.linkUrl as string)}>
              <View style={styles.linkItem}>
                <View style={styles.linkIconBox}>
                  <Ionicons name="link" size={18} color="#fff" />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={styles.linkName} numberOfLines={1}>Open resource link</Text>
                  <Text style={styles.linkUrl} numberOfLines={1}>{material.linkUrl}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#2563EB" />
              </View>
            </AnimatedPressable>
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
  headerTitle: { flex: 1, fontSize: 22, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  
  filterRow: { flexDirection: "row", gap: 8, paddingBottom: 16, alignItems: "center" },
  filterChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1, borderColor: D.outlineVariant },
  filterChipActive: { backgroundColor: D.primaryBtn, borderColor: D.primaryBtn },
  filterChipText: { color: D.onSurfaceVariant, fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold },
  filterChipTextActive: { color: "#fff" },

  list: { gap: 10 },
  card: { backgroundColor: "#fff", borderRadius: 18, paddingVertical: 14, paddingHorizontal: 14, paddingBottom: 12, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: "#4C1D95", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cardDate: { fontSize: 11.5, color: D.outline },
  cardTitle: { fontSize: 14.5, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2, lineHeight: 19, marginBottom: 6 },
  cardBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTeacher: { fontSize: 12, color: D.onSurfaceVariant },
  cardIconsRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  
  attachmentBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: "#F3F4F6" },
  attachmentBadgeText: { color: "#6B7280", fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold },
  linkBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: "#EFF6FF" },
  linkBadgeText: { color: "#2563EB", fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold },

  subjectBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 3, paddingHorizontal: 9, borderRadius: 999 },
  subjectDot: { width: 5, height: 5, borderRadius: 2.5 },
  subjectBadgeText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.3 },

  emptyWrap: { padding: 20, alignItems: "center" },
  emptyText: { color: D.outline },

  detailHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 18 },
  detailTitle: { flex: 1, fontSize: 20, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.4, lineHeight: 24 },

  metaStrip: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: D.outlineVariant, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 14, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaItemText: { fontSize: 12.5, color: D.onSurfaceVariant, fontWeight: "500" },

  bodyBox: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: D.outlineVariant, paddingVertical: 16, paddingHorizontal: 14, marginBottom: 14 },
  boxLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  boxLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 10 },
  bodyText: { fontSize: 13.5, color: D.onSurface, lineHeight: 22, letterSpacing: -0.1 },

  attachmentItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  attachmentIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  attachmentInfo: { flex: 1 },
  attachmentName: { fontSize: 13, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface, letterSpacing: -0.1 },
  attachmentType: { fontSize: 11, color: D.outline, marginTop: 2 },
  attachmentDownload: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },

  linkItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: "#EFF6FF", borderWidth: 1, borderColor: "#BFDBFE" },
  linkIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#2563EB", alignItems: "center", justifyContent: "center" },
  linkInfo: { flex: 1 },
  linkName: { fontSize: 13, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface, letterSpacing: -0.1 },
  linkUrl: { fontSize: 11, color: "#2563EB", marginTop: 2 },
});
