import { usePathname, type Href } from "expo-router";
import { useEffect } from "react";

let currentPathname = "/";

function getFallbackHref(pathname: string): Href {
  if (pathname.startsWith("/(student)")) return "/(student)/home";
  if (pathname.startsWith("/(teacher)")) return "/(teacher)/home";
  if (pathname.startsWith("/(team)")) return "/(team)/home";
  if (pathname.startsWith("/(employee)")) return "/(employee)/home";
  if (pathname.startsWith("/(admin)")) return "/(admin)/overview";
  if (pathname.startsWith("/(auth)")) return "/(auth)/welcome";
  return "/" as Href;
}

export function NavigationHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    currentPathname = pathname;
  }, [pathname]);

  return null;
}

export function navigateBack(router: { back: () => void; canGoBack: () => boolean; replace: (href: Href) => void }) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(getFallbackHref(currentPathname));
}
