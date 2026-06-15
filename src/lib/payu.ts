import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { firebaseAuth } from "./firebase";
import { isDemoMode } from "./demoMode";

// ---------------------------------------------------------------------------
// PayU online fee payment (client side). The client NEVER computes amounts or
// touches the merchant salt — it asks the server (/api/payu/initiate) to create a
// signed checkout session, opens it in an in-app browser, then refetches. The
// receipt/balance are written server-side by the gateway callback + webhook, so the
// browser outcome here is only advisory. See lib/server/* on the web app.
// ---------------------------------------------------------------------------

// Origin of the deployed Next.js web app (PayU routes live there). Reuses the
// existing notify origin if a dedicated one isn't set.
const WEB_BASE = (process.env.EXPO_PUBLIC_WEB_BASE_URL || process.env.EXPO_PUBLIC_NOTIFY_URL || "").replace(/\/$/, "");

export type CheckoutStatus = "success" | "failed" | "pending" | "dismissed";
export type CheckoutResult = { status: CheckoutStatus };

export function isOnlinePaymentAvailable(): boolean {
  return !isDemoMode() && WEB_BASE.length > 0;
}

export async function startFeeCheckout(input: {
  studentFeeId: string;
  installmentLabel?: string;
}): Promise<CheckoutResult> {
  if (isDemoMode()) throw new Error("Online payment isn't available in demo mode.");
  if (!WEB_BASE) throw new Error("Online payment isn't set up yet. Please pay at the office.");

  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("Please sign in again to pay.");
  const token = await user.getIdToken();

  const res = await fetch(`${WEB_BASE}/api/payu/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ studentFeeId: input.studentFeeId, installmentLabel: input.installmentLabel || "" }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ? `Payment couldn't start (${data.error}).` : "Payment couldn't start. Try again.");
  }
  const { checkoutUrl } = (await res.json()) as { checkoutUrl?: string };
  if (!checkoutUrl) throw new Error("Payment couldn't start. Try again.");

  // returnUrl = clsacademy://pay-return on native (closes the in-app browser when
  // the result page bounces to it); an https URL on web.
  const returnUrl = Linking.createURL("pay-return");
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, returnUrl);

  if (result.type === "success" && result.url) {
    const status = String(Linking.parse(result.url).queryParams?.status || "pending");
    if (status === "success" || status === "failed" || status === "pending") return { status };
    return { status: "pending" };
  }
  // cancel / dismiss: outcome unknown — caller refetches; the server is the source of truth.
  return { status: "dismissed" };
}
