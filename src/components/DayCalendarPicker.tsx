import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { D } from "./theme";
import { AnimatedPressable } from "./motion";

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

// 6 weeks x 7 days (Mon-first) covering the month.
function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const back = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - back);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export function DayCalendarPicker({
  visible,
  value,
  minDate,
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: string;
  minDate?: string; // YYYY-MM-DD; days before are disabled
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const base = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState({ year: base.getFullYear(), month: base.getMonth() });
  const todayValue = toValue(new Date());
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

          <View style={s.weekHeader}>
            {WEEKDAY_LABELS.map((label) => (
              <Text key={label} style={s.weekHeaderText}>{label}</Text>
            ))}
          </View>

          {Array.from({ length: 6 }, (_, w) => (
            <View key={w} style={s.weekRow}>
              {grid.slice(w * 7, w * 7 + 7).map((day, di) => {
                const dv = toValue(day);
                const inMonth = day.getMonth() === cursor.month;
                const selected = dv === value;
                const isToday = dv === todayValue;
                const disabled = minDate ? dv < minDate : false;
                return (
                  <Pressable
                    key={di}
                    disabled={disabled}
                    onPress={() => { onSelect(dv); onClose(); }}
                    style={[s.dayCell, selected && s.dayCellSelected]}
                  >
                    <Text
                      style={[
                        s.dayText,
                        !inMonth && s.dayMuted,
                        disabled && s.dayDisabled,
                        selected && s.dayTextSelected,
                        isToday && !selected && s.dayToday,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}

          <AnimatedPressable style={s.todayBtn} onPress={() => { onSelect(todayValue); onClose(); }}>
            <Text style={s.todayBtnText}>Today</Text>
          </AnimatedPressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 18, paddingHorizontal: 16, paddingBottom: 36 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  navBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: D.surfaceLow, alignItems: "center", justifyContent: "center" },
  monthTitle: { fontSize: 15, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
  weekHeader: { flexDirection: "row", marginBottom: 4 },
  weekHeaderText: { flex: 1, textAlign: "center", fontSize: 10.5, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.2 },
  weekRow: { flexDirection: "row", marginVertical: 1 },
  dayCell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", borderRadius: 10, margin: 1 },
  dayCellSelected: { backgroundColor: D.primary },
  dayText: { fontSize: 13.5, fontFamily: D.fontSemiBold, color: D.onSurface },
  dayMuted: { color: D.outlineVariant },
  dayDisabled: { color: D.outlineVariant },
  dayTextSelected: { color: "#fff", fontFamily: D.fontExtraBold },
  dayToday: { color: D.primary, fontFamily: D.fontExtraBold },
  todayBtn: { marginTop: 12, alignSelf: "center", paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: D.surfaceLow },
  todayBtnText: { fontSize: 12.5, fontFamily: D.fontBold, color: D.primary },
});
