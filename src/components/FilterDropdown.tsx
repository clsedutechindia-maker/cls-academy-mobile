import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { D } from "./theme";
import { AnimatedPressable } from "./motion";

export type FilterOption<T extends string> = { key: T; label: string; count?: number };

// Compact filter trigger + popover list. Replaces horizontal chip rows that
// run offscreen (and don't scroll well on web). Single-select.
export function FilterDropdown<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: FilterOption<T>[];
  value: T;
  onChange: (key: T) => void;
  style?: object;
}) {
  const [open, setOpen] = useState(false);
  const active = options.find((o) => o.key === value) ?? options[0];

  return (
    <>
      <AnimatedPressable style={[s.trigger, style]} onPress={() => setOpen(true)}>
        <Ionicons name="funnel-outline" size={14} color={D.primary} />
        <Text style={s.triggerText} numberOfLines={1}>
          {active?.label}
          {active?.count != null ? ` · ${active.count}` : ""}
        </Text>
        <Ionicons name="chevron-down" size={16} color={D.onSurfaceVariant} />
      </AnimatedPressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={s.sheetTitle}>Filter</Text>
            {options.map((o) => {
              const sel = o.key === value;
              return (
                <AnimatedPressable
                  key={o.key}
                  style={[s.item, sel && s.itemActive]}
                  onPress={() => {
                    onChange(o.key);
                    setOpen(false);
                  }}
                >
                  <Text style={[s.itemLabel, sel && s.itemLabelActive]} numberOfLines={1}>
                    {o.label}
                  </Text>
                  {o.count != null && (
                    <Text style={[s.itemCount, sel && s.itemLabelActive]}>{o.count}</Text>
                  )}
                  {sel && <Ionicons name="checkmark" size={16} color={D.primary} />}
                </AnimatedPressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.outlineVariant,
  },
  triggerText: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, maxWidth: 220 },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(20,12,40,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  sheet: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: D.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 2,
  },
  sheetTitle: {
    fontSize: 11,
    fontFamily: D.fontBold,
    color: D.outline,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  itemActive: { backgroundColor: D.surfaceLow },
  itemLabel: { flex: 1, fontSize: 14, fontFamily: D.fontMedium, color: D.onSurface },
  itemLabelActive: { fontFamily: D.fontBold, color: D.primary },
  itemCount: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurfaceVariant },
});
