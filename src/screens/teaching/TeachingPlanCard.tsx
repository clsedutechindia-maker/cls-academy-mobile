import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import type { TeachingPlanRecord } from "../../shared";
import { STATUS_META, formatWeekRange } from "./teachingPlanShared";

export function TeachingPlanCard({
  plan,
  onPress,
  showSubject = true,
}: {
  plan: TeachingPlanRecord;
  onPress: () => void;
  showSubject?: boolean;
}) {
  const status = STATUS_META[plan.status];
  return (
    <AnimatedPressable style={s.card} onPress={onPress}>
      <View style={{ flex: 1, gap: 4 }}>
        {showSubject ? <Text style={s.subject}>{plan.subjectName || "Subject"}</Text> : null}
        <Text style={s.title} numberOfLines={1}>{plan.unitName || "Weekly Plan"}</Text>
        <Text style={s.meta} numberOfLines={1}>
          {plan.className} · {formatWeekRange(plan.weekStartDate, plan.weekEndDate)}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 8 }}>
        <View style={[s.pill, { backgroundColor: status.bg }]}>
          <Text style={[s.pillText, { color: status.fg }]}>{status.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={D.outline} />
      </View>
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: D.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    padding: 14,
    marginBottom: 10,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  subject: { fontSize: 9.5, fontFamily: D.fontBold, color: D.primary, letterSpacing: 0.5, textTransform: "uppercase" },
  title: { fontSize: 13.5, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  meta: { fontSize: 11.5, fontFamily: D.font, color: D.outline },
  pill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  pillText: { fontSize: 10, fontFamily: D.fontBold, letterSpacing: 0.2 },
});
