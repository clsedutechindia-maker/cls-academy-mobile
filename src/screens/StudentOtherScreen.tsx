import { router, useSegments } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { D, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { useSession } from "../providers/session";
import { useResource } from "../hooks/useResource";
import { listStudentDoubts, listAnnouncementsForProfile } from "../lib/erp";
import { getReadCircularIds } from "../lib/readStore";

const SECTIONS = [
  {
    title: "Schedule",
    subtitle: "Timetable & tests",
    icon: "calendar-outline" as const,
    href: "/(student)/schedules" as const,
    color: "#7C3AED",
    bg: "#EDE9FE",
    badgeKey: null as null | "doubts" | "circulars",
  },
  {
    title: "Materials",
    subtitle: "Notes, DPPs & videos",
    icon: "book-outline" as const,
    href: "/(student)/materials" as const,
    color: "#2563EB",
    bg: "#DBEAFE",
    badgeKey: null as null | "doubts" | "circulars",
  },
  {
    title: "Teaching Plan",
    subtitle: "Subject-wise weekly plan",
    icon: "reader-outline" as const,
    href: "/(student)/teaching-plan" as const,
    color: "#7C3AED",
    bg: "#F3E8FF",
    badgeKey: null as null | "doubts" | "circulars",
  },
  {
    title: "Circulars",
    subtitle: "Notices & announcements",
    icon: "megaphone-outline" as const,
    href: "/(student)/circulars" as const,
    color: "#EA580C",
    bg: "#FFEDD5",
    badgeKey: "circulars" as null | "doubts" | "circulars",
  },
  {
    title: "Complaints",
    subtitle: "Raise an issue",
    icon: "alert-circle-outline" as const,
    href: "/(student)/complaints" as const,
    color: "#DC2626",
    bg: "#FEE2E2",
    badgeKey: null as null | "doubts" | "circulars",
  },
  {
    title: "Doubts",
    subtitle: "Submit a question",
    icon: "chatbubbles-outline" as const,
    href: "/(student)/doubts" as const,
    color: "#059669",
    bg: "#D1FAE5",
    badgeKey: "doubts" as null | "doubts" | "circulars",
  },
];

const RECENT_MS = 7 * 86_400_000;

function isRecentCircular(createdAtIso: string) {
  const t = new Date(createdAtIso).getTime();
  return !Number.isNaN(t) && Date.now() - t < RECENT_MS;
}

export function StudentOtherScreen() {
  const { profile } = useSession();
  const segments = useSegments();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getReadCircularIds().then(setReadIds);
  }, [segments.join(",")]);

  const resource = useResource(async () => {
    if (!profile) return { doubtUnread: 0, circulars: [] as { id: string; createdAtIso: string }[] };
    const [doubts, circulars] = await Promise.all([
      listStudentDoubts(profile),
      listAnnouncementsForProfile(profile),
    ]);
    return {
      doubtUnread: doubts.filter((d) => !d.studentSeen).length,
      circulars: (circulars as { id: string; createdAtIso: string }[]),
    };
  }, [profile?.userId]);

  const circularUnread = (resource.data?.circulars ?? []).filter(
    (c) => isRecentCircular(c.createdAtIso) && !readIds.has(c.id),
  ).length;

  const getBadge = (key: null | "doubts" | "circulars"): number | undefined => {
    if (!key || !resource.data) return undefined;
    const count = key === "doubts" ? resource.data.doubtUnread : circularUnread;
    return count > 0 ? count : undefined;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Other</Text>
      <Text style={styles.headerSubtitle}>Quick access to all features</Text>

      <View style={styles.grid}>
        {SECTIONS.map((section, index) => {
          const isFullWidth = SECTIONS.length % 2 !== 0 && index === SECTIONS.length - 1;
          const badge = getBadge(section.badgeKey);
          return (
            <AnimatedPressable
              key={section.title}
              style={[styles.card, isFullWidth && styles.fullWidthCard]}
              onPress={() => router.push(section.href)}
            >
              {badge !== undefined ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge}</Text>
                </View>
              ) : null}

              <View style={[styles.iconWrap, { backgroundColor: section.bg }]}>
                <Ionicons name={section.icon} size={22} color={section.color} />
              </View>

              <Text style={styles.title}>{section.title}</Text>
              <Text style={styles.subtitle}>{section.subtitle}</Text>

              <View style={styles.arrowContainer}>
                <View style={[styles.arrowWrap, { backgroundColor: section.bg }]}>
                  <Ionicons name="chevron-forward" size={12} color={section.color} />
                </View>
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: D.bg,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: MOBILE_BOTTOM_SPACING,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    fontFamily: D.fontExtraBold,
    color: D.onSurface,
    letterSpacing: -0.7,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: D.outline,
    fontFamily: D.fontMedium,
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  card: {
    width: "47%",
    backgroundColor: D.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 4,
    elevation: 1,
    position: "relative",
    minHeight: 140,
    justifyContent: "flex-start",
    gap: 6,
  },
  fullWidthCard: {
    width: "100%",
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    zIndex: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    fontFamily: D.fontExtraBold,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
    fontFamily: D.fontExtraBold,
    color: D.onSurface,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11.5,
    color: D.onSurfaceVariant,
    fontFamily: D.font,
    lineHeight: 16,
    flex: 1,
  },
  arrowContainer: {
    alignSelf: "flex-end",
    marginTop: "auto",
  },
  arrowWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
