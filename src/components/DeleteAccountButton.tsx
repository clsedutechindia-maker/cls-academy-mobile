import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { D } from "./theme";
import { AnimatedPressable } from "./motion";
import { useSession } from "../providers/session";
import { showAlert } from "../lib/alert";
import { requestAccountDeletion } from "../lib/deleteAccount";

// Low-emphasis "Delete account" action shown below Sign out on every account screen. Required by
// Google Play's account-deletion policy. Deletion is request-based: it disables the account server-
// side and logs a request that's purged within 30 days (see lib/server/accountDeletion.ts on web).
export function DeleteAccountButton() {
  const { signOutUser } = useSession();
  const [busy, setBusy] = useState(false);

  function confirmDelete() {
    if (busy) return;
    showAlert(
      "Delete account?",
      "This permanently deletes your CLS Academy account and personal data. Fee/payment records are kept 7 years per tax law. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: () => {
            void runDelete();
          },
        },
      ],
    );
  }

  async function runDelete() {
    setBusy(true);
    try {
      await requestAccountDeletion();
      showAlert(
        "Account deletion requested",
        "Your account is now disabled and will be deleted within 30 days. You'll be signed out.",
        [
          {
            text: "OK",
            onPress: () => {
              void signOutUser();
            },
          },
        ],
      );
    } catch (error) {
      setBusy(false);
      showAlert("Couldn't delete account", error instanceof Error ? error.message : "Please try again.");
    }
  }

  return (
    <AnimatedPressable onPress={confirmDelete} disabled={busy} style={styles.btn}>
      <Text style={styles.text}>{busy ? "Deleting…" : "Delete account"}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: "100%", paddingVertical: 14, alignItems: "center", justifyContent: "center", marginTop: 4 },
  text: { color: D.error || "#DC2626", fontSize: 13.5, fontWeight: "600", fontFamily: D.fontSemiBold, letterSpacing: -0.1 },
});
