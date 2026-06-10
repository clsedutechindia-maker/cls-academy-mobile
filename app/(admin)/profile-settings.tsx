import { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { navigateBack } from "../../src/lib/navigation";
import { updateProfile } from "firebase/auth";
import { firebaseAuth } from "../../src/lib/firebase";
import { useSession } from "../../src/providers/session";
import { D } from "../../src/components/ui";
import { AnimatedPressable } from "../../src/components/motion";

export default function ProfileSettingsScreen() {
  const { authUser, refresh } = useSession();
  const [name, setName] = useState(authUser?.displayName ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Display name cannot be empty.");
      return;
    }
    if (!firebaseAuth.currentUser) return;
    setSaving(true);
    try {
      await updateProfile(firebaseAuth.currentUser, { displayName: trimmed });
      await refresh();
      Alert.alert("Saved", "Your display name has been updated.", [
        { text: "OK", onPress: () => navigateBack(router) },
      ]);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.title}>Profile Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          <Text style={s.fieldLabel}>Display Name</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={D.outline}
            autoCapitalize="words"
          />

          <Text style={s.fieldLabel}>Email</Text>
          <View style={s.readonlyField}>
            <Text style={s.readonlyText}>{authUser?.email ?? "—"}</Text>
            <Text style={s.readonlyNote}>Email cannot be changed here.</Text>
          </View>
        </View>

        <AnimatedPressable
          style={[s.saveBtn, saving && { opacity: 0.6 }]}
          onPress={() => void handleSave()}
          disabled={saving}
        >
          <Text style={s.saveBtnText}>{saving ? "Saving…" : "Save Changes"}</Text>
        </AnimatedPressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: D.outlineVariant,
    backgroundColor: D.bg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },
  title: { flex: 1, textAlign: "center", fontSize: 15, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  content: { padding: 18, gap: 14, paddingBottom: 140 },
  card: {
    backgroundColor: D.surface, borderRadius: 14, padding: 16, gap: 6,
    borderWidth: 1, borderColor: D.outlineVariant,
  },
  fieldLabel: { fontSize: 11, fontFamily: D.fontBold, color: D.outline, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: D.outlineVariant, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: D.onSurface, fontFamily: D.font,
    backgroundColor: D.surfaceLow, marginTop: 4,
  },
  readonlyField: {
    borderWidth: 1, borderColor: D.outlineVariant, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: D.surfaceLow, marginTop: 4, gap: 2,
  },
  readonlyText: { fontSize: 14, color: D.onSurfaceVariant, fontFamily: D.font },
  readonlyNote: { fontSize: 11, color: D.outline, fontFamily: D.font },
  saveBtn: {
    backgroundColor: D.primaryBtn, borderRadius: 12,
    paddingVertical: 15, alignItems: "center",
  },
  saveBtnText: { fontSize: 14, fontFamily: D.fontBold, color: "#ffffff" },
});
