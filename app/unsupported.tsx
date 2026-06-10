import { Redirect } from "expo-router";
import { Text } from "react-native";
import { ActionButton, Card, Screen } from "../src/components/ui";
import { useSession } from "../src/providers/session";

export default function UnsupportedRoute() {
  const { authUser, profile, role, signOutUser } = useSession();

  if (role === "guest") {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (role === "unsupported" && authUser && !profile) {
    return (
      <Screen title="Account Not Set Up" subtitle="This Google account is signed in, but it is not connected to a CLS Academy ERP profile yet.">
        <Card title="Ask an admin to provision this account">
          <Text style={{ color: "#475569", lineHeight: 22 }}>
            Signed in as {authUser.email || "this Google account"}. An admin needs to create or link a student, teacher, or admin ERP account before the mobile app can open.
          </Text>
          <ActionButton label="Sign Out" onPress={() => void signOutUser()} tone="danger" />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen title="Unsupported Mobile Role" subtitle="This mobile build currently supports student, teacher, and admin access only.">
      <Card title="Role not supported yet">
        <Text style={{ color: "#475569", lineHeight: 22 }}>
          Employee workflows are intentionally hidden for now while the academic mobile release is being completed.
        </Text>
        <ActionButton label="Sign Out" onPress={() => void signOutUser()} tone="danger" />
      </Card>
    </Screen>
  );
}
