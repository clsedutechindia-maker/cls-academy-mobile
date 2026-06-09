import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

export function HTDoubtDetailScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Doubts</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Doubt</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Student card */}
        <View style={s.studentCard}>
          <View style={[s.avatar, { backgroundColor: "#EC4899" }]}>
            <Text style={s.avatarText}>AV</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.studentName}>Aanya Verma</Text>
            <Text style={s.studentMeta}>NEET 12-A · Roll #001</Text>
          </View>
          <View style={[s.subjectBadge, { backgroundColor: "#EEF2FF" }]}>
            <Text style={[s.subjectBadgeText, { color: "#6366F1" }]}>Physics</Text>
          </View>
        </View>

        {/* Question bubble */}
        <View style={s.questionCard}>
          <View style={s.qHeader}>
            <Ionicons name="help-circle" size={16} color={D.primary} />
            <Text style={s.qLabel}>Question</Text>
            <Text style={s.qTime}>2h ago</Text>
          </View>
          <Text style={s.questionText}>
            In the derivation of electric field due to a dipole at a general point, how do we resolve axial and equatorial components? I'm confused about the direction of the net field vector at an oblique angle.
          </Text>
        </View>

        {/* Reply area */}
        <Text style={s.sectionLabel}>YOUR REPLY</Text>
        <View style={s.replyBox}>
          <Text style={s.replyPlaceholder}>Type your reply here…</Text>
        </View>

        {/* Quick suggestion */}
        <View style={s.suggestionCard}>
          <Ionicons name="bulb-outline" size={14} color="#B45309" />
          <Text style={s.suggestionText}>Tip: Reference Chapter 1, Section 1.10 — Electric Dipole Field</Text>
        </View>
      </ScrollView>

      <View style={s.actionBar}>
        <AnimatedPressable style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Skip</Text>
        </AnimatedPressable>
        <AnimatedPressable style={s.replyBtn}>
          <Ionicons name="send" size={15} color="#fff" />
          <Text style={s.replyBtnText}>Send Reply</Text>
        </AnimatedPressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 10, backgroundColor: D.bg },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingRight: 10, paddingLeft: 6, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, height: 38 },
  backText: { fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  headerTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  studentCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 16, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" },
  studentName: { fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  studentMeta: { fontSize: 12, fontFamily: D.font, color: D.outline, marginTop: 2 },
  subjectBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  subjectBadgeText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold },
  questionCard: { padding: 16, borderRadius: 20, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, marginBottom: 18 },
  qHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  qLabel: { flex: 1, fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  qTime: { fontSize: 11, fontFamily: D.font, color: D.outline },
  questionText: { fontSize: 14, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 22, letterSpacing: -0.1 },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  replyBox: { minHeight: 130, padding: 16, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 14, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  replyPlaceholder: { fontSize: 13, fontFamily: D.font, color: D.outline, lineHeight: 22 },
  suggestionCard: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 14, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A" },
  suggestionText: { flex: 1, fontSize: 12.5, color: "#92400E", fontWeight: "500", fontFamily: D.fontMedium },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 30, backgroundColor: D.bg },
  cancelBtn: { width: 80, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  replyBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  replyBtnText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
});
