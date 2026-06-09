import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { D } from "../../components/theme";
import { AnimatedPressable } from "../../components/motion";

const tabs = ["Basic Info", "Results", "Attendance", "Fee"];

const infoRows = [
  { l: "Full Name", v: "Aanya Verma" },
  { l: "Phone", v: "+91 98765 43210" },
  { l: "Email", v: "aanya.verma@gmail.com" },
  { l: "Parent / Guardian", v: "Ramesh Verma" },
  { l: "Parent Phone", v: "+91 99887 12345" },
  { l: "Batch", v: "NEET 11-B · Ace" },
  { l: "Stream", v: "NEET (PCB)" },
  { l: "Class", v: "Class XI" },
  { l: "Roll No.", v: "043" },
  { l: "CLS ID", v: "CLS-2643" },
  { l: "Bus Route", v: "Route 4 · Civil Lines → CLS" },
  { l: "Enrolled", v: "Apr 12, 2026" },
];

const resultSubjects = [
  { name: "Physics", avg: 78, color: "#6366F1", bg: "#EEF2FF", tests: 8 },
  { name: "Chemistry", avg: 82, color: "#0EA5E9", bg: "#F0F9FF", tests: 7 },
  { name: "Biology", avg: 91, color: "#10B981", bg: "#F0FDF4", tests: 9 },
];

const recentTests = [
  { subject: "Biology", name: "Cell Division Unit Test", date: "Jun 5", score: 47, total: 50, rank: 1, color: "#10B981", bg: "#F0FDF4" },
  { subject: "Physics", name: "Optics Mock #3", date: "Jun 2", score: 38, total: 50, rank: 4, color: "#6366F1", bg: "#EEF2FF" },
  { subject: "Chemistry", name: "Equilibrium Test", date: "May 28", score: 42, total: 50, rank: 2, color: "#0EA5E9", bg: "#F0F9FF" },
  { subject: "Physics", name: "Waves & Sound", date: "May 22", score: 34, total: 50, rank: 6, color: "#6366F1", bg: "#EEF2FF" },
  { subject: "Biology", name: "Genetics Unit Test", date: "May 18", score: 46, total: 50, rank: 1, color: "#10B981", bg: "#F0FDF4" },
];

const months = [
  { m: "Apr", pct: 94, present: 32, total: 34 },
  { m: "May", pct: 91, present: 30, total: 33 },
  { m: "Jun", pct: 96, present: 24, total: 25 },
];

const payments = [
  { label: "Term 2 · Tuition", amount: "24,500", date: "Mar 1, 2026", via: "UPI", status: "paid" as const },
  { label: "Term 1 · Tuition", amount: "24,500", date: "Dec 2, 2025", via: "Card", status: "paid" as const },
  { label: "Admission fee", amount: "15,000", date: "Apr 12, 2025", via: "NetBank", status: "paid" as const },
  { label: "Materials & Lab", amount: "9,500", date: "Apr 12, 2025", via: "Cash", status: "paid" as const },
];

const statusStyle = {
  paid: { bg: "#DCFCE7", color: "#15803D", dot: "#22C55E", label: "Paid" },
  due: { bg: "#FEF3C7", color: "#B45309", dot: "#F59E0B", label: "Due" },
  overdue: { bg: "#FEE2E2", color: "#B91C1C", dot: "#EF4444", label: "Overdue" },
};

function StudentHero({ activeTab, onTabChange }: { activeTab: number; onTabChange: (i: number) => void }) {
  return (
    <>
      <View style={s.heroCard}>
        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#EC4899", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, color: "#fff" }}>AV</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.heroName}>Aanya Verma</Text>
          <Text style={s.heroMeta}>Roll 043 · NEET 11-B · CLS-2643</Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 7 }}>
            <View style={[s.badge, { backgroundColor: "#DCFCE7" }]}><Text style={[s.badgeText, { color: "#15803D" }]}>96% ATT</Text></View>
            <View style={[s.badge, { backgroundColor: D.surfaceLow }]}><Text style={[s.badgeText, { color: D.primary }]}>ACTIVE</Text></View>
            <View style={[s.badge, { backgroundColor: "#FEF3C7" }]}><Text style={[s.badgeText, { color: "#B45309" }]}>RANK 3</Text></View>
          </View>
        </View>
      </View>
      <View style={s.tabStrip}>
        {tabs.map((t, i) => (
          <AnimatedPressable key={t} style={[s.tabBtn, i === activeTab && s.tabBtnActive]} onPress={() => onTabChange(i)}>
            <Text style={[s.tabText, { color: i === activeTab ? D.primary : D.onSurfaceVariant }]}>{t}</Text>
          </AnimatedPressable>
        ))}
      </View>
    </>
  );
}

export function HTStudentDetailScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: D.bg }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <AnimatedPressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={16} color={D.primary} />
          <Text style={s.backText}>Students</Text>
        </AnimatedPressable>
        <Text style={s.headerTitle}>Student Profile</Text>
        <View style={s.moreBtn}>
          <Ionicons name="ellipsis-horizontal" size={18} color={D.onSurface} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <StudentHero activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab content */}
        {activeTab === 0 && (
          <>
            <View style={[s.card, { marginTop: 16 }]}>
              {infoRows.map((row, i) => (
                <View key={row.l} style={[s.infoRow, i < infoRows.length - 1 && s.divider]}>
                  <Text style={s.infoLabel}>{row.l}</Text>
                  <Text style={s.infoValue}>{row.v}</Text>
                </View>
              ))}
            </View>
            <AnimatedPressable
              style={s.removeBtn}
              onPress={() => router.push("/(head-teacher)/remove-student")}
            >
              <Ionicons name="trash-outline" size={18} color="#B91C1C" />
              <Text style={s.removeBtnText}>Remove Student</Text>
            </AnimatedPressable>
          </>
        )}

        {activeTab === 1 && (
          <>
            {/* Rank card */}
            <View style={[s.rankCard, { marginTop: 16 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.rankLabel}>BATCH RANK</Text>
                <Text style={s.rankValue}>#3</Text>
                <Text style={s.rankSub}>of 42 students · NEET 11-B</Text>
              </View>
              <View style={{ gap: 8, alignItems: "flex-end" }}>
                {[{ l: "Avg score", v: "84%" }, { l: "Percentile", v: "94th" }, { l: "Tests taken", v: "24" }].map((x) => (
                  <View key={x.l} style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 9.5, fontWeight: "700", fontFamily: D.fontBold, color: "rgba(255,255,255,0.65)", letterSpacing: 0.3 }}>{x.l.toUpperCase()}</Text>
                    <Text style={{ fontSize: 13, fontWeight: "800", fontFamily: D.fontExtraBold, color: "#fff", letterSpacing: -0.3 }}>{x.v}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>SUBJECT PERFORMANCE</Text>
            <View style={{ gap: 8 }}>
              {resultSubjects.map((subj) => (
                <View key={subj.name} style={[s.card, { padding: 15 }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: subj.color }} />
                      <Text style={{ fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface }}>{subj.name}</Text>
                      <View style={[s.badge, { backgroundColor: subj.bg }]}><Text style={[s.badgeText, { color: subj.color }]}>{subj.tests} tests</Text></View>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: "800", fontFamily: D.fontExtraBold, color: subj.color, letterSpacing: -0.4 }}>{subj.avg}%</Text>
                  </View>
                  <View style={{ height: 7, borderRadius: 999, backgroundColor: subj.bg, overflow: "hidden" }}>
                    <View style={{ width: `${subj.avg}%`, height: "100%", backgroundColor: subj.color, borderRadius: 999 }} />
                  </View>
                </View>
              ))}
            </View>
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>RECENT TESTS</Text>
            <View style={s.card}>
              {recentTests.map((t, i) => {
                const pct = Math.round((t.score / t.total) * 100);
                return (
                  <View key={i} style={[s.testResultRow, i < recentTests.length - 1 && s.divider]}>
                    <View style={[s.subjectIcon, { backgroundColor: t.bg }]}>
                      <Text style={{ fontSize: 10, fontWeight: "800", fontFamily: D.fontExtraBold, color: t.color }}>{t.subject.slice(0, 3).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.testName}>{t.name}</Text>
                      <Text style={s.testMeta}>{t.date} · Rank {t.rank}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={s.scoreText}>{t.score}<Text style={{ fontSize: 11, color: D.outline, fontWeight: "500", fontFamily: D.fontMedium }}>/{t.total}</Text></Text>
                      <Text style={{ fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: pct >= 80 ? "#15803D" : pct >= 60 ? "#B45309" : "#B91C1C", marginTop: 1 }}>{pct}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {activeTab === 2 && (
          <>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
              {[{ label: "Overall", value: "96%", sub: "This year", accent: "#15803D", bg: "#DCFCE7" }, { label: "Present", value: "86", sub: "of 90 classes", accent: D.onSurface, bg: "#F8F8F8" }, { label: "Absent", value: "4", sub: "3 approved", accent: "#B91C1C", bg: "#FEE2E2" }].map((c) => (
                <View key={c.label} style={s.attStat}>
                  <Text style={s.attStatLabel}>{c.label}</Text>
                  <Text style={[s.attStatValue, { color: c.accent }]}>{c.value}</Text>
                  <Text style={s.attStatSub}>{c.sub}</Text>
                </View>
              ))}
            </View>
            <View style={[s.card, { padding: 16, marginTop: 16 }]}>
              <Text style={s.cardTitle}>Monthly breakdown</Text>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-end", height: 90 }}>
                {months.map((mo) => (
                  <View key={mo.m} style={{ flex: 1, alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", fontFamily: D.fontBold, color: mo.pct >= 90 ? "#15803D" : "#B45309" }}>{mo.pct}%</Text>
                    <View style={{ width: "100%", borderRadius: 4, height: Math.round((mo.pct / 100) * 60), backgroundColor: mo.pct >= 90 ? "#10B981" : "#F59E0B" }} />
                    <Text style={{ fontSize: 12, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.outline }}>{mo.m}</Text>
                    <Text style={{ fontSize: 10.5, fontFamily: D.font, color: D.outline }}>{mo.present}/{mo.total}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === 3 && (
          <>
            {/* Fee hero */}
            <View style={s.feeHero}>
              <Text style={s.feeLabel}>TOTAL FEE · AY 2025–26</Text>
              <Text style={s.feeTotal}>₹98,000</Text>
              <View style={s.feeBar}><View style={{ width: "75%", height: "100%", backgroundColor: "#fff", borderRadius: 999 }} /></View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                <Text style={s.feeMeta}>₹73,500 paid · 75%</Text>
                <Text style={s.feeMeta}>₹24,500 due</Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
                {[{ l: "PAID", v: "₹73,500", color: "#A7F3D0" }, { l: "OUTSTANDING", v: "₹24,500", color: "#FCA5A5" }, { l: "NEXT DUE", v: "Jul 1", color: "rgba(255,255,255,0.7)" }].map((k) => (
                  <View key={k.l} style={s.feeTile}>
                    <Text style={{ fontSize: 9.5, fontWeight: "700", fontFamily: D.fontBold, color: "rgba(255,255,255,0.65)", letterSpacing: 0.4 }}>{k.l}</Text>
                    <Text style={{ marginTop: 3, fontSize: 13, fontWeight: "800", fontFamily: D.fontExtraBold, color: k.color, letterSpacing: -0.3 }}>{k.v}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={[s.sectionLabel, { marginTop: 18 }]}>PAYMENT HISTORY</Text>
            <View style={s.card}>
              {payments.map((p, i) => {
                const st = statusStyle[p.status];
                return (
                  <View key={i} style={[s.payRow, i < payments.length - 1 && s.divider]}>
                    <View style={[s.payIcon, { backgroundColor: D.surfaceLow }]}>
                      <Ionicons name="card-outline" size={16} color={D.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.payLabel}>{p.label}</Text>
                      <Text style={s.payMeta}>{p.date} · {p.via}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={s.payAmount}>₹{p.amount}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: st.dot }} />
                        <Text style={{ fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, color: st.color }}>{st.label}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingBottom: 10, backgroundColor: D.bg },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 6, paddingRight: 10, paddingLeft: 6, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, minWidth: 38, height: 38 },
  backText: { fontSize: 12.5, fontWeight: "700", fontFamily: D.fontBold, color: D.primary, letterSpacing: -0.1 },
  headerTitle: { fontSize: 15, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.3 },
  moreBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, alignItems: "center", justifyContent: "center" },
  heroCard: { backgroundColor: D.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: D.outlineVariant, flexDirection: "row", alignItems: "center", gap: 14, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  heroName: { fontSize: 17, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.5 },
  heroMeta: { fontSize: 12, fontFamily: D.font, color: D.onSurfaceVariant, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: 0.3 },
  tabStrip: { flexDirection: "row", padding: 3, borderRadius: 14, backgroundColor: D.surfaceLow, marginTop: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: "center" },
  tabBtnActive: { backgroundColor: D.surface, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  tabText: { fontSize: 10.5, fontWeight: "700", fontFamily: D.fontBold, letterSpacing: -0.1 },
  card: { backgroundColor: D.surface, borderRadius: 20, borderWidth: 1, borderColor: D.outlineVariant, overflow: "hidden", shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: D.outlineVariant },
  infoRow: { flexDirection: "row", alignItems: "center", padding: 14 },
  infoLabel: { width: 134, fontSize: 12, fontWeight: "600", fontFamily: D.fontSemiBold, color: D.outline, letterSpacing: 0.1, flexShrink: 0 },
  infoValue: { flex: 1, fontSize: 13, fontWeight: "500", fontFamily: D.fontMedium, color: D.onSurface, letterSpacing: -0.1 },
  removeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 22, height: 52, borderRadius: 16, backgroundColor: "#FEF2F2", borderWidth: 1.5, borderColor: "#FECACA" },
  removeBtnText: { fontSize: 14, fontWeight: "700", fontFamily: D.fontBold, color: "#B91C1C", letterSpacing: -0.2 },
  rankCard: { borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: D.primary, shadowColor: D.primary, shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  rankLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: "rgba(255,255,255,0.7)", letterSpacing: 0.5 },
  rankValue: { fontSize: 34, fontWeight: "800", fontFamily: D.fontExtraBold, color: "#fff", letterSpacing: -1, lineHeight: 38 },
  rankSub: { fontSize: 12, fontFamily: D.font, color: "rgba(255,255,255,0.8)", marginTop: 3 },
  sectionLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, marginBottom: 12 },
  subjectIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  testResultRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  testName: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  testMeta: { fontSize: 11.5, fontFamily: D.font, color: D.outline, marginTop: 1 },
  scoreText: { fontSize: 13, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
  attStat: { flex: 1, padding: 14, borderRadius: 18, backgroundColor: D.surface, borderWidth: 1, borderColor: D.outlineVariant, shadowColor: D.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  attStatLabel: { fontSize: 10, fontWeight: "700", fontFamily: D.fontBold, color: D.outline, letterSpacing: 0.5, textTransform: "uppercase" },
  attStatValue: { fontSize: 18, fontWeight: "800", fontFamily: D.fontExtraBold, letterSpacing: -0.6, lineHeight: 22, marginTop: 3 },
  attStatSub: { fontSize: 10.5, fontFamily: D.font, color: D.outline, marginTop: 3 },
  cardTitle: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.2, marginBottom: 14 },
  feeHero: { borderRadius: 22, padding: 18, backgroundColor: D.primary, shadowColor: D.primary, shadowOpacity: 0.24, shadowRadius: 26, shadowOffset: { width: 0, height: 10 }, marginTop: 16 },
  feeLabel: { fontSize: 11, fontWeight: "700", fontFamily: D.fontBold, color: "rgba(255,255,255,0.7)", letterSpacing: 0.5 },
  feeTotal: { marginTop: 4, fontSize: 34, fontWeight: "800", fontFamily: D.fontExtraBold, color: "#fff", letterSpacing: -1.2, lineHeight: 38 },
  feeBar: { marginTop: 14, height: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)", overflow: "hidden" },
  feeMeta: { fontSize: 10.5, fontFamily: D.fontSemiBold, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  feeTile: { flex: 1, padding: 10, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.13)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  payRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  payIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  payLabel: { fontSize: 13, fontWeight: "700", fontFamily: D.fontBold, color: D.onSurface, letterSpacing: -0.1 },
  payMeta: { fontSize: 11.5, fontFamily: D.font, color: D.outline, marginTop: 1 },
  payAmount: { fontSize: 13, fontWeight: "800", fontFamily: D.fontExtraBold, color: D.onSurface, letterSpacing: -0.3 },
});
