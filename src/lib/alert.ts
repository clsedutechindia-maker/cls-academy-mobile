import { Alert, Platform } from "react-native";

export type AlertButton = {
  text?: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

/**
 * Cross-platform alert. React Native's `Alert.alert` is a no-op on
 * react-native-web, which silently swallows both the message and any button
 * `onPress` (e.g. a navigate-back after submit). This routes web to the
 * browser's native `alert`/`confirm` so feedback + callbacks still fire.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== "web") {
    Alert.alert(title, message, buttons as never);
    return;
  }

  const text = [title, message].filter(Boolean).join("\n\n");

  // 0–1 button → simple notice. Run the single button's handler after dismiss.
  if (!buttons || buttons.length <= 1) {
    if (typeof window !== "undefined") window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }

  // 2+ buttons → confirm dialog. Non-cancel button = the confirm action.
  const confirmed = typeof window !== "undefined" ? window.confirm(text) : true;
  const cancelBtn = buttons.find((b) => b.style === "cancel");
  const confirmBtn = buttons.find((b) => b.style !== "cancel");
  if (confirmed) confirmBtn?.onPress?.();
  else cancelBtn?.onPress?.();
}
