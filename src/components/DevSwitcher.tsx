import { useState, useCallback } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { setDemoRole, getDemoRole, type DemoRole } from "../lib/demoMode";
import { useSession } from "../providers/session";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TEST_ACCOUNT_PASSWORD = "Demo@12345";

const ROLES: {
  id: DemoRole;
  email: string;
  label: string;
  sub: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  bg: string;
  route: string;
}[] = [
  { id: "student", email: "demo.student.neet@clsacademy.test", label: "Student", sub: "Demo NEET Student", icon: "school-outline", color: "#0EA5E9", bg: "#F0F9FF", route: "/(student)/home" },
  { id: "subject_teacher", email: "demo.subject.teacher@clsacademy.test", label: "Subject Teacher", sub: "Demo Subject Teacher", icon: "book-outline", color: "#10B981", bg: "#F0FDF4", route: "/(teacher)/announcements" },
  { id: "class_teacher", email: "demo.teacher@clsacademy.test", label: "Class Teacher", sub: "Demo Class Teacher", icon: "people-outline", color: "#F59E0B", bg: "#FEF3C7", route: "/(teacher)/announcements" },
  { id: "head_teacher", email: "demo.teacher@clsacademy.test", label: "Head Teacher", sub: "Demo Head Teacher", icon: "ribbon-outline", color: "#6D28D9", bg: "#F5F3FF", route: "/(head-teacher)/home" },
  { id: "admin", email: "demo.admin@clsacademy.test", label: "Centre Incharge", sub: "Demo Superadmin", icon: "shield-checkmark-outline", color: "#EF4444", bg: "#FEF2F2", route: "/(admin)/overview" },
];

export function DevSwitcher() {
  if (!__DEV__) return null;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<DemoRole | null>(getDemoRole());
  const [switching, setSwitching] = useState<DemoRole | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { authUser, signIn, signOutUser } = useSession();

  const switchRole = useCallback(async (role: DemoRole, email: string, route: string) => {
    setSwitching(role);
    setSwitchError(null);
    try {
      // Try real Firebase sign-in first for live Firestore data
      setDemoRole(null);
      if (authUser) await signOutUser();
      await signIn(email, TEST_ACCOUNT_PASSWORD);
      setActive(null);
      setOpen(false);
      router.replace(route as any);
    } catch {
      // Account not seeded — fall back to demo mode with fake data
      try {
        if (authUser) await signOutUser();
      } catch {}
      setDemoRole(role);
      setActive(role);
      setOpen(false);
      router.replace(route as any);
    } finally {
      setSwitching(null);
    }
  }, [authUser, signIn, signOutUser]);

  const clearAll = useCallback(async () => {
    setDemoRole(null);
    setActive(null);
    try {
      if (authUser) await signOutUser();
    } catch {}
    setOpen(false);
    router.replace("/");
  }, [authUser, signOutUser]);

  const currentEmail = authUser?.email ?? null;
  const activeTestRole = ROLES.find((r) => r.email === currentEmail) ?? null;
  const displayActive = active ?? (activeTestRole ? activeTestRole.id : null);

  return (
    <>
      <TouchableOpacity
        style={[s.fab, { bottom: insets.bottom + 90 }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <View style={[s.fabInner, displayActive != null && { backgroundColor: "#6D28D9" }]}>
          <Ionicons name="swap-horizontal" size={14} color="#fff" />
          <Text style={s.fabLabel}>
            {displayActive
              ? (ROLES.find((r) => r.id === displayActive)?.label?.split(" ")[0] ?? "Dev")
              : "DEV"}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <View style={[s.sheet, { paddingBottom: insets.bottom + 20 }]} onStartShouldSetResponder={() => true}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Quick Switch</Text>
            <Text style={s.sheetSub}>
              Taps auto sign-in with real Firebase data. Falls back to demo (fake) data if account not seeded.
            </Text>

            <View style={s.roleList}>
              {ROLES.map((r) => {
                const isActive = displayActive === r.id;
                const isSwitching = switching === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[s.roleRow, isActive && s.roleRowActive]}
                    onPress={() => void switchRole(r.id, r.email, r.route)}
                    activeOpacity={0.8}
                    disabled={switching !== null}
                  >
                    <View style={[s.roleIcon, { backgroundColor: r.bg }]}>
                      <Ionicons name={r.icon} size={18} color={r.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.roleName}>{r.label}</Text>
                      <Text style={s.roleSub}>{r.email}</Text>
                    </View>
                    {isSwitching ? (
                      <ActivityIndicator size="small" color="#6D28D9" />
                    ) : isActive ? (
                      <View style={s.activeDot}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>

            {switchError && (
              <View style={s.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                <Text style={s.errorText}>{switchError}</Text>
              </View>
            )}

            {(authUser || active) && (
              <TouchableOpacity style={s.clearBtn} onPress={() => void clearAll()} activeOpacity={0.8}>
                <Ionicons name="log-out-outline" size={14} color="#EF4444" />
                <Text style={s.clearText}>
                  {authUser ? `Sign out (${authUser.email})` : "Exit demo mode"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 14,
    zIndex: 9999,
  },
  fabInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#374151",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabLabel: { fontSize: 11, fontWeight: "800", color: "#fff", letterSpacing: 0.3 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: "#1B1230", letterSpacing: -0.4, marginBottom: 6 },
  sheetSub: { fontSize: 12, color: "#8B82A1", marginBottom: 16, lineHeight: 17 },
  roleList: { gap: 8, marginBottom: 14 },
  roleRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 16, backgroundColor: "#FAF8FF", borderWidth: 1, borderColor: "#EDE9F5" },
  roleRowActive: { borderColor: "#6D28D9", backgroundColor: "#F5F3FF" },
  roleIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  roleName: { fontSize: 14, fontWeight: "700", color: "#1B1230", letterSpacing: -0.2 },
  roleSub: { fontSize: 11, color: "#8B82A1", marginTop: 1 },
  activeDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#6D28D9", alignItems: "center", justifyContent: "center" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FEE2E2", borderRadius: 10, padding: 10, marginBottom: 12 },
  errorText: { flex: 1, color: "#EF4444", fontSize: 12, lineHeight: 17 },
  clearBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "#FEE2E2", backgroundColor: "#FFF5F5" },
  clearText: { fontSize: 13.5, fontWeight: "700", color: "#EF4444" },
});
