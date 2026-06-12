import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, RefreshControl } from "react-native";
import { Card, EmptyCard, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING, uiStyles, D } from "../components/ui";
import { Stagger } from "../components/motion";
import { listStudentSchedules } from "../lib/erp";
import { useResource } from "../hooks/useResource";
import { useSession } from "../providers/session";
import { formatScheduleDateLabel, type ScheduleDayKey } from "../shared";
import { daysRemaining, subjectColor, subjectBgColor } from "./studentUtils";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DAY_ORDER: ScheduleDayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const DAY_LABEL: Record<ScheduleDayKey, { l: string; d: number }> = {
  monday: { l: "Mon", d: 1 },
  tuesday: { l: "Tue", d: 2 },
  wednesday: { l: "Wed", d: 3 },
  thursday: { l: "Thu", d: 4 },
  friday: { l: "Fri", d: 5 },
  saturday: { l: "Sat", d: 6 },
};

const SCOLORS: Record<string, { c: string; light: string }> = {
  Physics: { c: "#EA580C", light: "#FFEDD5" },
  Chemistry: { c: "#2563EB", light: "#DBEAFE" },
  Biology: { c: "#059669", light: "#D1FAE5" },
  Maths: { c: "#7C3AED", light: "#EDE9FE" },
};

function getSubjectColors(subjectName: string) {
  for (const key of Object.keys(SCOLORS)) {
    if (subjectName.includes(key)) return SCOLORS[key];
  }
  return { c: "#6B7280", light: "#F3F4F6" };
}

function SChip({ s }: { s: string }) {
  const t = getSubjectColors(s);
  return (
    <View style={styles.sChip}>
      <View style={[styles.sChipDot, { backgroundColor: t.c }]} />
      <Text style={[styles.sChipText, { color: t.c }]}>{s}</Text>
    </View>
  );
}

function todayDayKey(): ScheduleDayKey {
  const day = new Date().getDay();
  return DAY_ORDER[Math.max(0, Math.min(5, day - 1))] ?? "monday";
}

function useScheduleResource() {
  const { profile } = useSession();
  const resource = useResource(async () => (profile ? listStudentSchedules(profile) : null), [profile?.userId, profile?.classId]);
  return { resource };
}

export function SchedulesScreen() {
  const { resource } = useScheduleResource();
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<"timetable" | "tests">("timetable");
  const [day, setDay] = useState<ScheduleDayKey>(todayDayKey());
  const [refreshing, setRefreshing] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const reloadResource = resource.reload;
  useFocusEffect(useCallback(() => { void reloadResource(); }, [reloadResource]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reloadResource();
    } finally {
      setRefreshing(false);
    }
  }, [reloadResource]);

  const dayEntries = (resource.data?.timetableEntries ?? []).filter((entry) => entry.dayKey === day);
  const upcoming = (resource.data?.tests ?? []).filter((test) => !test.scheduleDate || test.scheduleDate >= today).sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));
  const past = (resource.data?.tests ?? []).filter((test) => test.scheduleDate && test.scheduleDate < today).sort((a, b) => b.scheduleDate.localeCompare(a.scheduleDate));

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={[styles.pageContent, { paddingTop: Math.max(insets.top + 24, 56) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={D.primary} colors={[D.primary]} />}
      >
      <View style={styles.topHeader}>
        <Pressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </Pressable>
        <Text style={styles.topTitle}>Schedule</Text>
      </View>

      <View style={styles.segmentContainer}>
        {(["timetable", "tests"] as const).map((t, i) => {
          const isSel = view === t;
          return (
            <Pressable
              key={t}
              onPress={() => setView(t)}
              style={[styles.segmentBtn, isSel && styles.segmentBtnActive]}
            >
              <Text style={[styles.segmentBtnText, isSel && styles.segmentBtnTextActive]}>
                {t === "timetable" ? "Timetable" : "Test Schedule"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {resource.loading ? (
        <LoadingCard label="Loading schedule..." />
      ) : resource.error ? (
        <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
      ) : !resource.data ? (
        <EmptyCard title="No schedule access" message="Your ERP profile is missing a class assignment." />
      ) : view === "timetable" ? (
        <>
          <View style={styles.daysRow}>
            {DAY_ORDER.map((item, i) => {
              const isSel = day === item;
              return (
                <Pressable
                  key={item}
                  onPress={() => setDay(item)}
                  style={[styles.dayCard, isSel && styles.dayCardActive]}
                >
                  <Text style={[styles.dayCardLabel, isSel && styles.dayCardLabelActive]}>
                    {DAY_LABEL[item].l}
                  </Text>
                  <Text style={[styles.dayCardNum, isSel && styles.dayCardNumActive]}>
                    {DAY_LABEL[item].d}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.sectionTitle}>
            {DAY_LABEL[day].l.toUpperCase()} · {dayEntries.length} CLASSES
          </Text>
          <View style={styles.slotsList}>
            {dayEntries.length === 0 ? (
              <Card><Text style={uiStyles.muted}>No timetable entries for this day.</Text></Card>
            ) : (
              <Stagger>
                {dayEntries.map((entry) => {
                  const subj = entry.subjectName || "General";
                  const sc = getSubjectColors(subj);
                  return (
                    <View key={entry.id} style={[styles.slotItem, { borderLeftColor: sc.c }]}>
                      <View style={styles.slotTimeCol}>
                        <Text style={styles.slotTimeText}>{entry.startTime || "--:--"}</Text>
                        <Text style={styles.slotDurText}>{entry.slotLabel || "Slot"}</Text>
                      </View>
                      <View style={styles.slotInfoCol}>
                        <View style={styles.slotInfoTop}>
                          <SChip s={subj} />
                        </View>
                        <Text style={styles.slotTopicText}>{entry.notes || "Topic pending"}</Text>
                        <View style={styles.slotMetaRow}>
                          <Text style={styles.slotMetaText}>{entry.teacherName || "Teacher pending"}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </Stagger>
            )}
          </View>
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>UPCOMING · {upcoming.length} TESTS</Text>
          <View style={styles.testsBox}>
            {upcoming.length === 0 ? (
              <View style={{ padding: 14 }}><Text style={uiStyles.muted}>No upcoming tests.</Text></View>
            ) : (
              upcoming.map((test, i) => {
                const subj = test.subjectName || "General";
                const sc = getSubjectColors(subj);
                const remaining = daysRemaining(test.scheduleDate);
                const dBadge = remaining !== null && remaining <= 2 ? { bg: "#FEE2E2", fg: "#B91C1C" } : remaining !== null && remaining <= 7 ? { bg: "#FEF3C7", fg: "#B45309" } : { bg: "#DCFCE7", fg: "#15803D" };
                return (
                  <Pressable
                    key={test.id}
                    onPress={() => router.push(`/(student)/test-schedule-detail?id=${encodeURIComponent(test.id)}`)}
                    style={[styles.testItem, i < upcoming.length - 1 && styles.testItemBorder]}
                  >
                    <View style={[styles.testColorBar, { backgroundColor: sc.c, height: 40 }]} />
                    <View style={styles.testInfo}>
                      <SChip s={subj} />
                      <Text style={styles.testNameText}>{test.assessmentTitle}</Text>
                      <Text style={styles.testDateText}>{formatScheduleDateLabel(test.scheduleDate)}</Text>
                    </View>
                    <View style={[styles.testDaysBadge, { backgroundColor: dBadge.bg }]}>
                      <Text style={[styles.testDaysVal, { color: dBadge.fg }]}>{remaining === null ? "--" : remaining}d</Text>
                      <Text style={[styles.testDaysLabel, { color: dBadge.fg }]}>left</Text>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>

          <Text style={styles.sectionTitle}>PAST TESTS</Text>
          <View style={[styles.testsBox, { opacity: 0.65 }]}>
            {past.length === 0 ? (
              <View style={{ padding: 14 }}><Text style={uiStyles.muted}>No past tests.</Text></View>
            ) : (
              past.map((test, i) => {
                const subj = test.subjectName || "General";
                const sc = getSubjectColors(subj);
                return (
                  <Pressable
                    key={test.id}
                    onPress={() => router.push(`/(student)/test-schedule-detail?id=${encodeURIComponent(test.id)}`)}
                    style={[styles.testItem, i < past.length - 1 && styles.testItemBorder]}
                  >
                    <View style={[styles.testColorBar, { backgroundColor: sc.c, height: 36 }]} />
                    <View style={styles.testInfo}>
                      <SChip s={subj} />
                      <Text style={styles.testNameText}>{test.assessmentTitle}</Text>
                      <Text style={styles.testDateText}>{formatScheduleDateLabel(test.scheduleDate)}</Text>
                    </View>
                    <Text style={styles.pastScoreText}>--/--</Text>
                  </Pressable>
                );
              })
            )}
          </View>
        </>
      )}
      </ScrollView>
    </View>
  );
}

export function StudentTestScheduleDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const { resource } = useScheduleResource();
  const insets = useSafeAreaInsets();
  const test = resource.data?.tests.find((item) => item.id === id);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.pageContent, { paddingTop: Math.max(insets.top + 24, 56) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.detailTopHeader}>
          <Pressable onPress={() => navigateBack(router)} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </Pressable>
          <Text style={styles.detailTopTitle} numberOfLines={2}>{test?.assessmentTitle || "Test Schedule"}</Text>
        </View>
        {resource.loading ? (
          <LoadingCard label="Loading test schedule..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : !test ? (
          <EmptyCard title="Test not found" message="This test schedule is not available for your class." />
        ) : (
          <View style={styles.testDetailWrap}>
            <View style={styles.infoBlock}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>SUBJECT</Text>
                <View style={{ marginTop: 3 }}><SChip s={test.subjectName || "General"} /></View>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>DATE</Text>
                <Text style={styles.infoVal}>{formatScheduleDateLabel(test.scheduleDate)}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>TIME</Text>
                <Text style={styles.infoVal}>{`${test.startTime || "Time pending"} - ${test.endTime || "End pending"}`}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>UPLOADED BY</Text>
                <Text style={styles.infoVal}>{test.teacherName || "Teacher pending"}</Text>
              </View>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailBoxTitle}>SYLLABUS / INSTRUCTIONS</Text>
              <Text style={styles.detailBoxText}>{test.notes || "No special instructions published yet."}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: D.bg },
  pageContent: { paddingHorizontal: 16, paddingBottom: MOBILE_BOTTOM_SPACING },
  topHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  detailTopHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  topTitle: { fontSize: 22, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  detailTopTitle: { flex: 1, fontSize: 17, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3, lineHeight: 22 },
  segmentContainer: {
    padding: 3,
    borderRadius: 10,
    backgroundColor: "#F5F3FF", // PURPLE_50
    flexDirection: "row",
    marginBottom: 22,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  segmentBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12.5,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    textAlign: "center",
    color: "#6B7280", // INK_2
  },
  segmentBtnTextActive: {
    color: "#6D28D9", // PURPLE
  },
  daysRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
    overflow: "hidden",
  },
  dayCard: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: D.outlineVariant,
  },
  dayCardActive: {
    backgroundColor: "#6D28D9",
    borderColor: "#6D28D9",
  },
  dayCardLabel: {
    fontSize: 10.5,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    color: D.onSurfaceVariant,
    letterSpacing: 0.3,
  },
  dayCardLabelActive: {
    color: "rgba(255,255,255,0.75)",
  },
  dayCardNum: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    color: D.onSurface,
  },
  dayCardNumActive: {
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    color: D.onSurfaceVariant,
    letterSpacing: 0.6,
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  slotsList: {
    flexDirection: "column",
    gap: 14,
  },
  slotItem: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    borderLeftWidth: 2,
  },
  slotTimeCol: {
    width: 52,
  },
  slotTimeText: {
    fontSize: 14,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    color: D.onSurface,
    letterSpacing: -0.3,
  },
  slotDurText: {
    fontSize: 10.5,
    color: D.onSurfaceVariant,
    marginTop: 3,
  },
  slotInfoCol: {
    flex: 1,
  },
  slotInfoTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 7,
  },
  sChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sChipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  sChipText: {
    fontSize: 11,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    letterSpacing: 0.2,
  },
  slotTopicText: {
    fontSize: 13.5,
    fontWeight: "500", fontFamily: D.fontMedium,
    color: D.onSurface,
    letterSpacing: -0.1,
    lineHeight: 19,
  },
  slotMetaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  slotMetaText: {
    fontSize: 11.5,
    color: D.onSurfaceVariant,
  },
  testsBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    overflow: "hidden",
    marginBottom: 22,
  },
  testItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  testItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: D.outlineVariant,
  },
  testColorBar: {
    width: 3,
    borderRadius: 2,
  },
  testInfo: {
    flex: 1,
    alignItems: "flex-start",
  },
  testNameText: {
    marginTop: 5,
    fontSize: 13.5,
    fontWeight: "500", fontFamily: D.fontMedium,
    color: D.onSurface,
    letterSpacing: -0.1,
    lineHeight: 19,
  },
  testDateText: {
    fontSize: 11.5,
    color: D.onSurfaceVariant,
    marginTop: 2,
  },
  testDaysBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    minWidth: 52,
  },
  testDaysVal: {
    fontSize: 11.5,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    letterSpacing: 0.2,
  },
  testDaysLabel: {
    fontSize: 9.5,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    opacity: 0.75,
  },
  pastScoreText: {
    fontSize: 14,
    fontWeight: "600", fontFamily: D.fontSemiBold,
    color: D.onSurface,
    letterSpacing: -0.3,
  },
  testDetailWrap: { gap: 14 },
  infoBlock: { padding: 14, backgroundColor: "#fff", borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  infoCol: { flexBasis: "40%", flexGrow: 1 },
  infoLabel: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.4, marginBottom: 3 },
  infoVal: { fontSize: 13.5, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  detailBox: { paddingVertical: 16, paddingHorizontal: 14, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: D.outlineVariant },
  detailBoxTitle: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurfaceVariant, letterSpacing: 0.5, marginBottom: 10 },
  detailBoxText: { fontSize: 13.5, color: D.onSurface, lineHeight: 22, letterSpacing: -0.1 },
});
