import { Redirect, Stack, usePathname } from "expo-router";
import { useSession } from "../../src/providers/session";

export default function StudentLayout() {
  const { role, isReady, profile } = useSession();
  const pathname = usePathname();
  if (isReady && role !== "student") return <Redirect href="/" />;
  // Lock the student to the completion form until their profile is finished —
  // every other (student) route (tabs included) is blocked here.
  if (
    isReady &&
    role === "student" &&
    profile &&
    profile.profileCompleted !== true &&
    !pathname.includes("complete-profile")
  ) {
    return <Redirect href="/(student)/complete-profile" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
