import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { navigateBack } from "../lib/navigation";
import { useResource } from "../hooks/useResource";
import { listVisibleProfilesForAdmin } from "../lib/erp";
import { useSession } from "../providers/session";
import { AvatarCircle, D, EmptyCard, ErrorCard, LoadingCard, MOBILE_BOTTOM_SPACING, Pill } from "../components/ui";
import { AnimatedPressable, Stagger } from "../components/motion";

export function AdminLookupsScreen() {
  const { adminRecord } = useSession();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const resource = useResource(
    async () => (adminRecord ? listVisibleProfilesForAdmin(adminRecord) : []),
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return resource.data ?? [];
    return (resource.data ?? []).filter((profile) =>
      [profile.name, profile.studentId, profile.teacherId, profile.className, profile.centreName]
        .join(" ").toLowerCase().includes(term),
    );
  }, [resource.data, search]);

  return (
    <View style={s.safe}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: Math.max(insets.top + 14, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation header with back button — scrolls with content */}
        <View style={s.header}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </AnimatedPressable>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.title}>Lookups</Text>
            <Text style={s.subtitle}>Search teachers and students across all centres.</Text>
          </View>
        </View>

        {/* Search box */}
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={18} color={D.onSurfaceVariant} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by name, class, centre, or ID…"
            placeholderTextColor={D.outline}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoFocus
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={D.outline} />
            </Pressable>
          )}
        </View>

        {resource.loading ? (
          <LoadingCard label="Loading profiles..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : !search.trim() ? (
          <View style={s.hint}>
            <Ionicons name="search-outline" size={32} color={D.outline} />
            <Text style={s.hintText}>Type to search teachers and students.</Text>
          </View>
        ) : filtered.length === 0 ? (
          <EmptyCard title="No matches" message="Try a different name, class, centre, or ID." />
        ) : (
          <View style={s.listCard}>
            <Text style={s.listHeader}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</Text>
            <Stagger>
              {filtered.slice(0, 30).map((profile, idx) => (
                <View key={profile.userId} style={[s.row, idx < Math.min(filtered.length, 30) - 1 && s.rowBorder]}>
                  <AvatarCircle name={profile.name} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowName}>{profile.name}</Text>
                    <Text style={s.rowSub}>{profile.className || profile.centreName || "No class"}</Text>
                    <Text style={s.rowMeta}>
                      {profile.role === "teacher"
                        ? profile.teacherId || "Teacher ID pending"
                        : profile.studentId || "Student ID pending"}
                      {" · "}{profile.email}
                    </Text>
                  </View>
                  <Pill label={profile.role} tone="info" />
                </View>
              ))}
            </Stagger>
            {filtered.length > 30 && (
              <Text style={s.overflow}>+ {filtered.length - 30} more — refine your search</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: D.bg },
  header: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2,
  },
  title: { fontSize: 22, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.4 },
  subtitle: { fontSize: 12, color: D.onSurfaceVariant, lineHeight: 17, fontFamily: D.font },

  content: { paddingHorizontal: 18, gap: 14, paddingBottom: MOBILE_BOTTOM_SPACING },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: D.surface, borderRadius: 16,
    borderWidth: 1, borderColor: D.outlineVariant,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: D.onSurface, fontFamily: D.font },

  hint: { alignItems: "center", gap: 10, paddingVertical: 40 },
  hintText: { fontSize: 13, color: D.outline, fontFamily: D.font },

  listCard: { backgroundColor: D.surface, borderRadius: 18, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden" },
  listHeader: {
    fontSize: 11, fontFamily: D.fontBold, color: D.outline,
    textTransform: "uppercase", letterSpacing: 0.5,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: D.outlineVariant,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  rowName: { fontSize: 14, fontFamily: D.fontSemiBold, color: D.onSurface },
  rowSub: { fontSize: 11, color: D.onSurfaceVariant, marginTop: 1, fontFamily: D.font },
  rowMeta: { fontSize: 10, color: D.outline, marginTop: 1, fontFamily: D.font },
  overflow: { fontSize: 11, color: D.outline, textAlign: "center", paddingVertical: 10, fontFamily: D.font },
});
