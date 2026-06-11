import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { mondayOf } from "./teachingPlanShared";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 6 weeks × 7 days grid (Mon-first) covering the given month.
function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const back = (first.getDay() + 6) % 7; // days from Monday
  const start = new Date(year, month, 1 - back);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export function WeekCalendarPicker({
  visible,
  initialWeekStart,
  takenWeekStarts,
  onSelect,
  onClose,
}: {
  visible: boolean;
  initialWeekStart: string;
  takenWeekStarts: Set<string>;
  onSelect: (weekStart: string) => void;
  onClose: () => void;
}) {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(initialWeekStart) ? new Date(`${initialWeekStart}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState({ year: base.getFullYear(), month: base.getMonth() });

  const grid = buildGrid(cursor.year, cursor.month);

  function shiftMonth(delta: number) {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.sheet} onPress={() => {}}>
          <View style={s.headerRow}>
            <AnimatedPressable style={s.navBtn} onPress={() => shiftMonth(-1)}>
              <Ionicons name="chevron-back" size={18} color={D.onSurface} />
            </AnimatedPressable>
            <Text style={s.monthTitle}>{MONTHS[cursor.month]} {cursor.year}</Text>
            <AnimatedPressable style={s.navBtn} onPress={() => shiftMonth(1)}>
              <Ionicons name="chevron-forward" size={18} color={D.onSurface} />
            </AnimatedPressable>
          </View>

          <Text style={s.hint}>Tap any day — the whole week (Mon–Sat) is selected.</Text>

          <View style={s.weekHeader}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={s.weekHeaderText}>{label}</Text>
            ))}
          </View>

          {Array.from({ length: 6 }, (_, w) => {
            const weekDays = grid.slice(w * 7, w * 7 + 7);
            const weekMonday = toValue(weekDays[0]!);
            const taken = takenWeekStarts.has(weekMonday);
            const selected = weekMonday === initialWeekStart;
            return (
              <Pressable
                key={weekMonday}
                disabled={taken}
                onPress={() => {
                  onSelect(mondayOf(weekMonday));
                  onClose();
                }}
                style={[s.weekRow, selected && s.weekRowSelected, taken && s.weekRowTaken]}
              >
                {weekDays.map((day, di) => {
                  const inMonth = day.getMonth() === cursor.month;
                  const isSunday = di === 6;
                  return (
                    <View key={di} style={s.dayCell}>
                      <Text
                        style={[
                          s.dayText,
                          !inMonth && s.dayMuted,
                          isSunday && s.daySunday,
                          selected && s.dayTextSelected,
                          taken && s.dayTextTaken,
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                      {taken && di === 0 ? <View style={s.takenDot} /> : null}
                    </View>
                  );
                })}
              </Pressable>
            );
          })}

          <View style={s.legendRow}>
            <View style={s.takenDot} />
            <Text style={s.legendText}>Already has a plan</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 18, paddingHorizontal: 16, paddingBottom: 36 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  navBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surfaceLow, alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: 15, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
  hint: { fontSize: 11.5, fontFamily: D.font, color: D.outline, textAlign: "center", marginBottom: 12 },
  weekHeader: { flexDirection: "row", marginBottom: 4 },
  weekHeaderText: { flex: 1, textAlign: "center", fontSize: 10.5, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.2 },
  weekRow: { flexDirection: "row", borderRadius: 12, paddingVertical: 4, marginVertical: 1, borderWidth: 1, borderColor: "transparent" },
  weekRowSelected: { backgroundColor: D.surfaceLow, borderColor: D.primary },
  weekRowTaken: { opacity: 0.45 },
  dayCell: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 7 },
  dayText: { fontSize: 13, fontFamily: D.fontSemiBold, color: D.onSurface },
  dayMuted: { color: D.outlineVariant },
  daySunday: { color: D.outline },
  dayTextSelected: { color: D.primary, fontFamily: D.fontExtraBold },
  dayTextTaken: { color: D.outline },
  takenDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: D.leave, marginTop: 2 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, justifyContent: "center" },
  legendText: { fontSize: 11, fontFamily: D.font, color: D.outline },
});
