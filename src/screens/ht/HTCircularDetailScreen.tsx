import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { navigateBack } from "../../lib/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { formatDateTimeLabel } from "../../lib/date";
import type { AttachmentMeta } from "../../lib/erp";

export function HTCircularDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    message: string;
    createdByName: string;
    createdAtIso: string;
    attachmentsJson: string;
  }>();

  const title = params.title ?? "Circular";
  const message = params.message ?? "";
  const createdByName = params.createdByName ?? "";
  const createdAtIso = params.createdAtIso ?? "";
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
        <Text style={s.navTitle}>Circular</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {(createdByName || dateLabel) && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
            {dateLabel ? <Text style={s.dateText}>{dateLabel}</Text> : null}
            {createdByName && dateLabel ? <View style={s.dot} /> : null}
            {createdByName ? <Text style={s.dateText}>Posted by {createdByName}</Text> : null}
          </View>
        )}

        <Text style={s.title}>{title}</Text>

        {message ? (
          <Text style={s.body}>{message}</Text>
        ) : (
          <Text style={[s.body, { color: D.outline, fontStyle: "italic" }]}>No details provided.</Text>
        )}

        {attachments.length > 0 && (
          <>
            <Text style={s.sectionLabel}>ATTACHMENTS</Text>
            {attachments.map((att, i) => (
              <AnimatedPressable key={i} style={s.attachCard} onPress={() => att.url && void Linking.openURL(att.url)}>
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
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  dateText: { fontSize: 12, fontFamily: D.font, color: D.outline },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.outline },
  title: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.6, lineHeight: 26, marginBottom: 16 },
  body: { fontSize: 14, fontFamily: D.font, color: D.onSurfaceVariant, lineHeight: 22, letterSpacing: -0.1 },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginTop: 20, marginBottom: 10 },
  attachCard: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8, padding: 14, borderRadius: 14, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  attachIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surfaceLow, alignItems: "center", justifyContent: "center" },
  attachName: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  attachMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 2 },
  navHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: D.bg },
  navBack: { width: 36, height: 36, borderRadius: 10, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, textAlign: "center", letterSpacing: -0.3 },
});
