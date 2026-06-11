import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResource } from "../hooks/useResource";
import { listVisibleProfilesForAdmin } from "../lib/erp";
import { useSession } from "../providers/session";
import { AnimatedPressable } from "../components/motion";
import { AvatarCircle, D } from "../components/ui";

export function AdminStaffScreen() {
  const insets = useSafeAreaInsets();
  const { adminRecord } = useSession();
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [pendingOnly, setPendingOnly] = useState(false);

  const { data: staff, loading, error } = useResource(
    async () => {
      if (!adminRecord) return [];
      const profiles = await listVisibleProfilesForAdmin(adminRecord);
      return profiles.filter((p) => p.role === "teacher");
    },
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const classNames = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const st of staff ?? []) {
      if (st.className && !seen.has(st.className)) {
        seen.add(st.className);
        result.push(st.className);
      }
    }
    return result.sort((a, b) => a.localeCompare(b));
  }, [staff]);

  const batches = ["All", ...classNames];

  const pendingCount = useMemo(() => (staff ?? []).filter((st) => !st.active).length, [staff]);

  const filtered = (staff ?? []).filter((st) => {
    if (pendingOnly && st.active) return false;
    if (selectedBatch !== "All" && st.className !== selectedBatch) return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      return [st.name, st.teacherId, st.className, st.centreName].join(" ").toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>

        {/* Heading Section */}
        <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
          <View style={s.titleRow}>
            <Text style={s.pageTitle}>Staff</Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <AnimatedPressable style={s.batchDropdown} onPress={() => setPickerOpen(true)}>
                <Text style={s.batchDropdownText} numberOfLines={1}>{selectedBatch}</Text>
                <Ionicons name="chevron-down" size={13} color={D.primary} />
              </AnimatedPressable>
              <AnimatedPressable style={s.searchIconBtn} onPress={() => { setSearchVisible((v) => !v); if (searchVisible) setSearch(""); }}>
                <Ionicons name={searchVisible ? "close" : "search"} size={20} color={D.onSurface} />
              </AnimatedPressable>
            </View>
          </View>
        </View>

        {searchVisible && (
          <View style={{ paddingHorizontal: 18, paddingBottom: 10, backgroundColor: D.bg }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant }}>
              <Ionicons name="search-outline" size={17} color={D.outline} />
              <TextInput
                style={{ flex: 1, fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface }}
                placeholder="Search by name or staff ID…"
                placeholderTextColor={D.outline}
                value={search}
                onChangeText={setSearch}
                autoFocus
                autoCapitalize="none"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={17} color={D.outline} />
                </Pressable>
              )}
            </View>
          </View>
        )}

        <View style={s.contentArea}>
          {/* Summary stats — 2 per row */}
          <View style={s.grid2}>
            {/* Non-interactive stat */}
            <View style={s.featureCard}>
              <View style={s.fcTopRow}>
                <View style={[s.fcIcon, { backgroundColor: D.surfaceLow }]}>
                  <Ionicons name="briefcase-outline" size={14} color={D.primary} />
                </View>
              </View>
              <Text style={s.fcLabel}>STAFF</Text>
              <Text style={s.fcValue}>{String(staff?.length ?? "—")}</Text>
              <Text style={s.fcSub}>{classNames.length} class{classNames.length !== 1 ? "es" : ""}</Text>
            </View>
            {/* Tappable pending card */}
            <AnimatedPressable style={s.featureCard} onPress={() => setPendingOnly((v) => !v)}>
              <View style={s.fcTopRow}>
                <View style={[s.fcIcon, { backgroundColor: "#FEF3C7" }]}>
                  <Ionicons name="time-outline" size={14} color="#B45309" />
                </View>
                {pendingOnly && <Ionicons name="checkmark-circle" size={14} color="#B45309" />}
              </View>
              <Text style={s.fcLabel}>PENDING</Text>
              <Text style={s.fcValue}>{pendingCount > 0 ? String(pendingCount) : "—"}</Text>
              <Text style={s.fcSub}>Approvals</Text>
            </AnimatedPressable>
          </View>

          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>All staff</Text>
          </View>

          {loading && (
            <View style={[s.card, { padding: 20, alignItems: "center" }]}>
              <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>Loading staff…</Text>
            </View>
          )}

          {error && (
            <View style={[s.card, { padding: 16 }]}>
              <Text style={{ fontSize: 13, fontFamily: D.font, color: "#B91C1C" }}>{error}</Text>
            </View>
          )}

          {!loading && !error && filtered.length === 0 && (
            <View style={[s.card, { padding: 20, alignItems: "center" }]}>
              <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No staff members found.</Text>
            </View>
          )}

          {!loading && !error && filtered.length > 0 && (
            <View style={s.card}>
              {filtered.map((st, i) => (
                <AnimatedPressable
                  key={st.userId}
                  style={[s.studentRow, i < filtered.length - 1 && s.divider]}
                  onPress={() =>
                    router.push({
                      pathname: "/(admin)/staff/[userId]",
                      params: {
                        userId: st.userId,
                        name: st.name,
                        teacherId: st.teacherId ?? "",
                        className: st.className ?? "",
                        centreName: st.centreName ?? "",
                      },
                    })
                  }
                >
                  <AvatarCircle name={st.name} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.studentName}>{st.name}</Text>
                    <Text style={s.studentMeta}>
                      {st.teacherId ? `Staff ID ${st.teacherId} · ` : ""}{st.className || "Unassigned"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={13} color={D.outline} />
                </AnimatedPressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Batch picker modal */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setPickerOpen(false)}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Select Class</Text>
            {batches.map((b) => (
              <Pressable
                key={b}
                style={[s.modalOption, b === selectedBatch && s.modalOptionActive]}
                onPress={() => { setSelectedBatch(b); setPickerOpen(false); }}
              >
                <Text style={[s.modalOptionText, b === selectedBatch && { color: D.primary, fontFamily: D.fontBold }]}>{b}</Text>
                {b === selectedBatch && <Ionicons name="checkmark" size={16} color={D.primary} />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 16, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pageTitle: { fontSize: 24, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  batchDropdown: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, maxWidth: 130 },
  batchDropdownText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.primary, flex: 1 },
  searchIconBtn: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 40 },
  modalTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginBottom: 16, letterSpacing: -0.2 },
  modalOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  modalOptionActive: { backgroundColor: D.surfaceLow, marginHorizontal: -18, paddingHorizontal: 18, borderRadius: 0 },
  modalOptionText: { fontSize: 13, fontFamily: D.fontMedium, color: D.onSurface },
  contentArea: { paddingHorizontal: 18 },
  grid2: { flexDirection: "row", gap: 16 },
  featureCard: { flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 4, elevation: 1 },
  fcTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fcIcon: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  fcLabel: { marginTop: 10, fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5 },
  fcValue: { marginTop: 4, fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.35 },
  fcSub: { marginTop: 3, fontSize: 9.5, color: D.onSurfaceVariant, letterSpacing: -0.05, fontFamily: D.font },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 12, paddingHorizontal: 2 },
  sectionTitle: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  card: { backgroundColor: D.surface, borderRadius: 12, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  studentName: { fontSize: 12, fontWeight: "700", color: D.onSurface, letterSpacing: -0.1, fontFamily: D.fontBold },
  studentMeta: { fontSize: 10.5, color: D.outline, marginTop: 2, fontFamily: D.font },
});
