import { Redirect, Tabs, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { View } from "react-native";
import { useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSession } from "../../src/providers/session";
import { D } from "../../src/components/ui";

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
        <Animated.View
          style={[
            { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: D.primaryFixed, borderRadius: 10 },
            pillStyle,
          ]}
        />
        <Ionicons
          name={focused ? activeName : name}
          size={20}
          color={focused ? D.primary : (color as string)}
          style={{ zIndex: 1 }}
        />
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

export default function AdminLayout() {
  const { role, isReady } = useSession();
  if (isReady && role !== "admin") return <Redirect href="/" />;

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
      <Tabs.Screen name="overview" options={{ title: "Overview", tabBarIcon: TabIcon("grid-outline", "grid") }} />
      <Tabs.Screen name="students" options={{ title: "Students", tabBarIcon: TabIcon("people-outline", "people") }} />
      <Tabs.Screen name="staff" options={{ title: "Staff", tabBarIcon: TabIcon("briefcase-outline", "briefcase") }} />
      <Tabs.Screen
        name="operations"
        options={{
          title: "Operations",
          tabBarIcon: ActiveTabIcon("clipboard-outline", "clipboard", [
            "/complaints", "/complaint-detail", "/schedule", "/timetable-editor", "/exam-editor",
            "/results", "/result-detail", "/leave",
            "/teaching-plans", "/teaching-plan-detail", "/teaching-plan-editor",
            "/sessions",
            "/inquiries", "/inquiry-detail",
            "/fees", "/fee-detail",
          ]),
        }}
      />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: TabIcon("person-outline", "person") }} />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="lookups" options={{ href: null }} />
      <Tabs.Screen name="complaints" options={{ href: null }} />
      <Tabs.Screen name="complaint-detail" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="profile-settings" options={{ href: null }} />
      <Tabs.Screen name="leave" options={{ href: null }} />
      <Tabs.Screen name="circulars" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="timetable-editor" options={{ href: null }} />
      <Tabs.Screen name="exam-editor" options={{ href: null }} />
      <Tabs.Screen name="teaching-plans" options={{ href: null }} />
      <Tabs.Screen name="teaching-plan-detail" options={{ href: null }} />
      <Tabs.Screen name="teaching-plan-editor" options={{ href: null }} />
      <Tabs.Screen name="sessions" options={{ href: null }} />
      <Tabs.Screen name="inquiries" options={{ href: null }} />
      <Tabs.Screen name="inquiry-detail" options={{ href: null }} />
      <Tabs.Screen name="results" options={{ href: null }} />
      <Tabs.Screen name="result-detail" options={{ href: null }} />
      <Tabs.Screen name="fees" options={{ href: null }} />
      <Tabs.Screen name="fee-detail" options={{ href: null }} />
    </Tabs>
  );
}
