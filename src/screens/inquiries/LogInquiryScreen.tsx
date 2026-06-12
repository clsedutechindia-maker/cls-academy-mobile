import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { showAlert } from "../../lib/alert";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { createInquiry, findInquiryByPhone } from "../../lib/erp";
import { normalizeInquiryPhoneKey, type AdmissionInquiryRecord, type InquiryMode } from "../../shared";
import { DateField, DropdownButton, FieldLabel, OptionSheet } from "../schedule/scheduleEditorKit";
import { MODE_OPTIONS, inquiryStatusMeta } from "./inquiryShared";

export function LogInquiryScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const [studentName, setStudentName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("");
  const [mode, setMode] = useState<InquiryMode>("walk_in");
  const [remark, setRemark] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [modeSheet, setModeSheet] = useState(false);
  const [busy, setBusy] = useState(false);

  const [match, setMatch] = useState<AdmissionInquiryRecord | null>(null);
  const [checking, setChecking] = useState(false);
  const lookupSeq = useRef(0);

  // Live dedup: once enough digits are entered, look for an existing lead at
  // this centre. A hit means this is a repeat contact → steer to a follow-up.
  useEffect(() => {
    const key = normalizeInquiryPhoneKey(phone);
    if (!profile?.centreId || key.length < 10) {
      setMatch(null);
      setChecking(false);
      return;
    }
    const seq = ++lookupSeq.current;
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const found = await findInquiryByPhone(phone, profile.centreId);
        if (seq === lookupSeq.current) setMatch(found);
      } catch {
        if (seq === lookupSeq.current) setMatch(null);
      } finally {
        if (seq === lookupSeq.current) setChecking(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [phone, profile?.centreId]);

  async function submit() {
    if (!profile) return;
    if (!studentName.trim()) { showAlert("Missing Info", "Enter the student's name."); return; }
    if (normalizeInquiryPhoneKey(phone).length < 10) { showAlert("Missing Info", "Enter a valid 10-digit phone number."); return; }
    if (match) return; // guarded by UI, but never create a duplicate
    setBusy(true);
    let id: string;
    try {
      id = await createInquiry({ studentName, phone, email, course, mode, remark, nextFollowUpDate, profile });
    } catch (e) {
      setBusy(false);
      showAlert("Error", e instanceof Error ? e.message : "Could not save the inquiry. Try again.");
      return;
    }
    setBusy(false);
    // Navigate after a confirmed save — a routing error must not look like a save failure.
    navigateBack(router);
    router.push({ pathname: "/(head-teacher)/inquiry-detail" as any, params: { inquiryId: id } });
  }

  function openMatch() {
    if (!match) return;
    navigateBack(router);
    router.push({ pathname: "/(head-teacher)/inquiry-detail" as any, params: { inquiryId: match.id, addFollowUp: "1" } });
  }

  const modeLabel = MODE_OPTIONS.find((m) => m.key === mode)?.label ?? "Select";

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: D.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
          <Ionicons name="arrow-back" size={18} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.title}>Log Inquiry</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 160 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <FieldLabel>Phone Number</FieldLabel>
        <View style={s.phoneWrap}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="10-digit mobile"
            placeholderTextColor={D.outline}
            keyboardType="phone-pad"
          />
          {checking && <ActivityIndicator color={D.primary} style={{ position: "absolute", right: 14 }} />}
        </View>

        {match && (
          <AnimatedPressable style={s.matchCard} onPress={openMatch}>
            <View style={[s.matchIcon, { backgroundColor: inquiryStatusMeta(match.status).bg }]}>
              <Ionicons name="git-merge-outline" size={18} color={inquiryStatusMeta(match.status).fg} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.matchTitle}>Already logged: {match.studentName}</Text>
              <Text style={s.matchSub}>{inquiryStatusMeta(match.status).label} · {match.followUpCount} contact{match.followUpCount === 1 ? "" : "s"}. Add a follow-up instead.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={D.primary} />
          </AnimatedPressable>
        )}

        <View style={[match && s.dimmed]} pointerEvents={match ? "none" : "auto"}>
          <FieldLabel>Student Name</FieldLabel>
          <TextInput
            style={[s.input, { marginBottom: 14 }]}
            value={studentName}
            onChangeText={setStudentName}
            placeholder="Full name"
            placeholderTextColor={D.outline}
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

          <FieldLabel>Course Interested In</FieldLabel>
          <TextInput
            style={[s.input, { marginBottom: 14 }]}
            value={course}
            onChangeText={setCourse}
            placeholder="e.g. 11th NEET, 10th Foundation"
            placeholderTextColor={D.outline}
          />

          <FieldLabel>Inquiry Mode</FieldLabel>
          <View style={{ marginBottom: 14 }}>
            <DropdownButton value={modeLabel} placeholder="How did they reach out?" onPress={() => setModeSheet(true)} />
          </View>

          <FieldLabel>Remark</FieldLabel>
          <TextInput
            style={[s.input, s.inputMulti]}
            value={remark}
            onChangeText={setRemark}
            placeholder="e.g. Will join demo class tomorrow"
            placeholderTextColor={D.outline}
            multiline
            textAlignVertical="top"
          />

          <FieldLabel>Next Follow-up (optional)</FieldLabel>
          <View style={{ marginBottom: 20 }}>
            <DateField value={nextFollowUpDate} onChange={setNextFollowUpDate} />
          </View>
        </View>

        {!match && (
          <AnimatedPressable style={[s.submitBtn, busy && { opacity: 0.6 }]} onPress={() => void submit()} disabled={busy}>
            <Ionicons name="checkmark" size={17} color="#fff" />
            <Text style={s.submitText}>{busy ? "Saving…" : "Save Inquiry"}</Text>
          </AnimatedPressable>
        )}
      </ScrollView>

      <OptionSheet
        visible={modeSheet}
        title="Inquiry Mode"
        options={MODE_OPTIONS}
        selectedKey={mode}
        onSelect={(k) => setMode(k as InquiryMode)}
        onClose={() => setModeSheet(false)}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingBottom: 16 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  phoneWrap: { justifyContent: "center", marginBottom: 14 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13.5, color: D.onSurface, fontFamily: D.fontMedium },
  inputMulti: { minHeight: 84, textAlignVertical: "top", marginBottom: 14 },
  matchCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#DDD6FE", backgroundColor: D.surfaceLow, marginBottom: 16 },
  matchIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  matchTitle: { fontSize: 13.5, fontFamily: D.fontBold, color: D.onSurface },
  matchSub: { fontSize: 11.5, fontFamily: D.font, color: D.onSurfaceVariant, marginTop: 2, lineHeight: 16 },
  dimmed: { opacity: 0.4 },
  submitBtn: { height: 52, borderRadius: 16, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  submitText: { fontSize: 14, fontFamily: D.fontBold, color: "#fff" },
});
