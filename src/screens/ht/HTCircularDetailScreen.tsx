import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

export function HTCircularDetailScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Circulars</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Circular</Text>
        <AnimatedPressable style={s.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={D.onSurface} />
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Tag + date row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <View style={s.examBadge}><Text style={s.examBadgeText}>Exam</Text></View>
          <Text style={s.dateText}>Jun 9, 2026</Text>
          <View style={s.dot} />
          <Text style={s.dateText}>Posted by Ms. Rekha</Text>
        </View>

        <Text style={s.title}>JEE Mock #14 — schedule released</Text>

        {/* Audience chips */}
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
          {["NEET 11-B"].map((a) => (
            <View key={a} style={s.audienceChip}>
              <Ionicons name="people-outline" size={11} color={D.primary} />
              <Text style={s.audienceText}>{a}</Text>
            </View>
          ))}
        </View>

        <Text style={s.body}>
          Computer-based test will be held in Hall C on Saturday, Jun 14 at 1:30 PM. Students must carry their hall tickets and report 30 minutes early.
        </Text>
        <Text style={[s.body, { marginTop: 14 }]}>
          Syllabus includes Optics (Ch 9–11), Modern Physics (Ch 12), and Electrostatics (Ch 1–4). Revision material has been uploaded in the Materials section.
        </Text>

        {/* Attachment card */}
        <AnimatedPressable style={s.attachCard}>
          <View style={s.attachIcon}>
            <Ionicons name="document-text" size={18} color={D.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.attachName}>mock14_schedule.pdf</Text>
            <Text style={s.attachMeta}>PDF · 142 KB</Text>
          </View>
          <Ionicons name="download-outline" size={18} color={D.outline} />
        </AnimatedPressable>

        {/* Read by stats */}
        <View style={s.readCard}>
          <View style={s.readRow}>
            <Text style={s.readLabel}>Seen by</Text>
            <Text style={s.readValue}>89 / 124 students</Text>
          </View>
          <View style={s.readBar}>
            <View style={[s.readFill, { width: "72%" }]} />
          </View>
          <Text style={s.readSub}>72% read rate · 35 haven't seen yet</Text>
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
  moreBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  examBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, backgroundColor: D.surfaceLow },
  examBadgeText: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  dateText: { fontSize: 12, fontFamily: D.font, color: D.outline },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.outline },
  title: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.6, lineHeight: 26, marginBottom: 14 },
  audienceChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  audienceText: { fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.primary },
  body: { fontSize: 14, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 22, letterSpacing: -0.1 },
  attachCard: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20, padding: 14, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  attachIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: D.surfaceLow, alignItems: "center", justifyContent: "center" },
  attachName: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  attachMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 2 },
  readCard: { marginTop: 16, padding: 16, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  readRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  readLabel: { fontSize: 12, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.outline },
  readValue: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface },
  readBar: { height: 6, borderRadius: 3, backgroundColor: D.outlineVariant, overflow: "hidden", marginBottom: 7 },
  readFill: { height: "100%", borderRadius: 3, backgroundColor: D.primary },
  readSub: { fontSize: 11.5, fontFamily: D.font, color: D.outline },
});
