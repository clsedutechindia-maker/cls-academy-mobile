import AsyncStorage from "@react-native-async-storage/async-storage";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { router } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { D, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { updateStudentProfileContact } from "../lib/erp";
import { useSession } from "../providers/session";

function AccSection({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action}
      </View>
      <View style={styles.sectionBody}>
        {children}
      </View>
    </View>
  );
}

function AccRow({ label, value, last, muted, icon }: { label: string; value: string; last?: boolean; muted?: boolean; icon?: React.ReactNode }) {
  return (
    <View style={[styles.rowContainer, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueContainer}>
        <Text style={[styles.rowValue, muted && styles.rowValueMuted]} numberOfLines={1}>{value}</Text>
      </View>
      {icon}
    </View>
  );
}

function LockIcon() {
  return <Ionicons name="lock-closed-outline" size={13} color={D.outline} style={{ flexShrink: 0 }} />;
}

function ChevronRight() {
  return <Ionicons name="chevron-forward" size={14} color={D.outline} style={{ flexShrink: 0 }} />;
}

function Toggle({ on }: { on: boolean }) {
  return (
    <View style={[styles.toggleWrap, { backgroundColor: on ? D.primaryBtn : "#D1D5DB" }]}>
      <View style={[styles.toggleCircle, { left: on ? 21 : 3 }]} />
    </View>
  );
}

const PUSH_NOTIF_KEY = "cls_push_notifications_enabled";

export function StudentAccountScreen() {
  const { authUser, profile, signOutUser, refresh } = useSession();
  const [pushEnabled, setPushEnabled] = useState(true);
  const name = profile?.name || authUser?.displayName || "Student";

  useState(() => {
    AsyncStorage.getItem(PUSH_NOTIF_KEY).then((v) => {
      if (v !== null) setPushEnabled(v === "true");
    }).catch(() => {});
  });

  function handlePushToggle() {
    const next = !pushEnabled;
    setPushEnabled(next);
    AsyncStorage.setItem(PUSH_NOTIF_KEY, String(next)).catch(() => {});
  }
  const subjects = profile?.teacherSubjectNames?.length ? profile.teacherSubjectNames.join(" · ") : "—";
  const initials = name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Account</Text>

      {/* Profile block */}
      <View style={styles.profileBlock}>
        <View style={styles.avatarWrap}>
          <LinearGradient colors={[D.primaryBtn, "#8B5CF6"]} style={styles.avatarCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.avatarText}>{initials}</Text>
          </LinearGradient>
          <View style={styles.avatarBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" style={{ marginTop: -1, marginLeft: -1 }} />
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileBatch}>{profile?.className || "—"}</Text>
          <View style={styles.profileChip}>
            <Text style={styles.profileChipText}>{profile?.studentClass || "—"}{profile?.rollNumber ? ` · Roll ${profile.rollNumber}` : ""}</Text>
          </View>
        </View>
      </View>

      <AccSection
        title="Personal Details"
        action={
          <AnimatedPressable onPress={() => router.push("/(student)/edit-details")}>
            <View style={styles.editBtn}>
              <Text style={styles.editBtnText}>Edit Details</Text>
            </View>
          </AnimatedPressable>
        }
      >
        <AccRow label="Full Name" value={name} icon={<LockIcon />} />
        <AccRow label="Date of Birth" value={profile?.dateOfBirth || "—"} icon={<LockIcon />} />
        <AccRow label="Gender" value={profile?.gender || "—"} icon={<LockIcon />} />
        <AccRow label="Phone" value={profile?.phone || "—"} icon={<ChevronRight />} />
        <AccRow label="Email" value={profile?.email || authUser?.email || "—"} icon={<ChevronRight />} />
        <AccRow label="Address" value={profile?.address || "—"} last icon={<ChevronRight />} />
      </AccSection>

      <AccSection title="Parent / Guardian Info">
        <View style={styles.readOnlyNote}>
          <LockIcon />
          <Text style={styles.readOnlyNoteText}>Managed by admin — contact front desk to update</Text>
        </View>
        <AccRow label="Guardian 1 Name" value={profile?.parentOneName || "—"} />
        <AccRow label="Guardian 1 Phone" value={profile?.parentOneEmail || "—"} />
        <AccRow label="Guardian 2 Name" value={profile?.parentTwoName || "—"} />
        <AccRow label="Guardian 2 Phone" value={profile?.parentTwoEmail || "—"} last />
      </AccSection>

      <AccSection title="Academic Info">
        <View style={styles.readOnlyNote}>
          <LockIcon />
          <Text style={styles.readOnlyNoteText}>Managed by admin</Text>
        </View>
        <AccRow label="Batch" value={profile?.className || "—"} />
        <AccRow label="Class" value={profile?.studentClass || "—"} />
        <AccRow label="Roll Number" value={profile?.rollNumber || "—"} />
        <AccRow label="CLS ID" value={profile?.userId || "—"} />
        <AccRow label="Subjects" value={subjects} last />
      </AccSection>

      <AccSection title="App Settings">
        <AnimatedPressable style={styles.settingRow} onPress={handlePushToggle}>
          <View>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDesc}>Circulars, results, reminders</Text>
          </View>
          <Toggle on={pushEnabled} />
        </AnimatedPressable>
      </AccSection>

      <AnimatedPressable onPress={() => void signOutUser()} style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Sign out</Text>
      </AnimatedPressable>

    </ScrollView>
  );
}

export function StudentEditDetailsScreen() {
  const { authUser, profile, refresh } = useSession();
  const [phone, setPhone] = useState(profile?.phone || "");
  const [email, setEmail] = useState(profile?.email || authUser?.email || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const passwordRequested = !!newPassword || !!confirmPassword || !!currentPassword;
  const passwordValid = !passwordRequested || (currentPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword);
  const canSave = !!profile && email.trim().length > 4 && passwordValid && !saving;

  const save = async () => {
    if (!profile || !authUser || !canSave) return;
    setSaving(true);
    setFeedback(null);
    try {
      await updateStudentProfileContact({ profile, phone, email, address });
      if (passwordRequested) {
        const credential = EmailAuthProvider.credential(authUser.email || profile.email, currentPassword);
        await reauthenticateWithCredential(authUser, credential);
        await updatePassword(authUser, newPassword);
      }
      await refresh();
      router.replace("/(student)/account");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to save details.");
    } finally {
      setSaving(false);
    }
  };

  const name = profile?.name || authUser?.displayName || "Student";

  const EditField = ({ label, value, onChange, placeholder, type = "text", focused = false }: any) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.editFieldLabel}>{label}</Text>
      <View style={[styles.editFieldInputWrap, focused && styles.editFieldInputWrapFocused]}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          secureTextEntry={type === "password"}
          style={styles.editFieldInput}
          placeholderTextColor={D.outline}
          autoCapitalize="none"
        />
        {type === "password" && <Ionicons name="eye-off-outline" size={18} color={D.outline} />}
      </View>
    </View>
  );

  const ReadOnlyRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.readOnlyRow}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <View style={styles.readOnlyValueWrap}>
        <Text style={styles.readOnlyValue}>{value}</Text>
        <LockIcon />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentEdit}>
      {/* Header */}
      <View style={styles.editHeader}>
        <AnimatedPressable onPress={() => navigateBack(router)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={styles.editTitle}>Edit Details</Text>
        <AnimatedPressable onPress={save} disabled={!canSave}>
          <View style={[styles.saveBtnTop, !canSave && { opacity: 0.5 }]}>
            <Text style={styles.saveBtnTopText}>{saving ? "Saving" : "Save"}</Text>
          </View>
        </AnimatedPressable>
      </View>

      <View style={styles.infoBanner}>
        <LockIcon />
        <Text style={styles.infoBannerText}>
          Name, DOB, batch and parent info are managed by admin. Contact the front desk to update them.
        </Text>
      </View>

      <Text style={styles.sectionHeaderLabel}>ADMIN-MANAGED (READ ONLY)</Text>
      <View style={styles.readOnlyGroup}>
        <ReadOnlyRow label="Full Name" value={name} />
        <ReadOnlyRow label="Date of Birth" value={profile?.dateOfBirth || "14 Mar 2009"} />
        <ReadOnlyRow label="Batch" value={profile?.className || "NEET 2027 · Ace"} />
        <ReadOnlyRow label="Roll Number" value={profile?.rollNumber || "042"} />
      </View>

      <Text style={styles.sectionHeaderLabel}>CONTACT INFO</Text>
      <EditField label="Phone number" value={phone} onChange={setPhone} placeholder="Phone number" focused />
      <EditField label="Email address" value={email} onChange={setEmail} placeholder="Email address" />
      <EditField label="Address" value={address} onChange={setAddress} placeholder="Home Address" />

      <Text style={styles.sectionHeaderLabelMargin}>CHANGE PASSWORD</Text>
      <EditField label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" />
      <EditField label="New password" value={newPassword} onChange={setNewPassword} type="password" />
      <EditField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} type="password" />

      {!passwordValid && <Text style={styles.errorText}>Password fields do not match, or too short.</Text>}
      {feedback && <Text style={styles.errorText}>{feedback}</Text>}

      <AnimatedPressable onPress={save} disabled={!canSave} style={{ marginTop: 24 }}>
        <View style={[styles.saveBtnBottom, !canSave && { opacity: 0.5 }]}>
          <Text style={styles.saveBtnBottomText}>Save changes</Text>
        </View>
      </AnimatedPressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },
  content: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: MOBILE_BOTTOM_SPACING },
  contentEdit: { paddingTop: 56, paddingHorizontal: 16, paddingBottom: MOBILE_BOTTOM_SPACING },
  headerTitle: {
    fontSize: 28, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.7, marginBottom: 20,
  },
  profileBlock: {
    paddingVertical: 20, paddingHorizontal: 16, backgroundColor: "#fff", borderRadius: 20,
    borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 20,
    flexDirection: "row", alignItems: "center", gap: 16,
    shadowColor: "#4C1D95", shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center",
  },
  avatarText: {
    fontSize: 22, fontWeight: "800", fontFamily: D.fontExtraBold, color: "#fff", letterSpacing: -0.5,
  },
  avatarBadge: {
    position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11,
    backgroundColor: D.primaryBtn, borderWidth: 2, borderColor: "#fff",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.4 },
  profileBatch: { fontSize: 13, color: D.onSurfaceVariant, marginTop: 3 },
  profileChip: {
    marginTop: 6, alignSelf: "flex-start", paddingVertical: 3, paddingHorizontal: 10,
    borderRadius: 999, backgroundColor: "#F5F3FF",
  },
  profileChipText: { fontSize: 11.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primaryBtn, letterSpacing: 0.2 },

  sectionContainer: { marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4, marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, textTransform: "uppercase" },
  editBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "#F5F3FF" },
  editBtnText: { color: D.primaryBtn, fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.2 },
  sectionBody: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  
  rowContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, paddingHorizontal: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  rowLabel: { fontSize: 13.5, color: D.onSurfaceVariant, flexShrink: 0, minWidth: 110 },
  rowValueContainer: { flex: 1, alignItems: "flex-end" },
  rowValue: { fontSize: 13.5, fontWeight: "500", fontFamily: D.fontMedium, color: D.onSurface, textAlign: "right", letterSpacing: -0.1 },
  rowValueMuted: { color: D.outline },

  readOnlyNote: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, flexDirection: "row", alignItems: "center", gap: 6 },
  readOnlyNoteText: { fontSize: 11.5, color: D.outline, letterSpacing: 0.1 },

  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, paddingHorizontal: 14 },
  settingLabel: { fontSize: 14, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  settingDesc: { fontSize: 12, color: D.outline, marginTop: 2 },
  
  toggleWrap: { width: 44, height: 26, borderRadius: 13, justifyContent: "center" },
  toggleCircle: { position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },

  signOutBtn: { width: "100%", height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: "#FEE2E2", backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  signOutText: { color: "#DC2626", fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: -0.2 },

  editHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 22 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  editTitle: { flex: 1, fontSize: 22, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  saveBtnTop: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10, backgroundColor: D.primaryBtn },
  saveBtnTopText: { color: "#fff", fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: -0.1 },

  infoBanner: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: "#F5F3FF", borderWidth: 1, borderColor: "#DDD6FE", marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  infoBannerText: { fontSize: 12.5, color: "#5B21B6", lineHeight: 18, flex: 1 },

  sectionHeaderLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, paddingHorizontal: 4, marginBottom: 8, textTransform: "uppercase" },
  sectionHeaderLabelMargin: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, paddingHorizontal: 4, marginTop: 18, marginBottom: 10, textTransform: "uppercase" },

  readOnlyGroup: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", marginBottom: 20, opacity: 0.6 },
  readOnlyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  readOnlyLabel: { fontSize: 13.5, color: D.onSurfaceVariant, flexShrink: 0, minWidth: 110 },
  readOnlyValueWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  readOnlyValue: { fontSize: 13.5, color: D.onSurface },

  editFieldLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 6 },
  editFieldInputWrap: { height: 52, paddingHorizontal: 14, borderRadius: 13, backgroundColor: "#fff", borderWidth: 1, borderColor: D.outlineVariant, flexDirection: "row", alignItems: "center" },
  editFieldInputWrapFocused: { borderWidth: 1.5, borderColor: D.primaryBtn, shadowColor: "#DDD6FE", shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 /* Custom shadow for focus */ },
  editFieldInput: { flex: 1, fontSize: 14.5, color: D.onSurface, letterSpacing: -0.2, height: "100%" },

  saveBtnBottom: { width: "100%", height: 54, borderRadius: 16, backgroundColor: D.primaryBtn, alignItems: "center", justifyContent: "center", shadowColor: "#6D28D9", shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 4 },
  saveBtnBottomText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: -0.2 },
  errorText: { color: D.error, fontSize: 13, marginTop: 4, marginHorizontal: 4 },
});
