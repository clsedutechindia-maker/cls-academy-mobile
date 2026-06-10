import { Redirect } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../src/providers/session";

// Design tokens matching login HTML
const D = {
  bg: "#faf8ff",
  surface: "#ffffff",
  surfaceLow: "#f2f3ff",
  surfaceContainer: "#eaedff",
  primary: "#3525cd",
  onSurface: "#131b2e",
  onSurfaceVariant: "#464555",
  outlineVariant: "#c7c4d8",
  outline: "#777587",
  error: "#ba1a1a",
  errorBg: "#ffdad6",
  tertiary: "#6b00b8",
};

type Tab = "login" | "signup";

export default function SignInRoute() {
  const { role, signIn, signInWithGoogle, error, isReady } = useSession();
  const [activeTab, setActiveTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  if (isReady && role !== "guest" && role !== "loading") {
    return <Redirect href="/" />;
  }

  const handleEmailSubmit = async () => {
    if (!email.trim()) { setLocalError("Enter your email address."); return; }
    if (!password) { setLocalError("Enter your password."); return; }
    setLoading("email");
    setLocalError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setLoading(null);
    }
  };

  const handleGoogle = async () => {
    setLoading("google");
    setLocalError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Unable to sign in with Google.");
      setLoading(null);
    }
  };

  const displayError = localError || error;

  return (
    <View style={s.root}>
      {/* Wave background — same palette as welcome screen */}
      <View style={s.waveTopA} pointerEvents="none" />
      <View style={s.waveTopB} pointerEvents="none" />
      <View style={s.waveBotA} pointerEvents="none" />
      <View style={s.waveBotB} pointerEvents="none" />
      <View style={s.glow} pointerEvents="none" />
    <SafeAreaView style={s.safe}>


      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Glass card */}
          <View style={s.card}>
            {/* Brand */}
            <View style={s.brandRow}>
              <View style={s.brandIcon}>
                <Ionicons name="school" size={26} color={D.primary} />
              </View>
              <Text style={s.brandText}>CLS Academy</Text>
            </View>

            {/* Title */}
            <View style={s.titleBlock}>
              <Text style={s.title}>
                {activeTab === "login" ? "Welcome Back" : "Join Us"}
              </Text>
              <Text style={s.titleSub}>
                {activeTab === "login"
                  ? "Log in to continue your learning journey."
                  : "Account creation is managed by your institute."}
              </Text>
            </View>

            {/* Tabs */}
            <View style={s.tabBar}>
              <Pressable
                style={[s.tab, activeTab === "login" && s.tabActive]}
                onPress={() => { setActiveTab("login"); setLocalError(null); }}
              >
                <Text style={[s.tabText, activeTab === "login" && s.tabTextActive]}>Log In</Text>
              </Pressable>
              <Pressable
                style={[s.tab, activeTab === "signup" && s.tabActive]}
                onPress={() => { setActiveTab("signup"); setLocalError(null); }}
              >
                <Text style={[s.tabText, activeTab === "signup" && s.tabTextActive]}>Sign Up</Text>
              </Pressable>
            </View>

            {activeTab === "login" ? (
              <>
                {/* Email */}
                <View style={s.inputWrap}>
                  <Ionicons name="mail-outline" size={20} color={D.outline} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Email address"
                    placeholderTextColor={D.outlineVariant}
                    value={email}
                    onChangeText={(v) => { setEmail(v); setLocalError(null); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>

                {/* Password */}
                <View style={s.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={20} color={D.outline} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Password"
                    placeholderTextColor={D.outlineVariant}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setLocalError(null); }}
                    secureTextEntry
                    autoComplete="current-password"
                  />
                </View>

                {/* Error */}
                {displayError ? (
                  <View style={s.errorRow}>
                    <Ionicons name="alert-circle-outline" size={15} color={D.error} />
                    <Text style={s.errorText}>{displayError}</Text>
                  </View>
                ) : null}

                {/* Primary CTA */}
                <Pressable
                  style={({ pressed }) => [
                    loading !== null && { opacity: 0.55 },
                    pressed && loading === null && { opacity: 0.88 },
                  ]}
                  onPress={() => void handleEmailSubmit()}
                  disabled={loading !== null}
                >
                  <LinearGradient
                    colors={["#3525cd", "#6b00b8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.btnPrimary}
                  >
                    <Ionicons name="send-outline" size={16} color="#fff" />
                    <Text style={s.btnPrimaryText}>
                      {loading === "email" ? "Signing In…" : "Continue with Email"}
                    </Text>
                  </LinearGradient>
                </Pressable>

                {/* Divider */}
                <View style={s.divider}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerLabel}>Or continue with</Text>
                  <View style={s.dividerLine} />
                </View>

                {/* Google */}
                <Pressable
                  style={({ pressed }) => [
                    s.btnOutline,
                    loading !== null && { opacity: 0.55 },
                    pressed && loading === null && { opacity: 0.88 },
                  ]}
                  onPress={() => void handleGoogle()}
                  disabled={loading !== null}
                >
                  <Ionicons name="logo-google" size={18} color={D.onSurface} />
                  <Text style={s.btnOutlineText}>
                    {loading === "google" ? "Redirecting…" : "Continue with Google"}
                  </Text>
                </Pressable>


              </>
            ) : (
              <View style={s.signupInfo}>
                <Ionicons name="information-circle-outline" size={40} color={D.outline} />
                <Text style={s.signupTitle}>Admin-created accounts only</Text>
                <Text style={s.signupBody}>
                  Student and staff accounts are created by your CLS Academy administrator. Contact your institute to get access, then log in using the Log In tab.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },
  safe: { flex: 1 },
  waveTopA: {
    position: "absolute",
    top: -120,
    left: -80,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "#93c5fd",
    opacity: 0.35,
  },
  waveTopB: {
    position: "absolute",
    top: -60,
    left: 60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#5eead4",
    opacity: 0.28,
  },
  waveBotA: {
    position: "absolute",
    bottom: -120,
    right: -80,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "#f9a8d4",
    opacity: 0.32,
  },
  waveBotB: {
    position: "absolute",
    bottom: -60,
    right: 60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#8822df",
    opacity: 0.12,
  },
  glow: {
    position: "absolute",
    top: "25%",
    left: "5%",
    width: "90%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: "#faf8ff",
    opacity: 0.55,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    shadowColor: "#3525cd",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "#e2dfff",
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { fontSize: 20, fontWeight: "800", color: D.primary },
  titleBlock: { alignItems: "center", gap: 6 },
  title: { fontSize: 26, fontWeight: "800", color: D.onSurface, textAlign: "center" },
  titleSub: { fontSize: 14, color: D.onSurfaceVariant, textAlign: "center", lineHeight: 20 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: D.surfaceContainer,
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: D.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: D.onSurfaceVariant },
  tabTextActive: { color: D.primary },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: D.surfaceLow,
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: D.onSurface,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffdad6",
    borderRadius: 8,
    padding: 10,
  },
  errorText: { flex: 1, color: D.error, fontSize: 13, lineHeight: 18 },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 10,
    paddingVertical: 15,
    shadowColor: "#3525cd",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: D.outlineVariant + "80" },
  dividerLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: D.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  btnOutline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    borderRadius: 10,
    paddingVertical: 13,
  },
  btnOutlineText: { color: D.onSurface, fontWeight: "600", fontSize: 14 },
  signupInfo: { alignItems: "center", gap: 12, paddingVertical: 24 },
  signupTitle: { fontSize: 16, fontWeight: "700", color: D.onSurface },
  signupBody: {
    fontSize: 13,
    color: D.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
  },
});
