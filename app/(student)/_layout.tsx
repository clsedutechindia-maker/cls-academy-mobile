import { Redirect, Tabs, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { View } from "react-native";
import { useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSession } from "../../src/providers/session";
import { D } from "../../src/components/ui";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function ActiveTabIcon(name: IoniconsName, activeName: IoniconsName, subPaths: string[]) {
  return function IconComponent({ color, focused }: { color: ColorValue; focused: boolean }) {
    const pathname = usePathname();
    const isActive = focused || subPaths.some((p) => pathname.includes(p));
    const progress = useSharedValue(isActive ? 1 : 0);

    useEffect(() => {
      progress.value = withSpring(isActive ? 1 : 0, { damping: 15, stiffness: 150 });
    }, [isActive]);

    const pillStyle = useAnimatedStyle(() => ({
      transform: [{ scale: 0.8 + 0.2 * progress.value }],
      opacity: progress.value,
    }));

    return (
      <View style={{ paddingHorizontal: 12, paddingVertical: 4, alignItems: "center", marginBottom: 4, justifyContent: "center" }}>
        <Animated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: D.primaryFixed, borderRadius: 10 },
            pillStyle,
          ]}
        />
        <Ionicons name={isActive ? activeName : name} size={20} color={isActive ? D.primary : (color as string)} style={{ zIndex: 1 }} />
      </View>
    );
  };
}

export default function StudentLayout() {
  const { role, isReady } = useSession();

  if (isReady && role !== "student") {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: D.primary,
        tabBarInactiveTintColor: D.outline,
        animation: "shift",
        tabBarStyle: {
          position: "absolute",
          bottom: 18,
          left: 14,
          right: 14,
          backgroundColor: "#ffffff",
          borderTopColor: "transparent",
          borderColor: D.outlineVariant,
          borderWidth: 1,
          borderRadius: 24,
          height: 64,
          paddingBottom: 0,
          paddingTop: 0,
          elevation: 8,
          shadowColor: "#1f0c50",
          shadowOpacity: 0.16,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 12 },
        },
        tabBarItemStyle: { paddingVertical: 8 },
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: "600", letterSpacing: 0.1, marginTop: -4 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: "Home", tabBarIcon: ActiveTabIcon("home-outline", "home", []) }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: "Results",
          tabBarIcon: ActiveTabIcon("document-text-outline", "document-text", ["/subject-results", "/result-detail"]),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: "Attendance",
          tabBarIcon: ActiveTabIcon("checkmark-circle-outline", "checkmark-circle", ["/request-leave"]),
        }}
      />
      <Tabs.Screen
        name="other"
        options={{
          title: "Other",
          tabBarIcon: ActiveTabIcon("grid-outline", "grid", [
            "/circulars", "/schedules", "/materials", "/complaints", "/doubts",
            "/circular-detail", "/material-detail", "/complaint-detail", "/new-complaint",
            "/doubt-detail", "/submit-doubt", "/test-schedule-detail", "/announcements",
            "/teaching-plan", "/teaching-plan-detail",
          ]),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          tabBarIcon: ActiveTabIcon("person-outline", "person", ["/edit-details", "/notifications"]),
        }}
      />
      <Tabs.Screen name="announcements" options={{ href: null }} />
      <Tabs.Screen name="circulars" options={{ href: null }} />
      <Tabs.Screen name="schedules" options={{ href: null }} />
      <Tabs.Screen name="teaching-plan" options={{ href: null }} />
      <Tabs.Screen name="teaching-plan-detail" options={{ href: null }} />
      <Tabs.Screen name="materials" options={{ href: null }} />
      <Tabs.Screen name="complaints" options={{ href: null }} />
      <Tabs.Screen name="doubts" options={{ href: null }} />
      <Tabs.Screen name="subject-results" options={{ href: null }} />
      <Tabs.Screen name="result-detail" options={{ href: null }} />
      <Tabs.Screen name="request-leave" options={{ href: null }} />
      <Tabs.Screen name="test-schedule-detail" options={{ href: null }} />
      <Tabs.Screen name="material-detail" options={{ href: null }} />
      <Tabs.Screen name="circular-detail" options={{ href: null }} />
      <Tabs.Screen name="complaint-detail" options={{ href: null }} />
      <Tabs.Screen name="new-complaint" options={{ href: null }} />
      <Tabs.Screen name="doubt-detail" options={{ href: null }} />
      <Tabs.Screen name="submit-doubt" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="edit-details" options={{ href: null }} />
    </Tabs>
  );
}
