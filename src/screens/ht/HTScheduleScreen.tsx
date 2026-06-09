import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const slots = [
  { time: "8:00 AM", subject: "Physics · Optics", batch: "NEET 11-B", hall: "Hall C", color: "#6366F1", bg: "#EEF2FF" },
  { time: "10:00 AM", subject: "Chemistry · Equilibrium", batch: "NEET 11-A", hall: "Hall D", color: "#0EA5E9", bg: "#F0F9FF" },
  { time: "12:30 PM", subject: "Biology · Cell Division", batch: "NEET 12-A", hall: "Hall B", color: "#10B981", bg: "#F0FDF4" },
  { time: "2:00 PM", subject: null, batch: null, hall: null, color: D.outlineVariant, bg: D.surface },
];

const exams = [
  { date: "Jun 11", subject: "Physics", name: "Physics Unit Test", batch: "NEET 11-B", days: 2, color: "#6366F1", bg: "#EEF2FF" },
  { date: "Jun 13", subject: "Chemistry", name: "Chemistry Mock #4", batch: "NEET 11-A", days: 4, color: "#0EA5E9", bg: "#F0F9FF" },
  { date: "Jun 17", subject: "Biology", name: "Biology Mid-term", batch: "NEET 12-A", days: 8, color: "#10B981", bg: "#F0FDF4" },
  { date: "Jun 20", subject: "Physics", name: "Electrostatics Test", batch: "NEET 12-A", days: 11, color: "#6366F1", bg: "#EEF2FF" },
  { date: "Jun 24", subject: "Chemistry", name: "Organic Chemistry Final", batch: "NEET 11-B", days: 15, color: "#0EA5E9", bg: "#F0F9FF" },
];

export function HTScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Other</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Schedule</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Segmented control */}
        <View style={s.segControl}>
          {["Timetable", "Exam Schedule"].map((t, i) => (
            <AnimatedPressable key={t} style={[s.segBtn, i === activeTab && s.segBtnActive]} onPress={() => setActiveTab(i)}>
              <Text style={[s.segText, { color: i === activeTab ? D.primary : D.onSurfaceVariant }]}>{t}</Text>
            </AnimatedPressable>
          ))}
        </View>

        {activeTab === 0 && (
          <>
            {/* Day chips */}
            <View style={{ flexDirection: "row", gap: 7, marginBottom: 18 }}>
              {days.map((d) => {
                const active = d === "Wed";
                return (
                  <View key={d} style={[s.dayChip, { backgroundColor: active ? D.primary : D.surface, borderColor: active ? D.primary : D.outlineVariant }]}>
                    <Text style={[s.dayText, { color: active ? "#fff" : D.onSurfaceVariant }]}>{d}</Text>
                  </View>
                );
              })}
            </View>

            <Text style={s.sectionLabel}>WEDNESDAY · JUN 11</Text>
            <View style={s.card}>
              {slots.map((sl, i) => (
                <View key={sl.time} style={[s.slotRow, i < slots.length - 1 && s.divider, i === 0 && { backgroundColor: "#FFFBF0" }]}>
                  <Text style={s.slotTime}>{sl.time}</Text>
                  <View style={[s.accentLine, { backgroundColor: sl.color }]} />
                  {sl.subject ? (
                    <>
                      <View style={{ flex: 1 }}>
                        <Text style={s.slotSubject}>{sl.subject}</Text>
                        <Text style={s.slotMeta}>{sl.batch} · {sl.hall}</Text>
                      </View>
                      <View style={[s.editBtn, { backgroundColor: sl.bg }]}>
                        <Text style={[s.editText, { color: sl.color }]}>Edit</Text>
                      </View>
                    </>
                  ) : (
                    <Text style={s.freeSlot}>Free slot</Text>
                  )}
                </View>
              ))}
            </View>

            <View style={s.infoBanner}>
              <Ionicons name="information-circle-outline" size={16} color={D.primary} />
              <Text style={s.infoText}>Editing a slot will notify all students in the batch.</Text>
            </View>
          </>
        )}

        {activeTab === 1 && (
          <>
            <Text style={s.sectionLabel}>UPCOMING · 5 EXAMS</Text>
            <View style={s.card}>
              {exams.map((e, i) => {
                const [mon, day] = e.date.split(" ");
                return (
                  <View key={i} style={[s.examRow, i < exams.length - 1 && s.divider]}>
                    <View style={[s.datePill, { backgroundColor: e.bg, borderColor: e.color + "22" }]}>
                      <Text style={[s.datePillMon, { color: e.color }]}>{mon}</Text>
                      <Text style={[s.datePillDay, { color: e.color }]}>{day}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={[s.subjBadge, { backgroundColor: e.bg }]}>
                        <Text style={[s.subjBadgeText, { color: e.color }]}>{e.subject}</Text>
                      </View>
                      <Text style={s.examName}>{e.name}</Text>
                      <Text style={s.examBatch}>{e.batch}</Text>
                    </View>
                    <Text style={[s.daysLeft, { color: e.days <= 3 ? "#B45309" : D.outline }]}>in {e.days}d</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 10, backgroundColor: D.bg },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingRight: 10, paddingLeft: 6, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, height: 38 },
  backText: { fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  headerTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  segControl: { flexDirection: "row", padding: 3, borderRadius: 14, backgroundColor: D.surfaceLow, marginBottom: 16 },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: "center" },
  segBtnActive: { backgroundColor: D.surface, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: -0.1 },
  dayChip: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: "center", borderWidth: 1 },
  dayText: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  slotRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15, backgroundColor: D.surface },
  slotTime: { width: 58, fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: -0.1, textAlign: "right", flexShrink: 0 },
  accentLine: { width: 3, height: 40, borderRadius: 2, flexShrink: 0 },
  slotSubject: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  slotMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 2 },
  editBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  editText: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold },
  freeSlot: { flex: 1, fontSize: 13, fontFamily: D.font, color: D.outline, fontStyle: "italic" },
  infoBanner: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14, padding: 14, borderRadius: 16, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh },
  infoText: { flex: 1, fontSize: 12, fontWeight: "500", fontFamily: D.fontMedium, color: D.primary },
  examRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  datePill: { width: 44, borderRadius: 12, borderWidth: 1, paddingVertical: 5, alignItems: "center" },
  datePillMon: { fontSize: 9, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.4, textTransform: "uppercase" },
  datePillDay: { fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, letterSpacing: -0.4, lineHeight: 20 },
  subjBadge: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, marginBottom: 4 },
  subjBadgeText: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold },
  examName: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  examBatch: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 1 },
  daysLeft: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, flexShrink: 0 },
});
