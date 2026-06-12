import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listAdminInquiries } from "../../lib/erp";
import { INQUIRY_STATUS_ORDER, type AdmissionInquiryRecord, type InquiryStatus } from "../../shared";
import { computeInquiryStats, inquiryStatusMeta, isInquiryOverdue } from "./inquiryShared";
import { InquiryRow } from "./HTInquiriesScreen";

const FILTERS: { key: InquiryStatus | "all" | "overdue"; label: string }[] = [
  { key: "overdue", label: "Overdue" },
  { key: "all", label: "All" },
  ...INQUIRY_STATUS_ORDER.map((s) => ({ key: s, label: inquiryStatusMeta(s).label })),
];

export function AdminInquiriesScreen() {
  const insets = useSafeAreaInsets();
  const { adminRecord } = useSession();
  const [filter, setFilter] = useState<InquiryStatus | "all" | "overdue">("all");
  const [search, setSearch] = useState("");

  const { data, loading, error, reload } = useResource(
    async () => (adminRecord ? listAdminInquiries(adminRecord) : []),
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
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
    router.push({ pathname: "/(admin)/inquiry-detail" as any, params: { inquiryId: inquiry.id } });
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.title}>Inquiries</Text>
        </View>

        <View style={s.statRow}>
          <Stat label="Total" value={stats.total} tint={D.primary} />
          <Stat label="Active" value={stats.active} tint="#1D4ED8" />
          <Stat label="Overdue" value={stats.overdue} tint="#B45309" />
          <Stat label="Conv." value={`${stats.conversion}%`} tint="#166534" />
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
          <View style={s.empty}><Ionicons name="people-outline" size={30} color={D.outline} /><Text style={s.emptyText}>No inquiries in this view.</Text></View>
        )}
        {shown.map((inq) => (
          <InquiryRow key={inq.id} inquiry={inq} onPress={() => openDetail(inq)} />
        ))}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, tint }: { label: string; value: number | string; tint: string }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, { color: tint }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  statRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, paddingVertical: 10, alignItems: "center" },
  statValue: { fontSize: 18, fontFamily: D.fontExtraBold, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontFamily: D.fontSemiBold, color: D.outline, marginTop: 1 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface, paddingVertical: 0 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: D.fontBold },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
  errText: { fontFamily: D.font, color: D.error, fontSize: 13, padding: 16 },
});
