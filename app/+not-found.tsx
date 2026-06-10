import { Link } from "expo-router";
import { Text } from "react-native";
import { Card, D, Screen } from "../src/components/ui";

export default function NotFoundScreen() {
  return (
    <Screen title="Page Not Found" subtitle="This route is not part of the current mobile release.">
      <Card title="Missing Screen">
        <Text style={{ color: "#475569", lineHeight: 22 }}>
          The academic mobile build does not include this route yet. Use the tab bar or return to the home screen.
        </Text>
        <Link href="/" style={{ color: D.primaryBtn, fontWeight: "700" }}>
          Back to Home
        </Link>
      </Card>
    </Screen>
  );
}
