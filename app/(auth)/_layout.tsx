import { Stack } from "expo-router";
import { stackScreenOptions } from "../../src/lib/screenTransitions";

export default function AuthLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
