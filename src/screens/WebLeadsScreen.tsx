import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../components/theme";
import { AnimatedPressable } from "../components/motion";
import { FilterDropdown } from "../components/FilterDropdown";
import { HeaderBackButton } from "../components/HeaderBackButton";
import { useResource } from "../hooks/useResource";
import { listWebLeads, setWebLeadStatus } from "../lib/erp";
import {
  CONTACT_LEAD_STATUS_META,
  CONTACT_LEAD_STATUS_ORDER,
  type ContactLeadRecord,
  type ContactLeadStatus,
} from "../shared";
import { formatInquiryTimestamp } from "./inquiries/inquiryShared";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function weekStartIso(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toISOString().slice(0, 10);
}

export function WebLeadsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<ContactLeadStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, loading, error, reload } = useResource(async () => listWebLeads(), []);
  useFocusEffect(useCallback(() => { void reload(); }, [reload]));

  const all = useMemo(() => data ?? [], [data]);

  const stats = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const wkStart = weekStartIso();
    const day = (l: ContactLeadRecord) => (l.createdAtIso || "").slice(0, 10);
    return {
      today: all.filter((l) => day(l) === todayIso).length,
      thisWeek: all.filter((l) => day(l) >= wkStart).length,
      new: all.filter((l) => l.status === "new").length,
    };
  }, [all]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((l) => {
      if (filter !== "all" && l.status !== filter) return false;
      if (q && !l.name.toLowerCase().includes(q) && !l.phone.includes(q) && !l.course.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [all, filter, search]);

  const chips: (ContactLeadStatus | "all")[] = ["all", ...CONTACT_LEAD_STATUS_ORDER];

  async function changeStatus(id: string, status: ContactLeadStatus) {
    setBusyId(id);
    try {
      await setWebLeadStatus(id, status);
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <HeaderBackButton />
          <Text style={s.title}>Web Leads</Text>
        </View>

        <View style={s.statCard}>
          <Stat label="TODAY" value={stats.today} />
          <View style={s.statDivider} />
          <Stat label="THIS WEEK" value={stats.thisWeek} />
          <View style={s.statDivider} />
          <Stat label="NEW" value={stats.new} />
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
              label: key === "all" ? "All" : CONTACT_LEAD_STATUS_META[key].label,
              count: key === "all" ? all.length : all.filter((x) => x.status === key).length,
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
            <Ionicons name="globe-outline" size={30} color={D.outline} />
            <Text style={s.emptyText}>No website enquiries here yet.</Text>
          </View>
        )}
        {shown.map((lead) => (
          <LeadCard key={lead.id} lead={lead} busy={busyId === lead.id} onSetStatus={(st) => changeStatus(lead.id, st)} />
        ))}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function LeadCard({
  lead,
  busy,
  onSetStatus,
}: {
  lead: ContactLeadRecord;
  busy: boolean;
  onSetStatus: (status: ContactLeadStatus) => void;
}) {
  const meta = CONTACT_LEAD_STATUS_META[lead.status];
  const digits = lead.phone.replace(/\D/g, "");
  const call = () => { if (lead.phone) void Linking.openURL(`tel:${lead.phone}`); };
  const whatsapp = () => { if (digits) void Linking.openURL(`https://wa.me/${digits}`); };

  return (
    <View style={s.card}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={s.name}>{lead.name || "Unnamed"}</Text>
          <Text style={s.sub}>{lead.course || "Course not set"} · {lead.phone || "no phone"}</Text>
        </View>
        <View style={[s.pill, { backgroundColor: meta.bg }]}><Text style={[s.pillText, { color: meta.fg }]}>{meta.label}</Text></View>
      </View>

      {lead.message ? <Text style={s.message} numberOfLines={2}>{lead.message}</Text> : null}

      <Text style={s.timestamp}>{formatInquiryTimestamp(lead.createdAtIso)}</Text>

      <View style={s.actionRow}>
        <AnimatedPressable style={[s.actionBtn, { backgroundColor: D.primary }]} onPress={call}>
          <Ionicons name="call" size={14} color="#fff" />
          <Text style={s.actionText}>Call</Text>
        </AnimatedPressable>
        <AnimatedPressable style={[s.actionBtn, { backgroundColor: "#25D366" }]} onPress={whatsapp}>
          <Ionicons name="logo-whatsapp" size={14} color="#fff" />
          <Text style={s.actionText}>WhatsApp</Text>
        </AnimatedPressable>
      </View>

      <View style={s.statusRow}>
        {busy && <ActivityIndicator size="small" color={D.primary} style={{ marginRight: 4 }} />}
        {CONTACT_LEAD_STATUS_ORDER.map((st) => {
          const active = st === lead.status;
          const m = CONTACT_LEAD_STATUS_META[st];
          return (
            <AnimatedPressable
              key={st}
              disabled={busy || active}
              style={[s.statusChip, { backgroundColor: active ? m.bg : D.surface, borderColor: active ? m.fg : D.outlineVariant }]}
              onPress={() => onSetStatus(st)}
            >
              <Text style={[s.statusChipText, { color: active ? m.fg : D.onSurfaceVariant }]}>{m.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  title: { flex: 1, fontSize: 26, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  statCard: { flexDirection: "row", backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", marginBottom: 12 },
  stat: { flex: 1, alignItems: "center", paddingVertical: 14 },
  statDivider: { width: 1, backgroundColor: D.outlineVariant, marginVertical: 12 },
  statValue: { fontSize: 18, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  statLabel: { fontSize: 9, fontFamily: D.fontSemiBold, color: D.outline, marginTop: 4, letterSpacing: 0.3 },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface, paddingVertical: 0 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 12, fontFamily: D.fontBold },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, padding: 14, marginBottom: 10, gap: 9 },
  name: { fontSize: 14, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  sub: { fontSize: 11.5, fontFamily: D.font, color: D.outline, marginTop: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 9.5, fontFamily: D.fontBold, letterSpacing: 0.2 },
  message: { fontSize: 12.5, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 18 },
  timestamp: { fontSize: 10.5, fontFamily: D.fontMedium, color: D.outline },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 10, paddingVertical: 9 },
  actionText: { fontSize: 12, fontFamily: D.fontBold, color: "#fff" },
  statusRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, borderTopWidth: 1, borderTopColor: D.outlineVariant, paddingTop: 9 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  statusChipText: { fontSize: 11, fontFamily: D.fontSemiBold },
  empty: { padding: 32, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, fontFamily: D.font, color: D.outline, textAlign: "center" },
  errText: { fontFamily: D.font, color: D.error, fontSize: 13, padding: 16 },
});
