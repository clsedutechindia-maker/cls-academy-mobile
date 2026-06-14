import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listAnnouncementsForProfile } from "../../lib/erp";
import { formatDateTimeLabel } from "../../lib/date";

const FILTERS = ["All", "Exam", "Holiday", "General", "Fees"];

const tagColor: Record<string, { bg: string; fg: string }> = {
  exam: { bg: "#FEF3C7", fg: "#92400E" },
  holiday: { bg: "#D1FAE5", fg: "#065F46" },
  general: { bg: "#EEF2FF", fg: "#3730A3" },
  fees: { bg: "#FEE2E2", fg: "#991B1B" },
  ptm: { bg: "#F0FDF4", fg: "#15803D" },
};

function getTagStyle(tag?: string) {
  if (!tag) return { bg: D.surfaceLow, fg: D.outline };
  return tagColor[tag.toLowerCase()] ?? { bg: D.surfaceLow, fg: D.outline };
}

export function TeacherAnnouncementsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: announcements, loading, error, reload } = useResource(
    async () => {
      if (!profile) return [];
      return listAnnouncementsForProfile(profile);
    },
    [profile?.userId, profile?.regionId, profile?.centreId],
  );

  const filtered = (announcements ?? []).filter((a: any) => {
    if (activeFilter !== "All" && a.tag?.toLowerCase() !== activeFilter.toLowerCase()) return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      return (a.title ?? "").toLowerCase().includes(term) || (a.message ?? "").toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
          <View style={s.titleRow}>
            <Text style={s.pageTitle}>Circulars</Text>
            <AnimatedPressable style={s.searchIconBtn} onPress={() => { setSearchVisible((v) => !v); if (searchVisible) setSearch(""); }}>
              <Ionicons name={searchVisible ? "close" : "search"} size={20} color={D.onSurface} />
            </AnimatedPressable>
          </View>

          {searchVisible && (
            <View style={s.searchBar}>
              <Ionicons name="search-outline" size={17} color={D.outline} />
              <TextInput
                style={s.searchInput}
                placeholder="Search circulars…"
                placeholderTextColor={D.outline}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={17} color={D.outline} />
                </Pressable>
              )}
            </View>
          )}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsScroll}>
            {FILTERS.map((f) => (
              <AnimatedPressable
                key={f}
                style={[s.chip, activeFilter === f ? s.chipActive : s.chipInactive]}
                onPress={() => setActiveFilter(f)}
              >
                <Text style={[s.chipText, { color: activeFilter === f ? "#fff" : D.onSurfaceVariant }]}>{f}</Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </View>

        <View style={s.contentArea}>
          {loading && (
            <View style={[s.card, { padding: 20, alignItems: "center" }]}>
              <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>Loading circulars…</Text>
            </View>
          )}

          {error && (
            <View style={[s.card, { padding: 16 }]}>
              <Text style={{ fontSize: 13, fontFamily: D.font, color: "#B91C1C" }}>{error}</Text>
              <AnimatedPressable onPress={reload} style={{ marginTop: 10, alignSelf: "flex-start" }}>
                <Text style={{ fontSize: 12, fontFamily: D.fontBold, color: D.primary }}>Retry</Text>
              </AnimatedPressable>
            </View>
          )}

          {!loading && !error && filtered.length === 0 && (
            <View style={[s.emptyCard, { padding: 32 }]}>
              <Ionicons name="megaphone-outline" size={36} color={D.surfaceHigh} />
              <Text style={s.emptyTitle}>No circulars</Text>
              <Text style={s.emptySub}>Nothing here yet for your classes.</Text>
            </View>
          )}

          {!loading && !error && filtered.length > 0 && (filtered as any[]).map((a: any, i: number) => {
            const tc = getTagStyle(a.tag);
            const expanded = expandedId === a.id;
            return (
              <AnimatedPressable key={a.id} style={[s.announcCard, i < filtered.length - 1 && { marginBottom: 10 }]} onPress={() => setExpandedId(expanded ? null : a.id)}>
                <View style={s.announcHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.announcTitle} numberOfLines={expanded ? undefined : 2}>{a.title}</Text>
                    <Text style={s.announcMeta}>{a.createdByName} · {formatDateTimeLabel(a.createdAtIso)}</Text>
                  </View>
                  {(a as any).tag && (
                    <View style={[s.tagBadge, { backgroundColor: tc.bg }]}>
                      <Text style={[s.tagText, { color: tc.fg }]}>{(a as any).tag}</Text>
                    </View>
                  )}
                </View>
                <Text style={s.announcBody} numberOfLines={expanded ? undefined : 3}>{a.message}</Text>
                <View style={s.announcFooter}>
                  <Ionicons name="location-outline" size={12} color={D.outline} />
                  <Text style={s.footerText}>
                    {a.audienceScope === "all" ? "All students" : a.centreName || a.regionName || "Scoped"}
                  </Text>
                  <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={12} color={D.outline} style={{ marginLeft: "auto" }} />
                </View>
              </AnimatedPressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 16, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.7 },
  searchIconBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  searchInput: { flex: 1, fontSize: 13, fontFamily: D.font, color: D.onSurface },
  chipsScroll: { paddingRight: 18, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  chipActive: { backgroundColor: D.primary, borderWidth: 1, borderColor: D.primary },
  chipInactive: { backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  chipText: { fontSize: 12, fontWeight: "600", fontFamily: D.fontSemiBold },
  contentArea: { paddingHorizontal: 18 },
  card: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant },
  emptyCard: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  emptySub: { fontSize: 12, fontFamily: D.font, color: D.outline, textAlign: "center" },
  announcCard: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, padding: 14, marginBottom: 10, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  announcHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  announcTitle: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2, lineHeight: 19 },
  announcMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 3 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, flexShrink: 0 },
  tagText: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.3, textTransform: "uppercase" },
  announcBody: { fontSize: 12.5, fontFamily: D.fontMedium, color: D.onSurfaceVariant, lineHeight: 19, marginBottom: 10 },
  announcFooter: { flexDirection: "row", alignItems: "center", gap: 5, paddingTop: 10, borderTopWidth: 1, borderTopColor: D.outlineVariant },
  footerText: { fontSize: 11, fontFamily: D.font, color: D.outline },
});
