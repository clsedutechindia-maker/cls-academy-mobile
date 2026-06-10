import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { formatDateTimeLabel } from "../../lib/date";
import type { AttachmentMeta } from "../../lib/erp";

export function HTMaterialDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    description: string;
    subjectName: string;
    className: string;
    createdByName: string;
    createdAtIso: string;
    attachmentsJson: string;
    linkUrl: string;
  }>();

  const title = params.title ?? "Material";
  const description = params.description ?? "";
  const subjectName = params.subjectName ?? "";
  const className = params.className ?? "";
  const createdByName = params.createdByName ?? "";
  const createdAtIso = params.createdAtIso ?? "";
  const linkUrl = params.linkUrl ?? "";
  const attachments: AttachmentMeta[] = (() => {
    try { return JSON.parse(params.attachmentsJson ?? "[]"); }
    catch { return []; }
  })();

  const dateLabel = createdAtIso ? formatDateTimeLabel(createdAtIso) : "";

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <View style={[s.navHeader, { paddingTop: insets.top + 12 }]}>
        <AnimatedPressable style={s.navBack} onPress={() => navigateBack(router)}>
          <Ionicons name="chevron-back" size={20} color={D.onSurface} />
        </AnimatedPressable>
        <Text style={s.navTitle}>Material</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.heroCard}>
          <View style={s.heroIcon}>
            <Ionicons name="document-text" size={36} color={D.primary} />
          </View>
          <Text style={s.heroTitle}>{title}</Text>
          <View style={{ flexDirection: "row", gap: 7, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {className ? <View style={s.badge}><Text style={s.badgeText}>{className}</Text></View> : null}
            {subjectName ? <View style={[s.badge, { backgroundColor: "#EEF2FF" }]}><Text style={[s.badgeText, { color: "#6366F1" }]}>{subjectName}</Text></View> : null}
          </View>
        </View>

        {/* Meta */}
        <View style={s.metaCard}>
          {[
            createdByName ? { label: "Uploaded by", value: createdByName } : null,
            dateLabel ? { label: "Date", value: dateLabel } : null,
          ].filter(Boolean).map((m) => (
            <View key={m!.label} style={s.metaRow}>
              <Text style={s.metaLabel}>{m!.label}</Text>
              <Text style={s.metaValue}>{m!.value}</Text>
            </View>
          ))}
        </View>

        {/* Description */}
        {description ? (
          <>
            <Text style={s.sectionLabel}>DESCRIPTION</Text>
            <View style={s.descCard}>
              <Text style={s.descText}>{description}</Text>
            </View>
          </>
        ) : null}

        {/* Open Link */}
        {linkUrl ? (
          <AnimatedPressable style={s.openBtn} onPress={() => Linking.openURL(linkUrl)}>
            <Ionicons name="open-outline" size={18} color="#fff" />
            <Text style={s.openText}>Open Resource</Text>
          </AnimatedPressable>
        ) : null}

        {/* Attachments */}
        {attachments.length > 0 && (
          <>
            <Text style={s.sectionLabel}>ATTACHMENTS</Text>
            {attachments.map((att, i) => (
              <AnimatedPressable key={i} style={s.attachCard} onPress={() => att.url ? Linking.openURL(att.url) : undefined}>
                <View style={s.attachIcon}>
                  <Ionicons name={att.kind === "file" ? "document-text" : "link"} size={18} color={D.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.attachName} numberOfLines={1}>{att.label}</Text>
                  <Text style={s.attachMeta}>{att.kind === "file" ? "File" : "Link"}</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={D.outline} />
              </AnimatedPressable>
            ))}
          </>
        )}

        {!linkUrl && attachments.length === 0 && !description && (
          <View style={[s.metaCard, { padding: 20, alignItems: "center" }]}>
            <Text style={{ fontSize: 13, fontFamily: D.font, color: D.outline }}>No content available.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  heroCard: { alignItems: "center", padding: 26, borderRadius: 20, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, marginBottom: 14, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  heroIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: D.surfaceLow, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroTitle: { fontSize: 16, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5, textAlign: "center" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: D.surfaceLow },
  badgeText: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  metaCard: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", marginBottom: 14, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  metaLabel: { fontSize: 12.5, color: D.outline, fontWeight: "500", fontFamily: D.fontMedium },
  metaValue: { fontSize: 13, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurface },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  descCard: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, padding: 14, marginBottom: 14 },
  descText: { fontSize: 13.5, color: D.onSurface, lineHeight: 22, letterSpacing: -0.1, fontFamily: D.font },
  openBtn: { height: 52, borderRadius: 16, backgroundColor: D.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14, shadowColor: D.primary, shadowOpacity: 0.24, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  openText: { fontSize: 13.5, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" },
  attachCard: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8, padding: 14, borderRadius: 14, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  attachIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surfaceLow, alignItems: "center", justifyContent: "center" },
  attachName: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  attachMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 2 },
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
});
