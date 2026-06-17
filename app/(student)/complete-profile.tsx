import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../src/components/theme";
import { AnimatedPressable } from "../../src/components/motion";
import { useSession } from "../../src/providers/session";
import { showAlert } from "../../src/lib/alert";
import { firestoreDb } from "../../src/lib/firebase";
import { userProfilesCollectionName } from "../../src/shared";

// Gate screen: an approved student lands here (via index + (student)/_layout) and
// cannot reach the dashboard until these details are saved (profileCompleted → true).
export default function CompleteProfileScreen() {
  const insets = useSafeAreaInsets();
  const { authUser, profile, refresh } = useSession();

  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth || "");
  const [age, setAge] = useState(profile?.age || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [personalEmail, setPersonalEmail] = useState(profile?.personalEmail || "");
  const [parentName, setParentName] = useState(profile?.parentOneName || "");
  const [parentPhone, setParentPhone] = useState(profile?.parentOnePhone || "");
  const [parentEmail, setParentEmail] = useState(profile?.parentOneEmail || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const userId = profile?.userId || authUser?.uid || "";
    if (!userId) {
      showAlert("Please sign in again", "We couldn't find your account. Sign out and back in, then try again.");
      return;
    }

    const trimmedDob = dateOfBirth.trim();
    const numericAge = Number(age.trim());
    const trimmedPhone = phone.trim();
    const trimmedEmail = personalEmail.trim().toLowerCase();
    const trimmedParentName = parentName.trim();
    const trimmedParentPhone = parentPhone.trim();
    const trimmedParentEmail = parentEmail.trim().toLowerCase();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!trimmedDob) return showAlert("Missing Info", "Enter your date of birth.");
    if (!Number.isInteger(numericAge) || numericAge <= 0 || numericAge > 120)
      return showAlert("Missing Info", "Enter a valid age between 1 and 120.");
    if (trimmedPhone.replace(/\D/g, "").length < 10)
      return showAlert("Missing Info", "Enter a valid 10-digit phone number.");
    if (!emailRe.test(trimmedEmail)) return showAlert("Missing Info", "Enter a valid email address.");
    if (!trimmedParentName) return showAlert("Missing Info", "Enter a parent or guardian name.");
    if (trimmedParentPhone.replace(/\D/g, "").length < 10)
      return showAlert("Missing Info", "Enter a valid 10-digit parent or guardian phone number.");
    if (!emailRe.test(trimmedParentEmail))
      return showAlert("Missing Info", "Enter a valid parent or guardian email.");

    setSaving(true);
    try {
      await setDoc(
        doc(firestoreDb, userProfilesCollectionName, userId),
        {
          dateOfBirth: trimmedDob,
          age: `${numericAge}`,
          phone: trimmedPhone,
          personalEmail: trimmedEmail,
          parentOneName: trimmedParentName,
          parentOnePhone: trimmedParentPhone,
          parentOneEmail: trimmedParentEmail,
          profileCompleted: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      // Reload the profile so the gate clears, then enter the dashboard.
      await refresh();
      router.replace("/(student)/home");
    } catch (error) {
      setSaving(false);
      showAlert("Error", error instanceof Error ? error.message : "Could not save your profile. Try again.");
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: D.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <Text style={s.title}>Complete Your Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.noteCard}>
          <Ionicons name="lock-closed-outline" size={16} color={D.primary} />
          <Text style={s.noteText}>
            Welcome{profile?.name ? `, ${profile.name}` : ""}! Finish these details to unlock your dashboard — it's required before
            you can use any other feature.
          </Text>
        </View>

        <FieldLabel>Date of Birth</FieldLabel>
        <TextInput
          style={[s.input, { marginBottom: 14 }]}
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={D.outline}
        />

        <FieldLabel>Age</FieldLabel>
        <TextInput
          style={[s.input, { marginBottom: 14 }]}
          value={age}
          onChangeText={setAge}
          placeholder="e.g. 16"
          placeholderTextColor={D.outline}
          keyboardType="number-pad"
        />

        <FieldLabel>Your Phone Number</FieldLabel>
        <TextInput
          style={[s.input, { marginBottom: 14 }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="10-digit mobile"
          placeholderTextColor={D.outline}
          keyboardType="phone-pad"
        />

        <FieldLabel>Your Email</FieldLabel>
        <TextInput
          style={[s.input, { marginBottom: 14 }]}
          value={personalEmail}
          onChangeText={setPersonalEmail}
          placeholder="you@example.com"
          placeholderTextColor={D.outline}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FieldLabel>Parent / Guardian Name</FieldLabel>
        <TextInput
          style={[s.input, { marginBottom: 14 }]}
          value={parentName}
          onChangeText={setParentName}
          placeholder="Parent full name"
          placeholderTextColor={D.outline}
        />

        <FieldLabel>Parent / Guardian Phone Number</FieldLabel>
        <TextInput
          style={[s.input, { marginBottom: 14 }]}
          value={parentPhone}
          onChangeText={setParentPhone}
          placeholder="10-digit mobile"
          placeholderTextColor={D.outline}
          keyboardType="phone-pad"
        />

        <FieldLabel>Parent / Guardian Email</FieldLabel>
        <TextInput
          style={[s.input, { marginBottom: 20 }]}
          value={parentEmail}
          onChangeText={setParentEmail}
          placeholder="parent@example.com"
          placeholderTextColor={D.outline}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <AnimatedPressable style={[s.submitBtn, saving && { opacity: 0.6 }]} onPress={() => void save()} disabled={saving}>
          <Ionicons name="checkmark" size={17} color="#fff" />
          <Text style={s.submitText}>{saving ? "Saving…" : "Save & Unlock Dashboard"}</Text>
        </AnimatedPressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 16 },
  title: { fontSize: 24, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DDD6FE",
    backgroundColor: D.surfaceLow,
    marginBottom: 18,
  },
  noteText: { flex: 1, fontSize: 11.5, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 16 },
  fieldLabel: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 6 },
  input: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    backgroundColor: D.surface,
    fontSize: 13.5,
    color: D.onSurface,
    fontFamily: D.fontMedium,
  },
  submitBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: D.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  submitText: { fontSize: 14, fontFamily: D.fontBold, color: "#fff" },
});
