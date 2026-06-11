import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listDoubtsForTeacher } from "../../lib/erp";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const cards: { l: string; sub: string; icon: IoniconsName; color: string; bg: string; route: string }[] = [
  { l: "Schedule", sub: "Timetable & exams", icon: "calendar-outline", color: D.primary, bg: D.surfaceLow, route: "/(head-teacher)/schedule" },
  { l: "Circulars", sub: "Announcements", icon: "megaphone-outline", color: "#0369A1", bg: "#E0F2FE", route: "/(head-teacher)/circulars" },
  { l: "Leave", sub: "Manage requests", icon: "document-text-outline", color: "#B45309", bg: "#FEF3C7", route: "/(head-teacher)/leave" },
  { l: "Materials", sub: "Study resources", icon: "library-outline", color: "#15803D", bg: "#F0FDF4", route: "/(head-teacher)/materials" },
  { l: "Teaching Plan", sub: "Weekly plans", icon: "reader-outline", color: "#7C3AED", bg: "#F3E8FF", route: "/(head-teacher)/teaching-plans" },
  { l: "Sessions", sub: "Doubt & remedial requests", icon: "time-outline", color: "#0D9488", bg: "#CCFBF1", route: "/(head-teacher)/sessions" },
];

export function HTOtherScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const { data: doubts } = useResource(
    async () => {
      if (!profile) return [];
      return listDoubtsForTeacher(profile);
    },
    [profile?.userId],
  );

  const openDoubtsCount = (doubts ?? []).filter((d) => d.status === "open").length;

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 18, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Other</Text>
        </View>

        <View style={s.grid}>
          {cards.map((c) => (
            <AnimatedPressable key={c.l} style={s.gridCard} onPress={() => router.push(c.route as any)}>
              <View style={[s.cardIcon, { backgroundColor: c.bg }]}>
                <Ionicons name={c.icon} size={20} color={c.color} />
              </View>
              <Text style={s.cardTitle}>{c.l}</Text>
              <Text style={s.cardSub} numberOfLines={1}>{c.sub}</Text>
              <View style={s.arrowContainer}>
                <View style={[s.arrowWrap, { backgroundColor: c.bg }]}>
                  <Ionicons name="chevron-forward" size={12} color={c.color} />
                </View>
              </View>
            </AnimatedPressable>
          ))}
        </View>

        {/* Doubts — full width */}
        <AnimatedPressable style={s.doubtsCard} onPress={() => router.push("/(head-teacher)/doubts")}>
          <View style={[s.cardIcon, { backgroundColor: D.surfaceLow }]}>
            <Ionicons name="help-circle-outline" size={20} color={D.primaryBtn} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Doubt Requests</Text>
            <Text style={s.cardSub} numberOfLines={1}>
              {openDoubtsCount > 0 ? `${openDoubtsCount} unanswered from students` : "No pending doubts"}
            </Text>
          </View>
          {openDoubtsCount > 0 && (
            <View style={s.countBadge}>
              <Text style={s.countBadgeText}>{openDoubtsCount}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={13} color={D.outline} />
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: D.onSurface, letterSpacing: -0.7, fontFamily: D.fontExtraBold },
  searchIconBtn: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  gridCard: {
    width: "48%",
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    shadowColor: "#4C1D95",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  cardTitle: { fontSize: 13.5, fontWeight: "800", color: D.onSurface, letterSpacing: -0.2, fontFamily: D.fontExtraBold },
  cardSub: { fontSize: 11, color: D.outline, marginTop: 3, fontFamily: D.font },
  arrowContainer: { marginTop: 14, flexDirection: "row", justifyContent: "flex-end" },
  arrowWrap: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  doubtsCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: "#4C1D95", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  countBadge: { width: 22, height: 22, borderRadius: 6, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" },
  countBadgeText: { fontSize: 10.5, fontWeight: "800", color: "#fff", fontFamily: D.fontExtraBold },
});
