import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

export function HTMaterialDetailScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Materials</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Material</Text>
        <AnimatedPressable style={s.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={D.onSurface} />
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* File hero */}
        <View style={s.heroCard}>
          <View style={s.heroIcon}>
            <Ionicons name="document-text" size={36} color={D.primary} />
          </View>
          <Text style={s.heroTitle}>Electrostatics Revision Notes</Text>
          <View style={{ flexDirection: "row", gap: 7, marginTop: 8 }}>
            <View style={s.badge}><Text style={s.badgeText}>NEET 12-A</Text></View>
            <View style={[s.badge, { backgroundColor: "#EEF2FF" }]}><Text style={[s.badgeText, { color: "#6366F1" }]}>Physics</Text></View>
            <View style={[s.badge, { backgroundColor: "#F4F4F2" }]}><Text style={[s.badgeText, { color: D.outline }]}>Notes</Text></View>
          </View>
        </View>

        {/* Meta */}
        <View style={s.metaCard}>
          {[
            { label: "Uploaded by", value: "Ms. Rekha Sharma" },
            { label: "Date", value: "Jun 8, 2026" },
            { label: "File", value: "electrostatics_rev.pdf" },
            { label: "Size", value: "3.2 MB" },
          ].map((m) => (
            <View key={m.label} style={s.metaRow}>
              <Text style={s.metaLabel}>{m.label}</Text>
              <Text style={s.metaValue}>{m.value}</Text>
            </View>
          ))}
        </View>

        {/* Download / Open */}
        <AnimatedPressable style={s.openBtn}>
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={s.openText}>Open File</Text>
        </AnimatedPressable>
        <AnimatedPressable style={s.downloadBtn}>
          <Ionicons name="download-outline" size={18} color={D.primary} />
          <Text style={s.downloadText}>Download</Text>
        </AnimatedPressable>

        {/* Engagement stats */}
        <Text style={[s.sectionLabel, { marginTop: 24 }]}>STUDENT ACCESS</Text>
        <View style={s.statsCard}>
          {[
            { label: "Viewed", value: "67", sub: "students" },
            { label: "Downloaded", value: "34", sub: "students" },
            { label: "Not seen", value: "57", sub: "students" },
          ].map((stat) => (
            <View key={stat.label} style={s.statTile}>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
              <Text style={s.statSub}>{stat.sub}</Text>
            </View>
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
  moreBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  heroCard: { alignItems: "center", padding: 26, borderRadius: 24, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 14, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  heroIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: D.surfaceLow, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroTitle: { fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5, textAlign: "center" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: D.surfaceLow },
  badgeText: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  metaCard: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", marginBottom: 14, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  metaLabel: { fontSize: 12.5, color: D.outline, fontWeight: "500", fontFamily: D.fontMedium },
  metaValue: { fontSize: 13, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  openBtn: { height: 52, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8, shadowColor: D.primary, shadowOpacity: 0.24, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  openText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" },
  downloadBtn: { height: 52, borderRadius: 20, backgroundColor: D.surfaceLow, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: D.surfaceHigh },
  downloadText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  statsCard: { flexDirection: "row", gap: 8 },
  statTile: { flex: 1, padding: 16, borderRadius: 18, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  statValue: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.primary, letterSpacing: -0.5 },
  statLabel: { fontSize: 11.5, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginTop: 2 },
  statSub: { fontSize: 10, fontFamily: D.font, color: D.outline },
});
