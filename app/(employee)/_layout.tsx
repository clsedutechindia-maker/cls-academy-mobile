import { Redirect, Stack } from "expo-router";
import { useSession } from "../../src/providers/session";

export default function EmployeeLayout() {
  const { role, isReady } = useSession();
  if (isReady && role !== "employee") return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
