import React from "react";
import { Text as RNText, TextInput as RNTextInput, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Live, app-wide text-size scaling WITHOUT editing every screen.
//
// The design system bakes explicit `fontSize` into module-level
// StyleSheet.create across ~40 screens, so a token swap can't reflow them.
// Instead we monkey-patch RN's Text/TextInput render once: it reads a global
// scale from an external store and multiplies the resolved fontSize. Because
// every Text subscribes to the store, changing the scale re-renders all text
// instantly — no remount, no per-screen changes.

const KEY = "@cls/fontScale";

export const FONT_SCALE_OPTIONS = [
  { label: "Small", value: 0.9 },
  { label: "Default", value: 1.0 },
  { label: "Large", value: 1.15 },
  { label: "XL", value: 1.3 },
] as const;

// Ship a larger default app-wide (= the "Large" preset). Users can still override
// via the font-size setting; a saved preference wins over this baseline.
let currentScale = 1.15;
const listeners = new Set<() => void>();

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const getSnapshot = () => currentScale;

function setScaleInternal(s: number) {
  if (s === currentScale) return;
  currentScale = s;
  listeners.forEach((l) => l());
}

export function setFontScale(s: number) {
  setScaleInternal(s);
  AsyncStorage.setItem(KEY, String(s)).catch(() => {});
}

// Hydrate persisted choice. Call once at app start (fire-and-forget).
export async function loadFontScale() {
  try {
    const v = await AsyncStorage.getItem(KEY);
    const n = v ? parseFloat(v) : NaN;
    if (!Number.isNaN(n) && n > 0) setScaleInternal(n);
  } catch {
    // ignore — default scale stays
  }
}

export function useFontScale() {
  const scale = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { scale, setScale: setFontScale };
}

let installed = false;

// Patch a forwardRef text component so its rendered fontSize is scaled live.
function patch(Comp: any) {
  const orig = Comp?.render;
  if (typeof orig !== "function" || orig.__clsScaled) return;
  function patchedRender(props: any, ref: any) {
    // Subscribe so this element re-renders whenever the scale changes.
    const scale = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    const element = orig(props, ref);
    if (scale === 1 || !element || !React.isValidElement(element)) return element;
    const flat = StyleSheet.flatten((element.props as any)?.style) || {};
    const fs = (flat as any).fontSize;
    if (typeof fs !== "number") return element;
    return React.cloneElement(element, {
      style: [(element.props as any).style, { fontSize: fs * scale }],
    } as any);
  }
  patchedRender.__clsScaled = true;
  Comp.render = patchedRender;
}

// Install the global patch once, before any screen renders.
export function installGlobalFontScaling() {
  if (installed) return;
  installed = true;
  patch(RNText as any);
  patch(RNTextInput as any);
}
