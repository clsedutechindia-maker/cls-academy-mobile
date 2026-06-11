import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listTeacherResults } from "../../lib/erp";

const subjectColor: Record<string, { text: string; bg: string }> = {
  Physics: { text: "#6366F1", bg: "#EEF2FF" },
  Chemistry: { text: "#0EA5E9", bg: "#F0F9FF" },
  Biology: { text: "#10B981", bg: "#F0FDF4" },
};

function getSubjectColor(subjectName: string) {
  for (const key of Object.keys(subjectColor)) {
    if (subjectName.includes(key)) return subjectColor[key]!;
  }
  return { text: D.outline, bg: "#F4F4F2" };
}

export function TeacherResultsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [selectedBatch, setSelectedBatch] = useState("All batches");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);

  const { data: results, loading, error } = useResource(
    async () => {
      if (!profile) return [];
      return listTeacherResults(profile);
    },
    [profile?.userId],
  );

  const seen = new Set<string>();
  const uniqueTests = (results ?? []).filter((r) => {
    const key = `${r.assessmentTitle}__${r.classId}__${r.subjectId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const classNames = Array.from(new Set(uniqueTests.map((r) => r.className).filter(Boolean)));
  const batches = ["All batches", ...classNames];

  const filtered = uniqueTests.filter((r) => {
    if (selectedBatch !== "All batches" && r.className !== selectedBatch) return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      return (r.assessmentTitle ?? "").toLowerCase().includes(term) ||
        (r.className ?? "").toLowerCase().includes(term) ||
        (r.subjectName ?? "").toLowerCase().includes(term);
    }
    return true;
  });

  const filteredAllResults = selectedBatch === "All batches"
    ? (results ?? [])
    : (results ?? []).filter((r) => r.className === selectedBatch);

  const totalCount = filtered.length;
  const avgPct = filteredAllResults.length > 0
    ? Math.round(filteredAllResults.reduce((acc, r) => acc + (r.maxScore > 0 ? (r.score / r.maxScore) * 100 : 0), 0) / filteredAllResults.length)
    : 0;

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
          <View style={s.titleRow}>
            <Text style={s.pageTitle}>Results</Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <AnimatedPressable style={s.batchDropdown} onPress={() => setPickerOpen(true)}>
                <Text style={s.batchDropdownText} numberOfLines={1}>{selectedBatch}</Text>
                <Ionicons name="chevron-down" size={13} color={D.primary} />
              </AnimatedPressable>
              <AnimatedPressable style={s.searchIconBtn} onPress={() => { setSearchVisible((v) => !v); if (searchVisible) setSearch(""); }}>
                <Ionicons name={searchVisible ? "close" : "search"} size={20} color={D.onSurface} />
              </AnimatedPressable>
            </View>
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

        <View style={s.contentArea}>
          <View style={s.grid2}>
            {[
              { label: "Tests Uploaded", value: loading ? "—" : String(totalCount), sub: "Unique tests", icon: "document-text-outline" as const, tone: { bg: D.surfaceLow, fg: D.primary } },
              { label: "Avg Score", value: loading ? "—" : `${avgPct}%`, sub: selectedBatch === "All batches" ? "Across batches" : selectedBatch, icon: "bar-chart-outline" as const, tone: { bg: "#F0FDF4", fg: "#15803D" } },
            ].map((c) => (
              <View key={c.label} style={s.featureCard}>
                <View style={s.fcTopRow}>
                  <View style={[s.fcIcon, { backgroundColor: c.tone.bg }]}>
                    <Ionicons name={c.icon} size={14} color={c.tone.fg} />
                  </View>
                </View>
                <Text style={s.fcLabel}>{c.label.toUpperCase()}</Text>
                <Text style={s.fcValue}>{c.value}</Text>
                <Text style={s.fcSub} numberOfLines={1}>{c.sub}</Text>
              </View>
            ))}
          </View>

          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Recent uploads</Text>
          </View>

          {loading && (
            <View style={[s.card, { padding: 20, alignItems: "center" }]}>
              <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>Loading results…</Text>
            </View>
          )}

          {error && (
            <View style={[s.card, { padding: 16 }]}>
              <Text style={{ fontSize: 13, fontFamily: D.font, color: "#B91C1C" }}>{error}</Text>
            </View>
          )}

          {!loading && !error && filtered.length === 0 && (
            <View style={[s.card, { padding: 20, alignItems: "center" }]}>
              <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No results yet. Tap Upload to add.</Text>
            </View>
          )}

          {!loading && !error && filtered.length > 0 && (
            <View style={s.card}>
              {filtered.map((r, i) => {
                const sc = getSubjectColor(r.subjectName || "");
                const pct = r.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : 0;
                return (
                  <AnimatedPressable
                    key={`${r.assessmentTitle}__${r.classId}__${r.subjectId}`}
                    style={[s.resultRow, i < filtered.length - 1 && s.divider]}
                    onPress={() => router.push({
                      pathname: "/(teacher)/result-detail",
                      params: { assessmentTitle: r.assessmentTitle, classId: r.classId, className: r.className, subjectName: r.subjectName ?? "", subjectId: r.subjectId ?? "" },
                    })}
                  >
                    <View style={[s.subjectIcon, { backgroundColor: sc.bg }]}>
                      <Text style={{ fontSize: 9, fontWeight: "800", fontFamily: D.fontExtraBold, color: sc.text }}>
                        {(r.subjectName || "?").slice(0, 3).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.resultName}>{r.assessmentTitle}</Text>
                      <Text style={s.resultMeta}>
                        {r.className}{r.assessmentDate ? ` · ${r.assessmentDate}` : ""}
                      </Text>
                    </View>
                    <Text style={[s.avgText, { color: pct >= 80 ? "#15803D" : pct >= 65 ? "#B45309" : "#B91C1C" }]}>{pct}%</Text>
                    <Ionicons name="chevron-forward" size={14} color={D.outline} />
                  </AnimatedPressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.85}
        onPress={() => router.push("/(teacher)/upload-result")}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={s.fabText}>Upload Result</Text>
      </TouchableOpacity>

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
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 16, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontSize: 24, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  batchDropdown: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, maxWidth: 130 },
  batchDropdownText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.primary, flex: 1 },
  searchIconBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  searchInput: { flex: 1, fontSize: 13, fontFamily: D.font, color: D.onSurface },
  contentArea: { paddingHorizontal: 18 },
  grid2: { flexDirection: "row", gap: 16, marginBottom: 4 },
  featureCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 4, elevation: 1 },
  fcTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fcIcon: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  fcLabel: { marginTop: 10, fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 },
  fcValue: { marginTop: 4, fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.35 },
  fcSub: { marginTop: 3, fontSize: 9.5, color: D.onSurfaceVariant, letterSpacing: -0.05, fontFamily: D.font },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 12, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  card: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  subjectIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  resultName: { fontSize: 12.5, fontWeight: "700", color: D.onSurface, letterSpacing: -0.1, fontFamily: D.fontBold },
  resultMeta: { fontSize: 10.5, color: D.outline, marginTop: 3, fontFamily: D.font },
  avgText: { fontSize: 13, fontWeight: "800", letterSpacing: -0.3, fontFamily: D.fontExtraBold },
  fab: { position: "absolute", bottom: 100, right: 18, flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 28, backgroundColor: D.primary, shadowColor: D.primary, shadowOpacity: 0.32, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  fabText: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.1 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  modalTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginBottom: 16, letterSpacing: -0.2 },
  modalOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  modalOptionActive: { backgroundColor: D.surfaceLow, marginHorizontal: -18, paddingHorizontal: 18 },
  modalOptionText: { fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface },
});
