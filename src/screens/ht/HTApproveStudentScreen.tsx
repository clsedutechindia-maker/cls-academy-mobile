import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { AvatarCircle } from "../../components/ui";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { listPendingStudentsForTeacher } from "../../lib/erp";

export function HTApproveStudentScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();

  const { data: pending, loading, error } = useResource(
    async () => {
      if (!profile) return [];
      return listPendingStudentsForTeacher(profile);
    },
    [profile?.userId],
  );

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      {/* Nav header */}
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.navTitle}>Pending Approvals</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info banner */}
        <View style={s.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color={D.primary} style={{ flexShrink: 0, marginTop: 1 }} />
          <Text style={s.infoText}>
            These students have registered but are not yet active. Tap a student to review their details and approve or reject.
          </Text>
        </View>

        {loading && (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={D.primary} />
          </View>
        )}

        {error && (
          <View style={[s.card, { padding: 16 }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: "#B91C1C" }}>{error}</Text>
          </View>
        )}

        {!loading && !error && (pending ?? []).length === 0 && (
          <View style={[s.card, { padding: 28, alignItems: "center" }]}>
            <Ionicons name="checkmark-circle-outline" size={36} color="#15803D" style={{ marginBottom: 10 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, marginBottom: 4 }}>
              All caught up!
            </Text>
            <Text style={{ fontSize: 12, fontFamily: D.font, color: D.outline, textAlign: "center" }}>
              No pending student approvals.
            </Text>
          </View>
        )}

        {!loading && !error && (pending ?? []).length > 0 && (
          <>
            <Text style={s.sectionLabel}>PENDING · {(pending ?? []).length}</Text>
            <View style={s.card}>
              {(pending ?? []).map((st, i) => (
                <AnimatedPressable
                  key={st.userId}
                  style={[s.studentRow, i < (pending ?? []).length - 1 && s.divider]}
                  onPress={() =>
                    router.push({
                      pathname: "/(team)/student-detail",
                      params: { userId: st.userId, name: st.name, mode: "approve" },
                    })
                  }
                >
                  <AvatarCircle name={st.name} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.studentName}>{st.name}</Text>
                    <Text style={s.studentMeta}>
                      {st.className || "—"}{st.phone ? ` · ${st.phone}` : ""}
                    </Text>
                  </View>
                  <View style={s.pendingBadge}>
                    <Text style={s.pendingBadgeText}>PENDING</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={13} color={D.outline} />
                </AnimatedPressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
  infoBanner: { flexDirection: "row", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: 12, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.primaryFixed, marginBottom: 18 },
  infoText: { flex: 1, fontSize: 12.5, fontFamily: D.fontMedium, color: D.primary, lineHeight: 18, fontWeight: "500" },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  studentRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  studentName: { fontSize: 13, fontWeight: "700", color: D.onSurface, letterSpacing: -0.1, fontFamily: D.fontBold },
  studentMeta: { fontSize: 11, color: D.outline, marginTop: 2, fontFamily: D.font },
  pendingBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#FEF3C7" },
  pendingBadgeText: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, color: "#B45309", letterSpacing: 0.3 },
});
