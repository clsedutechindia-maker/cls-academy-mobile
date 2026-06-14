import { useGlobalSearchParams, usePathname, type Href } from "expo-router";
import { useEffect, useMemo } from "react";

const MAX_HISTORY_ENTRIES = 60;
const routeHistory: string[] = [];

function serializeRouteParams(params: Record<string, string | string[] | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
      continue;
    }

    if (typeof value === "string" && value.length > 0) {
      searchParams.append(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function getFallbackHref(currentHref: string): Href {
  if (currentHref.startsWith("/(student)")) return "/(student)/home";
  if (currentHref.startsWith("/(teacher)")) return "/(teacher)/home";
  if (currentHref.startsWith("/(team)")) return "/(team)/home";
  if (currentHref.startsWith("/(employee)")) return "/(employee)/home";
  if (currentHref.startsWith("/(admin)")) return "/(admin)/overview";
  if (currentHref.startsWith("/(auth)")) return "/(auth)/welcome";
  return "/" as Href;
}

export function NavigationHistoryTracker() {
  const pathname = usePathname();
  const rawParams = useGlobalSearchParams();

  const serializedParams = useMemo(
    () =>
      serializeRouteParams(
        Object.fromEntries(
          Object.entries(rawParams).map(([key, value]) => [
            key,
            Array.isArray(value) ? value.map((item) => String(item)) : typeof value === "string" ? value : undefined,
          ]),
        ),
      ),
    [rawParams],
  );

  useEffect(() => {
    const href = `${pathname}${serializedParams}`;
    const lastRoute = routeHistory[routeHistory.length - 1];

    if (lastRoute === href) return;

    routeHistory.push(href);
    if (routeHistory.length > MAX_HISTORY_ENTRIES) {
      routeHistory.shift();
    }
  }, [pathname, serializedParams]);

  return null;
}

export function navigateBack(router: { replace: (href: Href) => void }) {
  if (routeHistory.length > 1) {
    routeHistory.pop();
    const previousHref = routeHistory[routeHistory.length - 1];
    if (previousHref) {
      router.replace(previousHref as Href);
      return;
    }
  }

  const currentHref = routeHistory[routeHistory.length - 1] ?? "/";
  router.replace(getFallbackHref(currentHref));
}
