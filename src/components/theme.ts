import { Platform } from "react-native";

// Exact design tokens from Stitch HTML. Kept in its own module so both ui.tsx
// and motion.tsx can import without a circular dependency.
//
// Font: Android uses Plus Jakarta Sans (bundled). iOS uses the native system
// font (San Francisco) — fontFamily `undefined` makes React Native fall back to
// the system face, and the weight comes from each style's `fontWeight`. This
// keeps iOS looking native without bundling/loading the custom font there.
const ios = Platform.OS === "ios";
export const font = ios ? undefined : "PlusJakartaSans_400Regular";
export const fontMedium = ios ? undefined : "PlusJakartaSans_500Medium";
export const fontSemiBold = ios ? undefined : "PlusJakartaSans_600SemiBold";
export const fontBold = ios ? undefined : "PlusJakartaSans_700Bold";
export const fontExtraBold = ios ? undefined : "PlusJakartaSans_800ExtraBold";

export const D = {
  font,
  fontMedium,
  fontSemiBold,
  fontBold,
  fontExtraBold,
  bg: "#FAF8FF",
  surface: "#ffffff",
  surfaceContainer: "#EDE9F5",
  surfaceLow: "#F5F3FF",
  surfaceHigh: "#DDD6FE",
  primary: "#6D28D9",
  primaryBtn: "#7C3AED",
  primaryFixed: "#EDE9FE",
  onPrimary: "#ffffff",
  onSurface: "#1B1230",
  onSurfaceVariant: "#4B3E66",
  outlineVariant: "#EDE9F5",
  outline: "#8B82A1",
  success: "#10B981",
  successBg: "#dcfce7",
  successFg: "#166534",
  error: "#ba1a1a",
  errorBg: "#ffdad6",
  errorFg: "#93000a",
  leave: "#9d4300",
  leaveBg: "#ffdbca",
  warningBg: "#FEF3C7",
  warningFg: "#92400e",
  infoBg: "#F5F3FF",
  infoFg: "#7C3AED",
};
