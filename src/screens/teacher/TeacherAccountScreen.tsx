import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "../../providers/session";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const menuItems: { label: string; icon: IoniconsName; route?: string; destructive?: boolean }[] = [
  { label: "My Schedule", icon: "calendar-outline", route: "/(teacher)/schedules" },
  { label: "Privacy & Security", icon: "shield-outline" },
  { label: "Help & Support", icon: "help-circle-outline" },
  { label: "About CLS Academy", icon: "information-circle-outline" },
  { label: "Sign Out", icon: "log-out-outline", destructive: true },
];

export function TeacherAccountScreen() {
  const insets = useSafeAreaInsets();
  const { profile, signOutUser } = useSession();
  const initials = profile?.name?.split(" ").slice(0, 2).map((w: string) => w[0]).join("") || "T";
  const subjects = (profile as any)?.teacherSubjectNames?.join(" · ") || "";
  const classes = (profile as any)?.teacherClassNames?.join(", ") || "";
  const roleLabel = (profile as any)?.teacherRole === "class_teacher" ? "Class Teacher"
    : (profile as any)?.teacherRole === "subject_teacher" ? "Subject Teacher"
    : "Teacher";

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingHorizontal: 18, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Account</Text>
        </View>

        {/* Profile hero */}
        <View style={s.profileBlock}>
          <View style={s.avatarWrap}>
            <LinearGradient colors={["#7C3AED", "#8B5CF6"]} style={s.avatarCircle} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={s.avatarText}>{initials}</Text>
            </LinearGradient>
            <View style={s.avatarBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
            </View>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{profile?.name || "Teacher"}</Text>
            <View style={s.profileRoleRow}>
              <View style={s.roleChip}>
                <Text style={s.roleChipText}>{roleLabel}</Text>
              </View>
            </View>
            {!!subjects && <Text style={s.profileSubjects}>{subjects}</Text>}
            {!!classes && <Text style={s.profileClasses}>{classes}</Text>}
          </View>
        </View>

        {/* Stats */}
        <View style={s.grid2}>
          {[
            { label: "Batches", value: String((profile as any)?.teacherClassIds?.length ?? "—") },
            { label: "Subjects", value: String((profile as any)?.teacherSubjectIds?.length ?? "—") },
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
              <View style={[s.menuIcon, { backgroundColor: item.destructive ? "#FEF2F2" : D.surfaceLow }]}>
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
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: "800", color: D.onSurface, letterSpacing: -0.7, fontFamily: D.fontExtraBold },
  profileBlock: { flexDirection: "row", alignItems: "flex-start", gap: 16, marginBottom: 20 },
  avatarWrap: { position: "relative" },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#fff", fontFamily: D.fontExtraBold },
  avatarBadge: { position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: D.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: D.bg },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: { fontSize: 16, fontWeight: "800", color: D.onSurface, letterSpacing: -0.3, fontFamily: D.fontExtraBold },
  profileRoleRow: { flexDirection: "row", marginTop: 5 },
  roleChip: { backgroundColor: D.surfaceLow, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: D.surfaceHigh },
  roleChipText: { fontSize: 11, fontWeight: "600", color: D.primary, fontFamily: D.fontSemiBold },
  profileSubjects: { fontSize: 11.5, color: D.onSurfaceVariant, marginTop: 6, fontFamily: D.fontMedium },
  profileClasses: { fontSize: 10.5, color: D.outline, marginTop: 2, fontFamily: D.font },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 22 },
  statTile: { width: "48%", padding: 14, borderRadius: 14, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  statValue: { fontSize: 16, fontWeight: "800", color: D.onSurface, letterSpacing: -0.3, fontFamily: D.fontExtraBold },
  statLabel: { fontSize: 10, fontWeight: "600", color: D.outline, marginTop: 3, fontFamily: D.fontSemiBold },
  menuCard: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", marginBottom: 14, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  menuRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  menuIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: D.onSurface, letterSpacing: -0.1, fontFamily: D.fontSemiBold },
  signOutBtn: { marginBottom: 18, padding: 14, borderRadius: 14, backgroundColor: "#FEF2F2", alignItems: "center" },
  signOutText: { fontSize: 14, fontWeight: "700", color: "#EF4444", fontFamily: D.fontBold },
  versionText: { textAlign: "center", fontSize: 11, color: D.outline, marginBottom: 4, fontFamily: D.font },
});
