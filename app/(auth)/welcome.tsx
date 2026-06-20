import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { D } from "../../src/components/theme";
import { AnimatedPressable } from "../../src/components/motion";

const FEATURES: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string }> = [
  { icon: "calendar-outline", label: "Schedules & timetables at a glance" },
  { icon: "bar-chart-outline", label: "Results and progress tracking" },
  { icon: "checkmark-done-outline", label: "Attendance, doubts & announcements" },
];

export default function WelcomeRoute() {
  return (
    <View style={s.root}>
      {/* Soft brand blobs */}
      <View style={s.blobTopA} pointerEvents="none" />
      <View style={s.blobTopB} pointerEvents="none" />
      <View style={s.blobBot} pointerEvents="none" />
      <View style={s.glow} pointerEvents="none" />

      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <Animated.View entering={FadeInDown.duration(500)} style={s.card}>
            {/* Brand lockup */}
            <View style={s.brandRow}>
              <LinearGradient
                colors={[D.primary, D.primaryBtn]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.brandBadge}
              >
                <Ionicons name="school" size={26} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={s.welcomeTo}>Welcome to</Text>
            <Text style={s.brandName}>CLS Academy</Text>

            <Text style={s.tagline}>
              Where champions are made. Your classes, results and progress — all in one place.
            </Text>

            {/* Feature highlights */}
            <View style={s.features}>
              {FEATURES.map((f) => (
                <View key={f.label} style={s.featureRow}>
                  <View style={s.featureIcon}>
                    <Ionicons name={f.icon} size={16} color={D.primary} />
                  </View>
                  <Text style={s.featureText}>{f.label}</Text>
                </View>
              ))}
            </View>

            <AnimatedPressable style={s.btnWrap} onPress={() => router.push("/(auth)/sign-in")}>
              <LinearGradient
                colors={[D.primary, D.primaryBtn]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.btn}
              >
                <Text style={s.btnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </LinearGradient>
            </AnimatedPressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },
  safe: { flex: 1 },

  blobTopA: {
    position: "absolute",
    top: -130,
    left: -80,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: D.surfaceHigh,
    opacity: 0.55,
  },
  blobTopB: {
    position: "absolute",
    top: -40,
    right: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#C4B5FD",
    opacity: 0.4,
  },
  blobBot: {
    position: "absolute",
    bottom: -140,
    right: -60,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "#DDD6FE",
    opacity: 0.5,
  },
  glow: {
    position: "absolute",
    top: "32%",
    left: "8%",
    width: "84%",
    height: "40%",
    borderRadius: 9999,
    backgroundColor: D.bg,
    opacity: 0.6,
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },

  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 5,
  },

  brandRow: { marginBottom: 18 },
  brandBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
  },

  welcomeTo: {
    fontSize: 22,
    fontFamily: D.fontSemiBold,
    color: D.onSurfaceVariant,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  brandName: {
    fontSize: 34,
    fontFamily: D.fontExtraBold,
    color: D.primary,
    textAlign: "center",
    letterSpacing: -0.6,
    marginTop: 2,
    marginBottom: 14,
  },
  tagline: {
    fontSize: 15,
    fontFamily: D.font,
    color: D.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 23,
    marginBottom: 22,
  },

  features: { width: "100%", gap: 12, marginBottom: 26 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: D.surfaceLow,
    borderWidth: 1,
    borderColor: D.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { flex: 1, fontSize: 13.5, fontFamily: D.fontMedium, color: D.onSurface, letterSpacing: -0.1 },

  btnWrap: { width: "100%" },
  btn: {
    flexDirection: "row",
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  },
  btnText: { color: "#fff", fontSize: 15, fontFamily: D.fontBold, letterSpacing: 0.1 },
});
