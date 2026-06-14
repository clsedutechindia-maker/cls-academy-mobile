import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listLearningResourcesForProfile } from "../../lib/erp";
import { formatDateTimeLabel } from "../../lib/date";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const subjectIconMap: Record<string, { icon: IoniconsName; color: string; bg: string }> = {
  Physics: { icon: "flash-outline", color: "#6366F1", bg: "#EEF2FF" },
  Chemistry: { icon: "flask-outline", color: "#0EA5E9", bg: "#F0F9FF" },
  Biology: { icon: "leaf-outline", color: "#10B981", bg: "#F0FDF4" },
  Math: { icon: "calculator-outline", color: "#F59E0B", bg: "#FEF3C7" },
};

function getSubjectStyle(subjectName: string) {
  for (const key of Object.keys(subjectIconMap)) {
    if (subjectName.includes(key)) return subjectIconMap[key]!;
  }
  return { icon: "document-text-outline" as IoniconsName, color: D.primary, bg: D.surfaceLow };
}

export function HTMaterialsScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const segments = useSegments();
  const seg = segments[0] as string;
  const materialDetailPath = seg === "(teacher)" ? "/(teacher)/material-detail" : seg === "(employee)" ? "/(employee)/material-detail" : "/(team)/material-detail";
  const postMaterialPath = seg === "(teacher)" ? "/(teacher)/post-material" : seg === "(employee)" ? "/(employee)/post-material" : "/(team)/post-material";

  const [selectedFilter, setSelectedFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);

  const { data: materials, loading, error } = useResource(
    async () => {
      if (!profile) return [];
      return listLearningResourcesForProfile(profile);
    },
    [profile?.userId, profile?.centreId, profile?.regionId],
  );

  const allSubjects = Array.from(new Set((materials ?? []).map((m) => m.subjectName).filter(Boolean)));
  const filters = ["All", ...allSubjects];

  const filtered = (materials ?? []).filter((m) => {
    if (selectedFilter !== "All" && m.subjectName !== selectedFilter) return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      return [m.title, m.subjectName, m.className, m.createdByName].join(" ").toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Materials</Text>
          <AnimatedPressable style={s.searchIconBtn} onPress={() => { setSearchVisible((v) => !v); if (searchVisible) setSearch(""); }}>
            <Ionicons name={searchVisible ? "close" : "search"} size={22} color={D.onSurface} />
          </AnimatedPressable>
        </View>

        {searchVisible && (
          <View style={{ marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant }}>
            <Ionicons name="search-outline" size={17} color={D.outline} />
            <TextInput
              style={{ flex: 1, fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface }}
              placeholder="Search by title or subject…"
              placeholderTextColor={D.outline}
              value={search}
              onChangeText={setSearch}
              autoFocus
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={17} color={D.outline} />
              </Pressable>
            )}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsScroll}>
          {filters.map((b) => (
            <AnimatedPressable key={b} style={[s.chip, b === selectedFilter ? s.chipActive : s.chipInactive]} onPress={() => setSelectedFilter(b)}>
              <Text style={[s.chipText, { color: b === selectedFilter ? "#fff" : D.onSurfaceVariant }]}>{b}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
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
            <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No materials found.</Text>
          </View>
        )}
        {!loading && !error && filtered.length > 0 && (
          <View style={s.card}>
            {filtered.map((m, i) => {
              const { icon, color, bg } = getSubjectStyle(m.subjectName || "");
              const dateLabel = formatDateTimeLabel(m.createdAtIso);
              return (
                <AnimatedPressable
                  key={m.id}
                  style={[s.materialRow, i < filtered.length - 1 && s.divider]}
                  onPress={() =>
                    router.push({
                      pathname: materialDetailPath as any,
                      params: {
                        id: m.id,
                        title: m.title,
                        description: m.description,
                        subjectName: m.subjectName,
                        className: m.className,
                        createdByName: m.createdByName,
                        createdAtIso: m.createdAtIso,
                        attachmentsJson: JSON.stringify(m.attachments ?? []),
                        linkUrl: m.linkUrl ?? "",
                      },
                    })
                  }
                >
                  <View style={[s.fileIcon, { backgroundColor: bg }]}>
                    <Ionicons name={icon} size={16} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.matTitle} numberOfLines={1}>{m.title}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                      {m.subjectName ? (
                        <View style={[s.subjectBadge, { backgroundColor: bg }]}>
                          <Text style={[s.subjectBadgeText, { color }]}>{m.subjectName}</Text>
                        </View>
                      ) : null}
                      {m.className ? <Text style={s.matBatch}>{m.className}</Text> : null}
                      <View style={s.dot} />
                      <Text style={s.matDate}>{dateLabel}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={D.outline} />
                </AnimatedPressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={s.fab}
        activeOpacity={0.85}
        onPress={() => router.push(postMaterialPath as any)}
      >
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={s.fabText}>Post Material</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 16, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.7 },
  searchIconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  chipsScroll: { paddingRight: 18, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  chipActive: { backgroundColor: D.primary, borderWidth: 1, borderColor: D.primary },
  chipInactive: { backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  chipText: { fontSize: 12, fontWeight: "600", fontFamily: D.fontSemiBold },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  materialRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  fileIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  matTitle: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  subjectBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  subjectBadgeText: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold },
  matBatch: { fontSize: 11, fontFamily: D.font, color: D.outline },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.outline },
  matDate: { fontSize: 11, fontFamily: D.font, color: D.outline },
  fab: { position: "absolute", bottom: 100, right: 18, flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 13, paddingHorizontal: 18, borderRadius: 28, backgroundColor: D.primary, shadowColor: D.primary, shadowOpacity: 0.32, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  fabText: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.1 },
});
