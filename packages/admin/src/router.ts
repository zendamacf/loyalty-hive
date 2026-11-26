import { useCallback, useEffect, useState } from "react";

/** Must match `base` in vite.config.ts and the API mount path. */
const BASE_PATH = "/admin";

export const ROUTES = ["users", "brand-requests", "shares"] as const;
export type Route = (typeof ROUTES)[number];

const DEFAULT_ROUTE: Route = "users";

export function pathForRoute(route: Route): string {
  return `${BASE_PATH}/${route}`;
}

/** Unknown paths show the default page. */
export function routeFromPath(path: string): Route {
  const segment = path.slice(BASE_PATH.length).split("/")[1] ?? "";
  return (ROUTES as readonly string[]).includes(segment)
    ? (segment as Route)
    : DEFAULT_ROUTE;
}

/** The current page from the URL. `navigate` adds a history entry. */
export function useRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(() =>
    routeFromPath(window.location.pathname),
  );

  useEffect(() => {
    const onPopState = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((next: Route) => {
    window.history.pushState(null, "", pathForRoute(next));
    setRoute(next);
  }, []);

  return [route, navigate];
}
