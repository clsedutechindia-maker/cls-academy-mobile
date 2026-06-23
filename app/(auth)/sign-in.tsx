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
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../src/providers/session";
import { D } from "../../src/components/theme";

export default function SignInRoute() {
  const { role, signIn, error, isReady } = useSession();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [focused, setFocused] = useState<"id" | "pw" | null>(null);

  if (isReady && role !== "guest" && role !== "loading") {
    return <Redirect href="/" />;
  }

  const handleSubmit = async () => {
    if (!identifier.trim()) { setLocalError("Enter your roll number or email."); return; }
    if (!password) { setLocalError("Enter your password."); return; }
    setLoading(true);
    setLocalError(null);
    try {
      await signIn(identifier, password);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <View style={s.root}>
      {/* Soft brand blobs — match welcome screen */}
      <View style={s.blobTopA} pointerEvents="none" />
      <View style={s.blobTopB} pointerEvents="none" />
      <View style={s.blobBot} pointerEvents="none" />
      <View style={s.glow} pointerEvents="none" />
      <SafeAreaView style={s.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(450)} style={s.card}>
              {/* Brand */}
              <View style={s.brandRow}>
                <LinearGradient
                  colors={[D.primary, D.primaryBtn]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.brandIcon}
                >
                  <Ionicons name="school" size={24} color="#fff" />
                </LinearGradient>
                <Text style={s.brandText}>CLS Academy</Text>
              </View>

              {/* Title */}
              <View style={s.titleBlock}>
                <Text style={s.title}>Welcome Back</Text>
                <Text style={s.titleSub}>Sign in with the credentials issued by your institute.</Text>
              </View>

              {/* Identifier */}
              <View style={s.field}>
                <Text style={s.label}>Roll number or email</Text>
                <View style={[s.inputWrap, focused === "id" && s.inputWrapFocused]}>
                  <Ionicons name="person-outline" size={20} color={focused === "id" ? D.primary : D.outline} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="e.g. JS26001"
                    placeholderTextColor={D.outline}
                    value={identifier}
                    onChangeText={(v) => { setIdentifier(v); setLocalError(null); }}
                    onFocus={() => setFocused("id")}
                    onBlur={() => setFocused(null)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="default"
                    autoComplete="username"
                    returnKeyType="next"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={s.field}>
                <Text style={s.label}>Password</Text>
                <View style={[s.inputWrap, focused === "pw" && s.inputWrapFocused]}>
                  <Ionicons name="lock-closed-outline" size={20} color={focused === "pw" ? D.primary : D.outline} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    placeholder="Your password"
                    placeholderTextColor={D.outline}
                    value={password}
                    onChangeText={(v) => { setPassword(v); setLocalError(null); }}
                    onFocus={() => setFocused("pw")}
                    onBlur={() => setFocused(null)}
                    secureTextEntry={!showPassword}
                    autoComplete="current-password"
                    returnKeyType="go"
                    onSubmitEditing={() => void handleSubmit()}
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={10} style={s.eyeBtn}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={D.outline} />
                  </Pressable>
                </View>
              </View>

              {/* Error */}
              {displayError ? (
                <View style={s.errorRow}>
                  <Ionicons name="alert-circle-outline" size={15} color={D.errorFg} />
                  <Text style={s.errorText}>{displayError}</Text>
                </View>
              ) : null}

              {/* Primary CTA */}
              <Pressable
                style={({ pressed }) => [loading && { opacity: 0.55 }, pressed && !loading && { opacity: 0.9 }]}
                onPress={() => void handleSubmit()}
                disabled={loading}
              >
                <LinearGradient
                  colors={[D.primary, D.primaryBtn]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.btnPrimary}
                >
                  <Ionicons name="log-in-outline" size={18} color="#fff" />
                  <Text style={s.btnPrimaryText}>{loading ? "Signing In…" : "Sign In"}</Text>
                </LinearGradient>
              </Pressable>

              {/* Helper note */}
              <View style={s.note}>
                <Ionicons name="information-circle-outline" size={18} color={D.primary} />
                <Text style={s.noteText}>
                  Accounts are created by CLS Academy. Students sign in with their roll number. Lost your password? Contact your
                  institute.
                </Text>
              </View>

            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    opacity: 0.38,
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
    top: "25%",
    left: "5%",
    width: "90%",
    height: "50%",
    borderRadius: 9999,
    backgroundColor: D.bg,
    opacity: 0.55,
  },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 24,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5,
  },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  brandText: { fontSize: 20, fontFamily: D.fontExtraBold, color: D.primary, letterSpacing: -0.3 },
  titleBlock: { alignItems: "center", gap: 6 },
  title: { fontSize: 26, fontFamily: D.fontExtraBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.5 },
  titleSub: { fontSize: 14, fontFamily: D.font, color: D.onSurfaceVariant, textAlign: "center", lineHeight: 20 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginLeft: 2 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: D.surfaceLow,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputWrapFocused: { borderColor: D.primaryBtn, backgroundColor: "#fff" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, fontFamily: D.fontMedium, color: D.onSurface },
  eyeBtn: { paddingLeft: 8, paddingVertical: 4 },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: D.errorBg,
    borderRadius: 10,
    padding: 10,
  },
  errorText: { flex: 1, color: D.errorFg, fontSize: 13, fontFamily: D.fontMedium, lineHeight: 18 },
  btnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
  btnPrimaryText: { color: "#fff", fontFamily: D.fontBold, fontSize: 15 },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: D.surfaceLow, borderRadius: 12, padding: 12 },
  noteText: { flex: 1, fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 18 },
});
