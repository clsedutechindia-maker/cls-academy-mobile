import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../lib/navigation";
import { useResource } from "../hooks/useResource";
import { listAdminComplaints } from "../lib/erp";
import { useSession } from "../providers/session";
import { D, EmptyCard, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING, Pill } from "../components/ui";
import { AnimatedPressable, Stagger } from "../components/motion";
import type { StudentComplaintRecord } from "../lib/erp";

type FilterValue = "all" | StudentComplaintRecord["status"];

function complaintTone(status: StudentComplaintRecord["status"]): "danger" | "warning" | "success" | "info" {
  if (status === "open") return "danger";
  if (status === "in_progress") return "warning";
  if (status === "resolved") return "success";
  return "info";
}

function complaintStatusLabel(status: StudentComplaintRecord["status"]) {
  if (status === "in_progress") return "In Progress";
  if (status === "resolved") return "Resolved";
  if (status === "rejected") return "Rejected";
  return "Open";
}

export function AdminComplaintsScreen() {
  const { adminRecord } = useSession();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterValue>("all");

  const resource = useResource(
    async () => (adminRecord ? listAdminComplaints(adminRecord) : []),
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const filtered = useMemo(() => {
    if (filter === "all") return resource.data ?? [];
    return (resource.data ?? []).filter((c) => c.status === filter);
  }, [resource.data, filter]);

  const counts = useMemo(() => {
    const all = resource.data ?? [];
    return {
      open: all.filter((c) => c.status === "open").length,
      inProgress: all.filter((c) => c.status === "in_progress").length,
      resolved: all.filter((c) => c.status === "resolved").length,
    };
  }, [resource.data]);

  const FILTER_OPTIONS: { key: FilterValue; label: string }[] = [
    { key: "all", label: `All (${resource.data?.length ?? 0})` },
    { key: "open", label: `Open (${counts.open})` },
    { key: "in_progress", label: `In Progress (${counts.inProgress})` },
    { key: "resolved", label: `Resolved (${counts.resolved})` },
  ];

  return (
    <View style={s.safe}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: Math.max(insets.top + 14, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation header with back button — scrolls with content */}
        <View style={s.header}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </AnimatedPressable>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.title}>Complaints</Text>
            <Text style={s.subtitle}>Student complaints submitted within your admin scope.</Text>
          </View>
        </View>

        {/* Filter chips */}
        <View style={s.chipRow}>
          {FILTER_OPTIONS.map((opt) => (
            <AnimatedPressable
              key={opt.key}
              onPress={() => setFilter(opt.key)}
              style={[s.chip, filter === opt.key && s.chipActive]}
            >
              <Text style={[s.chipText, filter === opt.key && s.chipTextActive]}>{opt.label}</Text>
            </AnimatedPressable>
          ))}
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading complaints..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="chatbubble-ellipses-outline" size={36} color={D.outline} />
            <Text style={s.emptyText}>No complaints match the current filter.</Text>
          </View>
        ) : (
          <View style={s.listCard}>
            <Stagger>
              {filtered.map((complaint, idx) => (
                <View key={complaint.id} style={[s.row, idx < filtered.length - 1 && s.rowBorder]}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <Text style={s.rowTitle} numberOfLines={1}>{complaint.subject} · {complaint.studentName}</Text>
                      <Pill label={complaintStatusLabel(complaint.status)} tone={complaintTone(complaint.status)} />
                    </View>
                    <Text style={s.rowSub}>{complaint.className || complaint.centreName || "Unknown class"}</Text>
                    {complaint.description ? (
                      <Text style={s.rowMeta} numberOfLines={2}>{complaint.description.slice(0, 80)}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </Stagger>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },
  header: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
  },
  title: { fontSize: 22, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.4 },
  subtitle: { fontSize: 12, color: D.onSurfaceVariant, lineHeight: 17, fontFamily: D.font },

  content: { paddingHorizontal: 18, gap: 14, paddingBottom: MOBILE_BOTTOM_SPACING },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
  },
  chipActive: { backgroundColor: D.primaryFixed, borderColor: D.surfaceHigh },
  chipText: { fontSize: 12, fontFamily: D.fontSemiBold, color: D.outline },
  chipTextActive: { color: D.primary, fontFamily: D.fontExtraBold },

  listCard: { backgroundColor: D.surface, borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  row: { paddingHorizontal: 14, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  rowTitle: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, flex: 1 },
  rowSub: { fontSize: 11, color: D.onSurfaceVariant, fontFamily: D.font },
  rowMeta: { fontSize: 11, color: D.outline, lineHeight: 16, fontFamily: D.font },

  empty: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 13, color: D.onSurfaceVariant, fontFamily: D.font },
});
