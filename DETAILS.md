# CLS Academy Mobile — Head Teacher Portal + Demo System

## What was built

### Head Teacher Portal (`app/(head-teacher)/`)

Full portal for users with `profile.teacherRole === "head_teacher"`. 5-tab floating pill tab bar matching the student/teacher layout style.

**Routing:** `app/(head-teacher)/_layout.tsx`
- Auth guard: redirects to `/` if `role !== "teacher" || teacherRole !== "head_teacher"`
- 5 visible tabs: Home, Students, Results, Other, Account
- 17 sub-screens declared with `href: null` (hidden from tab bar, push-navigable)

**Tabs:**

| Tab | Route | Screen |
|-----|-------|--------|
| Home | `home` | `HTHomeScreen` |
| Students | `students` | `HTStudentsScreen` |
| Results | `results` | `HTResultsScreen` |
| Other | `other` | `HTOtherScreen` |
| Account | `account` | `HTAccountScreen` |

**Sub-screens (href: null):**

| Route | Screen | Navigated from |
|-------|--------|----------------|
| `student-detail` | `HTStudentDetailScreen` | Students list |
| `approve-student` | `HTApproveStudentScreen` | Students FAB / detail |
| `remove-student` | `HTRemoveStudentScreen` | Student detail |
| `upload-result` | `HTUploadResultScreen` | Results header button |
| `result-detail` | `HTResultDetailScreen` | Results list |
| `schedule` | `HTScheduleScreen` | Other → Schedule card |
| `circulars` | `HTCircularsScreen` | Other → Circulars card |
| `post-circular` | `HTPostCircularScreen` | Circulars header + |
| `circular-detail` | `HTCircularDetailScreen` | Circulars list row |
| `leave` | `HTLeaveScreen` | Other → Leave card |
| `new-leave` | `HTNewLeaveScreen` | Leave header + |
| `materials` | `HTMaterialsScreen` | Other → Materials card |
| `post-material` | `HTPostMaterialScreen` | Materials header + |
| `material-detail` | `HTMaterialDetailScreen` | Materials list row |
| `doubts` | `HTDoubtsScreen` | Other → Doubts row |
| `doubt-detail` | `HTDoubtDetailScreen` | Doubts list row |
| `edit-details` | `HTEditDetailsScreen` | Account → Edit Profile |

---

### Screen file locations

All screens live in `src/screens/ht/`. Each screen is a named export (not default) — route files in `app/(head-teacher)/` re-export as default.

**Pattern:**
```ts
// app/(head-teacher)/some-screen.tsx
export { HTSomeScreen as default } from "../../src/screens/ht/HTSomeScreen";
```

---

### Design tokens used

Screens that were auto-upgraded by the user's linter use the shared `D` object from `src/components/theme.ts` + `AnimatedPressable` from `src/components/motion.tsx`. Screens not yet upgraded still use inline hex constants matching the same palette:

```
Purple:    #6D28D9  (D.primary)
P50:       #F5F3FF  (D.surfaceLow)
P100/P200: #EDE9FE / #DDD6FE (D.surfaceHigh)
Ink:       #1B1230  (D.onSurface)
Ink2:      #4B3E66  (D.onSurfaceVariant)
Muted:     #8B82A1  (D.outline)
Line:      #EDE9F5  (D.outlineVariant)
BG:        #FAF8FF  (D.bg)
Surface:   #FFFFFF  (D.surface)
```

Font: **Plus Jakarta Sans** (loaded in `app/_layout.tsx` via `@expo-google-fonts/plus-jakarta-sans`, weights 400–800).

---

### Routing wiring

**`app/index.tsx`** — role-based redirect:
```ts
if (role === "teacher") {
  if (profile?.teacherRole === "head_teacher") {
    return <Redirect href="/(head-teacher)/home" />;
  }
  return <Redirect href="/(teacher)/announcements" />;
}
```

**`app/_layout.tsx`** — added `<Stack.Screen name="(head-teacher)" />` and `<DevSwitcher />`.

---

### Demo / Account Switcher System

Allows switching between 5 user personas without Firebase auth. Useful for development and design review.

#### Files

| File | Purpose |
|------|---------|
| `src/lib/demoMode.ts` | Module-level flag. `setDemoRole()`, `getDemoRole()`, `isDemoMode()` |
| `src/lib/demoData.ts` | All mock data (profiles, attendance, results, timetable, circulars, materials, complaints, doubts, leaves, notifications) |
| `src/components/DevSwitcher.tsx` | Floating `DEV` button + bottom-sheet role picker |

#### How it works

1. `DevSwitcher` calls `setDemoRole(role)` and navigates to the role's home route
2. `useSession()` in `src/providers/session.tsx` checks `isDemoMode()` — if active, returns the mock profile + role instead of real Firebase data
3. All erp functions (`listStudentResults`, `listStudentAttendance`, etc.) check `isDemoMode()` at top and return mock data early

#### Personas

| ID | Label | Profile | Route |
|----|-------|---------|-------|
| `student` | Student | Aanya Verma · NEET 11-B · Roll #001 | `/(student)/home` |
| `subject_teacher` | Subject Teacher | Mr. Ramesh Kumar · Physics | `/(teacher)/announcements` |
| `class_teacher` | Class Teacher | Ms. Priya Sharma · NEET 11-B · Chemistry | `/(teacher)/announcements` |
| `head_teacher` | Head Teacher | Dr. Anand Joshi | `/(head-teacher)/home` |
| `admin` | Centre Incharge | Mrs. Kavita Singh · Raipur | `/(admin)/overview` |

#### Demo data volume

- **Attendance:** 30 records, ~83% present rate
- **Results:** 10 entries across Physics/Chemistry/Biology/Math, with grades, remarks, class averages
- **Timetable:** 6-day week, 4 slots/day, subjects rotating across days
- **Test schedules:** 5 upcoming tests with dates (Jun 11–24)
- **Circulars:** 8 entries (exam, holiday, PTM, fees, general tags)
- **Materials:** 8 files with PDF attachment metadata
- **Complaints:** 3 (open / in_progress / resolved)
- **Doubts:** 4 (replied / open / resolved)
- **Leave requests:** 4 (pending / approved / rejected)
- **Notifications:** 8 across all types
- **Admin staff leaves:** 4 (for admin view)

#### erp.ts functions intercepted

```
listAnnouncementsForProfile  → getDemoAnnouncements()
listStudentResults           → getDemoStudentResults()
listStudentAttendance        → getDemoStudentAttendance()
listStudentSchedules         → getDemoStudentSchedules()
listLearningResourcesForProfile → getDemoMaterials()
listStudentComplaints        → getDemoComplaints()
listStudentDoubts            → getDemoDoubts()
listStudentLeaveRequests     → getDemoLeaveRequests()
getStudentNotifications      → getDemoNotifications()
listPendingLeaveRequests     → getDemoAdminLeaveRequests()
```

---

### Dev server

```bash
cd apps/mobile
npx expo start --web --port 8081
```

Opens at **http://localhost:8081**

`DEV` button appears bottom-right above the tab bar — tap to open account switcher.

---

### Known gaps / not yet done

- Head Teacher screens still use static/hardcoded mock data (not wired to real Firestore) — intentional, HT Firestore collections not defined yet
- Teacher layout `profile` may not be destructured in some existing sub-screens (subject/class teacher view under `/(teacher)/`)
- Employee role screen exists in code but is deprioritized (hidden from nav)
- `HTStudentDetailScreen` 4-tab layout (Basic/Results/Attendance/Fee) uses static data — real data would require cross-querying by studentId
