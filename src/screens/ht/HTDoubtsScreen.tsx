import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const doubts = [
  { student: "Aanya Verma", initials: "AV", color: "#EC4899", subject: "Physics", question: "In the derivation of electric field due to a dipole at a general point, how do we resolve axial and equatorial components?", time: "2h ago", batch: "NEET 12-A", answered: false },
  { student: "Rahul Sharma", initials: "RS", color: "#7C3AED", subject: "Chemistry", question: "Why does SN2 reaction fail for tertiary halides despite having a good leaving group?", time: "4h ago", batch: "NEET 11-B", answered: false },
  { student: "Karthik Reddy", initials: "KR", color: "#F59E0B", subject: "Biology", question: "Difference between incomplete dominance and codominance with examples from NEET perspective?", time: "Yesterday", batch: "NEET 11-A", answered: false },
  { student: "Meera Patel", initials: "MP", color: "#10B981", subject: "Physics", question: "Can you explain the concept of mutual inductance with a numerical example?", time: "Yesterday", batch: "NEET 12-A", answered: false },
  { student: "Sahil Kumar", initials: "SK", color: "#0EA5E9", subject: "Chemistry", question: "In which cases do we prefer mole fraction over molarity for concentration?", time: "Jun 7", batch: "NEET 11-B", answered: false },
  { student: "Priya Joshi", initials: "PJ", color: "#EF4444", subject: "Biology", question: "Explain the molecular basis of inheritance with respect to transcription in eukaryotes.", time: "Jun 6", batch: "NEET 11-A", answered: true },
];

const subjectColor: Record<string, { bg: string; color: string }> = {
  Physics: { bg: "#EEF2FF", color: "#6366F1" },
  Chemistry: { bg: "#F0F9FF", color: "#0EA5E9" },
  Biology: { bg: "#F0FDF4", color: "#10B981" },
};

export function HTDoubtsScreen() {
  const insets = useSafeAreaInsets();
  const unanswered = doubts.filter((d) => !d.answered);
  const answered = doubts.filter((d) => d.answered);

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Other</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Doubts</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Stats strip */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
          {[
            { label: "Unanswered", value: String(unanswered.length), color: "#B91C1C", bg: "#FEE2E2" },
            { label: "Answered", value: String(answered.length), color: "#15803D", bg: "#DCFCE7" },
            { label: "Total", value: String(doubts.length), color: D.primary, bg: D.surfaceLow },
          ].map((stat) => (
            <View key={stat.label} style={[s.statTile, { borderColor: stat.bg }]}>
              <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.sectionLabel}>UNANSWERED · {unanswered.length}</Text>
        <View style={[s.card, { marginBottom: 16 }]}>
          {unanswered.map((d, i) => {
            const sc = subjectColor[d.subject] ?? { bg: "#F4F4F2", color: "#555" };
            return (
              <AnimatedPressable
                key={i}
                style={[s.doubtRow, i < unanswered.length - 1 && s.divider]}
                onPress={() => router.push("/(head-teacher)/doubt-detail")}
              >
                <View style={[s.avatar, { backgroundColor: d.color }]}>
                  <Text style={s.avatarText}>{d.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 }}>
                    <Text style={s.studentName}>{d.student}</Text>
                    <View style={[s.subjectBadge, { backgroundColor: sc.bg }]}>
                      <Text style={[s.subjectBadgeText, { color: sc.color }]}>{d.subject}</Text>
                    </View>
                  </View>
                  <Text style={s.questionText} numberOfLines={2}>{d.question}</Text>
                  <Text style={s.metaText}>{d.batch} · {d.time}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={D.outline} />
              </AnimatedPressable>
            );
          })}
        </View>

        {answered.length > 0 && (
          <>
            <Text style={s.sectionLabel}>ANSWERED · {answered.length}</Text>
            <View style={s.card}>
              {answered.map((d, i) => {
                const sc = subjectColor[d.subject] ?? { bg: "#F4F4F2", color: "#555" };
                return (
                  <AnimatedPressable
                    key={i}
                    style={[s.doubtRow, { opacity: 0.6 }]}
                    onPress={() => router.push("/(head-teacher)/doubt-detail")}
                  >
                    <View style={[s.avatar, { backgroundColor: d.color }]}>
                      <Text style={s.avatarText}>{d.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 4 }}>
                        <Text style={s.studentName}>{d.student}</Text>
                        <View style={[s.subjectBadge, { backgroundColor: sc.bg }]}>
                          <Text style={[s.subjectBadgeText, { color: sc.color }]}>{d.subject}</Text>
                        </View>
                        <View style={s.answeredBadge}><Text style={s.answeredText}>Answered</Text></View>
                      </View>
                      <Text style={s.questionText} numberOfLines={2}>{d.question}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={D.outline} />
                  </AnimatedPressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 10, backgroundColor: D.bg },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingRight: 10, paddingLeft: 6, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, height: 38 },
  backText: { fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  headerTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  statTile: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: D.surface, borderWidth: 1, alignItems: "center", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  statValue: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, letterSpacing: -0.5 },
  statLabel: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  doubtRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" },
  studentName: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  subjectBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  subjectBadgeText: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold },
  questionText: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 17, letterSpacing: -0.1 },
  metaText: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 3 },
  answeredBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, backgroundColor: "#DCFCE7" },
  answeredText: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: "#15803D" },
});
