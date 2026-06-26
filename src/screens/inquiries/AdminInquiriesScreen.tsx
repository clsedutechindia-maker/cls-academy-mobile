import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../../lib/navigation";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { FilterDropdown } from "../../components/FilterDropdown";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listAdminInquiries } from "../../lib/erp";
import { type AdmissionInquiryRecord, type InquiryStatus } from "../../shared";
import { inquiryStatusMeta } from "./inquiryShared";
import { InquiryRow } from "./HTInquiriesScreen";

type Segment = "inquiries" | "ledger";

// Live pipeline vs the closed-book ledger (enrolled / lost outcomes).
const ACTIVE_STATUSES: InquiryStatus[] = ["new", "contacted", "demo_scheduled", "demo_attended", "demo"];
const LEDGER_STATUSES: InquiryStatus[] = ["enrolled", "lost"];

// Monday-of-this-week as a YYYY-MM-DD string.
function weekStartIso(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

function shiftIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function AdminInquiriesScreen() {
  const insets = useSafeAreaInsets();
  const { adminRecord } = useSession();
  const [segment, setSegment] = useState<Segment>("inquiries");
  const [filter, setFilter] = useState<InquiryStatus | "all">("all");
  const [search, setSearch] = useState("");

  const { data, loading, error, reload } = useResource(
    async () => (adminRecord ? listAdminInquiries(adminRecord) : []),
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const all = useMemo(() => data ?? [], [data]);

  // Time-based intake stats (by createdAtIso) + week-over-week delta.
  const timeStats = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const wkStart = weekStartIso();
    const lastWkStart = shiftIso(wkStart, -7);
    const monthStart = `${todayIso.slice(0, 7)}-01`;
    const day = (i: AdmissionInquiryRecord) => (i.createdAtIso || "").slice(0, 10);
    const today = all.filter((i) => day(i) === todayIso).length;
    const thisWeek = all.filter((i) => day(i) >= wkStart).length;
    const thisMonth = all.filter((i) => day(i) >= monthStart).length;
    const lastWeek = all.filter((i) => day(i) >= lastWkStart && day(i) < wkStart).length;
    const delta = lastWeek === 0 ? (thisWeek > 0 ? 100 : 0) : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
    return { today, thisWeek, thisMonth, delta };
  }, [all]);

  const base = useMemo(
    () => all.filter((i) => (segment === "ledger" ? LEDGER_STATUSES : ACTIVE_STATUSES).includes(i.status)),
    [all, segment],
  );

  const chips: (InquiryStatus | "all")[] = useMemo(
    () => ["all", ...(segment === "ledger" ? LEDGER_STATUSES : ACTIVE_STATUSES)],
    [segment],
  );

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return base.filter((i) => {
      if (filter !== "all" && i.status !== filter) return false;
      if (q && !i.studentName.toLowerCase().includes(q) && !i.phone.includes(q) && !i.course.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [base, filter, search]);

  function switchSegment(next: Segment) {
    setSegment(next);
    setFilter("all");
  }

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

        <View style={s.statCard}>
          <Stat label="TODAY" value={timeStats.today} tint={D.onSurface} />
          <View style={s.statDivider} />
          <Stat label="THIS WEEK" value={timeStats.thisWeek} tint={D.onSurface} />
          <View style={s.statDivider} />
          <Stat label="THIS MONTH" value={timeStats.thisMonth} tint={D.onSurface} />
          <View style={s.statDivider} />
          <Stat
            label="VS LAST WK"
            value={`${timeStats.delta >= 0 ? "+" : ""}${timeStats.delta}%`}
            tint={D.onSurface}
          />
        </View>

        <View style={s.segment}>
          {(["inquiries", "ledger"] as Segment[]).map((seg) => {
            const active = segment === seg;
            return (
              <AnimatedPressable key={seg} style={[s.segmentBtn, active && s.segmentBtnActive]} onPress={() => switchSegment(seg)}>
                <Text style={[s.segmentText, active && s.segmentTextActive]}>{seg === "inquiries" ? "Inquiries" : "Ledger"}</Text>
              </AnimatedPressable>
            );
          })}
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

        <View style={{ paddingTop: 12 }}>
          <FilterDropdown
            options={chips.map((key) => ({
              key,
              label: key === "all" ? "All" : inquiryStatusMeta(key).label,
              count: key === "all" ? base.length : base.filter((x) => x.status === key).length,
            }))}
            value={filter}
            onChange={setFilter}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        {loading && <View style={{ padding: 30, alignItems: "center" }}><ActivityIndicator color={D.primary} /></View>}
        {error && <Text style={s.errText}>{error}</Text>}
        {!loading && !error && shown.length === 0 && (
          <View style={s.empty}>
            <Ionicons name={segment === "ledger" ? "receipt-outline" : "people-outline"} size={30} color={D.outline} />
            <Text style={s.emptyText}>{segment === "ledger" ? "No enrolled or lost leads yet." : "No inquiries in this view."}</Text>
          </View>
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
  statCard: { flexDirection: "row", backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", marginBottom: 12, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 4, elevation: 1 },
  stat: { flex: 1, alignItems: "center", paddingVertical: 14, paddingHorizontal: 4 },
  statDivider: { width: 1, backgroundColor: D.outlineVariant, marginVertical: 12 },
  statValue: { fontSize: 17, fontFamily: D.fontExtraBold, letterSpacing: -0.5 },
  statLabel: { fontSize: 8.5, fontFamily: D.fontSemiBold, color: D.outline, marginTop: 4, letterSpacing: 0.3, textAlign: "center" },
  segment: { flexDirection: "row", gap: 4, backgroundColor: D.surfaceLow, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 12 },
  segmentBtn: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 8 },
  segmentBtnActive: { backgroundColor: D.surface, shadowColor: D.primary, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 },
  segmentText: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  segmentTextActive: { color: D.onSurface, fontFamily: D.fontBold },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface, paddingVertical: 0 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: D.fontBold },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
  errText: { fontFamily: D.font, color: D.error, fontSize: 13, padding: 16 },
});
