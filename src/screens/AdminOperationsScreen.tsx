import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { D, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { AnimatedPressable } from "../components/motion";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const NAV_CARDS: { label: string; sub: string; icon: IoniconsName; color: string; bg: string; route: string }[] = [
  { label: "Complaints", sub: "Student reports", icon: "alert-circle-outline", color: "#B91C1C", bg: "#FEE2E2", route: "/(admin)/complaints" },
  { label: "Schedule", sub: "Timetable & exams", icon: "calendar-outline", color: D.primary, bg: D.surfaceLow, route: "/(admin)/schedule" },
  { label: "Teaching Plan", sub: "Review & approve", icon: "reader-outline", color: "#7C3AED", bg: "#F3E8FF", route: "/(admin)/teaching-plans" },
  { label: "Sessions", sub: "Doubt & remedial", icon: "time-outline", color: "#0D9488", bg: "#CCFBF1", route: "/(admin)/sessions" },
  { label: "Results", sub: "Test results", icon: "trophy-outline", color: D.success, bg: "#dcfce7", route: "/(admin)/results" },
  { label: "Leave", sub: "Manage requests", icon: "document-text-outline", color: "#B45309", bg: "#FEF3C7", route: "/(admin)/leave" },
];

export function AdminOperationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Operations</Text>
          <AnimatedPressable style={styles.iconBtn} onPress={() => router.push("/(admin)/notifications")}>
            <Ionicons name="notifications-outline" size={20} color={D.onSurface} />
          </AnimatedPressable>
        </View>
        <Text style={styles.pageSub}>Manage circulars, complaints, schedules and leave.</Text>

        <View style={styles.grid}>
          {NAV_CARDS.map((c) => (
            <AnimatedPressable key={c.label} style={styles.gridCard} onPress={() => router.push(c.route as any)}>
              <View style={[styles.cardIcon, { backgroundColor: c.bg }]}>
                <Ionicons name={c.icon} size={20} color={c.color} />
              </View>
              <Text style={styles.cardTitle}>{c.label}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>{c.sub}</Text>
              <View style={styles.arrowContainer}>
                <View style={[styles.arrowWrap, { backgroundColor: c.bg }]}>
                  <Ionicons name="chevron-forward" size={12} color={c.color} />
                </View>
              </View>
            </AnimatedPressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },
  scroll: { paddingHorizontal: 18, paddingBottom: MOBILE_BOTTOM_SPACING },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingTop: 14, paddingBottom: 4,
  },
  pageTitle: { flex: 1, fontSize: 24, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },
  pageSub: { fontSize: 13, color: D.onSurfaceVariant, lineHeight: 18, fontFamily: D.font, paddingTop: 4, marginBottom: 20 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
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
  cardTitle: { fontSize: 13.5, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.2 },
  cardSub: { fontSize: 11, color: D.outline, marginTop: 3, fontFamily: D.font },
  arrowContainer: { marginTop: 14, flexDirection: "row", justifyContent: "flex-end" },
  arrowWrap: { width: 24, height: 24, borderRadius: 7, alignItems: "center", justifyContent: "center" },
});
