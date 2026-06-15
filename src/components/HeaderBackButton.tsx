import { StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { D } from "./theme";
import { AnimatedPressable } from "./motion";
import { navigateBack } from "../lib/navigation";

// Back chevron for pushed sub-pages. Renders nothing when there's nothing to go
// back to (e.g. when the screen is the root of a tab), so the same screen can be
// safely reused as both a tab root and a pushed page.
export function HeaderBackButton({ style }: { style?: object }) {
  if (!router.canGoBack()) return null;
  return (
    <AnimatedPressable style={[s.btn, style]} onPress={() => navigateBack(router)}>
      <Ionicons name="chevron-back" size={22} color={D.onSurface} />
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    marginRight: 10,
  },
});
