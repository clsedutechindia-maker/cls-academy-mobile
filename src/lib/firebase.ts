import { initializeApp, getApp, getApps } from "firebase/app";
import { browserLocalPersistence, getAuth, GoogleAuthProvider, initializeAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache, persistentLocalCache, persistentSingleTabManager } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyD1uSdF6Q41zr-TvpWG2tRezM4Fb9wCPgc",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "cls-edutech.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "cls-edutech",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "cls-edutech.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "377305665442",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:377305665442:web:9ad7d65239fcd68a262cfb",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  try {
    if (Platform.OS === "web") {
      // Do NOT pass browserPopupRedirectResolver here — Firebase tries to create hidden
      // iframes during initializeAuth before document.body is ready, which crashes.
      // Pass the resolver explicitly at the signInWithRedirect / getRedirectResult call sites instead.
      return initializeAuth(app, { persistence: browserLocalPersistence });
    }
    // Native: no getReactNativePersistence in firebase v12 JS SDK.
    // Users need to re-login after app restart until @react-native-firebase is adopted.
    return initializeAuth(app);
  } catch {
    // Auth already initialized (hot reload / module re-evaluation) — return existing instance.
    return getAuth(app);
  }
}

export const firebaseAuth = createAuth();

function createFirestore() {
  try {
    if (Platform.OS === "web") {
      // Single-tab manager: multi-tab's primary-lease heartbeat does a Date.now()
      // read-after-write that intermittently logs Firestore's bogus
      // "Detected an update time that is in the future" console.error,
      // which Expo's web overlay treats as a fatal error.
      return initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentSingleTabManager(undefined) }),
      });
    }
    return initializeFirestore(app, { localCache: memoryLocalCache() });
  } catch {
    return getFirestore(app);
  }
}

export const firestoreDb = createFirestore();
export const firebaseStorage = getStorage(app);
export const googleProvider = (() => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return provider;
})();
