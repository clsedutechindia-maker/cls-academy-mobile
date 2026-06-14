import { router } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { EmptyCard, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING, Pill, uiStyles, D } from "../components/ui";
import { formatDateTimeLabel } from "../lib/date";
import { getStudentNotifications, markStudentNotificationsSeen } from "../lib/erp";
import { useCachedResource } from "../hooks/useResource";
import { useSession } from "../providers/session";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function notificationTone(type: string) {
  if (type === "complaint" || type === "leave" || type === "fee") return "warning" as const;
  if (type === "doubt" || type === "result") return "success" as const;
  return "info" as const;
}

function NotificationRow({
  title,
  message,
  type,
  createdAtIso,
  onPress,
}: {
  title: string;
  message: string;
  type: string;
  createdAtIso: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.notificationRow}>
      <View style={styles.notificationHeaderRow}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Pill label={type} tone={notificationTone(type)} />
      </View>
      <Text style={styles.notificationMessage}>{message}</Text>
      <Text style={styles.notificationMeta}>{formatDateTimeLabel(createdAtIso)}</Text>
    </Pressable>
  );
}

export function StudentNotificationsScreen() {
  const { profile } = useSession();
  const insets = useSafeAreaInsets();
  const resource = useCachedResource(`notif-student:${profile?.userId ?? "anon"}`, async () => {
    if (!profile) return [];
    const items = await getStudentNotifications(profile);
    await markStudentNotificationsSeen(profile);
    return items;
  }, [profile?.userId, profile?.classId, profile?.regionId, profile?.centreId]);
  const items = resource.data ?? [];

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.pageContent, { paddingTop: Math.max(insets.top + 24, 56) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topHeader}>
          <Pressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </Pressable>
          <Text style={styles.topTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading notifications..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : items.length === 0 ? (
          <EmptyCard title="No notifications" message="You are all caught up." />
        ) : (
          <>
            <View style={styles.listCard}>
              {items.map((item, index) => (
                <View key={item.id} style={index < items.length - 1 ? styles.rowBorder : undefined}>
                  <NotificationRow
                    title={item.title}
                    message={item.message}
                    type={item.type}
                    createdAtIso={item.createdAtIso}
                    onPress={() => router.push(item.href as never)}
                  />
                </View>
              ))}
            </View>
            <Text style={[uiStyles.muted, { paddingHorizontal: 4 }]}>Opening this screen marks the current notification batch as seen.</Text>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: D.bg },
  pageContent: { paddingHorizontal: 16, paddingBottom: MOBILE_BOTTOM_SPACING },
  topHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  topTitle: { flex: 1, fontSize: 22, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  headerSpacer: { width: 38, height: 38 },
  listCard: { backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", marginBottom: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  notificationRow: { paddingHorizontal: 14, paddingVertical: 14, gap: 6 },
  notificationHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  notificationTitle: { flex: 1, fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2, lineHeight: 18 },
  notificationMessage: { fontSize: 12.5, lineHeight: 18, color: D.onSurfaceVariant, fontFamily: D.font },
  notificationMeta: { fontSize: 10.5, color: D.outline, fontFamily: D.font },
});
