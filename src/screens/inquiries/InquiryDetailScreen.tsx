import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { showAlert } from "../../lib/alert";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { addInquiryFollowUp, getInquiryById, listInquiryFollowUps } from "../../lib/erp";
import type { AdmissionInquiryRecord, InquiryFollowUpRecord, InquiryMode, InquiryStatus } from "../../shared";
import { DateField, DropdownButton, FieldLabel, OptionSheet } from "../schedule/scheduleEditorKit";
import {
  MODE_OPTIONS,
  STATUS_OPTIONS,
  formatInquiryDate,
  formatInquiryTimestamp,
  inquiryModeIcon,
  inquiryStatusMeta,
  isInquiryOverdue,
} from "./inquiryShared";

export function InquiryDetailScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const params = useLocalSearchParams<{ inquiryId?: string; addFollowUp?: string }>();
  const inquiryId = typeof params.inquiryId === "string" ? params.inquiryId : "";

  const inquiryRes = useResource(async () => (inquiryId ? getInquiryById(inquiryId) : null), [inquiryId]);
  const followUpsRes = useResource(async () => (inquiryId ? listInquiryFollowUps(inquiryId) : []), [inquiryId]);
  const inquiry = inquiryRes.data ?? null;
  const followUps = useMemo(() => followUpsRes.data ?? [], [followUpsRes.data]);

  const reloadAll = useCallback(async () => {
    await Promise.all([inquiryRes.reload(), followUpsRes.reload()]);
  }, [inquiryRes.reload, followUpsRes.reload]);
  useFocusEffect(useCallback(() => { void reloadAll(); }, [reloadAll]));

  const [sheetOpen, setSheetOpen] = useState(false);
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<InquiryMode>("phone");
  const [outcome, setOutcome] = useState<InquiryStatus>("contacted");
  const [nextDate, setNextDate] = useState("");
  const [modeSheet, setModeSheet] = useState(false);
  const [statusSheet, setStatusSheet] = useState(false);
  const [busy, setBusy] = useState(false);

  const openFollowUp = useCallback(() => {
    if (!inquiry) return;
    setNote("");
    setMode(inquiry.mode);
    setOutcome(inquiry.status === "new" ? "contacted" : inquiry.status);
    setNextDate(inquiry.nextFollowUpDate);
    setSheetOpen(true);
  }, [inquiry]);

  // Deep-link from the log screen ("number already exists → add follow-up").
  useEffect(() => {
    if (params.addFollowUp === "1" && inquiry && !sheetOpen) openFollowUp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.addFollowUp, inquiry]);

  async function submitFollowUp() {
    if (!inquiry || !profile) return;
    if (!note.trim()) { showAlert("Missing Info", "Add a note about this contact."); return; }
    setBusy(true);
    try {
      await addInquiryFollowUp({
        inquiry,
        note,
        mode,
        outcome,
        nextFollowUpDate: nextDate,
        actor: { userId: profile.userId, name: profile.name || profile.fullName || "Staff" },
      });
      setSheetOpen(false);
      await reloadAll();
    } catch {
      showAlert("Error", "Could not save the follow-up. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const loading = inquiryRes.loading || followUpsRes.loading;

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
          <Ionicons name="arrow-back" size={18} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.title}>Inquiry</Text>
        {inquiry && (
          <AnimatedPressable style={s.addBtn} onPress={openFollowUp}>
            <Ionicons name="add" size={20} color="#fff" />
          </AnimatedPressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {loading && !inquiry && <View style={{ padding: 30, alignItems: "center" }}><ActivityIndicator color={D.primary} /></View>}
        {!loading && !inquiry && (
          <View style={s.empty}><Ionicons name="alert-circle-outline" size={28} color={D.outline} /><Text style={s.emptyText}>Inquiry not found.</Text></View>
        )}

        {inquiry && (
          <>
            <View style={s.profileCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={[s.bigIcon, { backgroundColor: inquiryStatusMeta(inquiry.status).bg }]}>
                  <Ionicons name={inquiryModeIcon(inquiry.mode) as any} size={22} color={inquiryStatusMeta(inquiry.status).fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{inquiry.studentName}</Text>
                  <Text style={s.phone}>{inquiry.phone}</Text>
                </View>
                <View style={[s.pill, { backgroundColor: inquiryStatusMeta(inquiry.status).bg }]}>
                  <Text style={[s.pillText, { color: inquiryStatusMeta(inquiry.status).fg }]}>{inquiryStatusMeta(inquiry.status).label}</Text>
                </View>
              </View>
              <View style={s.metaGrid}>
                <Meta label="Course" value={inquiry.course || "—"} />
                <Meta label="Contacts" value={String(inquiry.followUpCount)} />
                <Meta label="Next Follow-up" value={inquiry.nextFollowUpDate ? formatInquiryDate(inquiry.nextFollowUpDate) : "—"} warn={isInquiryOverdue(inquiry)} />
                <Meta label="Owner" value={inquiry.assignedToName || "—"} />
              </View>
            </View>

            <Text style={s.sectionLabel}>CONTACT</Text>
            <View style={s.contactCard}>
              <ContactRow icon="call-outline" label="Phone" value={inquiry.phone} onPress={() => inquiry.phone && void Linking.openURL(`tel:${inquiry.phone}`)} />
              <View style={s.contactDivider} />
              <ContactRow icon="mail-outline" label="Email" value={inquiry.email || "—"} onPress={inquiry.email ? () => void Linking.openURL(`mailto:${inquiry.email}`) : undefined} />
            </View>

            <AnimatedPressable style={s.logBtn} onPress={openFollowUp}>
              <Ionicons name="add-circle-outline" size={17} color={D.primary} />
              <Text style={s.logBtnText}>Log a follow-up</Text>
            </AnimatedPressable>

            <Text style={s.sectionLabel}>TIMELINE · {followUps.length}</Text>
            <View style={s.timeline}>
              {followUps.map((fu, i) => (
                <TimelineRow key={fu.id} followUp={fu} last={i === followUps.length - 1} />
              ))}
              {followUps.length === 0 && <Text style={s.emptyText}>No contacts recorded yet.</Text>}
            </View>
          </>
        )}
      </ScrollView>

      {/* Add follow-up sheet */}
      <Modal visible={sheetOpen} transparent animationType="fade" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setSheetOpen(false)}>
          <Pressable style={s.sheet} onPress={() => {}}>
            <Text style={s.sheetTitle}>Add Follow-up</Text>

            <FieldLabel>What happened?</FieldLabel>
            <TextInput
              style={[s.input, s.inputMulti]}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Called back, confirmed demo for Saturday"
              placeholderTextColor={D.outline}
              multiline
              textAlignVertical="top"
            />

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Mode</FieldLabel>
                <DropdownButton value={MODE_OPTIONS.find((m) => m.key === mode)?.label ?? ""} placeholder="Mode" onPress={() => setModeSheet(true)} />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>Move to</FieldLabel>
                <DropdownButton value={STATUS_OPTIONS.find((o) => o.key === outcome)?.label ?? ""} placeholder="Status" onPress={() => setStatusSheet(true)} />
              </View>
            </View>

            <FieldLabel>Next Follow-up (optional)</FieldLabel>
            <View style={{ marginBottom: 18 }}>
              <DateField value={nextDate} onChange={setNextDate} />
            </View>

            <AnimatedPressable style={[s.confirmBtn, busy && { opacity: 0.6 }]} onPress={() => void submitFollowUp()} disabled={busy}>
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={s.confirmText}>{busy ? "Saving…" : "Save Follow-up"}</Text>
            </AnimatedPressable>
          </Pressable>
        </Pressable>
      </Modal>

      <OptionSheet visible={modeSheet} title="Contact Mode" options={MODE_OPTIONS} selectedKey={mode} onSelect={(k) => setMode(k as InquiryMode)} onClose={() => setModeSheet(false)} />
      <OptionSheet visible={statusSheet} title="Move Lead To" options={STATUS_OPTIONS} selectedKey={outcome} onSelect={(k) => setOutcome(k as InquiryStatus)} onClose={() => setStatusSheet(false)} />
    </View>
  );
}

function Meta({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={s.metaItem}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={[s.metaValue, warn && { color: "#B45309" }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ContactRow({ icon, label, value, onPress }: { icon: any; label: string; value: string; onPress?: () => void }) {
  const tappable = Boolean(onPress);
  return (
    <AnimatedPressable style={s.contactRow} onPress={onPress} disabled={!tappable}>
      <View style={s.contactIcon}><Ionicons name={icon} size={16} color={D.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.contactLabel}>{label}</Text>
        <Text style={[s.contactValue, tappable && { color: D.primary }]} numberOfLines={1}>{value}</Text>
      </View>
      {tappable && <Ionicons name="open-outline" size={15} color={D.outline} />}
    </AnimatedPressable>
  );
}

function TimelineRow({ followUp, last }: { followUp: InquiryFollowUpRecord; last: boolean }) {
  const meta = inquiryStatusMeta(followUp.outcome);
  return (
    <View style={s.tlRow}>
      <View style={s.tlGutter}>
        <View style={[s.tlDot, { backgroundColor: meta.fg }]} />
        {!last && <View style={s.tlLine} />}
      </View>
      <View style={s.tlBody}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Ionicons name={inquiryModeIcon(followUp.mode) as any} size={13} color={D.outline} />
          <View style={[s.tlPill, { backgroundColor: meta.bg }]}><Text style={[s.tlPillText, { color: meta.fg }]}>{meta.label}</Text></View>
        </View>
        {followUp.note ? <Text style={s.tlNote}>{followUp.note}</Text> : null}
        <Text style={s.tlMeta}>{followUp.byName} · {formatInquiryTimestamp(followUp.createdAtIso)}</Text>
        {followUp.nextFollowUpDate ? <Text style={s.tlNext}>Next: {formatInquiryDate(followUp.nextFollowUpDate)}</Text> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 22, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  addBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: D.primaryBtn, alignItems: "center", justifyContent: "center" },
  profileCard: { backgroundColor: D.surface, borderRadius: 16, borderWidth: 1, borderColor: D.outlineVariant, padding: 16, marginBottom: 12 },
  bigIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 17, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
  phone: { fontSize: 12.5, fontFamily: D.fontMedium, color: D.outline, marginTop: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 10, fontFamily: D.fontBold, letterSpacing: 0.2 },
  metaGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 14, borderTopWidth: 1, borderTopColor: D.outlineVariant, paddingTop: 12 },
  metaItem: { width: "50%", marginBottom: 10 },
  metaLabel: { fontSize: 10, fontFamily: D.fontSemiBold, color: D.outline, textTransform: "uppercase", letterSpacing: 0.3 },
  metaValue: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, marginTop: 2 },
  contactCard: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, paddingHorizontal: 14, marginBottom: 18 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13 },
  contactIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: D.surfaceLow, alignItems: "center", justifyContent: "center" },
  contactLabel: { fontSize: 10, fontFamily: D.fontSemiBold, color: D.outline, textTransform: "uppercase", letterSpacing: 0.3 },
  contactValue: { fontSize: 13.5, fontFamily: D.fontBold, color: D.onSurface, marginTop: 1 },
  contactDivider: { height: 1, backgroundColor: D.outlineVariant },
  logBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, height: 46, borderRadius: 12, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: "#DDD6FE", marginBottom: 18 },
  logBtnText: { fontSize: 13, fontFamily: D.fontBold, color: D.primary },
  sectionLabel: { fontSize: 10.5, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.6, marginBottom: 10 },
  timeline: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, padding: 16 },
  tlRow: { flexDirection: "row", gap: 12 },
  tlGutter: { alignItems: "center", width: 14 },
  tlDot: { width: 12, height: 12, borderRadius: 6, marginTop: 2 },
  tlLine: { flex: 1, width: 2, backgroundColor: D.outlineVariant, marginVertical: 4 },
  tlBody: { flex: 1, paddingBottom: 16, gap: 4 },
  tlPill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  tlPillText: { fontSize: 9.5, fontFamily: D.fontBold, letterSpacing: 0.2 },
  tlNote: { fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface, lineHeight: 18 },
  tlMeta: { fontSize: 10.5, fontFamily: D.font, color: D.outline },
  tlNext: { fontSize: 11, fontFamily: D.fontSemiBold, color: "#B45309" },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  sheetTitle: { fontSize: 15, fontFamily: D.fontBold, color: D.onSurface, marginBottom: 14 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, backgroundColor: D.surface, fontSize: 13.5, color: D.onSurface, fontFamily: D.fontMedium },
  inputMulti: { minHeight: 80, textAlignVertical: "top", marginBottom: 14 },
  confirmBtn: { height: 52, borderRadius: 16, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  confirmText: { fontSize: 14, fontFamily: D.fontBold, color: "#fff" },
});
