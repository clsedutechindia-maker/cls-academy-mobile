import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "../../providers/session";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const menuItems: { label: string; icon: IoniconsName; route?: string; destructive?: boolean }[] = [
  { label: "Edit Profile", icon: "create-outline", route: "/(head-teacher)/edit-details" },
  { label: "Change Password", icon: "lock-closed-outline" },
  { label: "Notifications", icon: "notifications-outline" },
  { label: "Privacy & Security", icon: "shield-outline" },
  { label: "Help & Support", icon: "help-circle-outline" },
  { label: "About CLS Academy", icon: "information-circle-outline" },
  { label: "Sign Out", icon: "log-out-outline", destructive: true },
];

export function HTAccountScreen() {
  const insets = useSafeAreaInsets();
  const { profile, signOutUser } = useSession();

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 18, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.pageTitle}>Account</Text>

        {/* Profile hero */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{profile?.name?.split(" ").slice(0, 2).map((w: string) => w[0]).join("") || "HT"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{profile?.name || "Head Teacher"}</Text>
            <Text style={s.profileRole}>Head Teacher</Text>
            {profile?.email && <Text style={s.profileEmail}>{profile.email}</Text>}
          </View>
          <AnimatedPressable style={s.editBtn} onPress={() => router.push("/(head-teacher)/edit-details")}>
            <Ionicons name="create-outline" size={14} color={D.primary} />
          </AnimatedPressable>
        </View>

        {/* Stats strip */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 22 }}>
          {[
            { label: "Students", value: "124" },
            { label: "Batches", value: "3" },
            { label: "Subjects", value: "5" },
          ].map((stat) => (
            <View key={stat.label} style={s.statTile}>
              <Text style={s.statValue}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={s.menuCard}>
          {menuItems.map((item, i) => (
            <AnimatedPressable
              key={item.label}
              style={[s.menuRow, i < menuItems.length - 1 && s.divider]}
              onPress={() => {
                if (item.route) router.push(item.route as any);
                else if (item.destructive && signOutUser) signOutUser();
              }}
            >
              <View style={[s.menuIcon, { backgroundColor: item.destructive ? "#FEF2F2" : D.bg }]}>
                <Ionicons name={item.icon} size={15} color={item.destructive ? "#EF4444" : D.primary} />
              </View>
              <Text style={[s.menuLabel, item.destructive && { color: "#EF4444" }]}>{item.label}</Text>
              {!item.destructive && <Ionicons name="chevron-forward" size={13} color={D.outline} />}
            </AnimatedPressable>
          ))}
        </View>

        <Text style={s.versionText}>CLS Academy · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  pageTitle: { fontSize: 22, fontWeight: "800", color: D.onSurface, letterSpacing: -0.5, marginBottom: 18, fontFamily: D.fontExtraBold },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 14, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: D.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontWeight: "800", color: "#fff", fontFamily: D.fontExtraBold },
  profileName: { fontSize: 14, fontWeight: "800", color: D.onSurface, letterSpacing: -0.25, fontFamily: D.fontExtraBold },
  profileRole: { fontSize: 11.5, color: D.primary, fontWeight: "700", marginTop: 2, fontFamily: D.fontBold },
  profileEmail: { fontSize: 11, color: D.outline, marginTop: 2, fontFamily: D.font },
  editBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, alignItems: "center", justifyContent: "center" },
  statTile: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  statValue: { fontSize: 16, fontWeight: "800", color: D.primary, letterSpacing: -0.3, fontFamily: D.fontExtraBold },
  statLabel: { fontSize: 10, fontWeight: "600", color: D.outline, marginTop: 3, fontFamily: D.fontSemiBold },
  menuCard: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", marginBottom: 18, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  menuIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: D.onSurface, letterSpacing: -0.1, fontFamily: D.fontSemiBold },
  versionText: { textAlign: "center", fontSize: 11, color: D.outline, marginTop: 4, fontFamily: D.font },
});
