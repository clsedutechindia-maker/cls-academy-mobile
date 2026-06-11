import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listDoubtsForTeacher } from "../../lib/erp";

const subjectColor: Record<string, { bg: string; color: string }> = {
  Physics: { bg: "#EEF2FF", color: "#6366F1" },
  Chemistry: { bg: "#F0F9FF", color: "#0EA5E9" },
  Biology: { bg: "#F0FDF4", color: "#10B981" },
};

function getSubjectColor(subjectName: string) {
  for (const key of Object.keys(subjectColor)) {
    if (subjectName.includes(key)) return subjectColor[key]!;
  }
  return { bg: "#F4F4F2", color: "#555" };
}

function relativeTime(isoStr: string) {
  if (!isoStr) return "—";
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const FILTER_OPTIONS = ["All", "Unanswered", "Answered"] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

export function HTDoubtsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const segments = useSegments();
  const doubtDetailPath = (segments[0] as string) === "(teacher)" ? "/(teacher)/doubt-detail" : "/(head-teacher)/doubt-detail";
  const [activeFilter, setActiveFilter] = useState<FilterOption>("All");
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);

  const { data: doubts, loading, error } = useResource(
    async () => {
      if (!profile) return [];
      return listDoubtsForTeacher(profile);
    },
    [profile?.userId],
  );

  const searchMatch = (d: { studentName: string; questionText: string }) => {
    if (!search.trim()) return true;
    const term = search.trim().toLowerCase();
    return d.studentName.toLowerCase().includes(term) || d.questionText.toLowerCase().includes(term);
  };
  const unanswered = (doubts ?? []).filter((d) => d.status === "open" && searchMatch(d));
  const answered = (doubts ?? []).filter((d) => (d.status === "replied" || d.status === "resolved") && searchMatch(d));

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      {/* Heading Section */}
      <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Doubts</Text>
          <AnimatedPressable style={s.searchIconBtn} onPress={() => { setSearchVisible((v) => !v); if (searchVisible) setSearch(""); }}>
            <Ionicons name={searchVisible ? "close" : "search"} size={20} color={D.onSurface} />
          </AnimatedPressable>
        </View>

        {searchVisible && (
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={17} color={D.outline} />
            <TextInput
              style={s.searchInput}
              placeholder="Search by student or question…"
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

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsScroll}>
          {FILTER_OPTIONS.map((b) => {
            const active = b === activeFilter;
            return (
              <AnimatedPressable key={b} style={[s.chip, active ? s.chipActive : s.chipInactive]} onPress={() => setActiveFilter(b)}>
                <Text style={[s.chipText, { color: active ? "#fff" : D.onSurfaceVariant }]}>{b}</Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {/* Stats 2 per row */}
        <View style={s.grid2}>
          {[
            { label: "Unanswered", value: loading ? "—" : String(unanswered.length), color: "#B91C1C", bg: "#FEE2E2" },
            { label: "Answered", value: loading ? "—" : String(answered.length), color: "#15803D", bg: "#DCFCE7" },
            { label: "Total Doubts", value: loading ? "—" : String((doubts ?? []).length), color: D.primary, bg: D.surfaceLow },
          ].map((stat) => (
            <View key={stat.label} style={[s.statTile, { borderColor: stat.bg }]}>
              <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {loading && (
          <View style={[s.card, { padding: 20, alignItems: "center" }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>Loading doubts…</Text>
          </View>
        )}

        {error && (
          <View style={[s.card, { padding: 16 }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: "#B91C1C" }}>{error}</Text>
          </View>
        )}

        {!loading && !error && (
          <>
            {activeFilter !== "Answered" && unanswered.length > 0 && (
              <>
                <Text style={s.sectionLabel}>UNANSWERED · {unanswered.length}</Text>
                <View style={[s.card, { marginBottom: 16 }]}>
                  {unanswered.map((d, i) => {
                    const sc = getSubjectColor(d.subjectName || "");
                    const initials = d.studentName.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
                    return (
                      <AnimatedPressable
                        key={d.id}
                        style={[s.doubtRow, i < unanswered.length - 1 && s.divider]}
                        onPress={() =>
                          router.push({
                            pathname: doubtDetailPath as any,
                            params: { doubtId: d.id },
                          })
                        }
                      >
                        <View style={[s.avatar, { backgroundColor: D.primary }]}>
                          <Text style={s.avatarText}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 }}>
                            <Text style={s.studentName}>{d.studentName}</Text>
                            <View style={[s.subjectBadge, { backgroundColor: sc.bg }]}>
                              <Text style={[s.subjectBadgeText, { color: sc.color }]}>{d.subjectName}</Text>
                            </View>
                          </View>
                          <Text style={s.questionText} numberOfLines={2}>{d.questionText}</Text>
                          <Text style={s.metaText}>{d.studentClassName} · {relativeTime(d.updatedAtIso || d.createdAtIso)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={13} color={D.outline} />
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </>
            )}

            {activeFilter !== "Answered" && unanswered.length === 0 && !loading && (
              <View style={[s.card, { marginBottom: 16, padding: 20, alignItems: "center" }]}>
                <Ionicons name="checkmark-circle-outline" size={28} color="#15803D" style={{ marginBottom: 8 }} />
                <Text style={{ fontSize: 13, fontFamily: D.fontBold, color: D.onSurface }}>All doubts answered</Text>
              </View>
            )}

            {activeFilter !== "Unanswered" && answered.length > 0 && (
              <>
                <Text style={s.sectionLabel}>ANSWERED · {answered.length}</Text>
                <View style={s.card}>
                  {answered.map((d, i) => {
                    const sc = getSubjectColor(d.subjectName || "");
                    const initials = d.studentName.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
                    return (
                      <AnimatedPressable
                        key={d.id}
                        style={[s.doubtRow, { opacity: 0.7 }, i < answered.length - 1 && s.divider]}
                        onPress={() =>
                          router.push({
                            pathname: doubtDetailPath as any,
                            params: { doubtId: d.id },
                          })
                        }
                      >
                        <View style={[s.avatar, { backgroundColor: "#10B981" }]}>
                          <Text style={s.avatarText}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 }}>
                            <Text style={s.studentName}>{d.studentName}</Text>
                            <View style={[s.subjectBadge, { backgroundColor: sc.bg }]}>
                              <Text style={[s.subjectBadgeText, { color: sc.color }]}>{d.subjectName}</Text>
                            </View>
                            <View style={s.answeredBadge}>
                              <Text style={s.answeredText}>{d.status === "resolved" ? "Resolved" : "Answered"}</Text>
                            </View>
                          </View>
                          <Text style={s.questionText} numberOfLines={2}>{d.questionText}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={13} color={D.outline} />
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </>
            )}
          </>
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
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 18 },
  statTile: { width: "47%", padding: 14, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, alignItems: "center", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  statValue: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, letterSpacing: -0.5 },
  statLabel: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  doubtRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" },
  studentName: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  subjectBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5 },
  subjectBadgeText: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold },
  questionText: { fontSize: 11.5, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 17, letterSpacing: -0.1 },
  metaText: { fontSize: 10.5, fontFamily: D.font, color: D.outline, marginTop: 3 },
  answeredBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5, backgroundColor: "#DCFCE7" },
  answeredText: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, color: "#15803D" },
});
