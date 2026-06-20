import { Stack } from "expo-router";
import { stackScreenOptions } from "../../../../src/lib/screenTransitions";

export default function StudentsLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
