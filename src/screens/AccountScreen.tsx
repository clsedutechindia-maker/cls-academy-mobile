import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSession } from "../providers/session";
import { AvatarCircle, D } from "../components/ui";
import { Animated, AnimatedPressable, enter } from "../components/motion";

function MenuRow({
  icon,
  label,
  sub,
  onPress,
  isLast,
}: {
  icon: string;
  label: string;
  sub: string;
  onPress?: () => void;
  isLast?: boolean;
}) {
  return (
    <AnimatedPressable
      style={[s.menuRow, isLast && { borderBottomWidth: 0 }]}
      onPress={onPress}
    >
      <View style={s.menuIconWrap}>
        <Ionicons name={icon as never} size={20} color={D.onSurfaceVariant} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.menuLabel}>{label}</Text>
        <Text style={s.menuSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={D.outline} />
    </AnimatedPressable>
  );
}

export function AccountScreen() {
  const { authUser, adminRecord, profile, roleLabel, signOutUser, refresh } = useSession();

  const displayName = profile?.name || authUser?.displayName || authUser?.email?.split("@")[0] || "Member";
  const displayEmail = authUser?.email || "No email";

  const scopeLabel = adminRecord
    ? adminRecord.role === "centre_incharge"
      ? adminRecord.centreName || "Centre"
      : adminRecord.role === "regional_incharge"
        ? adminRecord.regionName || "Region"
        : "All Centres"
    : profile?.centreName || null;

  return (
    <SafeAreaView style={s.safe}>
      {/* Non-home page header */}
      <View style={s.header}>
        <Text style={s.pageTitle}>Account</Text>
        <AnimatedPressable style={s.iconBtn} onPress={() => router.push("/(admin)/notifications")}>
          <Ionicons name="notifications-outline" size={20} color={D.onSurface} />
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={enter(0)}>
          <Text style={s.pageSub}>Manage your profile and settings.</Text>
        </Animated.View>

        {/* Profile card */}
        <Animated.View entering={enter(1)} style={s.profileCard}>
          <View style={{ position: "relative", alignSelf: "center" }}>
            <AvatarCircle name={displayName} size={80} />
            <AnimatedPressable style={s.editBadge} onPress={() => router.push("/(admin)/profile-settings")}>
              <Ionicons name="pencil" size={14} color="#fff" />
            </AnimatedPressable>
          </View>

          <Text style={s.profileName}>{displayName}</Text>
          <Text style={s.profileEmail}>{displayEmail}</Text>

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
            <View style={s.rolePill}>
              <Ionicons name="shield-checkmark-outline" size={13} color={D.primary} />
              <Text style={s.rolePillText}>{roleLabel}</Text>
            </View>
            {scopeLabel && (
              <View style={s.scopePill}>
                <Ionicons name="business-outline" size={13} color={D.primaryBtn} />
                <Text style={s.scopePillText}>{scopeLabel}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Menu card */}
        <Animated.View entering={enter(2)} style={s.menuCard}>
          <MenuRow
            icon="person-outline"
            label="Profile Settings"
            sub="Update personal details and preferences"
            onPress={() => router.push("/(admin)/profile-settings")}
            isLast
          />
        </Animated.View>

        {/* Sign Out — design system: D.errorBg bg, D.errorFg text */}
        <AnimatedPressable style={s.signOutBtn} onPress={() => void signOutUser()}>
          <Ionicons name="log-out-outline" size={18} color={D.errorFg} />
          <Text style={s.signOutText}>Sign Out</Text>
        </AnimatedPressable>

        {/* Refresh Access */}
        <AnimatedPressable style={s.refreshBtn} onPress={() => void refresh()}>
          <Ionicons name="refresh-outline" size={16} color={D.primaryBtn} />
          <Text style={s.refreshText}>Refresh Access</Text>
        </AnimatedPressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 18, paddingVertical: 14,
    backgroundColor: D.bg, borderBottomWidth: 1, borderBottomColor: D.outlineVariant,
  },
  pageTitle: { flex: 1, fontSize: 24, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },

  scroll: { padding: 18, gap: 16, paddingBottom: 140 },
  pageSub: { fontSize: 13, color: D.onSurfaceVariant, lineHeight: 18, fontFamily: D.font },

  profileCard: {
    backgroundColor: D.surface, borderRadius: 18, padding: 24,
    alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: D.outlineVariant,
    shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 5, elevation: 1,
  },
  editBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: D.primaryBtn,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: D.surface,
  },
  profileName: { fontSize: 20, fontFamily: D.fontExtraBold, color: D.onSurface, marginTop: 6 },
  profileEmail: { fontSize: 13, color: D.onSurfaceVariant, fontFamily: D.font },

  rolePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: D.primaryFixed, borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: D.surfaceHigh,
  },
  rolePillText: { fontSize: 12, fontFamily: D.fontSemiBold, color: D.primary },
  scopePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: D.surfaceLow, borderRadius: 99,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: D.outlineVariant,
  },
  scopePillText: { fontSize: 12, fontFamily: D.fontSemiBold, color: D.primaryBtn },

  menuCard: {
    backgroundColor: D.surface, borderRadius: 18,
    borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden",
    shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.025, shadowRadius: 5, elevation: 1,
  },
  menuRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: D.outlineVariant,
  },
  menuIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: D.surfaceHigh, alignItems: "center", justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontFamily: D.fontSemiBold, color: D.onSurface },
  menuSub: { fontSize: 12, color: D.onSurfaceVariant, lineHeight: 17, fontFamily: D.font },

  signOutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: D.errorBg, borderRadius: 14, paddingVertical: 16,
  },
  signOutText: { fontSize: 14, fontFamily: D.fontBold, color: D.errorFg },

  refreshBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: D.surface, borderRadius: 14,
    borderWidth: 1, borderColor: D.outlineVariant, paddingVertical: 12,
  },
  refreshText: { fontSize: 13, fontFamily: D.fontSemiBold, color: D.primaryBtn },
});
