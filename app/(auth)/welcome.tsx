import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function WelcomeRoute() {
  return (
    <View style={s.root}>
      {/* Top waves — light blue + pink/teal blobs */}
      <View style={s.waveTopA} />
      <View style={s.waveTopB} />
      {/* Bottom waves — pink + teal blobs */}
      <View style={s.waveBotA} />
      <View style={s.waveBotB} />
      {/* Central glow */}
      <View style={s.glow} />

      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          {/* Glass card */}
          <View style={s.card}>
            <Text style={s.welcomeTo}>Welcome to</Text>
            <Text style={s.brandName}>CLS Academy</Text>

            <Text style={s.tagline}>
              Where Champions Are Made. Join a community dedicated to your
              academic and professional success.
            </Text>

            <Pressable
              style={({ pressed }) => [s.btnWrap, pressed && { opacity: 0.88 }]}
              onPress={() => router.push("/(auth)/sign-in")}
            >
              <LinearGradient
                colors={["#3525cd", "#6b00b8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.btn}
              >
                <Text style={s.btnText}>Continue</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#faf8ff" },
  safe: { flex: 1 },

  // Wave blobs — top area (light blue + pink)
  waveTopA: {
    position: "absolute",
    top: -120,
    left: -80,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "#93c5fd",
    opacity: 0.35,
  },
  waveTopB: {
    position: "absolute",
    top: -60,
    left: 60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#5eead4",
    opacity: 0.3,
  },

  // Wave blobs — bottom area (pink + teal)
  waveBotA: {
    position: "absolute",
    bottom: -120,
    right: -80,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "#f9a8d4",
    opacity: 0.35,
  },
  waveBotB: {
    position: "absolute",
    bottom: -60,
    right: 60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#8822df",
    opacity: 0.15,
  },

  // Central glow
  glow: {
    position: "absolute",
    top: "30%",
    left: "10%",
    width: "80%",
    height: "40%",
    borderRadius: 9999,
    backgroundColor: "#faf8ff",
    opacity: 0.6,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  // Glass card
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(250,248,255,0.75)",
    borderRadius: 28,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#3525cd",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
    gap: 0,
  },

  welcomeTo: {
    fontSize: 40,
    fontWeight: "800",
    color: "#131b2e",
    textAlign: "center",
    letterSpacing: -0.8,
    lineHeight: 48,
    marginBottom: 4,
  },
  brandName: {
    fontSize: 32,
    fontWeight: "800",
    color: "#3525cd",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  tagline: {
    fontSize: 16,
    color: "#464555",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 36,
  },

  btnWrap: { width: "100%" },
  btn: {
    borderRadius: 9999,
    paddingVertical: 17,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3525cd",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.39,
    shadowRadius: 14,
    elevation: 6,
  },
  btnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.14,
  },
});
