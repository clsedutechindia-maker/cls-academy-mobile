import { Redirect, Stack } from "expo-router";
import { useSession } from "../../src/providers/session";

export default function AdminLayout() {
  const { role, isReady } = useSession();
  if (isReady && role !== "admin") return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
