import { Redirect, Tabs, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { View } from "react-native";
import { useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSession } from "../../src/providers/session";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon(name: IoniconsName, activeName: IoniconsName) {
  return function IconComponent({ color, focused }: { color: ColorValue; focused: boolean }) {
    const progress = useSharedValue(focused ? 1 : 0);

    useEffect(() => {
      progress.value = withSpring(focused ? 1 : 0, { damping: 15, stiffness: 150 });
    }, [focused]);

    const pillStyle = useAnimatedStyle(() => ({
      transform: [{ scale: 0.8 + 0.2 * progress.value }],
      opacity: progress.value,
    }));

    return (
      <View style={{ paddingHorizontal: 12, paddingVertical: 4, alignItems: "center", marginBottom: 4, justifyContent: "center" }}>
        <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#F5F3FF", borderRadius: 99 }, pillStyle]} />
        <Ionicons name={focused ? activeName : name} size={22} color={focused ? "#6D28D9" : (color as string)} style={{ zIndex: 1 }} />
      </View>
    );
  };
}

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
        <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#F5F3FF", borderRadius: 99 }, pillStyle]} />
        <Ionicons name={isActive ? activeName : name} size={22} color={isActive ? "#6D28D9" : (color as string)} style={{ zIndex: 1 }} />
      </View>
    );
  };
}

export default function TeamLayout() {
  const { role, isReady } = useSession();

  if (isReady && role !== "team") {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6D28D9",
        tabBarInactiveTintColor: "#8B82A1",
        animation: "shift",
        tabBarStyle: {
          position: "absolute",
          bottom: 18,
          left: 14,
          right: 14,
          backgroundColor: "#ffffff",
          borderTopColor: "transparent",
          borderColor: "#EDE9F5",
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
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: TabIcon("home-outline", "home") }} />
      <Tabs.Screen
        name="students"
        options={{
          title: "Students",
          tabBarIcon: ActiveTabIcon("people-outline", "people", ["/student-detail", "/approve-student", "/remove-student"]),
        }}
      />
      <Tabs.Screen
        name="results"
        options={{
          title: "Results",
          tabBarIcon: ActiveTabIcon("document-text-outline", "document-text", ["/upload-result", "/result-detail"]),
        }}
      />
      <Tabs.Screen
        name="other"
        options={{
          title: "Other",
          tabBarIcon: ActiveTabIcon("grid-outline", "grid", [
            "/schedule", "/timetable-editor", "/exam-editor",
            "/circulars", "/post-circular", "/circular-detail",
            "/leave", "/new-leave", "/materials", "/post-material", "/material-detail",
            "/doubts", "/doubt-detail",
            "/teaching-plans", "/teaching-plan-detail", "/teaching-plan-editor",
            "/sessions",
            "/inquiries", "/log-inquiry", "/inquiry-detail",
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
      {/* Sub-screens hidden from tab bar */}
      <Tabs.Screen name="student-detail" options={{ href: null }} />
      <Tabs.Screen name="approve-student" options={{ href: null }} />
      <Tabs.Screen name="remove-student" options={{ href: null }} />
      <Tabs.Screen name="upload-result" options={{ href: null }} />
      <Tabs.Screen name="result-detail" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="timetable-editor" options={{ href: null }} />
      <Tabs.Screen name="exam-editor" options={{ href: null }} />
      <Tabs.Screen name="teaching-plans" options={{ href: null }} />
      <Tabs.Screen name="teaching-plan-detail" options={{ href: null }} />
      <Tabs.Screen name="teaching-plan-editor" options={{ href: null }} />
      <Tabs.Screen name="sessions" options={{ href: null }} />
      <Tabs.Screen name="inquiries" options={{ href: null }} />
      <Tabs.Screen name="log-inquiry" options={{ href: null }} />
      <Tabs.Screen name="inquiry-detail" options={{ href: null }} />
      <Tabs.Screen name="circulars" options={{ href: null }} />
      <Tabs.Screen name="post-circular" options={{ href: null }} />
      <Tabs.Screen name="circular-detail" options={{ href: null }} />
      <Tabs.Screen name="leave" options={{ href: null }} />
      <Tabs.Screen name="new-leave" options={{ href: null }} />
      <Tabs.Screen name="materials" options={{ href: null }} />
      <Tabs.Screen name="post-material" options={{ href: null }} />
      <Tabs.Screen name="material-detail" options={{ href: null }} />
      <Tabs.Screen name="doubts" options={{ href: null }} />
      <Tabs.Screen name="doubt-detail" options={{ href: null }} />
      <Tabs.Screen name="edit-details" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
