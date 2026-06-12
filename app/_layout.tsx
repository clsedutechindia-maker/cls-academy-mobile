import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useFonts } from "expo-font";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Notifications from "expo-notifications";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { SessionProvider, useSession } from "../src/providers/session";
import { DevSwitcher } from "../src/components/DevSwitcher";
import { NavigationHistoryTracker } from "../src/lib/navigation";
import { setupNotificationHandler, registerForPushNotifications, getNotificationRoute } from "../src/lib/notifications";
import { savePushToken } from "../src/lib/erp";

SplashScreen.preventAutoHideAsync();

// Run once at module level (before any component mounts)
if (Platform.OS !== "web") {
  setupNotificationHandler();
}

function NotificationManager() {
  const { authUser, isReady } = useSession();
  const tokenRegistered = useRef(false);

  // Register push token once user is signed in
  useEffect(() => {
    if (!isReady || !authUser || tokenRegistered.current || Platform.OS === "web") return;
    tokenRegistered.current = true;
    void (async () => {
      const token = await registerForPushNotifications();
      if (token) {
        try {
          await savePushToken(authUser.uid, token);
        } catch {
          // Non-fatal — user still works without token saved
        }
      }
    })();
  }, [isReady, authUser]);

  // Re-register if user changes
  useEffect(() => {
    tokenRegistered.current = false;
  }, [authUser?.uid]);

  // Navigate to relevant screen when user taps a notification
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const route = getNotificationRoute(data);
      if (route) {
        router.push(route as any);
      }
    });
    return () => sub.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [error, loaded]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SessionProvider>
      <NavigationHistoryTracker />
      <NotificationManager />
      <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(teacher)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(team)" />
        <Stack.Screen name="unsupported" />
      </Stack>
      <DevSwitcher />
    </SessionProvider>
  );
}
