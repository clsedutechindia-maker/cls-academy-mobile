import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { ColorValue } from "react-native";
import { View } from "react-native";
import { useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
      <View style={{ width: 30, height: 28, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#F5F3FF", borderRadius: 99 }, pillStyle]} />
        <Ionicons name={focused ? activeName : name} size={22} color={focused ? "#6D28D9" : (color as string)} style={{ zIndex: 1 }} />
      </View>
    );
  };
}

export default function TeacherTabsLayout() {
  const insets = useSafeAreaInsets();
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
          bottom: Math.max(insets.bottom + 8, 18),
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
      <Tabs.Screen name="students" options={{ title: "Students", tabBarIcon: TabIcon("people-outline", "people") }} />
      <Tabs.Screen name="results" options={{ title: "Results", tabBarIcon: TabIcon("document-text-outline", "document-text") }} />
      <Tabs.Screen name="other" options={{ title: "Other", tabBarIcon: TabIcon("grid-outline", "grid") }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: TabIcon("person-outline", "person") }} />
    </Tabs>
  );
}
