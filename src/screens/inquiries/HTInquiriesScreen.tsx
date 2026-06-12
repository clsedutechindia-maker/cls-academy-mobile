import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listHeadTeacherInquiries } from "../../lib/erp";
import { INQUIRY_STATUS_ORDER, type AdmissionInquiryRecord, type InquiryStatus } from "../../shared";
import {
  computeInquiryStats,
  formatInquiryTimestamp,
  inquiryModeIcon,
  inquiryStatusMeta,
  isInquiryOverdue,
} from "./inquiryShared";

const FILTERS: { key: InquiryStatus | "all" | "overdue"; label: string }[] = [
  { key: "overdue", label: "Overdue" },
  { key: "all", label: "All" },
  ...INQUIRY_STATUS_ORDER.map((s) => ({ key: s, label: inquiryStatusMeta(s).label })),
];

export function HTInquiriesScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [filter, setFilter] = useState<InquiryStatus | "all" | "overdue">("all");
  const [search, setSearch] = useState("");

  const { data, loading, error, reload } = useResource(
    async () => (profile ? listHeadTeacherInquiries(profile) : []),
    [profile?.userId, profile?.centreId],
  );
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const all = useMemo(() => data ?? [], [data]);
  const stats = useMemo(() => computeInquiryStats(all), [all]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((i) => {
      if (filter === "overdue" && !isInquiryOverdue(i)) return false;
      if (filter !== "all" && filter !== "overdue" && i.status !== filter) return false;
      if (q && !i.studentName.toLowerCase().includes(q) && !i.phone.includes(q) && !i.course.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, filter, search]);

  function openDetail(inquiry: AdmissionInquiryRecord) {
    router.push({ pathname: "/(team)/inquiry-detail" as any, params: { inquiryId: inquiry.id } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <Text style={s.title}>Inquiries</Text>
          <AnimatedPressable style={s.addBtn} onPress={() => router.push("/(team)/log-inquiry" as any)}>
            <Ionicons name="add" size={22} color="#fff" />
          </AnimatedPressable>
        </View>

        <View style={s.statRow}>
          <Stat label="Active" value={stats.active} tint={D.primary} />
          <Stat label="Overdue" value={stats.overdue} tint="#B45309" />
          <Stat label="Enrolled" value={stats.enrolled} tint="#166534" />
        </View>

        <View style={s.searchBar}>
          <Ionicons name="search" size={16} color={D.outline} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, phone or course"
            placeholderTextColor={D.outline}
          />
          {search.length > 0 && (
            <AnimatedPressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={D.outline} />
            </AnimatedPressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingTop: 12 }}>
          {FILTERS.map((f) => {
            const active = f.key === filter;
            const count = f.key === "all" ? all.length : f.key === "overdue" ? stats.overdue : all.filter((x) => x.status === f.key).length;
            return (
              <AnimatedPressable
                key={f.key}
                style={[s.chip, { backgroundColor: active ? D.primary : D.surface, borderColor: active ? D.primary : D.outlineVariant }]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[s.chipText, { color: active ? "#fff" : D.onSurfaceVariant }]}>{f.label} · {count}</Text>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {loading && <View style={{ padding: 30, alignItems: "center" }}><ActivityIndicator color={D.primary} /></View>}
        {error && <Text style={s.errText}>{error}</Text>}
        {!loading && !error && shown.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="people-outline" size={30} color={D.outline} />
            <Text style={s.emptyText}>No inquiries here yet. Tap + to log a walk-in or call.</Text>
          </View>
        )}
        {shown.map((inq) => (
          <InquiryRow key={inq.id} inquiry={inq} onPress={() => openDetail(inq)} />
        ))}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, tint }: { label: string; value: number; tint: string }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, { color: tint }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export function InquiryRow({ inquiry, onPress }: { inquiry: AdmissionInquiryRecord; onPress: () => void }) {
  const meta = inquiryStatusMeta(inquiry.status);
  const overdue = isInquiryOverdue(inquiry);
  return (
    <AnimatedPressable style={[s.card, overdue && s.cardOverdue]} onPress={onPress}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={[s.modeIcon, { backgroundColor: meta.bg }]}>
          <Ionicons name={inquiryModeIcon(inquiry.mode) as any} size={16} color={meta.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{inquiry.studentName}</Text>
          <Text style={s.sub}>{inquiry.course || "Course not set"} · {inquiry.phone}</Text>
        </View>
        <View style={[s.pill, { backgroundColor: meta.bg }]}><Text style={[s.pillText, { color: meta.fg }]}>{meta.label}</Text></View>
      </View>
      {inquiry.remark ? <Text style={s.remark} numberOfLines={1}>{inquiry.remark}</Text> : null}
      <View style={s.footer}>
        <Text style={s.footMeta}>{inquiry.followUpCount} contact{inquiry.followUpCount === 1 ? "" : "s"} · {formatInquiryTimestamp(inquiry.lastContactedAtIso)}</Text>
        {overdue && (
          <View style={s.overdueTag}>
            <Ionicons name="alert-circle" size={11} color="#B45309" />
            <Text style={s.overdueText}>Follow-up due</Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  title: { flex: 1, fontSize: 26, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: D.primaryBtn, alignItems: "center", justifyContent: "center" },
  statRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, paddingVertical: 10, alignItems: "center" },
  statValue: { fontSize: 20, fontFamily: D.fontExtraBold, letterSpacing: -0.5 },
  statLabel: { fontSize: 10.5, fontFamily: D.fontSemiBold, color: D.outline, marginTop: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface, paddingVertical: 0 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: D.fontBold },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, padding: 14, marginBottom: 10, gap: 8 },
  cardOverdue: { borderColor: "#FCD34D", backgroundColor: "#FFFBEB" },
  modeIcon: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 14, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  sub: { fontSize: 11.5, fontFamily: D.font, color: D.outline, marginTop: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 9.5, fontFamily: D.fontBold, letterSpacing: 0.2 },
  remark: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant, fontStyle: "italic" },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  footMeta: { fontSize: 10.5, fontFamily: D.fontMedium, color: D.outline },
  overdueTag: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FEF3C7", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  overdueText: { fontSize: 9.5, fontFamily: D.fontBold, color: "#B45309" },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center", lineHeight: 19 },
  errText: { fontFamily: D.font, color: D.error, fontSize: 13, padding: 16 },
});
