import { Stack } from "expo-router";
import { stackScreenOptions } from "../../../../src/lib/screenTransitions";

export default function OperationsLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
