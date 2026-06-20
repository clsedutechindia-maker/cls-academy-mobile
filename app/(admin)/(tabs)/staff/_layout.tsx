import { Stack } from "expo-router";
import { stackScreenOptions } from "../../../../src/lib/screenTransitions";

export default function StaffLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
