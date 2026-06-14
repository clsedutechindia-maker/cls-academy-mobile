import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const cards: { l: string; sub: string; icon: IoniconsName; color: string; bg: string; route: string }[] = [
  { l: "Circulars", sub: "Notices & updates", icon: "megaphone-outline", color: "#0369A1", bg: "#E0F2FE", route: "/(employee)/announcements" },
  { l: "Schedules", sub: "Timetable & exam dates", icon: "calendar-outline", color: D.primary, bg: D.surfaceLow, route: "/(employee)/schedules" },
  { l: "Materials", sub: "Study resources", icon: "library-outline", color: "#15803D", bg: "#F0FDF4", route: "/(employee)/materials" },
  { l: "Inquiries", sub: "Admission leads", icon: "person-add-outline", color: "#7C3AED", bg: "#F3E8FF", route: "/(employee)/inquiries" },
  { l: "Teaching Plans", sub: "View & upload plans", icon: "book-outline", color: "#0369A1", bg: "#E0F2FE", route: "/(employee)/teaching-plans" },
  { l: "Sessions", sub: "Doubt & remedial slots", icon: "time-outline", color: "#0D9488", bg: "#CCFBF1", route: "/(employee)/sessions" },
  { l: "Fees", sub: "Collect & track payments", icon: "card-outline", color: "#B45309", bg: "#FEF3C7", route: "/(employee)/fees" },
  { l: "Fee Plans", sub: "Set up fee structures", icon: "options-outline", color: "#9333EA", bg: "#F3E8FF", route: "/(employee)/fee-structures" },
];

export function EmployeeDataScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 18, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Data</Text>
        </View>

        <Text style={s.sectionLabel}>DATA ENTRY TASKS</Text>
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

        <View style={s.infoCard}>
          <View style={[s.infoIcon, { backgroundColor: "#FEF3C7" }]}>
            <Ionicons name="information-circle-outline" size={18} color="#B45309" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.infoTitle}>Office Staff Access</Text>
            <Text style={s.infoBody}>You can enter results and mark attendance for any class in your centre. Teachers can view but not modify entries.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  pageTitle: { fontSize: 26, fontWeight: "700", color: D.onSurface, letterSpacing: -0.5, fontFamily: D.fontBold },
  sectionLabel: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.6, marginBottom: 14, marginTop: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
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
  cardTitle: { fontSize: 13.5, fontWeight: "600", color: D.onSurface, letterSpacing: -0.2, fontFamily: D.fontSemiBold },
  cardSub: { fontSize: 11, color: D.outline, marginTop: 3, fontFamily: D.font },
  arrowContainer: { marginTop: 14, flexDirection: "row", justifyContent: "flex-end" },
  arrowWrap: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 14, backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A" },
  infoIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  infoTitle: { fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold, color: "#92400E", marginBottom: 4 },
  infoBody: { fontSize: 11.5, color: "#92400E", fontFamily: D.font, lineHeight: 16 },
});
