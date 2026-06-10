import { browserPopupRedirectResolver, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signInWithCredential, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut, type User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { Platform } from "react-native";
import { firebaseAuth, firestoreDb, googleProvider } from "../lib/firebase";
// Lazy-loaded: only available in dev builds, not Expo Go
let GoogleSignin: typeof import("@react-native-google-signin/google-signin").GoogleSignin | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  GoogleSignin = (require("@react-native-google-signin/google-signin") as typeof import("@react-native-google-signin/google-signin")).GoogleSignin;
} catch {
  // Expo Go — native Google Sign-In unavailable, fall back to web popup or email/password
}
import {
  adminCollectionName,
  formatAdminRoleLabel,
  normalizeAdminRecord,
  normalizeUserProfileRecord,
  userProfilesCollectionName,
  type AdminRecord,
  type UserProfileRecord,
} from "../shared";

type SessionRole = "loading" | "guest" | "student" | "teacher" | "admin" | "employee" | "unsupported";

type SessionContextValue = {
  authUser: User | null;
  adminRecord: AdminRecord | null;
  profile: UserProfileRecord | null;
  role: SessionRole;
  isReady: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  refresh: () => Promise<void>;
  roleLabel: string;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const googleRedirectMarkerKey = "cls-academy:google-sign-in-started";

function getGoogleRedirectMarker() {
  if (Platform.OS !== "web" || typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(googleRedirectMarkerKey) === "true";
}

function setGoogleRedirectMarker() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.sessionStorage.setItem(googleRedirectMarkerKey, "true");
  }
}

function clearGoogleRedirectMarker() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.sessionStorage.removeItem(googleRedirectMarkerKey);
  }
}

function normalizeEmail(value: string | null | undefined) {
  return (value || "").trim().toLowerCase();
}

function formatAuthError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unable to sign in. Please try again.";
  }
  const msg = error.message;
  if (msg.includes("auth/wrong-password") || msg.includes("auth/invalid-credential")) {
    return "Incorrect email or password.";
  }
  if (msg.includes("auth/user-not-found")) {
    return "No account found with this email.";
  }
  if (msg.includes("auth/too-many-requests")) {
    return "Too many failed attempts. Please wait and try again.";
  }
  if (msg.includes("auth/network-request-failed")) {
    return "Network error. Check your connection and try again.";
  }
  if (msg.includes("auth/user-disabled")) {
    return "This account has been disabled. Contact your admin.";
  }
  if (msg.includes("auth/invalid-email")) {
    return "Invalid email address.";
  }
  if (msg.includes("auth/popup-blocked")) {
    return "Sign-in popup was blocked. Please allow popups and try again.";
  }
  if (msg.includes("auth/cancelled-popup-request") || msg.includes("auth/popup-closed-by-user")) {
    return "Sign-in was cancelled.";
  }
  return "Unable to sign in. Please try again.";
}

const GOOGLE_WEB_CLIENT_ID = "377305665442-co8u2vmlgstaj8hu4e6j752h15p531ut.apps.googleusercontent.com";

export function SessionProvider({ children }: PropsWithChildren) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [adminRecord, setAdminRecord] = useState<AdminRecord | null>(null);
  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Prevents sign-in screen flash while Google redirect result is being processed.
  const [pendingGoogleRedirect, setPendingGoogleRedirect] = useState(
    () => Platform.OS === "web" && getGoogleRedirectMarker(),
  );
  // Generation counter ensures stale concurrent hydrateUser calls don't overwrite newer results.
  const hydrationGenRef = useRef(0);

  const hydrateUser = useCallback(async (user: User | null) => {
    const gen = ++hydrationGenRef.current;

    if (!user) {
      if (gen !== hydrationGenRef.current) return;
      setAdminRecord(null);
      setProfile(null);
      setError(null);
      setIsReady(true);
      return;
    }

    setIsReady(false);

    try {
      const [adminSnapshot, profileSnapshot] = await Promise.all([
        getDoc(doc(firestoreDb, adminCollectionName, user.uid)),
        getDoc(doc(firestoreDb, userProfilesCollectionName, user.uid)),
      ]);

      if (gen !== hydrationGenRef.current) return;

      setAdminRecord(adminSnapshot.exists() ? normalizeAdminRecord(adminSnapshot.data()) : null);
      if (profileSnapshot.exists()) {
        setProfile(normalizeUserProfileRecord(user.uid, profileSnapshot.data(), user.email || ""));
        setError(null);
        return;
      }

      const email = normalizeEmail(user.email);

      if (!email) {
        setProfile(null);
        setError(null);
        return;
      }

      const profileByEmailSnapshot = await getDocs(
        query(collection(firestoreDb, userProfilesCollectionName), where("email", "==", email), limit(1)),
      );

      if (gen !== hydrationGenRef.current) return;

      const matchedProfileDocument = profileByEmailSnapshot.docs[0];

      if (!matchedProfileDocument) {
        setProfile(null);
        setError(null);
        return;
      }

      const matchedProfile = normalizeUserProfileRecord(matchedProfileDocument.id, matchedProfileDocument.data(), email);

      if (user.emailVerified) {
        const linkedProfile = {
          ...matchedProfile,
          userId: user.uid,
          email,
          emailVerified: true,
          linkedFromUserId: matchedProfileDocument.id,
          linkedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          authProvider: "google.com",
        };

        await setDoc(doc(firestoreDb, userProfilesCollectionName, user.uid), linkedProfile, { merge: true });
        if (gen !== hydrationGenRef.current) return;
        setProfile(normalizeUserProfileRecord(user.uid, linkedProfile, email));
      } else {
        setProfile(matchedProfile);
      }
      setError(null);
    } catch (loadError) {
      if (gen !== hydrationGenRef.current) return;
      setError(loadError instanceof Error ? loadError.message : "Unable to load your ERP account.");
      setAdminRecord(null);
      setProfile(null);
    } finally {
      if (gen === hydrationGenRef.current) {
        setIsReady(true);
      }
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (user) => {
      setAuthUser(user);
      // Skip hydration if we know a Google redirect is still pending —
      // the getRedirectResult effect below will hydrate once the redirect settles.
      if (pendingGoogleRedirect && !user) {
        return;
      }
      void hydrateUser(user);
    });
    // pendingGoogleRedirect intentionally excluded: this listener should only register once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrateUser]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const hadPendingGoogleRedirect = getGoogleRedirectMarker();

    // Safety timeout: if getRedirectResult hangs (Firebase iframe crash, cross-origin
    // issue, etc.), clear the pending state after 10s so the app isn't frozen.
    const safetyTimer = setTimeout(() => {
      clearGoogleRedirectMarker();
      setPendingGoogleRedirect(false);
      if (firebaseAuth.currentUser) {
        setAuthUser(firebaseAuth.currentUser);
        void hydrateUser(firebaseAuth.currentUser);
      } else if (hadPendingGoogleRedirect) {
        setError("Google sign-in timed out. Please try again.");
        void hydrateUser(null);
      }
    }, 10_000);

    // Pass the resolver explicitly here (not at initializeAuth time) so Firebase
    // only creates its hidden iframe after the DOM is ready.
    void getRedirectResult(firebaseAuth, browserPopupRedirectResolver)
      .then((result) => {
        clearTimeout(safetyTimer);
        clearGoogleRedirectMarker();
        setPendingGoogleRedirect(false);

        if (result?.user) {
          setAuthUser(result.user);
          void hydrateUser(result.user);
          return;
        }

        if (hadPendingGoogleRedirect) {
          if (firebaseAuth.currentUser) {
            setAuthUser(firebaseAuth.currentUser);
            void hydrateUser(firebaseAuth.currentUser);
          } else {
            setError("Google sign-in completed but no session was created. Use your provisioned ERP account email and try again.");
            void hydrateUser(null);
          }
        }
        // No pending redirect: onAuthStateChanged already handled everything — do nothing.
      })
      .catch((redirectError) => {
        clearTimeout(safetyTimer);
        clearGoogleRedirectMarker();
        setPendingGoogleRedirect(false);
        setError(formatAuthError(redirectError));
        if (!firebaseAuth.currentUser) {
          void hydrateUser(null);
        }
      });

    return () => clearTimeout(safetyTimer);
  }, [hydrateUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    } catch (signInError) {
      throw new Error(formatAuthError(signInError));
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);

    if (Platform.OS !== "web") {
      if (!GoogleSignin) {
        // Expo Go — native module unavailable, fall through to web popup path
      } else {
        // Native Google Sign-In via @react-native-google-signin/google-signin
        try {
          GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
          const response = await GoogleSignin.signIn();
          const idToken = response.data?.idToken;
          if (!idToken) {
            throw new Error("Google sign-in succeeded but no ID token was returned.");
          }
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(firebaseAuth, credential);
          // Success: onAuthStateChanged fires and hydrateUser handles the rest.
          return;
        } catch (nativeError: unknown) {
          const code = (nativeError as { code?: string }).code ?? "";
          if (code === "SIGN_IN_CANCELLED" || code === "12501") {
            // User dismissed — not an error.
            return;
          }
          throw new Error(formatAuthError(nativeError));
        }
      }
    }

    try {
      // Popup is the preferred path — no redirect round-trip, no iframe timing issues.
      await signInWithPopup(firebaseAuth, googleProvider, browserPopupRedirectResolver);
      // Success: onAuthStateChanged fires and hydrateUser handles the rest.
    } catch (popupError: unknown) {
      const code = (popupError as { code?: string }).code ?? "";
      if (code === "auth/popup-blocked") {
        // Embedded browser or strict popup policy — fall back to redirect flow.
        setGoogleRedirectMarker();
        setPendingGoogleRedirect(true);
        await signInWithRedirect(firebaseAuth, googleProvider, browserPopupRedirectResolver);
      } else if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // User dismissed — not an error.
      } else {
        throw new Error(formatAuthError(popupError));
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(firebaseAuth);
  }, []);

  const refresh = useCallback(async () => {
    await hydrateUser(firebaseAuth.currentUser);
  }, [hydrateUser]);

  const role = useMemo<SessionRole>(() => {
    if (!isReady || pendingGoogleRedirect) {
      return "loading";
    }

    if (!authUser) {
      return "guest";
    }

    if (adminRecord?.active) {
      return "admin";
    }

    if (profile?.role === "student") {
      return "student";
    }

    if (profile?.role === "teacher") {
      return "teacher";
    }

    if (profile?.role === "employee") {
      return "employee";
    }

    return "unsupported";
  }, [adminRecord?.active, authUser, isReady, pendingGoogleRedirect, profile?.role]);

  const roleLabel = useMemo(() => {
    if (role === "admin") {
      return formatAdminRoleLabel(adminRecord?.role || "admin");
    }

    if (role === "teacher") {
      return "Teacher";
    }

    if (role === "student") {
      return "Student";
    }

    if (role === "employee") {
      return "Employee";
    }

    return "Member";
  }, [adminRecord?.role, role]);

  return (
    <SessionContext.Provider
      value={{
        authUser,
        adminRecord,
        profile,
        role,
        isReady,
        error,
        signIn,
        signInWithGoogle,
        signOutUser,
        refresh,
        roleLabel,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside SessionProvider.");
  }

  // Inject demo profile/role transparently so every screen works without Firebase
  const demoRole = getDemoRole();
  if (isDemoMode() && demoRole) {
    const demoProfile = DEMO_PROFILES[demoRole];
    const sessionRole = DEMO_ROLE_TO_SESSION[demoRole];
    return {
      ...context,
      profile: demoProfile,
      role: sessionRole,
      isReady: true,
      error: null,
      adminRecord: demoRole === "admin" ? (DEMO_ADMIN_RECORD as any) : null,
    };
  }

  return context;
}

// ─── Demo session overlay (dev only) ─────────────────────────────────────────
import { getDemoRole, isDemoMode } from "../lib/demoMode";
import { DEMO_PROFILES, DEMO_ADMIN_RECORD } from "../lib/demoData";
import type { DemoRole } from "../lib/demoMode";

const DEMO_ROLE_TO_SESSION: Record<DemoRole, SessionRole> = {
  student: "student",
  subject_teacher: "teacher",
  class_teacher: "teacher",
  head_teacher: "teacher",
  admin: "admin",
};

export function useDemoAwareSession() {
  const real = useSession();
  const demoRole = getDemoRole();
  if (!isDemoMode() || !demoRole) return real;

  const demoProfile = DEMO_PROFILES[demoRole];
  const sessionRole = DEMO_ROLE_TO_SESSION[demoRole];

  return {
    ...real,
    authUser: real.authUser,
    adminRecord: demoRole === "admin" ? (DEMO_ADMIN_RECORD as any) : null,
    profile: demoProfile,
    role: sessionRole,
    isReady: true,
    error: null,
    roleLabel: demoRole === "admin" ? "Centre Incharge" : demoRole === "head_teacher" ? "Head Teacher" : demoRole === "class_teacher" ? "Class Teacher" : demoRole === "student" ? "Student" : "Subject Teacher",
  };
}
