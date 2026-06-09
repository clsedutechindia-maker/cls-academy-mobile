import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const cards: { l: string; sub: string; icon: IoniconsName; color: string; bg: string; route: string }[] = [
  { l: "Schedule", sub: "Timetable & exams", icon: "calendar-outline", color: D.primary, bg: D.surfaceLow, route: "/(head-teacher)/schedule" },
  { l: "Circulars", sub: "3 new this week", icon: "megaphone-outline", color: "#0369A1", bg: "#E0F2FE", route: "/(head-teacher)/circulars" },
  { l: "Leave", sub: "2 staff requests pending", icon: "document-text-outline", color: "#B45309", bg: "#FEF3C7", route: "/(head-teacher)/leave" },
  { l: "Materials", sub: "Upload study resources", icon: "library-outline", color: "#15803D", bg: "#F0FDF4", route: "/(head-teacher)/materials" },
];

export function HTOtherScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 18, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>Other</Text>
        <Text style={s.pageSubtitle}>Quick access to all features</Text>

        <View style={s.grid}>
          {cards.map((c) => (
            <AnimatedPressable key={c.l} style={s.gridCard} onPress={() => router.push(c.route as any)}>
              <View style={[s.cardIcon, { backgroundColor: c.bg }]}>
                <Ionicons name={c.icon} size={20} color={c.color} />
              </View>
              <Text style={s.cardTitle}>{c.l}</Text>
              <Text style={s.cardSub}>{c.sub}</Text>
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
            <Text style={s.cardSub}>5 unanswered from students</Text>
          </View>
          <View style={s.countBadge}><Text style={s.countBadgeText}>5</Text></View>
          <Ionicons name="chevron-forward" size={13} color={D.outline} />
        </AnimatedPressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  pageTitle: { fontSize: 22, fontWeight: "800", color: D.onSurface, letterSpacing: -0.5, marginBottom: 4, fontFamily: D.fontExtraBold },
  pageSubtitle: { fontSize: 12.5, color: D.outline, marginBottom: 20, fontFamily: D.font },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  gridCard: {
    width: "47.5%",
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    shadowColor: "#4C1D95",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  cardTitle: { fontSize: 13.5, fontWeight: "800", color: D.onSurface, letterSpacing: -0.2, fontFamily: D.fontExtraBold },
  cardSub: { fontSize: 11, color: D.outline, marginTop: 3, fontFamily: D.font },
  arrowContainer: { marginTop: 14, flexDirection: "row", justifyContent: "flex-end" },
  arrowWrap: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  doubtsCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: "#4C1D95", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  countBadge: { width: 22, height: 22, borderRadius: 7, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center" },
  countBadgeText: { fontSize: 10.5, fontWeight: "800", color: "#fff", fontFamily: D.fontExtraBold },
});
