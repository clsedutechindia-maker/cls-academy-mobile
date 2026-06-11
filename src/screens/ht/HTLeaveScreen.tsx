import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";
import { AvatarCircle, MOBILE_BOTTOM_SPACING } from "../../components/ui";
import { useResource } from "../../hooks/useResource";
import {
  listLeaveRequestsForHT,
  approveLeaveRequest,
  rejectLeaveRequest,
  listStudentLeaveRequestsForTeacher,
  approveStudentLeaveRequest,
  rejectStudentLeaveRequest,
  type LeaveRequestRecord,
  type StudentLeaveRequestRecord,
} from "../../lib/erp";
import { useSession } from "../../providers/session";

type HTModalItem =
  | { kind: "staff"; data: LeaveRequestRecord }
  | { kind: "student"; data: StudentLeaveRequestRecord };

function HTLeaveDetailModal({
  item,
  onClose,
  onApprove,
  onReject,
  busy,
}: {
  item: HTModalItem | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  busy: boolean;
}) {
  if (!item) return null;
  const isStaff = item.kind === "staff";
  const name = isStaff ? item.data.staffName : item.data.studentName;
  const sub = isStaff ? (item.data.leaveType || "Staff") : item.data.className;
  const reason = item.data.reason;
  const startDate = item.data.startDate;
  const endDate = item.data.endDate;
  const dateLabel = startDate === endDate ? startDate : `${startDate} – ${endDate}`;
  const isPending = isStaff ? item.data.status === "pending" : true;
  const ss = isStaff ? (htStatusStyle[item.data.status] ?? htStatusStyle.pending!) : htStatusStyle.pending!;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={md.overlay} onPress={onClose}>
        <Pressable style={md.sheet} onPress={() => {}}>
          <View style={md.handle} />
          <View style={md.sheetHeader}>
            <AvatarCircle name={name} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={md.name}>{name}</Text>
              {sub ? <Text style={md.sub}>{sub}</Text> : null}
            </View>
            {isStaff && (
              <View style={[md.statusBadge, { backgroundColor: ss.bg }]}>
                <Text style={[md.statusText, { color: ss.color }]}>{ss.label}</Text>
              </View>
            )}
          </View>
          <View style={md.section}>
            <Text style={md.sectionLabel}>DATES</Text>
            <Text style={md.sectionValue}>{dateLabel}</Text>
          </View>
          <View style={md.section}>
            <Text style={md.sectionLabel}>REASON</Text>
            <Text style={md.reasonText}>{reason || "No reason provided."}</Text>
          </View>
          {isPending && (
            <View style={md.actionFooter}>
              <AnimatedPressable
                style={[md.actionBtn, md.approveBtn, busy && { opacity: 0.5 }]}
                onPress={onApprove}
                disabled={busy}
              >
                <Ionicons name="checkmark" size={16} color="#15803D" />
                <Text style={[md.actionBtnText, { color: "#15803D" }]}>{busy ? "…" : "Approve"}</Text>
              </AnimatedPressable>
              <View style={md.actionDivider} />
              <AnimatedPressable
                style={[md.actionBtn, md.rejectBtn, busy && { opacity: 0.5 }]}
                onPress={onReject}
                disabled={busy}
              >
                <Ionicons name="close" size={16} color="#B91C1C" />
                <Text style={[md.actionBtnText, { color: "#B91C1C" }]}>{busy ? "…" : "Reject"}</Text>
              </AnimatedPressable>
            </View>
          )}
          {!isPending && (
            <AnimatedPressable style={md.closeBtn} onPress={onClose}>
              <Text style={md.closeBtnText}>Close</Text>
            </AnimatedPressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const htStatusStyle: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "#FEF3C7", color: "#B45309", label: "Pending" },
  approved: { bg: "#DCFCE7", color: "#15803D", label: "Approved" },
  rejected: { bg: "#FEE2E2", color: "#B91C1C", label: "Rejected" },
};

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

const COLORS = ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#8B5CF6"];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % COLORS.length;
  return COLORS[h]!;
}

export function HTLeaveScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const [activeTab, setActiveTab] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [staffFeedback, setStaffFeedback] = useState<string | null>(null);
  const [studentActionLoading, setStudentActionLoading] = useState<string | null>(null);
  const [studentFeedback, setStudentFeedback] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<HTModalItem | null>(null);

  useEffect(() => {
    if (!staffFeedback) return;
    const t = setTimeout(() => setStaffFeedback(null), 2500);
    return () => clearTimeout(t);
  }, [staffFeedback]);

  useEffect(() => {
    if (!studentFeedback) return;
    const t = setTimeout(() => setStudentFeedback(null), 2500);
    return () => clearTimeout(t);
  }, [studentFeedback]);

  const resource = useResource(
    async () => (profile ? listLeaveRequestsForHT(profile) : []),
    [profile?.userId],
  );

  const studentLeaveResource = useResource(
    async () => (profile ? listStudentLeaveRequestsForTeacher(profile) : []),
    [profile?.userId],
  );

  const allRequests = resource.data ?? [];
  const staffRequests = allRequests.filter((r) => r.staffUserId !== profile?.userId);
  const myRequests = allRequests.filter((r) => r.staffUserId === profile?.userId);
  const pendingCount = staffRequests.filter((r) => r.status === "pending").length;
  const studentPendingCount = studentLeaveResource.data?.length ?? 0;

  async function handleAction(id: string, action: "approved" | "rejected") {
    if (actionLoading) return;
    setActionLoading(id);
    try {
      if (action === "approved") await approveLeaveRequest(id);
      else await rejectLeaveRequest(id);
      setStaffFeedback(action === "approved" ? "Request approved." : "Request rejected.");
      setSelectedItem(null);
      resource.reload();
    } catch {
      setStaffFeedback("Could not update request. Try again.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStudentLeaveAction(req: StudentLeaveRequestRecord, action: "approve" | "reject") {
    if (studentActionLoading) return;
    setStudentActionLoading(req.id);
    try {
      if (action === "approve") {
        await approveStudentLeaveRequest(req, { name: profile?.name ?? "Teacher", userId: profile?.userId ?? "" });
      } else {
        await rejectStudentLeaveRequest(req.id);
      }
      setStudentFeedback(action === "approve" ? "Leave approved." : "Leave rejected.");
      setSelectedItem(null);
      studentLeaveResource.reload();
    } catch {
      setStudentFeedback("Could not update request. Try again.");
    } finally {
      setStudentActionLoading(null);
    }
  }

  function renderRequest(lr: LeaveRequestRecord, i: number, arr: LeaveRequestRecord[]) {
    const ss = htStatusStyle[lr.status] ?? htStatusStyle.pending!;
    const isPending = lr.status === "pending";
    const busy = actionLoading === lr.id;
    const dateLabel = lr.startDate === lr.endDate ? lr.startDate : `${lr.startDate} – ${lr.endDate}`;
    return (
      <AnimatedPressable
        key={lr.id}
        style={i < arr.length - 1 ? s.divider : undefined}
        onPress={() => setSelectedItem({ kind: "staff", data: lr })}
      >
        <View style={s.leaveRow}>
          <View style={[s.avatar, { backgroundColor: avatarColor(lr.staffName) }]}>
            <Text style={s.avatarText}>{initials(lr.staffName)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.leaveName}>{lr.staffName}</Text>
            {lr.leaveType ? <Text style={s.leaveRole}>{lr.leaveType}</Text> : null}
            <View style={s.metaRow}>
              {lr.reason ? (
                <Text style={s.leaveType} numberOfLines={1}>
                  {lr.reason.length > 30 ? lr.reason.slice(0, 30) + "…" : lr.reason}
                </Text>
              ) : null}
              {lr.reason ? <View style={s.dot} /> : null}
              <Text style={s.leaveDates}>{dateLabel}</Text>
            </View>
          </View>
          <View style={[s.statusBadge, { backgroundColor: ss.bg }]}>
            <Text style={[s.statusText, { color: ss.color }]}>{ss.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={13} color={D.outlineVariant} style={{ marginLeft: 4 }} />
        </View>

        {isPending && (
          <View style={s.actionRow}>
            <AnimatedPressable
              style={[s.pillBtn, s.rejectPill, busy && { opacity: 0.5 }]}
              onPress={() => void handleAction(lr.id, "rejected")}
              disabled={!!busy}
            >
              <Ionicons name="close" size={14} color="#B91C1C" />
              <Text style={[s.pillText, { color: "#B91C1C" }]}>{busy ? "…" : "Reject"}</Text>
            </AnimatedPressable>
            <AnimatedPressable
              style={[s.pillBtn, s.approvePill, busy && { opacity: 0.5 }]}
              onPress={() => void handleAction(lr.id, "approved")}
              disabled={!!busy}
            >
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={[s.pillText, { color: "#fff" }]}>{busy ? "…" : "Approve"}</Text>
            </AnimatedPressable>
          </View>
        )}
      </AnimatedPressable>
    );
  }

  const isModalBusy =
    selectedItem?.kind === "staff"
      ? actionLoading === selectedItem.data.id
      : selectedItem?.kind === "student"
        ? studentActionLoading === selectedItem.data.id
        : false;

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <HTLeaveDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onApprove={() => {
          if (!selectedItem) return;
          if (selectedItem.kind === "staff") void handleAction(selectedItem.data.id, "approved");
          else void handleStudentLeaveAction(selectedItem.data, "approve");
        }}
        onReject={() => {
          if (!selectedItem) return;
          if (selectedItem.kind === "staff") void handleAction(selectedItem.data.id, "rejected");
          else void handleStudentLeaveAction(selectedItem.data, "reject");
        }}
        busy={isModalBusy}
      />
      <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Leave</Text>
        </View>
        <View style={s.segControl}>
          {["Staff Requests", "Student Leave", "My Leave"].map((t, i) => (
            <AnimatedPressable key={t} style={[s.segBtn, i === activeTab && s.segBtnActive]} onPress={() => setActiveTab(i)}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Text style={[s.segText, { color: i === activeTab ? D.primary : D.onSurfaceVariant }]}>{t}</Text>
                {i === 1 && studentPendingCount > 0 && (
                  <View style={s.tabBadge}><Text style={s.tabBadgeText}>{studentPendingCount}</Text></View>
                )}
              </View>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: MOBILE_BOTTOM_SPACING }} showsVerticalScrollIndicator={false}>
        {staffFeedback && activeTab === 0 && (
          <View style={s.feedbackBanner}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#15803D" />
            <Text style={s.feedbackText}>{staffFeedback}</Text>
          </View>
        )}
        {studentFeedback && activeTab === 1 && (
          <View style={s.feedbackBanner}>
            <Ionicons name="checkmark-circle-outline" size={14} color="#15803D" />
            <Text style={s.feedbackText}>{studentFeedback}</Text>
          </View>
        )}

        {resource.loading && activeTab !== 1 ? (
          <Text style={s.muted}>Loading…</Text>
        ) : resource.error && activeTab !== 1 ? (
          <Text style={s.errorText}>{resource.error}</Text>
        ) : activeTab === 0 ? (
          <>
            {pendingCount > 0 && (
              <View style={s.alertBanner}>
                <Ionicons name="time-outline" size={14} color="#92400E" />
                <Text style={s.alertText}>{pendingCount} request{pendingCount > 1 ? "s" : ""} pending your approval</Text>
              </View>
            )}
            <Text style={s.sectionLabel}>ALL REQUESTS · {staffRequests.length}</Text>
            {staffRequests.length === 0 ? (
              <Text style={s.muted}>No staff leave requests.</Text>
            ) : (
              <View style={s.card}>
                {staffRequests.map((lr, i, arr) => renderRequest(lr, i, arr))}
              </View>
            )}
          </>
        ) : activeTab === 1 ? (
          <>
            {studentLeaveResource.loading ? (
              <Text style={s.muted}>Loading…</Text>
            ) : studentLeaveResource.data?.length === 0 ? (
              <Text style={s.muted}>No pending student leave requests.</Text>
            ) : (
              <>
                <Text style={s.sectionLabel}>PENDING · {studentPendingCount}</Text>
                <View style={s.card}>
                  {(studentLeaveResource.data ?? []).map((req, i, arr) => {
                    const busy = studentActionLoading === req.id;
                    return (
                      <AnimatedPressable
                        key={req.id}
                        style={i < arr.length - 1 ? s.divider : undefined}
                        onPress={() => setSelectedItem({ kind: "student", data: req })}
                      >
                        <View style={s.leaveRow}>
                          <AvatarCircle name={req.studentName} size={38} />
                          <View style={{ flex: 1 }}>
                            <Text style={s.leaveName}>{req.studentName}</Text>
                            <Text style={s.leaveRole}>{req.className}</Text>
                            <View style={s.metaRow}>
                              {req.reason ? (
                                <Text style={s.leaveType} numberOfLines={1}>
                                  {req.reason.length > 30 ? req.reason.slice(0, 30) + "…" : req.reason}
                                </Text>
                              ) : null}
                              {req.reason ? <View style={s.dot} /> : null}
                              <Text style={s.leaveDates}>{req.startDate === req.endDate ? req.startDate : `${req.startDate} – ${req.endDate}`}</Text>
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={13} color={D.outlineVariant} />
                        </View>
                        <View style={s.actionRow}>
                          <AnimatedPressable
                            style={[s.pillBtn, s.rejectPill, busy && { opacity: 0.5 }]}
                            onPress={() => void handleStudentLeaveAction(req, "reject")}
                            disabled={!!busy}
                          >
                            <Ionicons name="close" size={14} color="#B91C1C" />
                            <Text style={[s.pillText, { color: "#B91C1C" }]}>{busy ? "…" : "Reject"}</Text>
                          </AnimatedPressable>
                          <AnimatedPressable
                            style={[s.pillBtn, s.approvePill, busy && { opacity: 0.5 }]}
                            onPress={() => void handleStudentLeaveAction(req, "approve")}
                            disabled={!!busy}
                          >
                            <Ionicons name="checkmark" size={14} color="#fff" />
                            <Text style={[s.pillText, { color: "#fff" }]}>{busy ? "…" : "Approve"}</Text>
                          </AnimatedPressable>
                        </View>
                      </AnimatedPressable>
                    );
                  })}
                </View>
              </>
            )}
          </>
        ) : (
          <>
            <AnimatedPressable style={s.newLeaveBtn} onPress={() => router.push("/(head-teacher)/new-leave")}>
              <Ionicons name="add-circle-outline" size={16} color={D.primary} />
              <Text style={s.newLeaveText}>Apply for Leave</Text>
            </AnimatedPressable>
            <Text style={s.sectionLabel}>MY LEAVE HISTORY</Text>
            {myRequests.length === 0 ? (
              <Text style={s.muted}>No leave requests submitted.</Text>
            ) : (
              <View style={s.card}>
                {myRequests.map((lr, i, arr) => renderRequest(lr, i, arr))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  headerSection: { paddingHorizontal: 18, paddingBottom: 16, backgroundColor: D.bg },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.7 },
  segControl: { flexDirection: "row", padding: 3, borderRadius: 10, backgroundColor: D.surfaceLow },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  segBtnActive: { backgroundColor: D.surface, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: -0.1 },
  tabBadge: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  tabBadgeText: { fontSize: 9, fontWeight: "800", fontFamily: D.fontExtraBold, color: "#fff" },
  feedbackBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0", marginBottom: 12 },
  feedbackText: { fontSize: 12, fontWeight: "600", fontFamily: D.fontSemiBold, color: "#15803D" },
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 10, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", marginBottom: 16 },
  alertText: { fontSize: 12, fontWeight: "600", fontFamily: D.fontSemiBold, color: "#92400E" },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: { backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  leaveRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexShrink: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: "#fff" },
  leaveName: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  leaveRole: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 1 },
  leaveType: { fontSize: 11, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.outline },
  leaveDates: { fontSize: 11, fontFamily: D.font, color: D.outline },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold },
  actionRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 2 },
  pillBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 99 },
  approvePill: { backgroundColor: D.success },
  rejectPill: { backgroundColor: "#FEE2E2" },
  pillText: { fontSize: 12, fontWeight: "700", fontFamily: D.fontBold },
  newLeaveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 15, borderRadius: 14, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.surfaceHigh, marginBottom: 16 },
  newLeaveText: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.primary },
  muted: { fontSize: 13, color: D.onSurfaceVariant, textAlign: "center", marginTop: 24 },
  errorText: { fontSize: 12, color: "#B91C1C", textAlign: "center", marginTop: 24 },
});

const md = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: D.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32, overflow: "hidden",
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: D.outlineVariant, alignSelf: "center", marginTop: 10, marginBottom: 16 },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  name: { fontSize: 15, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  sub: { fontSize: 12, fontFamily: D.font, color: D.outline, marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontFamily: D.fontBold },
  section: { paddingHorizontal: 20, paddingTop: 16 },
  sectionLabel: { fontSize: 10, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.8, marginBottom: 6 },
  sectionValue: { fontSize: 14, fontFamily: D.fontSemiBold, color: D.onSurface },
  reasonText: { fontSize: 14, fontFamily: D.font, color: D.onSurface, lineHeight: 22 },
  actionFooter: { flexDirection: "row", marginTop: 20, marginHorizontal: 20, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: D.outlineVariant },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  approveBtn: { backgroundColor: "#F0FDF4" },
  rejectBtn: { backgroundColor: "#FFF5F5" },
  actionDivider: { width: 1, backgroundColor: D.outlineVariant },
  actionBtnText: { fontSize: 13, fontFamily: D.fontBold },
  closeBtn: { marginTop: 16, marginHorizontal: 20, alignItems: "center", paddingVertical: 13, borderRadius: 14, backgroundColor: D.surfaceLow, borderWidth: 1, borderColor: D.outlineVariant },
  closeBtnText: { fontSize: 13, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant },
});
