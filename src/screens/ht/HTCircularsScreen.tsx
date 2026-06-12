import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listAnnouncementsForProfile } from "../../lib/erp";
import { formatDateTimeLabel } from "../../lib/date";

const tagColor: Record<string, { bg: string; color: string }> = {
  exam: { bg: D.surfaceLow, color: D.primary },
  holiday: { bg: "#DCFCE7", color: "#15803D" },
  ptm: { bg: "#FEF3C7", color: "#B45309" },
  fees: { bg: "#FEE2E2", color: "#B91C1C" },
  general: { bg: "#F4F4F2", color: "#555" },
};

const FILTERS = ["All", "Exam", "Holiday", "PTM", "Fees", "General"];

export function HTCircularsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);

  const { data: announcements, loading, error } = useResource(
    async () => {
      if (!profile) return [];
      return listAnnouncementsForProfile(profile);
    },
    [profile?.userId, profile?.regionId, profile?.centreId],
  );

  const filtered = (announcements ?? []).filter((a: any) => {
    if (activeFilter !== "All") {
      const tag = a.tag ?? a.kind ?? "";
      if (tag.toLowerCase() !== activeFilter.toLowerCase()) return false;
    }
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      return (a.title ?? "").toLowerCase().includes(term) || (a.message ?? "").toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Circulars</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <AnimatedPressable style={s.searchIconBtn} onPress={() => { setSearchVisible((v) => !v); if (searchVisible) setSearch(""); }}>
              <Ionicons name={searchVisible ? "close" : "search"} size={20} color={D.onSurface} />
            </AnimatedPressable>
            <AnimatedPressable style={s.searchIconBtn} onPress={() => router.push("/(team)/post-circular")}>
              <Ionicons name="add" size={20} color={D.onSurface} />
            </AnimatedPressable>
          </View>
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
          {FILTERS.map((b) => (
            <AnimatedPressable key={b} style={[s.chip, b === activeFilter ? s.chipActive : s.chipInactive]} onPress={() => setActiveFilter(b)}>
              <Text style={[s.chipText, { color: b === activeFilter ? "#fff" : D.onSurfaceVariant }]}>{b}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={{ padding: 32, alignItems: "center" }}>
            <ActivityIndicator size="large" color={D.primary} />
          </View>
        )}
        {error && (
          <View style={[s.card, { padding: 16 }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: "#B91C1C" }}>{error}</Text>
          </View>
        )}
        {!loading && !error && filtered.length === 0 && (
          <View style={[s.card, { padding: 20, alignItems: "center" }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No circulars found.</Text>
          </View>
        )}
        {!loading && !error && filtered.length > 0 && (
          <View style={s.card}>
            {filtered.map((c: any, i: number) => {
              const rawTag = c.tag ?? "general";
              const tc = tagColor[rawTag.toLowerCase()] ?? tagColor.general!;
              const dateLabel = formatDateTimeLabel(c.createdAtIso);
              const hasAttach = c.attachments && c.attachments.length > 0;
              return (
                <AnimatedPressable
                  key={c.id}
                  style={[s.circularRow, i < filtered.length - 1 && s.divider]}
                  onPress={() =>
                    router.push({
                      pathname: "/(team)/circular-detail",
                      params: {
                        id: c.id,
                        title: c.title,
                        message: c.message,
                        createdByName: c.createdByName,
                        createdAtIso: c.createdAtIso,
                        attachmentsJson: JSON.stringify(c.attachments ?? []),
                      },
                    })
                  }
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 5 }}>
                    <View style={[s.badge, { backgroundColor: tc.bg }]}>
                      <Text style={[s.badgeText, { color: tc.color }]}>{rawTag}</Text>
                    </View>
                    <Text style={s.circularDate}>{dateLabel}</Text>
                    {hasAttach && <Ionicons name="attach" size={13} color={D.outline} />}
                  </View>
                  <Text style={s.circularTitle}>{c.title}</Text>
                  <Text style={s.circularPreview} numberOfLines={2}>{c.message}</Text>
                </AnimatedPressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 16, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  searchIconBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  searchInput: { flex: 1, fontSize: 13, fontFamily: D.font, color: D.onSurface },
  chipsScroll: { paddingRight: 18, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  chipActive: { backgroundColor: D.primary, borderWidth: 1, borderColor: D.primary },
  chipInactive: { backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  chipText: { fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold },
  card: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  circularRow: { padding: 14 },
  badge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5 },
  badgeText: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.2, textTransform: "capitalize" },
  circularDate: { fontSize: 10.5, fontFamily: D.font, color: D.outline },
  circularTitle: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1, marginBottom: 3 },
  circularPreview: { fontSize: 11, fontFamily: D.font, color: D.outline, lineHeight: 16 },
});
