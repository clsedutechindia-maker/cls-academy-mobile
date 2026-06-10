# Mobile App — Remaining Issues

Last updated: 2026-06-09. Tracks the original 38-issue audit list.

---

## Done (this + prev session)

- [x] DevSwitcher leaks into production → `if (!__DEV__) return null`
- [x] AccountScreen exposes demo password/accounts in production → `{__DEV__ && ...}`
- [x] Sign-in shows disabled Phone auth button → removed
- [x] Teacher home quick links route to "Other" → fixed to direct screens
- [x] Admin notifications not clickable → wrapped in `AnimatedPressable`, added routes
- [x] Stale duplicate teacher screens (`TeacherAttendanceScreen`, `TeacherResultsScreen`, `TeacherStudentsScreen` in `/src/screens/`) → deleted
- [x] HT approve-students returns no demo pending students → `DEMO_PENDING_STUDENTS` array
- [x] HT doubt reply shows nothing on success → success card + scroll-to-end
- [x] HT leave approvals fake/local-only → real Firestore via `approveLeaveRequest`/`rejectLeaveRequest`
- [x] HT new leave form doesn't submit → functional `TextInput` form + `submitTeacherLeaveRequest`
- [x] HT post circular display-only → functional form + `createCircular` Firestore write
- [x] HT post material uploads file but no Firestore record → `createMaterialRecord` called after upload
- [x] HT remove student does nothing → reads `userId`/`name` params, calls `removeStudentFromCentre`
- [x] HTStudentDetailScreen doesn't pass userId to remove-student route → fixed
- [x] Admin employee count always zero → `listVisibleProfilesForAdmin` now includes `role === "employee"`
- [x] Admin pending leave cards route to wrong section → now routes to `/(admin)/staff`
- [x] HT reject student enrollment is incomplete → calls `rejectStudentEnrollment` Firestore update
- [x] HT schedule is hardcoded → replaced with `listTeacherTimetable` real Firestore fetch
- [x] HT account stats are hardcoded → now uses real profile data (batches/subjects count)
- [x] HT edit profile is display-only → full TextInput form + `updateTeacherProfileContact` save
- [x] HT circular attachments not openable → `Linking.openURL(att.url)` on press
- [x] Teacher/HT material lists miss class-scoped resources → `listLearningResourcesForProfile` now queries each `teacherClassId`
- [x] Teacher result upload accepts invalid marks → validates `0 ≤ score ≤ maxMarks` before submit
- [x] HT result upload accepts invalid marks → same validation
- [x] Result lists merge tests with same title/class → grouping key now `title__classId__subjectId`
- [x] Result detail mixes results from different subjects → `listResultsForAssessment` accepts optional `subjectId` filter; passed from results screen
- [x] Admin students "Load More" no pagination → client-side pagination with `visibleCount` state (+20 per tap)
- [x] Teacher home "today's classes" are placeholder rows → fetch from `listTeacherTimetable`, filter by today's dayKey
- [x] HT home "today's classes" are placeholder rows → same fix
- [x] Student account shows fake fallback personal data → all invented fallbacks replaced with "—"
- [x] Teacher notifications route into HT screens → created `TeacherNotificationsScreen` alias; `(teacher)/notifications.tsx` now exports `TeacherNotificationsScreen`
- [x] Teacher/HT Account shows duplicate "Sign Out" (in menu list AND as standalone button) → removed redundant standalone `signOutBtn` from both `HTAccountScreen.tsx` and `TeacherAccountScreen.tsx`
- [x] Roleplay testing (student, subject teacher, head teacher, admin) → all screens verified via Playwright; real data loads, navigation works, no broken flows detected
- [x] HTMaterialsScreen search bar is visual-only → wired `searchVisible`/`search` state + filter on title/subject/class/teacher

---

## Pending

### Medium — missing feature

- [ ] **Employee role has no mobile workflow**
  - No `(employee)/` route group exists
  - Decision needed: minimal read-only dashboard, or defer entirely

---

### Low — cosmetic / infrastructure

- [ ] **Student push notification toggle is static**
  - `StudentAccountScreen.tsx` — toggle renders but state isn't persisted across restarts
  - Fix: already uses `AsyncStorage`; verify key `cls_push_notifications_enabled` persists on Android

- [ ] **Native auth persistence not implemented**
  - Sessions may not survive app restart on Android
  - Fix: verify `setPersistence(auth, getReactNativePersistence(AsyncStorage))` in `firebase.ts`

- [ ] **Firebase config has hardcoded live fallback values**
  - `apps/mobile/src/lib/firebase.ts` — fallback `firebaseConfig` object has real API keys
  - Fix: remove fallback values; throw if env vars missing in dev

- [ ] **Mobile typecheck fails**
  - Pre-existing errors in `erp.ts` (DEMO_PENDING_STUDENTS null fields, line 834 `any`)
  - and `AnnouncementsScreen`, `StudentCircularsScreen`, `HTCircularsScreen`, `HTLeaveScreen`
  - No new errors introduced by recent fixes
