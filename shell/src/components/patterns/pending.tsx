import { useLocation, useNavigation } from "@modern-js/runtime/router";

/**
 * The URL the router is currently navigating to (`pathname + search`), or `null`
 * when idle. Shell-only (needs the router). Pass the result to federated views
 * as `pendingHref` so a router-free filter control can compare it to its own
 * target `href` and show a spinner on *itself* — no page-wide treatment.
 */
export function usePendingHref(): string | null {
  const nav = useNavigation();
  if (!nav.location) return null;
  return `${nav.location.pathname}${nav.location.search}`;
}

/**
 * True while the router is navigating to a *different pathname* (a real
 * page-to-page move) rather than only changing the query string.
 */
export function useChangingPage(): boolean {
  const nav = useNavigation();
  const { pathname } = useLocation();
  return nav.state === "loading" && !!nav.location && nav.location.pathname !== pathname;
}
