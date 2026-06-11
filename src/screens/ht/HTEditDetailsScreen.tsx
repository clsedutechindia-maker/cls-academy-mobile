import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { useSession } from "../../providers/session";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { updateTeacherProfileContact } from "../../lib/erp";

export function HTEditDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, refresh } = useSession();

  const [phone, setPhone] = useState(profile?.phone || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!profile?.userId) return;
    setSaving(true);
    try {
      await updateTeacherProfileContact(profile.userId, { phone: phone.trim(), email: email.trim() });
      await refresh?.();
      Alert.alert("Saved", "Profile updated successfully.", [{ text: "OK", onPress: () => navigateBack(router) }]);
    } catch {
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.navTitle}>Edit Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={{ alignItems: "center", marginBottom: 28 }}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{profile?.name?.split(" ").slice(0, 2).map((w: string) => w[0]).join("") || "HT"}</Text>
            </View>
          </View>
        </View>

        {/* Read-only fields */}
        <Text style={s.fieldLabel}>Full Name</Text>
        <View style={[s.fieldBox, s.fieldReadOnly]}>
          <Text style={s.fieldText}>{profile?.name || "—"}</Text>
          <Ionicons name="lock-closed-outline" size={14} color={D.outline} />
        </View>

        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Employee ID</Text>
        <View style={[s.fieldBox, s.fieldReadOnly]}>
          <Text style={s.fieldText}>{profile?.userId || "—"}</Text>
          <Ionicons name="lock-closed-outline" size={14} color={D.outline} />
        </View>

        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Subjects</Text>
        <View style={[s.fieldBox, s.fieldReadOnly]}>
          <Text style={s.fieldText}>{profile?.teacherSubjectNames?.join(", ") || "—"}</Text>
          <Ionicons name="lock-closed-outline" size={14} color={D.outline} />
        </View>

        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Classes</Text>
        <View style={[s.fieldBox, s.fieldReadOnly]}>
          <Text style={s.fieldText}>{profile?.teacherClassNames?.join(", ") || "—"}</Text>
          <Ionicons name="lock-closed-outline" size={14} color={D.outline} />
        </View>

        {/* Editable fields */}
        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Phone</Text>
        <TextInput
          style={s.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter phone number"
          placeholderTextColor={D.outline}
          keyboardType="phone-pad"
        />

        <Text style={[s.fieldLabel, { marginTop: 14 }]}>Email</Text>
        <TextInput
          style={s.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter email"
          placeholderTextColor={D.outline}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={[s.infoBanner, { marginTop: 20 }]}>
          <Ionicons name="lock-closed-outline" size={14} color={D.primary} />
          <Text style={s.infoText}>Name, subjects, and classes can only be changed by your admin.</Text>
        </View>
      </ScrollView>

      <View style={s.actionBar}>
        <AnimatedPressable style={s.cancelBtn} onPress={() => navigateBack(router)} disabled={saving}>
          <Text style={s.cancelText}>Cancel</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[s.saveBtn, saving && { opacity: 0.6 }]} onPress={() => void handleSave()} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={s.saveText}>Save Changes</Text>
            </>
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  avatarWrap: { position: "relative" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: D.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 24, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" },
  fieldLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 7 },
  fieldBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface },
  fieldReadOnly: { backgroundColor: D.surfaceLow },
  fieldText: { fontSize: 13, color: D.onSurface, letterSpacing: -0.2, fontWeight: "500", fontFamily: D.fontMedium, flex: 1 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: D.primary, backgroundColor: D.surface, fontSize: 13, color: D.onSurface, fontFamily: D.fontMedium, letterSpacing: -0.2 },
  infoBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 16, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  infoText: { flex: 1, fontSize: 12.5, color: D.primary, fontWeight: "500", fontFamily: D.fontMedium },
  actionBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", gap: 10, padding: 16, paddingBottom: 30, backgroundColor: D.bg },
  cancelBtn: { width: 80, height: 54, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  cancelText: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  saveBtn: { flex: 1, height: 54, borderRadius: 20, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: D.primary, shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  saveText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff", letterSpacing: -0.2 },
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
});
