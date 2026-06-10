import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { EmptyCard, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING, SegmentedToggle, SubjectChip, uiStyles, D } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { formatDateLabel } from "../lib/date";
import { listStudentResults } from "../lib/erp";
import { useResource } from "../hooks/useResource";
import { useSession } from "../providers/session";
import { groupResultsBySubject, percent, resultDate, resultDelta, subjectColor, subjectBgColor } from "./studentUtils";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SortMode = "recent" | "highest" | "lowest";

function DeltaText({ delta, big }: { delta: number | null, big?: boolean }) {
  if (delta === null) return <Text style={[uiStyles.muted, { fontSize: big ? 15 : 11.5 }]}>-</Text>;
  const up = delta >= 0;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      <Ionicons name={up ? "arrow-up" : "arrow-down"} size={big ? 14 : 12} color={up ? D.successFg : D.errorFg} />
      <Text style={{ color: up ? D.successFg : D.errorFg, fontWeight: "700", fontSize: big ? 15 : 11.5 }}>
        {up ? "+" : ""}{delta}
      </Text>
    </View>
  );
}

function formatDeltaValue(delta: number | null) {
  if (delta === null) return "--";
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

function useStudentResultsResource() {
  const { profile } = useSession();
  const resource = useResource(async () => (profile ? listStudentResults(profile) : []), [profile?.userId]);
  return { profile, resource };
}

export function StudentResultsScreen() {
  const { resource } = useStudentResultsResource();
  const [view, setView] = useState<"all" | "subjects">("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("recent");

  const SORT_CYCLE: SortMode[] = ["recent", "highest", "lowest"];
  const SORT_LABELS: Record<SortMode, string> = { recent: "Most recent", highest: "Highest score", lowest: "Lowest score" };
  const cycleSortMode = () => setSortMode(prev => SORT_CYCLE[(SORT_CYCLE.indexOf(prev) + 1) % SORT_CYCLE.length]);
  const insets = useSafeAreaInsets();
  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return [...(resource.data ?? [])]
      .filter((item) => {
        return !normalizedSearch ||
          [item.assessmentTitle, item.subjectName, item.teacherName]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalizedSearch));
      })
      .sort((a, b) => {
        if (sortMode === "highest") return percent(b.score, b.maxScore) - percent(a.score, a.maxScore);
        if (sortMode === "lowest") return percent(a.score, a.maxScore) - percent(b.score, b.maxScore);
        return resultDate(b).localeCompare(resultDate(a));
      });
  }, [normalizedSearch, resource.data, sortMode]);

  const subjectSummaries = useMemo(() => {
    const grouped = groupResultsBySubject(resource.data ?? []);
    return Array.from(grouped.entries()).map(([name, items]) => {
      const avg = items.length ? Math.round(items.reduce((sum, item) => sum + percent(item.score, item.maxScore), 0) / items.length) : 0;
      const latest = items[0];
      return { name, items, avg, latest };
    }).sort((a, b) => b.avg - a.avg);
  }, [resource.data]);

  const overallAverage = subjectSummaries.length
    ? Math.round(subjectSummaries.reduce((sum, item) => sum + item.avg, 0) / subjectSummaries.length)
    : 0;

  const filteredSubjectSummaries = useMemo(() => {
    if (!normalizedSearch) return subjectSummaries;
    return subjectSummaries.filter((item) => {
      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.items.some((result) => {
          return [result.assessmentTitle, result.teacherName]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(normalizedSearch));
        })
      );
    });
  }, [normalizedSearch, subjectSummaries]);

  const hasActiveSearch = searchOpen || search.length > 0;

  const closeSearch = () => {
    setSearch("");
    setSearchOpen(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={[uiStyles.screenContent, { paddingTop: Math.max(insets.top + 18, 46), paddingBottom: MOBILE_BOTTOM_SPACING, gap: 8 }]}>
        <View style={styles.resultsHeader}>
          <Text style={{ fontSize: 24, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.45 }}>Results</Text>
          <AnimatedPressable onPress={hasActiveSearch ? closeSearch : () => setSearchOpen(true)} style={styles.searchBtn}>
            <Ionicons name={hasActiveSearch ? "close" : "search"} size={18} color={D.onSurface} />
          </AnimatedPressable>
        </View>

        <View style={styles.segmentTighten}>
          <SegmentedToggle
            options={[{ label: "All", value: "all" }, { label: "Subject-wise", value: "subjects" }]}
            selected={view}
            onChange={setView}
          />
        </View>

        {searchOpen ? (
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={D.onSurfaceVariant} />
            <TextInput
              style={styles.searchInput}
              placeholder={view === "all" ? "Search assessments, subjects, or teachers" : "Search subjects or recent tests"}
              placeholderTextColor={D.outline}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 ? (
              <AnimatedPressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={D.outline} />
              </AnimatedPressable>
            ) : null}
          </View>
        ) : null}

        {resource.loading ? (
          <LoadingCard label="Loading results..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : !resource.data || resource.data.length === 0 ? (
          <EmptyCard title="No results yet" message="Teachers have not published any assessments for this account yet." />
        ) : view === "all" ? (
          <>
            <View style={styles.resultsControls}>
              <AnimatedPressable onPress={cycleSortMode} style={styles.filterBar}>
                <Ionicons name="swap-vertical-outline" size={12} color={D.primary} />
                <Text style={[styles.filterBarText, { color: D.primary }]}>{SORT_LABELS[sortMode]}</Text>
              </AnimatedPressable>
            </View>

            {filtered.length === 0 ? (
              <EmptyCard
                title="No matching results"
                message={search.length > 0 ? "Try a different search or clear the subject filter." : "No results match the selected subject yet."}
              />
            ) : (
              <View style={styles.resultsList}>
                {filtered.map((result) => {
                  const pct = percent(result.score, result.maxScore);
                  const delta = resultDelta(result, resource.data ?? []);
                  const color = subjectColor(result.subjectName);
                  const bgColor = subjectBgColor(result.subjectName);
                  return (
                    <AnimatedPressable key={result.id} onPress={() => router.push(`/(student)/result-detail?id=${encodeURIComponent(result.id)}`)} style={styles.resultCard}>
                      <View style={styles.resultTopRow}>
                        <SubjectChip subject={result.subjectName} color={color} bgColor={bgColor} />
                        <Text style={styles.resultDate}>{formatDateLabel(resultDate(result))}</Text>
                      </View>
                      <Text style={styles.resultName}>{result.assessmentTitle}</Text>
                      <View style={styles.resultMetaRow}>
                        <View style={styles.resultScoreCluster}>
                          <Text style={styles.resultScore}>{result.score}<Text style={styles.resultMaxScore}>/{result.maxScore}</Text></Text>

                          <DeltaText delta={Number(delta)} />
                        </View>
                        <Text style={styles.resultTeacher}>{result.teacherName || "Teacher"}</Text>
                      </View>
                      <View style={[styles.resultProgressTrack, { backgroundColor: bgColor }]}>
                        <View style={[styles.resultProgressFill, { width: `${pct}%`, backgroundColor: color }]} />
                      </View>
                    </AnimatedPressable>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.subjectStatsRow}>
              <StatBox label="TOTAL TESTS" value={String(resource.data.length)} sub="All subjects" />
              <StatBox label="OVERALL AVG" value={`${overallAverage}%`} sub="Across terms" />
              <StatBox label="BEST SUBJECT" value={subjectSummaries[0]?.name || "N/A"} sub={`${subjectSummaries[0]?.avg || 0}% avg`} />
            </View>

            {filteredSubjectSummaries.length === 0 ? (
              <EmptyCard title="No matching subjects" message="Try a different search term to find a subject or test." />
            ) : (
              <View style={styles.subjectGrid}>
                {filteredSubjectSummaries.map((item) => {
                  const color = subjectColor(item.name);
                  const bgColor = subjectBgColor(item.name);
                  return (
                    <AnimatedPressable key={item.name} onPress={() => router.push(`/(student)/subject-results?subject=${encodeURIComponent(item.name)}`)} style={[styles.subjectCard, { width: "48%" }]}>
                      <View style={[styles.subjectColorStripe, { backgroundColor: color }]} />
                      <View style={{ marginTop: 6 }}>
                        <Text style={styles.subjectName}>{item.name}</Text>
                        <Text style={styles.subjectTests}>{item.items.length} tests taken</Text>
                      </View>
                      <Text style={[styles.subjectAvg, { color }]}>{item.avg}<Text style={{ fontSize: 14, opacity: 0.7 }}>%</Text></Text>
                      <Text style={styles.subjectAvgSub}>avg score</Text>
                      <View style={[styles.miniBarTrack, { backgroundColor: bgColor, marginTop: 10 }]}>
                        <View style={[styles.miniBarFill, { width: `${item.avg}%`, backgroundColor: color }]} />
                      </View>
                      <View style={[styles.mostRecentBox, { backgroundColor: bgColor }]}>
                        <Text style={[styles.mrLabel, { color }]}>MOST RECENT</Text>
                        <Text style={styles.mrName} numberOfLines={1}>{item.latest?.assessmentTitle}</Text>
                        <Text style={[styles.mrScore, { color }]}>{item.latest ? percent(item.latest.score, item.latest.maxScore) : 0}%</Text>
                      </View>
                    </AnimatedPressable>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, sub }: { label: string, value: string, sub: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  resultsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  segmentTighten: { marginBottom: -6 },
  searchBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#fff", borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    paddingHorizontal: 14,
    marginBottom: 0,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 12.5,
    color: D.onSurface,
    fontFamily: D.font,
  },
  resultsControls: { display: "flex", gap: 8, marginBottom: 0 },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: D.outlineVariant,
  },
  filterBarText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    fontFamily: D.fontSemiBold,
    color: D.onSurfaceVariant,
    includeFontPadding: false,
  },
  filterChip: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: D.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: { backgroundColor: D.primary, borderColor: D.primary },
  filterChipText: { fontSize: 11.5, lineHeight: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, letterSpacing: -0.1, includeFontPadding: false },
  filterChipTextActive: { color: "#fff" },
  resultsList: { gap: 10 },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    shadowColor: "#4C1D95",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  resultTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  resultDate: { fontSize: 10.5, color: D.outline, fontFamily: D.font },
  resultName: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.15, marginBottom: 12, lineHeight: 18 },
  resultMetaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  resultScoreCluster: { flexDirection: "row", alignItems: "baseline", gap: 6, flexWrap: "wrap", flex: 1 },
  resultScore: { fontSize: 20, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  resultMaxScore: { fontSize: 11.5, color: D.outline, fontWeight: "600" },
  resultTeacher: { fontSize: 10.5, color: D.outline, fontFamily: D.font, textAlign: "right", flexShrink: 0 },
  resultProgressTrack: { marginTop: 14, height: 4, borderRadius: 999, overflow: "hidden" },
  resultProgressFill: { height: "100%", borderRadius: 999 },
  miniBarTrack: { height: 4, borderRadius: 999, overflow: "hidden" },
  miniBarFill: { height: "100%", borderRadius: 999 },
  subjectStatsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statBox: { flex: 1, padding: 12, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: D.outlineVariant },
  statLabel: { fontSize: 8.8, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.55 },
  statValue: { marginTop: 4, fontSize: 14, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.35 },
  statSub: { fontSize: 9.5, color: D.onSurfaceVariant, marginTop: 2 },
  subjectGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  subjectCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: "#4C1D95", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  subjectColorStripe: { position: "absolute", top: 0, left: 0, right: 0, height: 4 },
  subjectName: { fontSize: 13.5, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.2 },
  subjectTests: { fontSize: 10, color: D.outline, marginTop: 3 },
  subjectAvg: { marginTop: 14, fontSize: 24, fontWeight: "800", fontFamily: D.fontExtraBold, letterSpacing: -0.8, lineHeight: 26 },
  subjectAvgSub: { fontSize: 9.5, color: D.outline, marginTop: 3 },
  mostRecentBox: { marginTop: 14, padding: 12, borderRadius: 12 },
  mrLabel: { fontSize: 8.8, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.45 },
  mrName: { marginTop: 4, fontSize: 10.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface, letterSpacing: -0.05 },
  mrScore: { marginTop: 3, fontSize: 12, fontWeight: "800", fontFamily: D.fontExtraBold },

  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  resultsListCard: { backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  resultItem: { paddingHorizontal: 14, paddingVertical: 14 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  infoBlock: { padding: 16, backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 12, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  infoCol: { flexBasis: "40%", flexGrow: 1 },
  infoLabel: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.4, marginBottom: 3 },
  infoVal: { fontSize: 13, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  bigScoreBlock: { padding: 18, borderRadius: 22, marginBottom: 14, shadowColor: D.primary, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  classCompBlock: { padding: 16, backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 16 },
  compVal: { marginTop: 4, fontSize: 20, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.6 },
  compDivider: { width: 1, height: 48, backgroundColor: D.outlineVariant },
  compBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: D.successBg },
  compBadgeText: { color: D.successFg, fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.2 },
  trendBlock: { padding: 16, backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 12 },
  chartRow: { minHeight: 116, flexDirection: "row", alignItems: "flex-end", gap: 12, paddingTop: 12, paddingBottom: 10 },
  chartItem: { flex: 1, alignItems: "center", gap: 6 },
  chartBarTrack: { width: "100%", maxWidth: 28, height: 84, justifyContent: "flex-end", alignItems: "center" },
  chartBar: { width: "100%", maxWidth: 28, borderRadius: 8 },
  chartLabel: { fontSize: 11, color: D.onSurfaceVariant, fontWeight: "700", fontFamily: D.fontBold },
});




export function StudentSubjectResultsScreen() {
  const params = useLocalSearchParams<{ subject?: string }>();
  const subject = typeof params.subject === "string" ? params.subject : "";
  const { resource } = useStudentResultsResource();
  const results = useMemo(
    () => (resource.data ?? []).filter((item) => item.subjectName === subject).sort((a, b) => resultDate(b).localeCompare(resultDate(a))),
    [resource.data, subject],
  );
  const avg = results.length ? Math.round(results.reduce((sum, item) => sum + percent(item.score, item.maxScore), 0) / results.length) : 0;
  const best = [...results].sort((a, b) => percent(b.score, b.maxScore) - percent(a.score, a.maxScore))[0];
  const color = subjectColor(subject);
  const bgColor = subjectBgColor(subject);
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={[uiStyles.screenContent, { paddingTop: Math.max(insets.top + 24, 56) }]}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <AnimatedPressable onPress={() => navigateBack(router)} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={20} color={D.onSurface} />
            </AnimatedPressable>
            <Text style={{ fontSize: 24, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 }}>{subject || "Subject"}</Text>
            <SubjectChip subject={subject} color={color} bgColor={bgColor} />
          </View>
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading subject results..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : results.length === 0 ? (
          <EmptyCard title="No subject results" message="No tests were found for this subject." />
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              <View style={[styles.statBox, { flex: 1 }]}>
                <Text style={styles.statLabel}>AVERAGE</Text>
                <Text style={styles.statValue}>{avg}%</Text>
              </View>
              <View style={[styles.statBox, { flex: 1, backgroundColor: bgColor, borderColor: color + "33" }]}>
                <Text style={[styles.statLabel, { color }]}>BEST SCORE</Text>
                <Text style={[styles.statValue, { color }]}>{best ? percent(best.score, best.maxScore) : 0}%</Text>
                <Text style={styles.statSub} numberOfLines={1}>{best?.assessmentTitle || ""}</Text>
              </View>
              <View style={[styles.statBox, { flex: 1 }]}>
                <Text style={styles.statLabel}>TESTS TAKEN</Text>
                <Text style={styles.statValue}>{results.length}</Text>
                <Text style={styles.statSub}>this year</Text>
              </View>
            </View>

            <Text style={{ fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 8, paddingHorizontal: 4 }}>ALL TESTS · MOST RECENT FIRST</Text>
            <View style={styles.resultsListCard}>
              {results.map((result, i, arr) => {
                const pct = percent(result.score, result.maxScore);
                const delta = resultDelta(result, resource.data ?? []);
                return (
                  <View key={result.id} style={[styles.resultItem, i < arr.length - 1 && styles.borderBottom]}>
                    <AnimatedPressable onPress={() => router.push(`/(student)/result-detail?id=${encodeURIComponent(result.id)}`)}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.resultName}>{result.assessmentTitle}</Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                            <Text style={{ fontSize: 11.5, color: D.outline }}>{formatDateLabel(resultDate(result))}</Text>
                            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.outline }} />
                            <Text style={{ fontSize: 11.5, color: D.outline }}>{result.teacherName}</Text>
                          </View>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={styles.resultScore}>{result.score}<Text style={styles.resultMaxScore}>/{result.maxScore}</Text></Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>

                            <DeltaText delta={Number(delta)} />
                          </View>
                        </View>
                      </View>
                      <View style={[styles.miniBarTrack, { backgroundColor: bgColor, marginTop: 10 }]}>
                        <View style={[styles.miniBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                      </View>
                    </AnimatedPressable>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export function StudentResultDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { resource } = useStudentResultsResource();
  const result = (resource.data ?? []).find((item) => item.id === id);
  const sameSubject = (resource.data ?? [])
    .filter((item) => (result?.subjectId && item.subjectId === result.subjectId) || item.subjectName === result?.subjectName)
    .sort((a, b) => resultDate(a).localeCompare(resultDate(b)))
    .slice(-6);
  const scorePct = result ? percent(result.score, result.maxScore) : 0;
  const delta = result ? resultDelta(result, resource.data ?? []) : null;
  const classAvg = result?.classAveragePercent ?? 74;

  const color = result ? subjectColor(result.subjectName) : D.primary;
  const bgColor = result ? subjectBgColor(result.subjectName) : D.primaryFixed;
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={[uiStyles.screenContent, { paddingTop: Math.max(insets.top + 24, 56) }]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={{ fontSize: 17, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3, flex: 1 }} numberOfLines={2}>
            {result?.assessmentTitle || "Test Detail"}
          </Text>
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading result..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : !result ? (
          <EmptyCard title="Result not found" message="This result is not available for your account." />
        ) : (
          <>
            <View style={styles.infoBlock}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>SUBJECT</Text>
                <SubjectChip subject={result.subjectName} color={color} bgColor={bgColor} />
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>CLASS</Text>
                <Text style={styles.infoVal}>{result.className || "Class pending"}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>DATE</Text>
                <Text style={styles.infoVal}>{formatDateLabel(resultDate(result))}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>UPLOADED BY</Text>
                <Text style={styles.infoVal}>{result.teacherName}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              {/* Marks Achieved card */}
              <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 4, elevation: 1 }}>
                <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: bgColor, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="trophy-outline" size={14} color={color} />
                </View>
                <Text style={{ marginTop: 10, fontSize: 9.5, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 }}>MARKS ACHIEVED</Text>
                <Text style={{ marginTop: 4, fontSize: 22, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5, lineHeight: 28 }}>
                  {result.score}<Text style={{ fontSize: 13, color: D.outline, fontWeight: "600", fontFamily: D.fontSemiBold }}>/{result.maxScore}</Text>
                </Text>
                <View style={{ marginTop: 8, height: 4, borderRadius: 999, backgroundColor: D.outlineVariant, overflow: "hidden" }}>
                  <View style={{ width: `${scorePct}%`, height: "100%", backgroundColor: color, borderRadius: 999 }} />
                </View>
                <Text style={{ marginTop: 5, fontSize: 9.5, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 14 }}>{scorePct}% score</Text>
              </View>

              {/* Delta % card */}
              <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 4, elevation: 1 }}>
                <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: delta === null ? D.surfaceLow : (Number(delta) >= 0 ? D.successBg : D.errorBg), alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={delta === null ? "remove-outline" : (Number(delta) >= 0 ? "trending-up-outline" : "trending-down-outline")} size={14} color={delta === null ? D.outline : (Number(delta) >= 0 ? D.success : D.error)} />
                </View>
                <Text style={{ marginTop: 10, fontSize: 9.5, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 }}>DELTA %</Text>
                <Text style={{ marginTop: 4, fontSize: 22, fontWeight: "800", fontFamily: D.fontExtraBold, color: delta === null ? D.outline : (Number(delta) >= 0 ? D.success : D.error), letterSpacing: -0.5, lineHeight: 28 }}>
                  {formatDeltaValue(delta)}
                </Text>
                <Text style={{ marginTop: 9, fontSize: 9.5, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 14 }}>vs previous test</Text>
              </View>
            </View>

            <View style={styles.classCompBlock}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>CLASS AVERAGE</Text>
                <Text style={styles.compVal}>{classAvg}%</Text>
                <View style={{ marginTop: 4, height: 5, borderRadius: 999, backgroundColor: bgColor, overflow: "hidden" }}>
                  <View style={{ width: `${classAvg}%`, height: "100%", backgroundColor: color + "66", borderRadius: 999 }} />
                </View>
              </View>
              <View style={styles.compDivider} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>YOUR SCORE</Text>
                <Text style={[styles.compVal, { color }]}>{scorePct}%</Text>
                <View style={{ marginTop: 4, height: 5, borderRadius: 999, backgroundColor: bgColor, overflow: "hidden" }}>
                  <View style={{ width: `${scorePct}%`, height: "100%", backgroundColor: color, borderRadius: 999 }} />
                </View>
              </View>
              <View style={styles.compBadge}>
                <Text style={styles.compBadgeText}>{scorePct >= classAvg ? "↑ Above avg" : "↓ Below avg"}</Text>
              </View>
            </View>

            <View style={styles.trendBlock}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 }}>Performance trend</Text>
                <Text style={{ fontSize: 11.5, color: D.outline, fontWeight: "500" }}>Last {sameSubject.length} tests</Text>
              </View>
              <View style={styles.chartRow}>
                {sameSubject.map((item) => {
                  const value = percent(item.score, item.maxScore);
                  return (
                    <View key={item.id} style={styles.chartItem}>
                      <View style={styles.chartBarTrack}>
                        <View style={[styles.chartBar, { height: `${Math.max(12, value)}%`, backgroundColor: item.id === result.id ? color : bgColor }]} />
                      </View>
                      <Text style={styles.chartLabel}>{value}%</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
