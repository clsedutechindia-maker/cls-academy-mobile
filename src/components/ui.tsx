import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewProps,
  type TextInputProps,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { PropsWithChildren, ReactNode } from "react";
import { D } from "./theme";
import { AnimatedPressable, SkeletonList } from "./motion";

export { D };
export const MOBILE_BOTTOM_SPACING = 156;

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// Avatar color palette cycling
const AVATAR_PALETTE = [
  { bg: "#e2dfff", fg: "#3525cd" },
  { bg: "#f0dbff", fg: "#4b0083" },
  { bg: "#ffdbca", fg: "#9d4300" },
  { bg: "#ffdad6", fg: "#ba1a1a" },
  { bg: "#dae2fc", fg: "#1e00a9" },
  { bg: "#dcfce7", fg: "#166534" },
  { bg: "#fce7f3", fg: "#9d174d" },
];

export function AvatarCircle({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  const palette = AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0]!;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: palette.bg,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Text style={{ fontSize: size * 0.36, fontWeight: "700", color: palette.fg }}>{initials}</Text>
    </View>
  );
}

export function Screen({
  title,
  subtitle,
  children,
  scrollProps,
  headerRight,
}: PropsWithChildren<{
  title?: string;
  subtitle?: string;
  scrollProps?: ScrollViewProps;
  headerRight?: ReactNode;
}>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.screenContent} {...scrollProps}>
        {title || subtitle || headerRight ? (
          <Animated.View entering={FadeInDown.duration(340).springify().damping(18)} style={styles.header}>
            <View style={{ flex: 1, gap: 4 }}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {headerRight}
          </Animated.View>
        ) : null}
        <Animated.View entering={FadeIn.duration(300).delay(80)} style={styles.body}>
          {children}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({
  title,
  subtitle,
  children,
  right,
}: PropsWithChildren<{ title?: string; subtitle?: string; right?: ReactNode }>) {
  return (
    <View style={styles.card}>
      {title || subtitle || right ? (
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
            {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor={D.outline} style={styles.field} {...props} />;
}

export function Label({ children }: PropsWithChildren) {
  return <Text style={styles.label}>{children}</Text>;
}

export function ActionButton({
  label,
  onPress,
  disabled,
  tone = "primary",
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "danger";
}) {
  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        tone === "secondary"
          ? styles.buttonSecondary
          : tone === "danger"
            ? styles.buttonDanger
            : styles.buttonPrimary,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={tone === "secondary" ? styles.buttonTextSecondary : styles.buttonTextPrimary}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function Pill({ label, tone = "info" }: { label: string; tone?: "info" | "success" | "warning" | "danger" }) {
  type ToneStyle = { bg: string; fg: string; dot: string };
  const toneMap: Record<string, ToneStyle> = {
    success: { bg: "#dcfce7", fg: "#166534", dot: D.success },
    warning: { bg: D.leaveBg, fg: D.leave, dot: D.leave },
    danger: { bg: D.errorBg, fg: D.errorFg, dot: D.error },
    info: { bg: D.primaryFixed, fg: D.primaryBtn, dot: D.primaryBtn },
  };
  const t = toneMap[tone] ?? toneMap.info!;
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      style={[styles.pill, { backgroundColor: t.bg, borderColor: t.dot + "33" }]}
    >
      <View style={[styles.pillDot, { backgroundColor: t.dot }]} />
      <Text style={[styles.pillText, { color: t.fg }]}>{label}</Text>
    </Animated.View>
  );
}

export function LoadingCard({
  label = "Loading...",
  variant = "skeleton",
  rows = 4,
  avatar = true,
}: {
  label?: string;
  variant?: "skeleton" | "spinner";
  rows?: number;
  avatar?: boolean;
}) {
  if (variant === "spinner") {
    return (
      <Card>
        <View style={styles.centerRow}>
          <ActivityIndicator color={D.primaryBtn} />
          <Text style={styles.muted}>{label}</Text>
        </View>
      </Card>
    );
  }
  return <SkeletonList rows={rows} avatar={avatar} />;
}

export function EmptyCard({ title, message }: { title: string; message: string }) {
  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Card title={title}>
        <Text style={styles.muted}>{message}</Text>
      </Card>
    </Animated.View>
  );
}

export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Card title="Something went wrong">
        <Text style={styles.errorText}>{message}</Text>
        {onRetry ? <ActionButton label="Try Again" onPress={onRetry} tone="secondary" /> : null}
      </Card>
    </Animated.View>
  );
}

export function SectionListItem({
  title,
  subtitle,
  meta,
  action,
  onPress,
  left,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  action?: ReactNode;
  onPress?: () => void;
  left?: ReactNode;
}) {
  const inner = (
    <View style={styles.listItem}>
      {left}
      <View style={styles.listText}>
        <Text style={styles.listTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
        {meta ? <Text style={styles.listMeta}>{meta}</Text> : null}
      </View>
      {action}
    </View>
  );
  if (onPress) return <AnimatedPressable onPress={onPress}>{inner}</AnimatedPressable>;
  return inner;
}

// ---------------------------------------------------------------------------
// Segmented Toggle
// ---------------------------------------------------------------------------

export function SegmentedToggle<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: { label: string; value: T }[];
  selected: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={segStyles.track}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <AnimatedPressable
            key={opt.value}
            style={[segStyles.tab, active && segStyles.tabActive]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[segStyles.tabText, active && segStyles.tabTextActive]}>{opt.label}</Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: D.surfaceLow,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 1,
  },
  tabText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: D.onSurfaceVariant,
    letterSpacing: -0.1,
    fontFamily: D.fontBold,
  },
  tabTextActive: {
    color: D.primary,
  },
});

// ---------------------------------------------------------------------------
// SubjectChip — colored pill showing subject name
// ---------------------------------------------------------------------------

export function SubjectChip({
  subject,
  color,
  bgColor,
}: {
  subject: string;
  color: string;
  bgColor: string;
}) {
  return (
    <View style={[chipStyles.chip, { backgroundColor: bgColor }]}>
      <View style={[chipStyles.chipDot, { backgroundColor: color }]} />
      <Text style={[chipStyles.chipText, { color }]} numberOfLines={1}>{subject}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    minHeight: 22,
    alignSelf: "flex-start",
  },
  chipDot: { width: 5, height: 5, borderRadius: 3 },
  chipText: { fontSize: 10, lineHeight: 11, fontWeight: "700", maxWidth: 100, letterSpacing: 0.3, fontFamily: D.fontBold, includeFontPadding: false },
});

// ---------------------------------------------------------------------------
// InfoNote — styled alert/info box for form screens
// ---------------------------------------------------------------------------

export function InfoNote({
  children,
  tone = "info",
}: PropsWithChildren<{
  tone?: "info" | "warning";
}>) {
  const bg = tone === "warning" ? D.warningBg : D.infoBg;
  const fg = tone === "warning" ? D.warningFg : D.infoFg;
  const iconName: IoniconsName = tone === "warning" ? "alert-circle" : "information-circle";
  return (
    <View style={[noteStyles.note, { backgroundColor: bg }]}>
      <Ionicons name={iconName} size={18} color={fg} style={{ marginTop: 1 }} />
      <Text style={[noteStyles.noteText, { color: fg }]}>{children}</Text>
    </View>
  );
}

const noteStyles = StyleSheet.create({
  note: {
    flexDirection: "row",
    gap: 9,
    padding: 12,
    borderRadius: 12,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  noteText: { flex: 1, fontSize: 11.5, lineHeight: 17, fontFamily: D.font },
});

// ---------------------------------------------------------------------------
// ScreenHeader — compact header bar with back arrow
// ---------------------------------------------------------------------------

export function ScreenHeader({
  title,
  onBack,
  rightAction,
}: {
  title: string;
  onBack: () => void;
  rightAction?: ReactNode;
}) {
  return (
    <View style={hdrStyles.bar}>
      <AnimatedPressable onPress={onBack} style={hdrStyles.backBtn}>
        <Ionicons name="chevron-back" size={20} color={D.onSurface} />
      </AnimatedPressable>
      <Text style={hdrStyles.barTitle} numberOfLines={1}>{title}</Text>
      {rightAction ? rightAction : (
        <View style={hdrStyles.rightBtnPlaceholder} />
      )}
    </View>
  );
}

const hdrStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: D.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  rightBtnPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  barTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: D.onSurface,
    textAlign: "center",
    letterSpacing: -0.3,
    fontFamily: D.fontExtraBold,
  },
});

// ---------------------------------------------------------------------------
// IconPillButton — icon + text action pill
// ---------------------------------------------------------------------------

export function IconPillButton({
  label,
  icon,
  onPress,
  disabled,
  tone = "primary",
}: {
  label: string;
  icon: IoniconsName;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary";
}) {
  const isPrimary = tone === "primary";
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      style={[
        ipStyles.pill,
        {
          backgroundColor: isPrimary ? D.primaryBtn : D.surface,
          borderColor: isPrimary ? D.primaryBtn : D.outlineVariant,
        },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Ionicons name={icon} size={16} color={isPrimary ? D.onPrimary : D.primaryBtn} />
      <Text style={[ipStyles.pillLabel, { color: isPrimary ? D.onPrimary : D.primaryBtn }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const ipStyles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderWidth: 1,
  },
  pillLabel: { fontSize: 11.5, fontWeight: "700", fontFamily: D.fontBold },
});



const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: D.bg },
  screenContent: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: MOBILE_BOTTOM_SPACING, gap: 18 },
  body: { gap: 16 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { fontSize: 22, fontWeight: "800", color: D.onSurface, letterSpacing: -0.5, fontFamily: D.fontExtraBold },
  subtitle: { fontSize: 12.5, lineHeight: 18, color: D.onSurfaceVariant, letterSpacing: -0.1, fontFamily: D.font },
  card: {
    backgroundColor: D.surface,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  cardHeaderText: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 13.5, fontWeight: "700", color: D.onSurface, letterSpacing: -0.15, fontFamily: D.fontBold },
  cardSubtitle: { fontSize: 11.5, color: D.onSurfaceVariant, lineHeight: 16, fontFamily: D.font },
  label: { fontSize: 11, fontWeight: "700", color: D.outline, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: D.fontBold },
  field: {
    backgroundColor: D.surface,
    borderWidth: 1.5,
    borderColor: D.outlineVariant,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: D.onSurface,
    fontSize: 13,
    fontFamily: D.font,
  },
  button: {
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: D.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 3,
  },
  buttonPrimary: { backgroundColor: D.primaryBtn },
  buttonSecondary: { backgroundColor: D.surface, borderWidth: 1.5, borderColor: D.outlineVariant, elevation: 0, shadowOpacity: 0 },
  buttonDanger: { backgroundColor: "#b91c1c" },
  buttonDisabled: { opacity: 0.5, elevation: 0, shadowOpacity: 0 },
  buttonPressed: { opacity: 0.85 },
  buttonTextPrimary: { color: "#ffffff", fontWeight: "700", fontSize: 13, letterSpacing: -0.15, fontFamily: D.fontBold },
  buttonTextSecondary: { color: D.onSurface, fontWeight: "700", fontSize: 13, letterSpacing: -0.15, fontFamily: D.fontBold },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 22,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontSize: 9.5, lineHeight: 10.5, fontWeight: "700", letterSpacing: 0.3, fontFamily: D.fontBold, includeFontPadding: false },
  centerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  muted: { color: D.outline, fontSize: 11.5, lineHeight: 17, fontFamily: D.font },
  errorText: { color: D.error, fontSize: 12.5, lineHeight: 18, fontFamily: D.font },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: D.outlineVariant,
  },
  listText: { flex: 1, gap: 3 },
  listTitle: { fontSize: 12.5, fontWeight: "700", color: D.onSurface, letterSpacing: -0.15, fontFamily: D.fontBold },
  listSubtitle: { fontSize: 11.5, color: D.onSurfaceVariant, lineHeight: 17, fontFamily: D.font },
  listMeta: { fontSize: 10, color: D.outline, lineHeight: 14, fontFamily: D.font },
});

export const uiStyles = styles;
export { D as designColors };
