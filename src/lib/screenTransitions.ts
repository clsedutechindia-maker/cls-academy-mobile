import type { ComponentProps } from "react";
import type { Stack } from "expo-router";

/**
 * Shared stack screen options. Every nested role/auth stack uses this so screen
 * pushes slide in consistently on iOS, Android and web — matching the root
 * stack's `slide_from_right` instead of falling back to per-platform defaults.
 *
 * `satisfies` keeps the `animation` string literal intact (a bare const would
 * widen it to `string` and stop satisfying the native-stack option union).
 */
export const stackScreenOptions = {
  headerShown: false,
  animation: "slide_from_right",
  animationDuration: 220,
  gestureEnabled: true,
} satisfies ComponentProps<typeof Stack>["screenOptions"];
