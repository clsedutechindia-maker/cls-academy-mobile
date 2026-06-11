import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../lib/navigation";
import { useResource } from "../hooks/useResource";
import { listAdminNotifications, type MobileNotificationItem } from "../lib/erp";
import { useSession } from "../providers/session";
import { D, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { Animated, AnimatedPressable, FadeIn, Pulse, enter } from "../components/motion";

function notifRoute(type: MobileNotificationItem["type"]): string | null {
  if (type === "complaint") return "/(admin)/complaints";
  if (type === "leave_request") return "/(admin)/attendance";
  if (type === "diary") return "/(admin)/staff" as string;
  return null;
}

type NotifStyle = { bg: string; fg: string; icon: string };

function notifStyle(type: MobileNotificationItem["type"], urgency: MobileNotificationItem["urgency"]): NotifStyle {
  if (type === "complaint") {
    return urgency === "high"
      ? { bg: D.errorBg, fg: D.error, icon: "alert-circle-outline" }
      : { bg: "#fff4e8", fg: "#9d4300", icon: "chatbubble-ellipses-outline" };
  }
  if (type === "leave_request") return { bg: "#fff8e8", fg: "#8f6610", icon: "calendar-outline" };
  if (type === "diary") return { bg: D.primaryFixed, fg: D.primary, icon: "document-text-outline" };
  return { bg: D.infoBg, fg: D.infoFg, icon: "megaphone-outline" };
}

function typeLabel(type: MobileNotificationItem["type"]) {
  if (type === "complaint") return "Complaint";
  if (type === "leave_request") return "Leave";
  if (type === "diary") return "Diary";
  return "Announcement";
}

export function AdminNotificationsScreen() {
  const { adminRecord } = useSession();
  const insets = useSafeAreaInsets();

  const resource = useResource(
    async () => (adminRecord ? listAdminNotifications(adminRecord) : []),
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
          <Text style={s.headerTitle} numberOfLines={1}>Notifications</Text>
        </View>

        {resource.loading ? (
          <View style={s.centreRow}>
            <Text style={s.muted}>Loading notifications…</Text>
          </View>
        ) : resource.error ? (
          <Animated.View entering={FadeIn.duration(300)} style={s.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={D.error} />
            <Text style={s.errorText}>{resource.error}</Text>
          </Animated.View>
        ) : !resource.data || resource.data.length === 0 ? (
          <Animated.View entering={FadeIn.duration(360)} style={s.empty}>
            <Pulse style={s.emptyIcon}>
              <Ionicons name="checkmark-circle-outline" size={32} color={D.success} />
            </Pulse>
            <Text style={s.emptyTitle}>All clear</Text>
            <Text style={s.emptySub}>No pending items requiring your attention.</Text>
          </Animated.View>
        ) : (
          <View style={s.list}>
            <Text style={s.listCount}>{resource.data.length} item{resource.data.length !== 1 ? "s" : ""} need attention</Text>
            {resource.data.map((item, idx) => {
              const ns = notifStyle(item.type, item.urgency);
              const route = notifRoute(item.type);
              return (
                <Animated.View key={item.id} entering={enter(idx)}>
                  <AnimatedPressable
                    style={[s.card, item.urgency === "high" && s.cardUrgent]}
                    onPress={route ? () => router.push(route as any) : undefined}
                  >
                    <View style={[s.iconWrap, { backgroundColor: ns.bg }]}>
                      <Ionicons name={ns.icon as never} size={20} color={ns.fg} />
                    </View>
                    <View style={s.cardBody}>
                      <View style={s.cardTop}>
                        <View style={[s.typePill, { backgroundColor: ns.bg }]}>
                          <Text style={[s.typePillText, { color: ns.fg }]}>{typeLabel(item.type)}</Text>
                        </View>
                        {item.urgency === "high" && <View style={s.urgentDot} />}
                      </View>
                      <Text style={s.cardTitle}>{item.title}</Text>
                      <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
                      <Text style={s.cardDate}>{item.dateLabel}</Text>
                    </View>
                    {route && <Ionicons name="chevron-forward" size={14} color={D.outline} style={{ alignSelf: "center" }} />}
                  </AnimatedPressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { flex: 1, fontSize: 22, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.4 },
  content: { paddingHorizontal: 18, gap: 0, paddingBottom: MOBILE_BOTTOM_SPACING },
  centreRow: { alignItems: "center", paddingTop: 48 },
  muted: { color: D.onSurfaceVariant, fontSize: 14, fontFamily: D.font },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: D.errorBg, borderRadius: 12, padding: 14,
  },
  errorText: { flex: 1, color: D.error, fontSize: 13, lineHeight: 18, fontFamily: D.font },
  empty: { alignItems: "center", gap: 12, paddingTop: 64 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: D.successBg, alignItems: "center", justifyContent: "center",
  },
  emptyTitle: { fontSize: 16, fontFamily: D.fontBold, color: D.onSurface },
  emptySub: { fontSize: 13, color: D.onSurfaceVariant, textAlign: "center", lineHeight: 19, maxWidth: 260, fontFamily: D.font },
  list: { gap: 10 },
  listCount: { fontSize: 12, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, marginBottom: 4 },
  card: {
    flexDirection: "row", gap: 12,
    backgroundColor: D.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: D.outlineVariant,
  },
  cardUrgent: { borderColor: D.error + "60", backgroundColor: "#fff8f8" },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  cardBody: { flex: 1, gap: 4 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  typePill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  typePillText: { fontSize: 10, fontFamily: D.fontBold, textTransform: "uppercase", letterSpacing: 0.4 },
  urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: D.error },
  cardTitle: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, lineHeight: 18 },
  cardDesc: { fontSize: 12, color: D.onSurfaceVariant, lineHeight: 17, fontFamily: D.font },
  cardDate: { fontSize: 11, color: D.outline, marginTop: 2, fontFamily: D.font },
});
