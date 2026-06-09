import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const tagColor: Record<string, { bg: string; color: string }> = {
  Exam: { bg: D.surfaceLow, color: D.primary },
  Holiday: { bg: "#DCFCE7", color: "#15803D" },
  PTM: { bg: "#FEF3C7", color: "#B45309" },
  Fees: { bg: "#FEE2E2", color: "#B91C1C" },
  General: { bg: "#F4F4F2", color: "#555" },
};

const circulars = [
  { title: "JEE Mock #14 — schedule released", date: "Jun 9", preview: "Computer-based test in Hall C on Saturday, Jun 14 at 1:30 PM…", attach: true, tag: "Exam" },
  { title: "Holiday notice — Jun 12", date: "Jun 8", preview: "Institute will remain closed on Jun 12 (public holiday)…", attach: false, tag: "Holiday" },
  { title: "Parent-Teacher Meeting — Jun 18", date: "Jun 6", preview: "PTM for NEET 11 batches scheduled for June 18 at 10 AM…", attach: false, tag: "PTM" },
  { title: "Fee reminder — Term 3", date: "Jun 3", preview: "Kindly clear Term 3 dues before June 30 to avoid late fee…", attach: true, tag: "Fees" },
  { title: "New batch timings from July", date: "May 28", preview: "Batch timings for NEET 11-B will change starting July 1…", attach: false, tag: "General" },
];

export function HTCircularsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Other</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Circulars</Text>
        <AnimatedPressable style={s.actionBtn} onPress={() => router.push("/(head-teacher)/post-circular")}>
          <Ionicons name="add" size={18} color={D.onSurface} />
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={D.outline} />
          <Text style={s.searchPlaceholder}>Search circulars…</Text>
        </View>

        <Text style={[s.sectionLabel, { marginTop: 16 }]}>RECENT</Text>
        <View style={s.card}>
          {circulars.map((c, i) => {
            const tc = tagColor[c.tag] ?? { bg: "#F4F4F2", color: "#555" };
            return (
              <AnimatedPressable
                key={i}
                style={[s.circularRow, i < circulars.length - 1 && s.divider]}
                onPress={() => router.push("/(head-teacher)/circular-detail")}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <View style={[s.badge, { backgroundColor: tc.bg }]}><Text style={[s.badgeText, { color: tc.color }]}>{c.tag}</Text></View>
                  <Text style={s.circularDate}>{c.date}</Text>
                  {c.attach && <Ionicons name="attach" size={13} color={D.outline} />}
                </View>
                <Text style={s.circularTitle}>{c.title}</Text>
                <Text style={s.circularPreview}>{c.preview}</Text>
              </AnimatedPressable>
            );
          })}
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
  searchBox: { flexDirection: "row", alignItems: "center", gap: 9, padding: 13, borderRadius: 16, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  searchPlaceholder: { fontSize: 13, fontFamily: D.font, color: D.outline },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  circularRow: { padding: 15 },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  badgeText: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold },
  circularDate: { fontSize: 11, fontFamily: D.font, color: D.outline },
  circularTitle: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2, marginBottom: 3 },
  circularPreview: { fontSize: 11, fontFamily: D.font, color: D.outline, lineHeight: 16 },
});
