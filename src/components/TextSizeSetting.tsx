import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { D } from "./ui";
import { AnimatedPressable } from "./motion";
import { FONT_SCALE_OPTIONS, useFontScale } from "../lib/fontScale";

// Drop-in card for the account page. Switches global text size live.
export function TextSizeSetting() {
  const { scale, setScale } = useFontScale();
  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={s.iconWrap}>
          <Ionicons name="text-outline" size={18} color={D.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.title}>Text Size</Text>
          <Text style={s.sub}>Adjust font size across the app</Text>
        </View>
      </View>

      <View style={s.row}>
        {FONT_SCALE_OPTIONS.map((o) => {
          const active = Math.abs(o.value - scale) < 0.001;
          return (
            <AnimatedPressable
              key={o.label}
              onPress={() => setScale(o.value)}
              style={[s.opt, active && s.optActive]}
            >
              <Text style={[s.optText, active && s.optTextActive]}>{o.label}</Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: D.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    padding: 16,
    gap: 14,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 5,
    elevation: 1,
  },
  head: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: D.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 15, fontFamily: D.fontSemiBold, color: D.onSurface },
  sub: { fontSize: 12, color: D.onSurfaceVariant, lineHeight: 17, fontFamily: D.font },

  row: { flexDirection: "row", gap: 8 },
  opt: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: D.surfaceLow,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  optActive: { backgroundColor: D.primaryFixed, borderColor: D.primaryBtn },
  optText: { fontSize: 12.5, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  optTextActive: { color: D.primary, fontFamily: D.fontBold },
});
