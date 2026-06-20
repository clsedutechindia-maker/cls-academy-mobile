import { Redirect, Stack } from "expo-router";
import { useSession } from "../../src/providers/session";
import { stackScreenOptions } from "../../src/lib/screenTransitions";

export default function EmployeeLayout() {
  const { role, isReady } = useSession();
  if (isReady && role !== "employee") return <Redirect href="/" />;
  return <Stack screenOptions={stackScreenOptions} />;
}
