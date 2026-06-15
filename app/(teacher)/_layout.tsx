import { Redirect, Stack } from "expo-router";
import { useSession } from "../../src/providers/session";

export default function TeacherLayout() {
  const { role, isReady } = useSession();
  if (isReady && role !== "teacher") return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
