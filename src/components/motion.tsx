import { useEffect, useState, Children, isValidElement } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import type { PressableProps, StyleProp, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { AnimatedStyle } from "react-native-reanimated";
import type { ReactNode } from "react";
import { D } from "./theme";

/**
 * Shared motion primitives. Keeps screens declarative — one home for press
 * feedback, staggered entrances, shimmer skeletons and animated counters.
 */

// ---------------------------------------------------------------------------
// Press feedback
// ---------------------------------------------------------------------------

const SPRING = { damping: 18, stiffness: 280, mass: 0.6 };

type AnimatedPressableProps = Omit<PressableProps, "style"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Scale target while pressed. Lower = punchier. */
  scaleTo?: number;
  /** Opacity while pressed. */
  pressedOpacity?: number;
  entering?: any;
  exiting?: any;
  layout?: any;
};

/** The single press-feedback primitive: spring scale + opacity dip. */
export function AnimatedPressable({
  children,
  style,
  scaleTo = 0.96,
  pressedOpacity = 0.9,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressableBase
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) {
          scale.value = withSpring(scaleTo, SPRING);
          opacity.value = withTiming(pressedOpacity, { duration: 90 });
        }
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        opacity.value = withTiming(1, { duration: 140 });
        onPressOut?.(e);
      }}
      style={[style, animStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressableBase>
  );
}

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

// ---------------------------------------------------------------------------
// Entrance helpers
// ---------------------------------------------------------------------------

/** Cap the cascade so long lists don't wait seconds for the tail to appear. */
const MAX_STAGGER_STEPS = 8;

/** Configured fade-in-up entrance for the i-th item in a sequence. */
export function enter(i = 0, step = 55, base = 0) {
  const delay = base + Math.min(i, MAX_STAGGER_STEPS) * step;
  return FadeInDown.duration(360).delay(delay).springify().damping(18);
}

/** Plain fade with optional delay — for content that shouldn't slide. */
export function fade(delay = 0, duration = 280) {
  return FadeIn.duration(duration).delay(delay);
}

/**
 * Wrap a list of children so each cascades in on mount. Each child is wrapped
 * in an Animated.View — fine for full-width blocks (cards / rows).
 */
export function Stagger({
  children,
  step = 55,
  base = 0,
  style,
}: {
  children: ReactNode;
  step?: number;
  base?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <>
      {items.map((child, i) => (
        <Animated.View key={i} entering={enter(i, step, base)} style={style}>
          {child}
        </Animated.View>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loaders (shimmer sweep)
// ---------------------------------------------------------------------------

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function Skeleton({
  width = "100%",
  height = 14,
  radius = 8,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [w, setW] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1150, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const sweep = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-w, w]) }],
  }));

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[{ width, height, borderRadius: radius, backgroundColor: D.surfaceHigh, overflow: "hidden" }, style]}
    >
      {w > 0 ? (
        <AnimatedLinearGradient
          colors={["transparent", "rgba(255,255,255,0.7)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { width: w }, sweep]}
        />
      ) : null}
    </View>
  );
}

/** A card-shaped skeleton: optional avatar + two text lines. */
export function SkeletonCard({ avatar = false }: { avatar?: boolean }) {
  return (
    <View style={mStyles.skelCard}>
      {avatar ? <Skeleton width={40} height={40} radius={20} /> : null}
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="90%" height={11} />
      </View>
    </View>
  );
}

/** A list of skeleton rows inside a single card — drop-in for LoadingCard. */
export function SkeletonList({ rows = 4, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <View style={mStyles.skelList}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={[mStyles.skelRow, i < rows - 1 && mStyles.skelRowBorder]}>
          {avatar ? <Skeleton width={40} height={40} radius={20} /> : null}
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width={i % 2 === 0 ? "55%" : "70%"} height={14} />
            <Skeleton width="85%" height={11} />
          </View>
          <Skeleton width={56} height={22} radius={11} />
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Looping pulse — for "all clear" / empty-state icons
// ---------------------------------------------------------------------------

export function Pulse({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const v = useSharedValue(1);
  useEffect(() => {
    v.value = withRepeat(withTiming(1.08, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [v]);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: v.value }] }));
  return <Animated.View style={[style, animStyle]}>{children}</Animated.View>;
}

// ---------------------------------------------------------------------------
// CountUp — JS-driven (reliable, no worklet text plumbing)
// ---------------------------------------------------------------------------

export function CountUp({
  value,
  duration = 900,
  style,
  suffix = "",
  prefix = "",
}: {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
  suffix?: string;
  prefix?: string;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <Text style={style}>
      {prefix}
      {display}
      {suffix}
    </Text>
  );
}

// Re-export the configured Animated namespace + common entrances so screens
// import motion in one place.
export { Animated };
export { FadeIn, FadeInDown, FadeInUp, FadeOut, SlideInRight } from "react-native-reanimated";
export type { AnimatedStyle };

const mStyles = StyleSheet.create({
  skelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: D.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: D.outlineVariant + "50",
  },
  skelList: {
    backgroundColor: D.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: D.outlineVariant + "50",
  },
  skelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  skelRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: D.surfaceHigh,
  },
});
