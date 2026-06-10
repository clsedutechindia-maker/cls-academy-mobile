import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../lib/navigation";
import { useResource } from "../hooks/useResource";
import { listAdminAttendanceOverview } from "../lib/erp";
import { useSession } from "../providers/session";
import { AvatarCircle, D, EmptyCard, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING, Pill } from "../components/ui";
import { AnimatedPressable, Stagger } from "../components/motion";

export function AdminAttendanceScreen() {
  const { adminRecord } = useSession();
  const insets = useSafeAreaInsets();
  const resource = useResource(
    async () => (adminRecord ? listAdminAttendanceOverview(adminRecord) : []),
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

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
            <Text style={s.title}>Attendance Oversight</Text>
            <Text style={s.subtitle}>Today's student attendance visible within your admin scope.</Text>
          </View>
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading attendance oversight..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : !resource.data || resource.data.length === 0 ? (
          <EmptyCard title="No attendance records" message="No attendance has been submitted for today in your current scope." />
        ) : (
          <View style={s.listCard}>
            <Text style={s.listTitle}>Today's Attendance</Text>
            <Stagger>
              {resource.data.map((record, idx) => (
                <View key={record.id} style={[s.row, idx < resource.data!.length - 1 && s.rowBorder]}>
                  <AvatarCircle name={record.studentName} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowName}>{record.studentName}</Text>
                    <Text style={s.rowMeta}>{record.className} · {record.teacherName}</Text>
                  </View>
                  <Pill
                    label={record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    tone={record.status === "present" ? "success" : record.status === "leave" ? "warning" : "danger"}
                  />
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
  listCard: { backgroundColor: D.surface, borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  listTitle: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  rowName: { fontSize: 13, fontFamily: D.fontSemiBold, color: D.onSurface },
  rowMeta: { fontSize: 11, color: D.onSurfaceVariant, marginTop: 1, fontFamily: D.font },
});
