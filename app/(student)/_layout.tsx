import { Redirect, Stack } from "expo-router";
import { useSession } from "../../src/providers/session";

export default function StudentLayout() {
  const { role, isReady } = useSession();
  if (isReady && role !== "student") return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
