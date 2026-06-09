import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const materials = [
  { title: "Electrostatics Revision Notes", batch: "NEET 12-A", subject: "Physics", type: "Notes", date: "Jun 8", icon: "document-text" as IoniconsName, color: "#6366F1", bg: "#EEF2FF" },
  { title: "Organic Chemistry Formula Sheet", batch: "NEET 11-B", subject: "Chemistry", type: "Notes", date: "Jun 6", icon: "document-text" as IoniconsName, color: "#0EA5E9", bg: "#F0F9FF" },
  { title: "Cell Division Diagrams", batch: "NEET 11-A", subject: "Biology", type: "Diagrams", date: "Jun 4", icon: "image-outline" as IoniconsName, color: "#10B981", bg: "#F0FDF4" },
  { title: "JEE Mock #13 Solutions", batch: "NEET 12-A", subject: "Physics", type: "Solutions", date: "Jun 2", icon: "checkmark-circle-outline" as IoniconsName, color: "#6366F1", bg: "#EEF2FF" },
  { title: "Integration Practice Problems", batch: "NEET 11-B", subject: "Math", type: "Problems", date: "May 30", icon: "calculator-outline" as IoniconsName, color: "#F59E0B", bg: "#FEF3C7" },
];

export function HTMaterialsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Other</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Materials</Text>
        <AnimatedPressable style={s.actionBtn} onPress={() => router.push("/(head-teacher)/post-material")}>
          <Ionicons name="add" size={18} color={D.onSurface} />
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Materials</Text>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={D.outline} />
          <Text style={s.searchPlaceholder}>Search materials…</Text>
        </View>

        {/* Batch filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 14 }} contentContainerStyle={{ gap: 7, paddingRight: 8 }}>
          {["All", "NEET 11-B", "NEET 11-A", "NEET 12-A"].map((b) => (
            <AnimatedPressable key={b} style={[s.batchChip, b === "All" && s.batchChipActive]}>
              <Text style={[s.batchText, b === "All" && { color: D.primary }]}>{b}</Text>
            </AnimatedPressable>
          ))}
        </ScrollView>

        <Text style={s.sectionLabel}>RECENT · {materials.length} FILES</Text>
        <View style={s.card}>
          {materials.map((m, i) => (
            <AnimatedPressable
              key={i}
              style={[s.materialRow, i < materials.length - 1 && s.divider]}
              onPress={() => router.push("/(head-teacher)/material-detail")}
            >
              <View style={[s.fileIcon, { backgroundColor: m.bg }]}>
                <Ionicons name={m.icon} size={16} color={m.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.matTitle} numberOfLines={1}>{m.title}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <View style={[s.subjectBadge, { backgroundColor: m.bg }]}>
                    <Text style={[s.subjectBadgeText, { color: m.color }]}>{m.subject}</Text>
                  </View>
                  <Text style={s.matBatch}>{m.batch}</Text>
                  <View style={s.dot} />
                  <Text style={s.matDate}>{m.date}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={14} color={D.outline} />
            </AnimatedPressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 10, backgroundColor: D.bg },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingRight: 10, paddingLeft: 6, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, height: 38 },
  backText: { fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  headerTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  actionBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 22, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.7, marginBottom: 16 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 9, padding: 13, borderRadius: 16, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  searchPlaceholder: { fontSize: 13, fontFamily: D.font, color: D.outline },
  batchChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  batchChipActive: { backgroundColor: D.surfaceLow, borderColor: D.surfaceHigh },
  batchText: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  materialRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  fileIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  matTitle: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  subjectBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  subjectBadgeText: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold },
  matBatch: { fontSize: 11, fontFamily: D.font, color: D.outline },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.outline },
  matDate: { fontSize: 11, fontFamily: D.font, color: D.outline },
});
