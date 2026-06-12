import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

const EXPO_PROJECT_ID = "d8973aa7-81ac-4d3e-ae9c-e84f7529e62f";

// Show notifications while app is in foreground
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// Android notification channel (required for Android 8+)
export async function ensureNotificationChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "CLS Academy",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#3525CD",
    sound: "default",
  });
}

// Request permission + get Expo push token. Returns null on web or if denied.
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  await ensureNotificationChannel();

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? EXPO_PROJECT_ID;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch {
    return null;
  }
}

// Map notification data payload to an app route
export function getNotificationRoute(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  const type = data.type as string | undefined;
  const role = data.role as string | undefined;

  if (role === "admin") {
    switch (type) {
      case "leave": return "/(admin)/leave";
      case "complaint": return "/(admin)/complaints";
      case "circular": return "/(admin)/circulars";
      default: return "/(admin)/overview";
    }
  }

  if (role === "team") {
    switch (type) {
      case "leave": return "/(team)/leave";
      case "complaint": return "/(team)/announcements";
      default: return "/(team)/announcements";
    }
  }

  if (role === "teacher") {
    switch (type) {
      case "complaint": return "/(teacher)/announcements";
      default: return "/(teacher)/announcements";
    }
  }

  // Student (default)
  switch (type) {
    case "circular": return "/(student)/circulars";
    case "result": return "/(student)/results";
    case "attendance": return "/(student)/attendance";
    case "complaint": return "/(student)/complaints";
    case "schedule": return "/(student)/schedules";
    case "leave": return "/(student)/request-leave";
    default: return null;
  }
}
