import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { D } from "../components/theme";
import { AvatarCircle, MOBILE_BOTTOM_SPACING } from "../components/ui";
import { AnimatedPressable } from "../components/motion";
import { useResource } from "../hooks/useResource";
import {
  approveLeaveRequest,
  approveStudentLeaveRequest,
  listPendingLeaveRequests,
  listStudentLeaveRequestsForAdmin,
  rejectLeaveRequest,
  rejectStudentLeaveRequest,
  type LeaveRequestRecord,
  type StudentLeaveRequestRecord,
} from "../lib/erp";
import { useSession } from "../providers/session";

type ModalItem =
  | { kind: "staff"; data: LeaveRequestRecord }
  | { kind: "student"; data: StudentLeaveRequestRecord };

const statusStyle: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "#FEF3C7", color: "#B45309", label: "Pending" },
  approved: { bg: "#DCFCE7", color: "#15803D", label: "Approved" },
  rejected: { bg: "#FEE2E2", color: "#B91C1C", label: "Rejected" },
};

function LeaveDetailModal({
  item,
  onClose,
  onApprove,
  onReject,
  busy,
}: {
  item: ModalItem | null;
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
  const ss = isStaff ? (statusStyle[item.data.status] ?? statusStyle.pending!) : statusStyle.pending!;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={m.overlay} onPress={onClose}>
        <Pressable style={m.sheet} onPress={() => {}}>
          <View style={m.handle} />
          <View style={m.sheetHeader}>
            <AvatarCircle name={name} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={m.name}>{name}</Text>
              {sub ? <Text style={m.sub}>{sub}</Text> : null}
            </View>
            {isStaff && (
              <View style={[m.statusBadge, { backgroundColor: ss.bg }]}>
                <Text style={[m.statusText, { color: ss.color }]}>{ss.label}</Text>
              </View>
            )}
          </View>

          <View style={m.section}>
            <Text style={m.sectionLabel}>DATES</Text>
            <Text style={m.sectionValue}>{dateLabel}</Text>
          </View>

          <View style={m.section}>
            <Text style={m.sectionLabel}>REASON</Text>
            <Text style={m.reasonText}>{reason || "No reason provided."}</Text>
          </View>

          {isPending && (
            <View style={m.actionFooter}>
              <AnimatedPressable
                style={[m.actionBtn, m.approveBtn, busy && { opacity: 0.5 }]}
                onPress={onApprove}
                disabled={busy}
              >
                <Ionicons name="checkmark" size={16} color="#15803D" />
                <Text style={[m.actionBtnText, { color: "#15803D" }]}>{busy ? "…" : "Approve"}</Text>
              </AnimatedPressable>
              <View style={m.actionDivider} />
              <AnimatedPressable
                style={[m.actionBtn, m.rejectBtn, busy && { opacity: 0.5 }]}
                onPress={onReject}
                disabled={busy}
              >
                <Ionicons name="close" size={16} color="#B91C1C" />
                <Text style={[m.actionBtnText, { color: "#B91C1C" }]}>{busy ? "…" : "Reject"}</Text>
              </AnimatedPressable>
            </View>
          )}

          {!isPending && (
            <AnimatedPressable style={m.closeBtn} onPress={onClose}>
              <Text style={m.closeBtnText}>Close</Text>
            </AnimatedPressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function AdminLeaveScreen() {
  const insets = useSafeAreaInsets();
  const { adminRecord, profile } = useSession();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ModalItem | null>(null);
  const [staffActionLoading, setStaffActionLoading] = useState<string | null>(null);
  const [studentActionLoading, setStudentActionLoading] = useState<string | null>(null);
  const [staffFeedback, setStaffFeedback] = useState<string | null>(null);
  const [studentFeedback, setStudentFeedback] = useState<string | null>(null);

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

  const staffResource = useResource(
    async () => (adminRecord ? listPendingLeaveRequests(adminRecord) : []),
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const studentResource = useResource(
    async () => (adminRecord ? listStudentLeaveRequestsForAdmin(adminRecord) : []),
    [adminRecord?.role, adminRecord?.centreId, adminRecord?.regionId],
  );

  const staffPendingCount = (staffResource.data ?? []).length;
  const studentPendingCount = (studentResource.data ?? []).length;

  async function handleStaffAction(id: string, action: "approved" | "rejected") {
    if (staffActionLoading) return;
    setStaffActionLoading(id);
    try {
      if (action === "approved") await approveLeaveRequest(id);
      else await rejectLeaveRequest(id);
      setStaffFeedback(action === "approved" ? "Request approved." : "Request rejected.");
      setSelectedItem(null);
      void staffResource.reload();
    } catch {
      setStaffFeedback("Could not update. Try again.");
    } finally {
      setStaffActionLoading(null);
    }
  }

  async function handleStudentAction(req: StudentLeaveRequestRecord, action: "approve" | "reject") {
    if (studentActionLoading) return;
    setStudentActionLoading(req.id);
    try {
      if (action === "approve") {
        await approveStudentLeaveRequest(req, { name: profile?.name ?? "Admin", userId: profile?.userId ?? "" });
      } else {
        await rejectStudentLeaveRequest(req.id);
      }
      setStudentFeedback(action === "approve" ? "Leave approved." : "Leave rejected.");
      setSelectedItem(null);
      void studentResource.reload();
    } catch {
      setStudentFeedback("Could not update. Try again.");
    } finally {
      setStudentActionLoading(null);
    }
  }

  const isModalBusy =
    selectedItem?.kind === "staff"
      ? staffActionLoading === selectedItem.data.id
      : selectedItem?.kind === "student"
        ? studentActionLoading === selectedItem.data.id
        : false;

  function renderStaffRow(lr: LeaveRequestRecord, i: number, arr: LeaveRequestRecord[]) {
    const dateLabel = lr.startDate === lr.endDate ? lr.startDate : `${lr.startDate} – ${lr.endDate}`;
    return (
      <AnimatedPressable
        key={lr.id}
        style={i < arr.length - 1 ? s.divider : undefined}
        onPress={() => setSelectedItem({ kind: "staff", data: lr })}
      >
        <View style={s.leaveRow}>
          <AvatarCircle name={lr.staffName} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={s.leaveName}>{lr.staffName}</Text>
            {lr.leaveType ? <Text style={s.leaveRole}>{lr.leaveType}</Text> : null}
            <View style={s.metaRow}>
              {lr.reason ? (
                <Text style={s.leaveReason} numberOfLines={1}>
                  {lr.reason.length > 35 ? lr.reason.slice(0, 35) + "…" : lr.reason}
                </Text>
              ) : null}
              {lr.reason ? <View style={s.dot} /> : null}
              <Text style={s.leaveDates}>{dateLabel}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={14} color={D.outlineVariant} />
        </View>
        <View style={s.actionRow}>
          <AnimatedPressable
            style={[s.pillBtn, s.rejectPill, staffActionLoading === lr.id && { opacity: 0.5 }]}
            onPress={() => void handleStaffAction(lr.id, "rejected")}
            disabled={!!staffActionLoading}
          >
            <Ionicons name="close" size={14} color="#B91C1C" />
            <Text style={[s.pillText, { color: "#B91C1C" }]}>
              {staffActionLoading === lr.id ? "…" : "Reject"}
            </Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[s.pillBtn, s.approvePill, staffActionLoading === lr.id && { opacity: 0.5 }]}
            onPress={() => void handleStaffAction(lr.id, "approved")}
            disabled={!!staffActionLoading}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={[s.pillText, { color: "#fff" }]}>
              {staffActionLoading === lr.id ? "…" : "Approve"}
            </Text>
          </AnimatedPressable>
        </View>
      </AnimatedPressable>
    );
  }

  function renderStudentRow(req: StudentLeaveRequestRecord, i: number, arr: StudentLeaveRequestRecord[]) {
    const dateLabel = req.startDate === req.endDate ? req.startDate : `${req.startDate} – ${req.endDate}`;
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
            {req.className ? <Text style={s.leaveRole}>{req.className}</Text> : null}
            <View style={s.metaRow}>
              {req.reason ? (
                <Text style={s.leaveReason} numberOfLines={1}>
                  {req.reason.length > 35 ? req.reason.slice(0, 35) + "…" : req.reason}
                </Text>
              ) : null}
              {req.reason ? <View style={s.dot} /> : null}
              <Text style={s.leaveDates}>{dateLabel}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={14} color={D.outlineVariant} />
        </View>
        <View style={s.actionRow}>
          <AnimatedPressable
            style={[s.pillBtn, s.rejectPill, busy && { opacity: 0.5 }]}
            onPress={() => void handleStudentAction(req, "reject")}
            disabled={!!studentActionLoading}
          >
            <Ionicons name="close" size={14} color="#B91C1C" />
            <Text style={[s.pillText, { color: "#B91C1C" }]}>{busy ? "…" : "Reject"}</Text>
          </AnimatedPressable>
          <AnimatedPressable
            style={[s.pillBtn, s.approvePill, busy && { opacity: 0.5 }]}
            onPress={() => void handleStudentAction(req, "approve")}
            disabled={!!studentActionLoading}
          >
            <Ionicons name="checkmark" size={14} color="#fff" />
            <Text style={[s.pillText, { color: "#fff" }]}>{busy ? "…" : "Approve"}</Text>
          </AnimatedPressable>
        </View>
      </AnimatedPressable>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      <LeaveDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onApprove={() => {
          if (!selectedItem) return;
          if (selectedItem.kind === "staff") void handleStaffAction(selectedItem.data.id, "approved");
          else void handleStudentAction(selectedItem.data, "approve");
        }}
        onReject={() => {
          if (!selectedItem) return;
          if (selectedItem.kind === "staff") void handleStaffAction(selectedItem.data.id, "rejected");
          else void handleStudentAction(selectedItem.data, "reject");
        }}
        busy={isModalBusy}
      />

      <View style={[s.headerSection, { paddingTop: insets.top + 20 }]}>
        <View style={s.titleRow}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={s.backBtn}>
            <Ionicons name="arrow-back" size={18} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={s.pageTitle}>Leave</Text>
        </View>
        <View style={s.segControl}>
          {["Staff Requests", "Student Leave"].map((t, i) => (
            <AnimatedPressable key={t} style={[s.segBtn, i === activeTab && s.segBtnActive]} onPress={() => setActiveTab(i)}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Text style={[s.segText, { color: i === activeTab ? D.primary : D.onSurfaceVariant }]}>{t}</Text>
                {i === 0 && staffPendingCount > 0 && (
                  <View style={s.tabBadge}><Text style={s.tabBadgeText}>{staffPendingCount}</Text></View>
                )}
                {i === 1 && studentPendingCount > 0 && (
                  <View style={s.tabBadge}><Text style={s.tabBadgeText}>{studentPendingCount}</Text></View>
                )}
              </View>
            </AnimatedPressable>
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: MOBILE_BOTTOM_SPACING }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 0 ? (
          <>
            {staffFeedback && (
              <View style={s.feedbackBanner}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#15803D" />
                <Text style={s.feedbackText}>{staffFeedback}</Text>
              </View>
            )}
            {staffPendingCount > 0 && (
              <View style={s.alertBanner}>
                <Ionicons name="time-outline" size={14} color="#92400E" />
                <Text style={s.alertText}>
                  {staffPendingCount} request{staffPendingCount > 1 ? "s" : ""} pending approval
                </Text>
              </View>
            )}
            <Text style={s.sectionLabel}>ALL REQUESTS · {staffPendingCount}</Text>
            {staffResource.loading ? (
              <Text style={s.muted}>Loading…</Text>
            ) : staffResource.error ? (
              <Text style={s.errorText}>{staffResource.error}</Text>
            ) : staffPendingCount === 0 ? (
              <Text style={s.muted}>No pending staff leave requests.</Text>
            ) : (
              <View style={s.card}>
                {(staffResource.data ?? []).map((lr, i, arr) => renderStaffRow(lr, i, arr))}
              </View>
            )}
          </>
        ) : (
          <>
            {studentFeedback && (
              <View style={s.feedbackBanner}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#15803D" />
                <Text style={s.feedbackText}>{studentFeedback}</Text>
              </View>
            )}
            <Text style={s.sectionLabel}>PENDING · {studentPendingCount}</Text>
            {studentResource.loading ? (
              <Text style={s.muted}>Loading…</Text>
            ) : studentResource.error ? (
              <Text style={s.errorText}>{studentResource.error}</Text>
            ) : studentPendingCount === 0 ? (
              <Text style={s.muted}>No pending student leave requests.</Text>
            ) : (
              <View style={s.card}>
                {(studentResource.data ?? []).map((req, i, arr) => renderStudentRow(req, i, arr))}
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant,
    alignItems: "center", justifyContent: "center",
  },
  pageTitle: { fontSize: 24, fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  segControl: { flexDirection: "row", padding: 3, borderRadius: 10, backgroundColor: D.surfaceLow },
  segBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  segBtnActive: { backgroundColor: D.surface, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segText: { fontSize: 11, fontFamily: D.fontBold, letterSpacing: -0.1 },
  tabBadge: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  tabBadgeText: { fontSize: 9, fontFamily: D.fontExtraBold, color: "#fff" },
  feedbackBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#BBF7D0", marginBottom: 12 },
  feedbackText: { fontSize: 12, fontFamily: D.fontSemiBold, color: "#15803D" },
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderRadius: 10, backgroundColor: "#FEF3C7", borderWidth: 1, borderColor: "#FDE68A", marginBottom: 16 },
  alertText: { fontSize: 12, fontFamily: D.fontSemiBold, color: "#92400E" },
  sectionLabel: { fontSize: 11, fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  card: {
    backgroundColor: D.surface, borderRadius: 14, borderWidth: 1, borderColor: D.outlineVariant,
    overflow: "hidden",
    shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  leaveRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10 },
  leaveName: { fontSize: 13, fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2 },
  leaveRole: { fontSize: 11, fontFamily: D.font, color: D.outline, marginTop: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, flexShrink: 1 },
  leaveReason: { fontSize: 11, fontFamily: D.fontSemiBold, color: D.onSurfaceVariant, flexShrink: 1 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: D.outline, flexShrink: 0 },
  leaveDates: { fontSize: 11, fontFamily: D.font, color: D.outline, flexShrink: 0 },
  actionRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8, paddingHorizontal: 14, paddingBottom: 12, paddingTop: 2 },
  pillBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 99 },
  approvePill: { backgroundColor: D.success },
  rejectPill: { backgroundColor: "#FEE2E2" },
  pillText: { fontSize: 12, fontFamily: D.fontBold },
  muted: { fontSize: 13, color: D.onSurfaceVariant, textAlign: "center", marginTop: 24 },
  errorText: { fontSize: 12, color: "#B91C1C", textAlign: "center", marginTop: 24 },
});

const m = StyleSheet.create({
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
