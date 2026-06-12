import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { useSession } from "../providers/session";
import { useResource } from "../hooks/useResource";
import { listResultsForAdmin } from "../lib/erp";

const subjectColor: Record<string, { text: string; bg: string }> = {
  Physics: { text: "#6366F1", bg: "#EEF2FF" },
  Chemistry: { text: "#0EA5E9", bg: "#F0F9FF" },
  Biology: { text: "#10B981", bg: "#F0FDF4" },
  Math: { text: "#F59E0B", bg: "#FEF3C7" },
};

function getSubjectColor(subjectName: string) {
  for (const key of Object.keys(subjectColor)) {
    if (subjectName.includes(key)) return subjectColor[key]!;
  }
  return { text: D.outline, bg: D.surfaceLow };
}

export function AdminResultsScreen() {
  const insets = useSafeAreaInsets();
  const { adminRecord } = useSession();
  const [selectedBatch, setSelectedBatch] = useState("All batches");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("All subjects");
  const [sortMode, setSortMode] = useState<"recent" | "high" | "low">("recent");
  const [sortPickerOpen, setSortPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);

  const { data: results, loading, error } = useResource(
    async () => {
      if (!adminRecord) return [];
      return listResultsForAdmin(adminRecord);
    },
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const all = results ?? [];
  const classNames = Array.from(new Set(all.map((r) => r.className).filter(Boolean)));
  const batches = ["All batches", ...classNames];
  const subjectNames = Array.from(new Set(all.map((r) => r.subjectName).filter(Boolean)));
  const subjects = ["All subjects", ...subjectNames];

  const SORT_LABELS: Record<typeof sortMode, string> = {
    recent: "Most recent",
    high: "Highest %",
    low: "Lowest %",
  };

  const filtered = all.filter((r) => {
    if (selectedBatch !== "All batches" && r.className !== selectedBatch) return false;
    if (selectedSubject !== "All subjects" && r.subjectName !== selectedSubject) return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      return (r.assessmentTitle ?? "").toLowerCase().includes(term) ||
        (r.studentName ?? "").toLowerCase().includes(term) ||
        (r.className ?? "").toLowerCase().includes(term) ||
        (r.subjectName ?? "").toLowerCase().includes(term);
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "recent") return b.publishedAtIso.localeCompare(a.publishedAtIso);
    const pctA = a.maxScore > 0 ? a.score / a.maxScore : 0;
    const pctB = b.maxScore > 0 ? b.score / b.maxScore : 0;
    return sortMode === "high" ? pctB - pctA : pctA - pctB;
  });

  const avgPct = filtered.length > 0
    ? Math.round(filtered.reduce((acc, r) => acc + (r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0), 0) / filtered.length)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.pageTitle}>Results</Text>
          <View style={{ flex: 1 }} />
          <AnimatedPressable style={s.batchDropdown} onPress={() => setPickerOpen(true)}>
            <Text style={s.batchDropdownText} numberOfLines={1}>{selectedBatch}</Text>
            <Ionicons name="chevron-down" size={13} color={D.primary} />
          </AnimatedPressable>
          <AnimatedPressable style={s.searchIconBtn} onPress={() => { setSearchVisible((v) => !v); if (searchVisible) setSearch(""); }}>
            <Ionicons name={searchVisible ? "close" : "search"} size={18} color={D.onSurface} />
          </AnimatedPressable>
        </View>
        {searchVisible && (
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={17} color={D.outline} />
            <TextInput
              style={s.searchInput}
              placeholder="Search results…"
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
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: MOBILE_BOTTOM_SPACING }} showsVerticalScrollIndicator={false}>
        <View style={s.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsScroll} contentContainerStyle={s.chipsRow}>
            {subjects.map((subj) => (
              <Pressable
                key={subj}
                style={[s.chip, subj === selectedSubject && s.chipActive]}
                onPress={() => setSelectedSubject(subj)}
              >
                <Text style={[s.chipText, subj === selectedSubject && s.chipTextActive]} numberOfLines={1}>{subj}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <AnimatedPressable style={s.sortDropdown} onPress={() => setSortPickerOpen(true)}>
            <Ionicons name="swap-vertical" size={13} color={D.primary} />
            <Text style={s.sortDropdownText} numberOfLines={1}>{SORT_LABELS[sortMode]}</Text>
          </AnimatedPressable>
        </View>

        <View style={s.grid2}>
          <View style={s.featureCard}>
            <View style={[s.fcIcon, { backgroundColor: D.surfaceLow }]}>
              <Ionicons name="document-text-outline" size={14} color={D.primary} />
            </View>
            <Text style={s.fcLabel}>RESULTS</Text>
            <Text style={s.fcValue}>{loading ? "—" : String(filtered.length)}</Text>
            <Text style={s.fcSub} numberOfLines={1}>{selectedBatch === "All batches" ? "All batches" : selectedBatch}</Text>
          </View>
          <View style={s.featureCard}>
            <View style={[s.fcIcon, { backgroundColor: "#F0FDF4" }]}>
              <Ionicons name="bar-chart-outline" size={14} color="#15803D" />
            </View>
            <Text style={s.fcLabel}>AVG SCORE</Text>
            <Text style={s.fcValue}>{loading ? "—" : `${avgPct}%`}</Text>
            <Text style={s.fcSub} numberOfLines={1}>Across results</Text>
          </View>
        </View>

        {loading && (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator color={D.primary} />
            <Text style={{ marginTop: 12, fontFamily: D.font, color: D.outline, fontSize: 13 }}>Loading results…</Text>
          </View>
        )}

        {error && (
          <View style={[s.card, { padding: 16, marginTop: 16 }]}>
            <Text style={{ fontFamily: D.font, color: "#B91C1C", fontSize: 13 }}>{error}</Text>
          </View>
        )}

        {!loading && !error && filtered.length === 0 && (
          <View style={[s.card, { padding: 24, alignItems: "center", marginTop: 16 }]}>
            <Ionicons name="document-text-outline" size={32} color={D.outline} />
            <Text style={{ marginTop: 10, fontFamily: D.font, color: D.outline, fontSize: 13 }}>No results found.</Text>
          </View>
        )}

        {!loading && !error && sorted.length > 0 && (
          <View style={[s.card, { marginTop: 16 }]}>
            {sorted.map((r, i) => {
              const sc = getSubjectColor(r.subjectName || "");
              const pct = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0;
              return (
                <AnimatedPressable
                  key={r.id}
                  style={[s.resultRow, i < sorted.length - 1 && s.divider]}
                  onPress={() =>
                    router.push({
                      pathname: "/(admin)/result-detail",
                      params: {
                        assessmentTitle: r.assessmentTitle,
                        classId: r.classId,
                        className: r.className,
                        subjectName: r.subjectName,
                        subjectId: r.subjectId,
                      },
                    })
                  }
                >
                  <View style={[s.subjectIcon, { backgroundColor: sc.bg }]}>
                    <Text style={{ fontSize: 9, fontFamily: D.fontExtraBold, color: sc.text }}>
                      {(r.subjectName || "?").slice(0, 3).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.resultName} numberOfLines={1}>{r.assessmentTitle}</Text>
                    <Text style={s.resultMeta} numberOfLines={1}>
                      {r.className} · {r.studentName}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text style={[s.avgText, { color: pct >= 80 ? "#15803D" : pct >= 65 ? "#B45309" : "#B91C1C" }]}>{pct}%</Text>
                    <Ionicons name="chevron-forward" size={13} color={D.outline} />
                  </View>
                </AnimatedPressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Batch</Text>
            {batches.map((b) => (
              <Pressable
                key={b}
                style={[s.modalOption, b === selectedBatch && s.modalOptionActive]}
                onPress={() => { setSelectedBatch(b); setPickerOpen(false); }}
              >
                <Text style={[s.modalOptionText, b === selectedBatch && { color: D.primary, fontFamily: D.fontBold }]}>{b}</Text>
                {b === selectedBatch && <Ionicons name="checkmark" size={16} color={D.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={sortPickerOpen} transparent animationType="fade" onRequestClose={() => setSortPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setSortPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Sort By</Text>
            {(Object.keys(SORT_LABELS) as Array<keyof typeof SORT_LABELS>).map((mode) => (
              <Pressable
                key={mode}
                style={[s.modalOption, mode === sortMode && s.modalOptionActive]}
                onPress={() => { setSortMode(mode); setSortPickerOpen(false); }}
              >
                <Text style={[s.modalOptionText, mode === sortMode && { color: D.primary, fontFamily: D.fontBold }]}>{SORT_LABELS[mode]}</Text>
                {mode === sortMode && <Ionicons name="checkmark" size={16} color={D.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 16, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },
  pageTitle: { fontSize: 24, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  batchDropdown: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, maxWidth: 130 },
  batchDropdownText: { fontSize: 11, fontFamily: D.fontBold, color: D.primary, flex: 1 },
  searchIconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  searchInput: { flex: 1, fontSize: 13, fontFamily: D.font, color: D.onSurface },
  filterRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  chipsScroll: { flex: 1 },
  chipsRow: { flexDirection: "row", gap: 8, paddingRight: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  chipActive: { backgroundColor: D.surfaceLow, borderColor: D.primary },
  chipText: { fontSize: 11.5, fontFamily: D.fontMedium, color: D.onSurfaceVariant },
  chipTextActive: { color: D.primary, fontFamily: D.fontBold },
  sortDropdown: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, maxWidth: 110, flexShrink: 0 },
  sortDropdownText: { fontSize: 10.5, fontFamily: D.fontBold, color: D.primary, flexShrink: 1 },
  grid2: { flexDirection: "row", gap: 12, marginBottom: 4 },
  featureCard: { flex: 1, backgroundColor: D.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 4, elevation: 1 },
  fcIcon: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  fcLabel: { marginTop: 10, fontSize: 9, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 },
  fcValue: { marginTop: 4, fontSize: 16, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.35 },
  fcSub: { marginTop: 3, fontSize: 9.5, color: D.onSurfaceVariant, letterSpacing: -0.05, fontFamily: D.font },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  subjectIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  resultName: { fontSize: 12.5, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  resultMeta: { fontSize: 10.5, color: D.outline, marginTop: 3, fontFamily: D.font },
  avgText: { fontSize: 13, fontFamily: D.fontExtraBold, letterSpacing: -0.3 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  modalTitle: { fontSize: 15, fontFamily: D.fontBold, color: D.onSurface, marginBottom: 16, letterSpacing: -0.2 },
  modalOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  modalOptionActive: { backgroundColor: D.surfaceLow, marginHorizontal: -18, paddingHorizontal: 18, borderRadius: 0 },
  modalOptionText: { fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface },
});
