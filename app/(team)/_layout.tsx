import { Redirect, Stack } from "expo-router";
import { useSession } from "../../src/providers/session";

export default function TeamLayout() {
  const { role, isReady } = useSession();
  if (isReady && role !== "team") return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
