import { useEffect } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../src/providers/session";
import { setDemoRole } from "../src/lib/demoMode";
import { router } from "expo-router";

// Dev-only: auto-recover test accounts that have no Firestore profile
const TEST_EMAIL_ROLE_MAP: Record<string, { demoRole: import("../src/lib/demoMode").DemoRole; route: string }> = {
  "demo.student.neet@clsacademy.test": { demoRole: "student", route: "/(student)/home" },
  "demo.student.jee@clsacademy.test": { demoRole: "student", route: "/(student)/home" },
  "demo.student.practice@clsacademy.test": { demoRole: "student", route: "/(student)/home" },
  "demo.teacher@clsacademy.test": { demoRole: "team", route: "/(team)/home" },
  "demo.subject.teacher@clsacademy.test": { demoRole: "teacher", route: "/(teacher)/announcements" },
  "demo.admin@clsacademy.test": { demoRole: "admin", route: "/(admin)/overview" },
};

export default function IndexRoute() {
  const { role, authUser, isReady, profile } = useSession();

  useEffect(() => {
    if (!__DEV__) return;
    if (role !== "unsupported") return;
    const email = authUser?.email?.toLowerCase() ?? "";
    const match = TEST_EMAIL_ROLE_MAP[email];
    if (match) {
      setDemoRole(match.demoRole);
      router.replace(match.route as any);
    }
  }, [role, authUser]);

  if (!isReady || role === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#faf8ff" }}>
        <ActivityIndicator color="#3525cd" size="large" />
      </View>
    );
  }

  if (role === "guest") {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (role === "pending") {
    return <Redirect href="/(auth)/pending" />;
  }

  if (role === "student") {
    // Approved students must finish their profile before the dashboard unlocks.
    if (profile && profile.profileCompleted !== true) {
      return <Redirect href="/(student)/complete-profile" />;
    }
    return <Redirect href="/(student)/home" />;
  }

  if (role === "team") {
    return <Redirect href="/(team)/home" />;
  }

  if (role === "teacher") {
    // Approved teachers must pick their batches + subjects before the dashboard unlocks.
    if (profile && profile.profileCompleted !== true) {
      return <Redirect href="/(teacher)/complete-profile" />;
    }
    return <Redirect href="/(teacher)/home" />;
  }

  if (role === "employee") {
    return <Redirect href="/(employee)/home" />;
  }

  if (role === "admin") {
    return <Redirect href="/(admin)/overview" />;
  }

  return <Redirect href="/unsupported" />;
}
