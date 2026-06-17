import { Redirect, Stack, usePathname } from "expo-router";
import { useSession } from "../../src/providers/session";

export default function TeacherLayout() {
  const { role, isReady, profile } = useSession();
  const pathname = usePathname();
  if (isReady && role !== "teacher") return <Redirect href="/" />;
  // Lock the teacher to the completion form until they've picked their batches and
  // subjects — every other (teacher) route (tabs included) is blocked here.
  if (
    isReady &&
    role === "teacher" &&
    profile &&
    profile.profileCompleted !== true &&
    !pathname.includes("complete-profile")
  ) {
    return <Redirect href="/(teacher)/complete-profile" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
