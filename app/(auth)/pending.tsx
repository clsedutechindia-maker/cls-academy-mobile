import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../src/providers/session";

const D = {
  bg: "#faf8ff",
  surface: "#ffffff",
  surfaceLow: "#f2f3ff",
  primary: "#3525cd",
  onSurface: "#131b2e",
  onSurfaceVariant: "#464555",
  outlineVariant: "#c7c4d8",
  outline: "#777587",
};

export default function PendingApprovalRoute() {
  const { role, profile, refresh, signOutUser, isReady } = useSession();
  const [checking, setChecking] = useState(false);

  // Approved (or any non-pending state) → let the index router send them onward.
  if (isReady && role !== "pending" && role !== "loading") {
    return <Redirect href="/" />;
  }

  const rejected = profile?.approvalStatus === "rejected";

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await refresh();
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={s.waveTopA} pointerEvents="none" />
      <View style={s.waveTopB} pointerEvents="none" />
      <View style={s.waveBotA} pointerEvents="none" />
      <View style={s.waveBotB} pointerEvents="none" />
      <View style={s.glow} pointerEvents="none" />
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <View style={s.card}>
            <View style={s.iconWrap}>
              <Ionicons
                name={rejected ? "close-circle" : "hourglass-outline"}
                size={40}
                color={D.primary}
              />
            </View>

            <Text style={s.title}>
              {rejected ? "Account Not Approved" : "Awaiting Approval"}
            </Text>
            <Text style={s.body}>
              {rejected
                ? "Your account was not approved. Please contact CLS Academy for help."
                : "Your account has been created and is waiting for an admin to approve it. You'll be able to sign in once it's approved."}
            </Text>

            {profile?.rollNumber ? (
              <View style={s.rollChip}>
                <Ionicons name="person-outline" size={14} color={D.onSurfaceVariant} />
                <Text style={s.rollText}>{profile.rollNumber}</Text>
              </View>
            ) : null}

            {!rejected ? (
              <Pressable
                style={({ pressed }) => [checking && { opacity: 0.55 }, pressed && !checking && { opacity: 0.88 }]}
                onPress={() => void handleRefresh()}
                disabled={checking}
              >
                <LinearGradient
                  colors={["#3525cd", "#6b00b8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.btnPrimary}
                >
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={s.btnPrimaryText}>
                    {checking ? "Checking…" : "Check Again"}
                  </Text>
                </LinearGradient>
              </Pressable>
            ) : null}

            <Pressable
              style={({ pressed }) => [s.btnOutline, pressed && { opacity: 0.88 }]}
              onPress={() => void signOutUser()}
            >
              <Ionicons name="log-out-outline" size={16} color={D.onSurface} />
              <Text style={s.btnOutlineText}>Sign Out</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },
  safe: { flex: 1 },
  waveTopA: { position: "absolute", top: -120, left: -80, width: 360, height: 360, borderRadius: 180, backgroundColor: "#93c5fd", opacity: 0.35 },
  waveTopB: { position: "absolute", top: -60, left: 60, width: 280, height: 280, borderRadius: 140, backgroundColor: "#5eead4", opacity: 0.28 },
  waveBotA: { position: "absolute", bottom: -120, right: -80, width: 360, height: 360, borderRadius: 180, backgroundColor: "#f9a8d4", opacity: 0.32 },
  waveBotB: { position: "absolute", bottom: -60, right: 60, width: 280, height: 280, borderRadius: 140, backgroundColor: "#8822df", opacity: 0.12 },
  glow: { position: "absolute", top: "25%", left: "5%", width: "90%", height: "50%", borderRadius: 9999, backgroundColor: "#faf8ff", opacity: 0.55 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#3525cd",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  iconWrap: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#e2dfff", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "800", color: D.onSurface, textAlign: "center" },
  body: { fontSize: 14, color: D.onSurfaceVariant, textAlign: "center", lineHeight: 21 },
  rollChip: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: D.surfaceLow, borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 6 },
  rollText: { fontSize: 13, fontWeight: "700", color: D.onSurfaceVariant, letterSpacing: 0.5 },
  btnPrimary: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 10, paddingVertical: 14, paddingHorizontal: 28, marginTop: 4,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  btnOutline: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28,
  },
  btnOutlineText: { color: D.onSurface, fontWeight: "600", fontSize: 14 },
});
