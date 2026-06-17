import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { firestoreDb } from "../lib/firebase";
import { notifyEvent } from "../lib/notify";
import { navigateBack } from "../lib/navigation";
import { D, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { AvatarCircle } from "../components/ui";
import { useResource } from "../hooks/useResource";
import { useSession } from "../providers/session";
import { adminCollectionName, normalizeUserProfileRecord, userProfilesCollectionName, type UserProfileRecord } from "../shared";

// Role-default capabilities (mirrors packages/shared/src/permissions.ts)
const DEFAULT_CAPABILITIES_BY_ROLE: Record<string, string[]> = {
  teacher: ["materials", "doubts", "schedules", "teaching_plans", "leave"],
  team: ["materials", "doubts", "schedules", "teaching_plans", "leave", "inquiries", "sessions"],
  employee: ["attendance", "inquiries", "upload_results", "schedules", "sessions", "fees", "fee_plans"],
};

const ROLE_LABEL: Record<string, string> = {
  teacher: "Teacher",
  team: "Team / Head Teacher",
  employee: "Employee",
  admin: "Admin",
};

type ApprovalProfile = UserProfileRecord & { approvalStatus: "pending" | "rejected"; createdAtIso?: string };

async function loadPendingStaff(adminRole: string, centreId: string, regionId: string): Promise<ApprovalProfile[]> {
  const col = collection(firestoreDb, userProfilesCollectionName);
  const scopeConstraints =
    adminRole === "centre_incharge" && centreId
      ? [where("centreId", "==", centreId)]
      : adminRole === "regional_incharge" && regionId
        ? [where("regionId", "==", regionId)]
        : [];

  // Firestore doesn't allow combining `in` on two different fields, so run one query per role.
  // Self-signed-up admins land here too; approving one provisions its admins/{uid} record.
  const staffRoles = ["teacher", "team", "employee", "admin"];
  const snapshots = await Promise.all(
    staffRoles.map((role) =>
      getDocs(
        query(
          col,
          where("role", "==", role),
          where("approvalStatus", "in", ["pending", "rejected"]),
          ...scopeConstraints,
        ),
      ),
    ),
  );

  const seen = new Set<string>();
  const result: ApprovalProfile[] = [];

  snapshots.forEach((snapshot, index) => {
    const queriedRole = staffRoles[index];
    for (const d of snapshot.docs) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      const data = d.data();
      const profile = normalizeUserProfileRecord(d.id, data, data.email || "") as ApprovalProfile;
      // normalizeAccountRole collapses unknown roles (e.g. "admin") to "student"; restore the
      // role this query matched so the label + admins/{uid} provisioning branch are correct.
      (profile as any).role = queriedRole;
      const rawStatus = data.approvalStatus;
      profile.approvalStatus = rawStatus === "rejected" ? "rejected" : "pending";
      (profile as any).createdAtIso = typeof data.createdAtIso === "string" ? data.createdAtIso : "";
      result.push(profile);
    }
  });

  return result.sort((a, b) => {
    if (a.approvalStatus !== b.approvalStatus) {
      return a.approvalStatus === "pending" ? -1 : 1;
    }
    return ((b as any).createdAtIso || "").localeCompare((a as any).createdAtIso || "");
  });
}

export function AdminTeacherApprovalsScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const insets = useSafeAreaInsets();
  const { adminRecord } = useSession();
  const [actingId, setActingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const resource = useResource(
    async () =>
      adminRecord
        ? loadPendingStaff(adminRecord.role, adminRecord.centreId ?? "", adminRecord.regionId ?? "")
        : [],
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const profiles = resource.data ?? [];
  const pendingCount = profiles.filter((p) => p.approvalStatus === "pending").length;

  async function handleModerate(profile: ApprovalProfile, nextStatus: "approved" | "rejected") {
    if (actingId) return;
    setActingId(profile.userId);
    setFeedback(null);
    try {
      const defaultPermissions = nextStatus === "approved"
        ? (DEFAULT_CAPABILITIES_BY_ROLE[profile.role] ?? [])
        : undefined;
      await updateDoc(doc(firestoreDb, userProfilesCollectionName, profile.userId), {
        approvalStatus: nextStatus,
        ...(defaultPermissions !== undefined ? { permissions: defaultPermissions } : {}),
      });
      // Admin profiles only grant admin access through an admins/{uid} record (superadmin-write).
      // Provision it on approval; deactivate it on reject. Requires the approver to be a superadmin.
      if ((profile.role as string) === "admin") {
        await setDoc(
          doc(firestoreDb, adminCollectionName, profile.userId),
          {
            email: profile.email || "",
            role: "admin",
            active: nextStatus === "approved",
            regionId: profile.regionId || "",
            regionName: profile.regionName || "",
            centreId: profile.centreId || "",
            centreName: profile.centreName || "",
          },
          { merge: true },
        );
      }
      notifyEvent("enrollment.decided", { userId: profile.userId, status: nextStatus, role: profile.role });
      setFeedback({
        kind: "success",
        text:
          nextStatus === "approved"
            ? `${profile.name || profile.email} approved.`
            : `${profile.name || profile.email} rejected.`,
      });
      void resource.reload();
    } catch (err) {
      setFeedback({
        kind: "error",
        text: err instanceof Error ? err.message : "Unable to update approval status.",
      });
    } finally {
      setActingId(null);
    }
  }

  function renderRow(profile: ApprovalProfile, i: number, arr: ApprovalProfile[]) {
    const isPending = profile.approvalStatus === "pending";
    const busy = actingId === profile.userId;
    const roleLabel = ROLE_LABEL[profile.role] ?? profile.role;
    const dateLabel = (profile as any).createdAtIso
      ? new Date((profile as any).createdAtIso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "";

    return (
      <View key={profile.userId} style={[s.row, i < arr.length - 1 && s.divider]}>
        <View style={s.rowTop}>
          <AvatarCircle name={profile.name || profile.email} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={s.rowName} numberOfLines={1}>{profile.name || profile.email}</Text>
            <View style={s.metaRow}>
              <Text style={s.roleTag}>{roleLabel}</Text>
              {profile.centreName ? (
                <>
                  <View style={s.dot} />
                  <Text style={s.rowMeta} numberOfLines={1}>{profile.centreName}</Text>
                </>
              ) : null}
            </View>
            {dateLabel ? <Text style={s.rowDate}>{dateLabel}</Text> : null}
          </View>
          {!isPending && (
            <View style={s.rejectedBadge}>
              <Text style={s.rejectedBadgeText}>REJECTED</Text>
            </View>
          )}
        </View>
        <View style={s.actionRow}>
          {isPending && (
            <AnimatedPressable
              style={[s.pillBtn, s.rejectPill, busy && { opacity: 0.5 }]}
              onPress={() => void handleModerate(profile, "rejected")}
              disabled={!!actingId}
            >
              <Ionicons name="close" size={14} color="#B91C1C" />
              <Text style={[s.pillText, { color: "#B91C1C" }]}>{busy ? "…" : "Reject"}</Text>
            </AnimatedPressable>
          )}
          <AnimatedPressable
            style={[s.pillBtn, s.approvePill, busy && { opacity: 0.5 }]}
            onPress={() => void handleModerate(profile, "approved")}
            disabled={!!actingId}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={[s.pillText, { color: "#fff" }]}>{busy ? "…" : "Approve"}</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      {!embedded && (
        <View style={[s.headerSection, { paddingTop: insets.top + 16 }]}>
          <View style={s.titleRow}>
            <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
              <Ionicons name="arrow-back" size={18} color={D.onSurface} />
            </AnimatedPressable>
            <Text style={s.pageTitle}>Staff Approvals</Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: embedded ? 14 : 0, paddingBottom: MOBILE_BOTTOM_SPACING }}
        showsVerticalScrollIndicator={false}
      >
        {feedback && (
          <View style={[s.banner, feedback.kind === "success" ? s.successBanner : s.errorBanner]}>
            <Ionicons
              name={feedback.kind === "success" ? "checkmark-circle-outline" : "alert-circle-outline"}
              size={14}
              color={feedback.kind === "success" ? "#15803D" : "#B91C1C"}
            />
            <Text style={[s.bannerText, { color: feedback.kind === "success" ? "#15803D" : "#B91C1C" }]}>
              {feedback.text}
            </Text>
          </View>
        )}

        {pendingCount > 0 && (
          <View style={s.alertBanner}>
            <Ionicons name="time-outline" size={14} color="#92400E" />
            <Text style={s.alertText}>
              {pendingCount} staff member{pendingCount > 1 ? "s" : ""} pending approval
            </Text>
          </View>
        )}

        <Text style={s.sectionLabel}>STAFF REQUESTS · {profiles.length}</Text>

        {resource.loading ? (
          <Text style={s.muted}>Loading…</Text>
        ) : resource.error ? (
          <Text style={s.errorText}>{resource.error}</Text>
        ) : profiles.length === 0 ? (
          <Text style={s.muted}>No pending or rejected staff approvals.</Text>
        ) : (
          <View style={s.card}>{profiles.map((p, i, arr) => renderRow(p, i, arr))}</View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 16, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },
  pageTitle: { fontSize: 24, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.5 },
  banner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, marginBottom: 12,
  },
  successBanner: { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  errorBanner: { backgroundColor: "#FFF5F5", borderColor: "#FECACA" },
  bannerText: { fontSize: 12, fontFamily: D.fontSemiBold },
  alertBanner: {
    flexDirection: "row", alignItems: "center", gap: 8, padding: 14,
    borderRadius: 10, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", marginBottom: 16,
  },
  alertText: { fontSize: 12, fontFamily: D.fontSemiBold, color: "#92400E" },
  sectionLabel: { fontSize: 11, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: {
    backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant,
    overflow: "hidden",
    shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  row: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowName: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2, flexShrink: 1 },
  roleTag: { fontSize: 10, fontFamily: D.fontBold, color: D.primary, letterSpacing: 0.2 },
  rowMeta: { fontSize: 11, fontFamily: D.font, color: D.outline, flexShrink: 1 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.outline },
  rowDate: { fontSize: 10, fontFamily: D.font, color: D.outline, marginTop: 3 },
  rejectedBadge: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
    backgroundColor: "#FEE2E2",
  },
  rejectedBadgeText: { fontSize: 9, fontFamily: D.fontBold, color: "#B91C1C", letterSpacing: 0.3 },
  actionRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 10 },
  pillBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 99 },
  approvePill: { backgroundColor: D.success },
  rejectPill: { backgroundColor: "#FEE2E2" },
  pillText: { fontSize: 12, fontFamily: D.fontBold },
  muted: { fontSize: 13, color: D.onSurfaceVariant, textAlign: "center", marginTop: 24 },
  errorText: { fontSize: 12, color: "#B91C1C", textAlign: "center", marginTop: 24 },
});
