import { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useResource } from "../hooks/useResource";
import { listStaffAttendanceForUser } from "../lib/erp";
import { D, EmptyCard, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { Animated, AnimatedPressable, CountUp, FadeIn } from "../components/motion";
import { Ionicons } from "@expo/vector-icons";
import type { StaffAttendanceRecord } from "../lib/erp";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_SHORT = ["SUN","MON","TUE","WED","THU","FRI","SAT"];

function AttendanceCalendar({ records, year, month, onPrevMonth, onNextMonth }: {
  records: StaffAttendanceRecord[];
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const now = new Date();

  const statusMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of records) map.set(r.attendanceDate, r.status);
    return map;
  }, [records]);

  const cells = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDow = new Date(year, month, 1).getDay();
    const prevDays = new Date(year, month, 0).getDate();
    const arr: { d: number; inMonth: boolean; dateStr: string }[] = [];
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevDays - i;
      const pm = month === 0 ? 12 : month;
      const py = month === 0 ? year - 1 : year;
      arr.push({ d, inMonth: false, dateStr: `${py}-${String(pm).padStart(2,"0")}-${String(d).padStart(2,"0")}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push({ d, inMonth: true, dateStr: `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}` });
    }
    const tail = arr.length % 7 === 0 ? 0 : 7 - (arr.length % 7);
    for (let d = 1; d <= tail; d++) {
      const nm = month === 11 ? 1 : month + 2;
      const ny = month === 11 ? year + 1 : year;
      arr.push({ d, inMonth: false, dateStr: `${ny}-${String(nm).padStart(2,"0")}-${String(d).padStart(2,"0")}` });
    }
    return arr;
  }, [year, month]);

  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const rows: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  function cellBg(status: string | undefined, inMonth: boolean) {
    if (!inMonth || !status) return "transparent";
    if (status === "present") return D.successBg;
    if (status === "absent") return D.errorBg;
    if (status === "leave") return "#fef3c7";
    return "transparent";
  }
  function statusColor(status: string | undefined) {
    if (status === "present") return D.success;
    if (status === "absent") return D.error;
    if (status === "leave") return "#EAB308";
    return D.onSurface;
  }

  return (
    <View style={cal.container}>
      <View style={cal.navRow}>
        <AnimatedPressable onPress={onPrevMonth} style={cal.navBtn}><Text style={cal.navArrow}>‹</Text></AnimatedPressable>
        <Text style={cal.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
        <AnimatedPressable onPress={onNextMonth} style={cal.navBtn}><Text style={cal.navArrow}>›</Text></AnimatedPressable>
      </View>
      <View style={cal.dayHeaders}>
        {DAY_SHORT.map((d) => <Text key={d} style={cal.dayHeader}>{d}</Text>)}
      </View>
      <View style={{ gap: 4 }}>
        {rows.map((row, ri) => (
          <View key={ri} style={cal.row}>
            {row.map((cell) => {
              const status = cell.inMonth ? statusMap.get(cell.dateStr) : undefined;
              const isToday = cell.dateStr === todayStr;
              return (
                <View key={cell.dateStr} style={[cal.cell, { backgroundColor: cellBg(status, cell.inMonth) }, isToday && cal.cellToday]}>
                  <Text style={[
                    cal.cellDate,
                    !cell.inMonth && cal.cellDateOther,
                    status && cell.inMonth && { color: statusColor(status), fontWeight: "700" },
                    isToday && cal.cellDateToday,
                  ]}>{cell.d}</Text>
                  {status && cell.inMonth && (
                    <View style={[cal.cellDot, { backgroundColor: statusColor(status) }]} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <View style={cal.legend}>
        {[
          { color: D.success, bg: D.successBg, label: "Present" },
          { color: D.error, bg: D.errorBg, label: "Absent" },
          { color: "#EAB308", bg: "#fef3c7", label: "Leave" },
        ].map((l) => (
          <View key={l.label} style={cal.legendItem}>
            <View style={[cal.legendDot, { backgroundColor: l.bg, borderColor: l.color + "60" }]} />
            <Text style={cal.legendText}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

type Props = {
  userId: string;
  name: string;
  teacherId: string;
  className: string;
  centreName: string;
};

export function StaffDetailScreen({ userId, name, teacherId, className, centreName }: Props) {
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const attendanceResource = useResource(() => listStaffAttendanceForUser(userId), [userId]);

  const prevCalMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  };
  const nextCalMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
  };

  const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
  const present = (attendanceResource.data ?? []).filter((r) => r.attendanceDate.startsWith(monthStr) && r.status === "present").length;
  const absent = (attendanceResource.data ?? []).filter((r) => r.attendanceDate.startsWith(monthStr) && r.status === "absent").length;
  const leave = (attendanceResource.data ?? []).filter((r) => r.attendanceDate.startsWith(monthStr) && r.status === "leave").length;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <AnimatedPressable onPress={() => navigateBack(router)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.headerName} numberOfLines={1}>{name}</Text>
          <View style={styles.headerMeta}>
            {teacherId ? <Text style={styles.headerMetaItem}>{teacherId}</Text> : null}
            {className ? <><Text style={styles.headerMetaDot}>·</Text><Text style={styles.headerMetaItem}>{className}</Text></> : null}
            {centreName ? <><Text style={styles.headerMetaDot}>·</Text><Text style={styles.headerMetaItem}>{centreName}</Text></> : null}
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeIn.duration(240)} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>
          {attendanceResource.loading ? (
            <LoadingCard label="Loading attendance..." />
          ) : attendanceResource.error ? (
            <ErrorCard message={attendanceResource.error} onRetry={() => void attendanceResource.reload()} />
          ) : !attendanceResource.data || attendanceResource.data.length === 0 ? (
            <EmptyCard title="No attendance records" message="No attendance records for this staff member." />
          ) : (
            <>
              <View style={styles.statRow}>
                <View style={[styles.statBox, { backgroundColor: "#f0fdf4" }]}>
                  <CountUp value={present} style={[styles.statValue, { color: "#16a34a" }]} />
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: "#fef2f2" }]}>
                  <CountUp value={absent} style={[styles.statValue, { color: "#dc2626" }]} />
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: "#fffbeb" }]}>
                  <CountUp value={leave} style={[styles.statValue, { color: "#d97706" }]} />
                  <Text style={styles.statLabel}>Leave</Text>
                </View>
              </View>
              <AttendanceCalendar
                records={attendanceResource.data}
                year={calYear}
                month={calMonth}
                onPrevMonth={prevCalMonth}
                onNextMonth={nextCalMonth}
              />
            </>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const cal = StyleSheet.create({
  container: { backgroundColor: D.surface, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: D.outlineVariant, gap: 8 },
  navRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center", backgroundColor: D.surfaceLow, borderRadius: 8 },
  navArrow: { fontSize: 17, color: D.primary, fontWeight: "700", lineHeight: 20 },
  monthLabel: { fontSize: 14, fontFamily: D.fontBold, color: D.onSurface },
  dayHeaders: { flexDirection: "row", paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  dayHeader: { flex: 1, textAlign: "center", fontSize: 9, fontFamily: D.fontSemiBold, color: D.outline },
  row: { flexDirection: "row", gap: 2 },
  cell: { flex: 1, aspectRatio: 1, borderRadius: 6, alignItems: "center", justifyContent: "center", gap: 1 },
  cellToday: { borderWidth: 2, borderColor: D.primaryBtn },
  cellDate: { fontSize: 11, fontFamily: D.fontMedium, color: D.onSurface, textAlign: "center" },
  cellDateOther: { color: D.outlineVariant, fontWeight: "400" },
  cellDateToday: { color: D.primaryBtn, fontWeight: "800" },
  cellDot: { width: 3, height: 3, borderRadius: 2 },
  legend: { flexDirection: "row", gap: 10, paddingTop: 4, borderTopWidth: 1, borderTopColor: D.outlineVariant },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 3, borderWidth: 1 },
  legendText: { fontSize: 10, color: D.onSurfaceVariant, fontFamily: D.fontMedium },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: D.bg },

  header: {
    flexDirection: "row", alignItems: "center",
    gap: 12, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: D.outlineVariant,
    backgroundColor: D.bg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  headerName: { fontSize: 15, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  headerMeta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4 },
  headerMetaItem: { fontSize: 11, color: D.onSurfaceVariant, fontFamily: D.font },
  headerMetaDot: { fontSize: 11, color: D.outline },

  content: { padding: 16, gap: 14, paddingBottom: MOBILE_BOTTOM_SPACING },
  statRow: { flexDirection: "row", gap: 8 },
  statBox: { flex: 1, borderRadius: 10, padding: 12, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontFamily: D.fontBold },
  statLabel: { fontSize: 11, color: D.onSurfaceVariant, fontFamily: D.font },
});
