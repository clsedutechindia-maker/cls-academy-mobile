import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { useSession } from "../../providers/session";
import { useResource } from "../../hooks/useResource";
import { getStudentProfile } from "../../lib/erp";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

export function TeacherStudentDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ userId?: string; name?: string }>();
  const userId = typeof params.userId === "string" ? params.userId : "";
  const displayName = typeof params.name === "string" ? params.name : "Student";

  const { profile: teacherProfile } = useSession();

  const { data: profile, loading, error } = useResource(
    async () => {
      if (!userId) return null;
      return getStudentProfile(userId);
    },
    [userId],
  );

  const initials = displayName.split(" ").slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.navTitle} numberOfLines={1}>{displayName}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.heroName}>{displayName}</Text>
          {profile && (
            <View style={s.activeBadge}>
              <View style={[s.activeDot, { backgroundColor: profile.active ? "#15803D" : "#B45309" }]} />
              <Text style={[s.activeBadgeText, { color: profile.active ? "#15803D" : "#B45309" }]}>
                {profile.active ? "Active" : "Pending"}
              </Text>
            </View>
          )}
        </View>

        {loading && (
          <View style={[s.card, { padding: 20, alignItems: "center" }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>Loading…</Text>
          </View>
        )}

        {error && (
          <View style={[s.card, { padding: 16 }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: "#B91C1C" }}>{error}</Text>
          </View>
        )}

        {!loading && !error && profile && (
          <>
            <Text style={s.sectionLabel}>BASIC INFO</Text>
            <View style={s.card}>
              <InfoRow label="Full Name" value={profile.name || "—"} />
              <View style={s.divider} />
              <InfoRow label="Roll Number" value={profile.rollNumber || "—"} />
              <View style={s.divider} />
              <InfoRow label="Class / Batch" value={profile.className || "—"} />
              <View style={s.divider} />
              <InfoRow label="Centre" value={profile.centreName || "—"} />
              <View style={s.divider} />
              <InfoRow label="Region" value={profile.regionName || "—"} />
              {(profile as any).email && (
                <>
                  <View style={s.divider} />
                  <InfoRow label="Email" value={(profile as any).email} />
                </>
              )}
            </View>
          </>
        )}

        {!loading && !error && !profile && userId && (
          <View style={[s.card, { padding: 20, alignItems: "center" }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>Student profile not found.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
  hero: { alignItems: "center", paddingVertical: 24, marginBottom: 20 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: D.primary, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 24, fontWeight: "800", color: "#fff", fontFamily: D.fontExtraBold },
  heroName: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.4, marginBottom: 6 },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeBadgeText: { fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 10 },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1, marginBottom: 20 },
  divider: { height: 1, backgroundColor: D.outlineVariant },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14 },
  infoLabel: { fontSize: 12, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  infoValue: { fontSize: 12.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface, textAlign: "right", flex: 1, marginLeft: 12 },
});
