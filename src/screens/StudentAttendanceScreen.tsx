import { router, useSegments } from "expo-router";
import { navigateBack } from "../lib/navigation";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { EmptyCard, ErrorCard, InfoNote, LoadingCard, MOBILE_BOTTOM_SPACING, uiStyles, D } from "../components/ui";
import { Ionicons } from "@expo/vector-icons";
import { AnimatedPressable } from "../components/motion";
import { formatDateLabel, getTodayDateValue } from "../lib/date";
import { createStudentLeaveRequest, listStudentAttendance, listStudentLeaveRequests, type StudentLeaveRequestRecord } from "../lib/erp";
import { useResource } from "../hooks/useResource";
import { useSession } from "../providers/session";
import type { AttendanceStatus, StudentAttendanceRecord } from "../shared";
import { attendancePercent, attendanceStatusLabel, daysBetweenInclusive, monthKey, monthLabel } from "./studentUtils";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATUS_COLORS: Record<AttendanceStatus | "holiday" | "today", { bg: string; fg: string; fw: "400" | "500" | "600" | "700" | "800" }> = {
  present: { bg: "#DCFCE7", fg: "#15803D", fw: "600" },
  absent: { bg: "#FEE2E2", fg: "#B91C1C", fw: "600" },
  leave: { bg: "#FEF3C7", fg: "#B45309", fw: "600" },
  holiday: { bg: "#F3F4F6", fg: "#9CA3AF", fw: "400" },
  today: { bg: D.primary, fg: "#fff", fw: "800" },
};

function statusTone(status: StudentLeaveRequestRecord["status"]) {
  if (status === "approved") return { bg: "#DCFCE7", fg: "#15803D", label: "Approved" };
  if (status === "rejected") return { bg: "#FEE2E2", fg: "#B91C1C", label: "Rejected" };
  return { bg: "#FEF3C7", fg: "#B45309", label: "Pending" };
}

function CalendarGrid({ records, year, monthIndex }: { records: StudentAttendanceRecord[]; year: number; monthIndex: number }) {
  const byDate = new Map(records.map((record) => [record.attendanceDate, record.status]));
  const first = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const offset = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const cells = Array.from({ length: offset + daysInMonth }, (_, index) => {
    if (index < offset) return null;
    return index - offset + 1;
  });
  const today = getTodayDateValue();

  return (
    <View style={styles.calendar}>
      <View style={styles.calHeaderRow}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.calGrid}>
        {cells.map((day, index) => {
          if (!day) return <View key={`blank-${index}`} style={[styles.dayCell, styles.emptyDayCell]} />;
          const value = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const status = byDate.get(value);
          const isToday = value === today;

          let st = isToday ? STATUS_COLORS.today : status ? STATUS_COLORS[status] : null;
          const dayOfWeek = new Date(year, monthIndex, day).getDay();
          if (!st) {
            st = dayOfWeek === 0 ? STATUS_COLORS.holiday : { bg: "transparent", fg: D.onSurfaceVariant, fw: "400" };
          }

          const letter = isToday ? "T" : status === "present" ? "P" : status === "absent" ? "A" : status === "leave" ? "L" : st === STATUS_COLORS.holiday ? "" : day;

          return (
            <View key={value} style={[styles.dayCell, { backgroundColor: st.bg }]}>
              <Text style={[styles.dayText, { color: st.fg, fontWeight: st.fw as never }]}>{letter}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function useAttendanceResource() {
  const { profile } = useSession();
  const resource = useResource(async () => {
    if (!profile) return { attendance: [], leaves: [] };
    const [attendance, leaves] = await Promise.all([listStudentAttendance(profile), listStudentLeaveRequests(profile)]);
    return { attendance, leaves };
  }, [profile?.userId]);
  return { profile, resource };
}

export function StudentAttendanceScreen() {
  const { resource } = useAttendanceResource();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    void resource.reload();
  }, [segments.join(",")]); // reload whenever route changes (e.g. returning from request-leave)
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth());

  const monthRecords = (resource.data?.attendance ?? []).filter((record) => record.attendanceDate.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}`));
  const pct = attendancePercent(resource.data?.attendance ?? []);
  const status = attendanceStatusLabel(pct);
  const present = (resource.data?.attendance ?? []).filter((item) => item.status === "present").length;
  const total = (resource.data?.attendance ?? []).length;
  const leaveRequests = resource.data?.leaves ?? [];

  const shiftMonth = (delta: number) => {
    const next = new Date(year, monthIndex + delta, 1);
    setYear(next.getFullYear());
    setMonthIndex(next.getMonth());
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.pageContent, { paddingTop: Math.max(insets.top + 24, 56) }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Attendance</Text>

        {resource.loading ? (
          <LoadingCard label="Loading attendance..." />
        ) : resource.error ? (
          <ErrorCard message={resource.error} onRetry={() => void resource.reload()} />
        ) : (
          <>
            <View style={styles.overallCardWrapper}>
              <LinearGradient colors={["#6D28D9", "#8B5CF6"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.overallCard}>
                <View style={styles.cardBgCircle} />
                <View style={styles.overallTopRow}>
                  <View>
                    <Text style={styles.overallLabel}>OVERALL ATTENDANCE</Text>
                    <View style={styles.percentRow}>
                      <Text style={styles.overallPct}>{pct}</Text>
                      <Text style={styles.overallPctSymbol}>%</Text>
                    </View>
                    <Text style={styles.overallSub}>{present} of {total} days present</Text>
                  </View>
                </View>

                <View style={styles.progressBarWrapper}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(pct, 100)}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabelText}>0%</Text>
                  <Text style={styles.progressLabelText}>Min. 85%</Text>
                  <Text style={styles.progressLabelText}>100%</Text>
                </View>

              </LinearGradient>
            </View>

            <View style={styles.monthSelectorRow}>
              <AnimatedPressable onPress={() => shiftMonth(-1)} style={styles.calArrowBtn}>
                <Ionicons name="chevron-back" size={16} color={D.onSurface} />
              </AnimatedPressable>
              <Text style={styles.monthTitle}>{monthLabel(year, monthIndex)}</Text>
              <AnimatedPressable onPress={() => shiftMonth(1)} style={styles.calArrowBtn}>
                <Ionicons name="chevron-forward" size={16} color={D.onSurface} />
              </AnimatedPressable>
            </View>

            <View style={styles.calendarCard}>
              <CalendarGrid records={monthRecords} year={year} monthIndex={monthIndex} />
              <View style={styles.legendWrap}>
                {[
                  { label: "Present", bg: "#DCFCE7", border: "#15803D33" },
                  { label: "Absent", bg: "#FEE2E2", border: "#B91C1C33" },
                  { label: "Leave", bg: "#FEF3C7", border: "#B4530933" },
                  { label: "Holiday", bg: "#F3F4F6", border: "#6B728033" },
                  { label: "Today", bg: D.primary, border: "#6D28D933" },
                ].map((item) => (
                  <View key={item.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.bg, borderColor: item.border }]} />
                    <Text style={styles.legendText}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Leave Requests</Text>
            </View>
            <View style={styles.leaveListCard}>
              {leaveRequests.length === 0 ? (
                <Text style={styles.emptyStateText}>No leave requests yet.</Text>
              ) : (
                leaveRequests.map((request, index) => {
                  const badge = statusTone(request.status);
                  return (
                    <View key={request.id} style={[styles.leaveRow, index < leaveRequests.length - 1 && styles.leaveRowBorder]}>
                      <View style={styles.leaveRowText}>
                        <Text style={styles.leaveRangeText}>
                          {request.startDate} - {request.endDate}
                        </Text>
                        <Text style={styles.leaveReasonText}>
                          {request.reason} · {daysBetweenInclusive(request.startDate, request.endDate)} day(s)
                        </Text>
                        {request.adminReply ? <Text style={styles.leaveReplyText}>{request.adminReply}</Text> : null}
                      </View>
                      <View style={[styles.leaveStatusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.leaveStatusText, { color: badge.fg }]}>{badge.label}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <AnimatedPressable onPress={() => router.push("/(student)/request-leave")} style={styles.requestLeaveBtn}>
              <Ionicons name="add" size={18} color={D.primary} />
              <Text style={styles.requestLeaveBtnText}>Request Leave</Text>
            </AnimatedPressable>

            {total === 0 ? <EmptyCard title="No attendance records" message="No attendance has been captured for this account yet." /> : null}
          </>
        )}

      </ScrollView>
    </View>
  );
}

export function StudentRequestLeaveScreen() {
  const { profile, resource } = useAttendanceResource();
  const insets = useSafeAreaInsets();
  const [startDate, setStartDate] = useState(getTodayDateValue());
  const [endDate, setEndDate] = useState(getTodayDateValue());
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const days = daysBetweenInclusive(startDate, endDate);
  const canSubmit = !!profile && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate) && days > 0 && reason.trim().length >= 3 && !submitting;

  const submit = async () => {
    if (!profile) return;
    if (!canSubmit) {
      if (reason.trim().length < 3) setFeedback("Reason must be at least 3 characters.");
      else if (days <= 0) setFeedback("End date must be on or after start date.");
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await createStudentLeaveRequest({ profile, startDate, endDate, reason });
      await resource.reload();
      setSubmitted(true);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.page}>
        <View style={[styles.pageContent, { paddingTop: Math.max(insets.top + 24, 56), flex: 1, justifyContent: "center", alignItems: "center", gap: 16 }]}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: D.successBg, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="checkmark-circle" size={40} color={D.success} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.4 }}>Request submitted</Text>
          <Text style={{ fontSize: 13, color: D.onSurfaceVariant, textAlign: "center", lineHeight: 20, maxWidth: 260 }}>
            Your leave request for {formatDateLabel(startDate)}{startDate !== endDate ? ` – ${formatDateLabel(endDate)}` : ""} has been submitted for admin approval.
          </Text>
          <AnimatedPressable onPress={() => navigateBack(router)} style={[styles.submitBtn, { marginTop: 8, backgroundColor: D.success }]}>
            <Ionicons name="arrow-back" size={16} color="#fff" />
            <Text style={styles.submitBtnText}>Back to attendance</Text>
          </AnimatedPressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={[styles.pageContent, { paddingTop: Math.max(insets.top + 24, 56) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.detailHeader}>
          <AnimatedPressable onPress={() => navigateBack(router)} style={styles.detailBackBtn}>
            <Ionicons name="chevron-back" size={20} color={D.onSurface} />
          </AnimatedPressable>
          <Text style={styles.detailHeaderTitle}>Request Leave</Text>
        </View>

        <Text style={styles.miniSectionLabel}>SELECT DATE(S)</Text>
        <View style={styles.leaveFormCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Start Date</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={D.outline}
              style={styles.inputField}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>End Date</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={D.outline}
              style={styles.inputField}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.dateSummary}>
            <Text style={styles.dateSummaryText}>
              {formatDateLabel(startDate)} - {formatDateLabel(endDate)}
            </Text>
            <View style={styles.dayCountBadge}>
              <Text style={styles.dayCountBadgeText}>{days > 0 ? `${days} day${days > 1 ? "s" : ""}` : "Invalid"}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.miniSectionLabel}>REASON</Text>
        <View style={styles.reasonCard}>
          <Text style={styles.inputLabel}>Additional Notes</Text>
          <TextInput
            value={reason}
            onChangeText={(value) => setReason(value.slice(0, 300))}
            placeholder="Detailed reason for your leave request"
            placeholderTextColor={D.outline}
            multiline
            style={styles.reasonField}
          />
          <Text style={styles.charCountText}>{reason.length} / 300</Text>
        </View>

        <InfoNote tone="warning">Leave is subject to approval. Attendance will be marked as Leave once approved.</InfoNote>
        {feedback ? <Text style={[uiStyles.muted, { color: D.error }]}>{feedback}</Text> : null}

        <AnimatedPressable onPress={submit} disabled={!canSubmit} style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}>
          <Ionicons name="paper-plane-outline" size={16} color="#fff" />
          <Text style={styles.submitBtnText}>{submitting ? "Submitting..." : "Submit request"}</Text>
        </AnimatedPressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: D.bg,
  },
  pageContent: {
    paddingHorizontal: 18,
    paddingBottom: MOBILE_BOTTOM_SPACING,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: D.fontExtraBold,
    color: D.onSurface,
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  overallCardWrapper: {
    borderRadius: 20,
    shadowColor: "#6D28D9",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 5,
  },
  overallCard: {
    padding: 18,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardBgCircle: {
    position: "absolute",
    top: -36,
    right: -36,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  overallTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  overallLabel: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: D.fontBold,
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.7)",
  },
  percentRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
  },
  overallPct: {
    marginTop: 3,
    fontSize: 36,
    fontWeight: "700",
    fontFamily: D.fontBold,
    letterSpacing: -1,
    color: "#fff",
    lineHeight: 36,
  },
  overallPctSymbol: {
    fontSize: 17,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: 17,
    marginBottom: 4,
  },
  overallSub: {
    marginTop: 4,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.85)",
    fontFamily: D.font,
  },
  progressBarWrapper: {
    marginTop: 14,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#fff",
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  progressLabelText: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "600",
    fontFamily: D.fontSemiBold,
  },
  monthSelectorRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  calArrowBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: D.fontBold,
    color: D.onSurface,
    letterSpacing: -0.3,
  },
  calendarCard: {
    marginTop: 12,
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: D.outlineVariant,
  },
  calendar: {
    paddingVertical: 0,
  },
  calHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  weekday: {
    width: "13.3%",
    textAlign: "center",
    fontSize: 9,
    fontWeight: "700",
    color: D.outline,
    letterSpacing: 0.3,
    fontFamily: D.font,
  },
  calGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dayCell: {
    width: "13.3%",
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyDayCell: {
    backgroundColor: "transparent",
  },
  dayText: {
    fontSize: 11,
    fontFamily: D.font,
  },
  legendWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 10,
    color: D.onSurfaceVariant,
    fontWeight: "500",
    fontFamily: D.fontMedium,
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: D.fontBold,
    color: D.onSurface,
    letterSpacing: -0.2,
  },
  leaveListCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    overflow: "hidden",
  },
  leaveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  leaveRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: D.outlineVariant,
  },
  leaveRowText: {
    flex: 1,
    minWidth: 0,
  },
  leaveRangeText: {
    fontSize: 11.5,
    fontWeight: "700",
    fontFamily: D.fontBold,
    color: D.onSurface,
    letterSpacing: -0.2,
  },
  leaveReasonText: {
    fontSize: 10.5,
    color: D.onSurfaceVariant,
    marginTop: 4,
    fontFamily: D.font,
  },
  leaveReplyText: {
    fontSize: 9.5,
    color: D.outline,
    marginTop: 5,
    fontFamily: D.font,
  },
  leaveStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    flexShrink: 0,
  },
  leaveStatusText: {
    fontSize: 9.5,
    fontWeight: "700",
    fontFamily: D.fontBold,
    letterSpacing: 0.3,
  },
  requestLeaveBtn: {
    marginTop: 14,
    height: 44,
    borderRadius: 15,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#EDE9FE",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  requestLeaveBtnText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: D.fontBold,
    color: D.primary,
    letterSpacing: -0.2,
  },
  emptyStateText: {
    padding: 14,
    fontSize: 11,
    color: D.outline,
    fontFamily: D.font,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 22,
  },
  detailBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: D.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: D.fontExtraBold,
    color: D.onSurface,
    letterSpacing: -0.5,
  },
  miniSectionLabel: {
    fontSize: 9.5,
    fontWeight: "700",
    fontFamily: D.fontBold,
    color: D.outline,
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  leaveFormCard: {
    paddingTop: 14,
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    marginBottom: 14,
    gap: 12,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    fontFamily: D.fontSemiBold,
    color: D.onSurfaceVariant,
  },
  inputField: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: D.outlineVariant,
    backgroundColor: "#fff",
    fontSize: 12.5,
    color: D.onSurface,
    letterSpacing: -0.2,
    fontFamily: D.font,
  },
  dateSummary: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: D.surfaceLow,
    borderWidth: 1,
    borderColor: D.primaryFixed,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  dateSummaryText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: "600",
    color: D.primary,
    fontFamily: D.font,
  },
  dayCountBadge: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 999,
    backgroundColor: D.primary,
  },
  dayCountBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    fontFamily: D.fontBold,
  },
  reasonCard: {
    marginBottom: 18,
  },
  reasonField: {
    minHeight: 88,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: D.primary,
    backgroundColor: "#fff",
    color: D.onSurfaceVariant,
    padding: 14,
    textAlignVertical: "top",
    lineHeight: 19,
    letterSpacing: -0.1,
    fontFamily: D.font,
  },
  charCountText: {
    marginTop: 8,
    fontSize: 9.5,
    color: D.outline,
    textAlign: "right",
    fontFamily: D.font,
  },
  submitBtn: {
    width: "100%",
    height: 46,
    borderRadius: 15,
    backgroundColor: D.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    shadowColor: "#6D28D9",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    fontFamily: D.fontBold,
    letterSpacing: -0.2,
  },
});
