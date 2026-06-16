import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { showAlert } from "../../lib/alert";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { listEmployeeClasses, registerStudent, getInquiryById, setInquiryStatus } from "../../lib/erp";
import { enrollStudent, type IssuedCredentials } from "../../lib/enroll";
import { isDemoMode } from "../../lib/demoMode";
import { normalizeUserProfileRecord } from "../../shared";
import { DropdownButton, FieldLabel, OptionSheet, type SheetOption } from "../schedule/scheduleEditorKit";

const paramStr = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export function RegisterStudentScreen() {
  const insets = useSafeAreaInsets();
  const { profile, adminRecord, authUser } = useSession();
  const params = useLocalSearchParams<{
    inquiryId?: string; studentName?: string; phone?: string; email?: string; course?: string;
    centreId?: string; centreName?: string; regionId?: string; regionName?: string;
  }>();
  const inquiryId = paramStr(params.inquiryId);
  const isConvert = !!inquiryId;

  // Admins have no userProfile; build a profile-shaped record from adminRecord +
  // the inquiry's centre context (passed via params) so the student lands in the
  // right centre and registerStudent/listEmployeeClasses have a scope to work with.
  const effectiveProfile = useMemo(() => {
    if (profile) return profile;
    if (!adminRecord) return null;
    return normalizeUserProfileRecord(
      authUser?.uid ?? adminRecord.email,
      {
        name: "Admin",
        role: "employee",
        regionId: paramStr(params.regionId) || adminRecord.regionId,
        regionName: paramStr(params.regionName) || adminRecord.regionName,
        centreId: paramStr(params.centreId) || adminRecord.centreId,
        centreName: paramStr(params.centreName) || adminRecord.centreName,
        email: adminRecord.email,
      },
      adminRecord.email,
    );
  }, [profile, adminRecord, authUser?.uid, params.regionId, params.regionName, params.centreId, params.centreName]);

  const [studentName, setStudentName] = useState(paramStr(params.studentName));
  const [phone, setPhone] = useState(paramStr(params.phone));
  const [email, setEmail] = useState(paramStr(params.email));
  const [parentName, setParentName] = useState("");
  const [remark, setRemark] = useState(paramStr(params.course) ? `Course interest: ${paramStr(params.course)}` : "");
  const [classId, setClassId] = useState("");
  const [classSheet, setClassSheet] = useState(false);
  const [classOptions, setClassOptions] = useState<SheetOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<IssuedCredentials | null>(null);

  useEffect(() => {
    let alive = true;
    if (!effectiveProfile) return;
    void listEmployeeClasses(effectiveProfile)
      .then((classes) => {
        if (alive) setClassOptions(classes.map((c) => ({ key: c.id, label: c.name })));
      })
      .catch(() => {
        if (alive) setClassOptions([]);
      });
    return () => {
      alive = false;
    };
  }, [effectiveProfile?.userId, effectiveProfile?.centreId]);

  const classLabel = classOptions.find((c) => c.key === classId)?.label ?? "Select batch";

  async function submit() {
    if (!effectiveProfile) return;
    if (!studentName.trim()) {
      showAlert("Missing Info", "Enter the student's name.");
      return;
    }
    if (!classId) {
      showAlert("Missing Info", "Select a batch for the student.");
      return;
    }
    const className = classOptions.find((c) => c.key === classId)?.label ?? "";
    setBusy(true);
    try {
      if (isDemoMode()) {
        // Demo mode has no server to mint a real login — keep the legacy pending write.
        await registerStudent({ studentName, phone, email, classId, className, parentName, remark, profile: effectiveProfile });
        setBusy(false);
        showAlert("Submitted", "Student registered (demo mode — no live credentials).", [
          { text: "Done", onPress: () => navigateBack(router) },
        ]);
        return;
      }

      const issued = await enrollStudent({
        studentName,
        classId,
        phone,
        email,
        parentName,
        remark,
        staffName: effectiveProfile.name || effectiveProfile.fullName || "Staff",
      });

      // Converting from an inquiry → close the lead as enrolled.
      if (inquiryId) {
        const inquiry = await getInquiryById(inquiryId);
        if (inquiry) {
          await setInquiryStatus({
            inquiry,
            status: "enrolled",
            note: `Converted to student${className ? ` — ${className}` : ""} · ${issued.rollNumber}`,
            actor: { userId: effectiveProfile.userId, name: effectiveProfile.name || "Staff" },
          });
        }
      }

      setBusy(false);
      setCredentials(issued);
    } catch (e) {
      setBusy(false);
      showAlert("Error", e instanceof Error ? e.message : "Could not register the student. Try again.");
    }
  }

  if (credentials) {
    return (
      <View style={{ flex: 1, backgroundColor: D.bg }}>
        <View style={[s.header, { paddingTop: insets.top + 20 }]}>
          <Text style={s.title}>Student Registered</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
          <View style={s.successCard}>
            <Ionicons name="checkmark-circle" size={44} color={D.primary} />
            <Text style={s.successName}>{studentName.trim()}</Text>
            <Text style={s.successHint}>Share these with the student. The password is shown only once — long-press to copy.</Text>

            <View style={s.credRow}>
              <Text style={s.credLabel}>Roll Number (username)</Text>
              <Text style={s.credValue} selectable>{credentials.rollNumber}</Text>
            </View>
            <View style={s.credRow}>
              <Text style={s.credLabel}>Temporary Password</Text>
              <Text style={s.credValue} selectable>{credentials.password}</Text>
            </View>
          </View>

          <View style={s.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color={D.primary} />
            <Text style={s.noteText}>The student signs in with the roll number and this password — no admin approval needed.</Text>
          </View>

          <AnimatedPressable style={s.submitBtn} onPress={() => navigateBack(router)}>
            <Ionicons name="checkmark" size={17} color="#fff" />
            <Text style={s.submitText}>Done</Text>
          </AnimatedPressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: D.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
          <Ionicons name="arrow-back" size={18} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.title}>{isConvert ? "Convert to Student" : "Register Student"}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 160 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.noteCard}>
          <Ionicons name="information-circle-outline" size={16} color={D.primary} />
          <Text style={s.noteText}>A login (roll number + password) is created instantly — no approval needed. You'll get the credentials to share.</Text>
        </View>

        <FieldLabel>Student Name</FieldLabel>
        <TextInput
          style={[s.input, { marginBottom: 14 }]}
          value={studentName}
          onChangeText={setStudentName}
          placeholder="Full name"
          placeholderTextColor={D.outline}
        />

        <FieldLabel>Batch</FieldLabel>
        <View style={{ marginBottom: 14 }}>
          <DropdownButton value={classLabel} placeholder="Select batch" onPress={() => setClassSheet(true)} />
        </View>

        <FieldLabel>Phone (optional)</FieldLabel>
        <TextInput
          style={[s.input, { marginBottom: 14 }]}
          value={phone}
          onChangeText={setPhone}
          placeholder="10-digit mobile"
          placeholderTextColor={D.outline}
          keyboardType="phone-pad"
        />

        <FieldLabel>Email (optional)</FieldLabel>
        <TextInput
          style={[s.input, { marginBottom: 14 }]}
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          placeholderTextColor={D.outline}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FieldLabel>Parent / Guardian Name (optional)</FieldLabel>
        <TextInput
          style={[s.input, { marginBottom: 14 }]}
          value={parentName}
          onChangeText={setParentName}
          placeholder="Parent full name"
          placeholderTextColor={D.outline}
        />

        <FieldLabel>Remark (optional)</FieldLabel>
        <TextInput
          style={[s.input, s.inputMulti]}
          value={remark}
          onChangeText={setRemark}
          placeholder="e.g. Joined after demo class"
          placeholderTextColor={D.outline}
          multiline
          textAlignVertical="top"
        />

        <AnimatedPressable style={[s.submitBtn, busy && { opacity: 0.6 }]} onPress={() => void submit()} disabled={busy}>
          <Ionicons name="checkmark" size={17} color="#fff" />
          <Text style={s.submitText}>{busy ? "Creating…" : "Create Student Login"}</Text>
        </AnimatedPressable>
      </ScrollView>

      <OptionSheet
        visible={classSheet}
        title="Select Batch"
        options={classOptions}
        selectedKey={classId}
        onSelect={(k) => setClassId(k)}
        onClose={() => setClassSheet(false)}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingBottom: 16 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  noteCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#DDD6FE", backgroundColor: D.surfaceLow, marginBottom: 16 },
  noteText: { flex: 1, fontSize: 11.5, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 16 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13.5, color: D.onSurface, fontFamily: D.fontMedium },
  inputMulti: { minHeight: 84, textAlignVertical: "top", marginBottom: 20 },
  submitBtn: { height: 52, borderRadius: 16, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  submitText: { fontSize: 14, fontFamily: D.fontBold, color: "#fff" },
  successCard: { padding: 18, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, alignItems: "center", gap: 10, marginBottom: 16 },
  successName: { fontSize: 18, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
  successHint: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant, textAlign: "center", lineHeight: 17, marginBottom: 4 },
  credRow: { width: "100%", padding: 13, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surfaceLow, gap: 5 },
  credLabel: { fontSize: 10.5, fontFamily: D.fontMedium, color: D.onSurfaceVariant, textTransform: "uppercase", letterSpacing: 0.5 },
  credValue: { fontSize: 22, fontFamily: D.fontExtraBold, color: D.primary, letterSpacing: 1 },
});
