import { useEffect } from "react";
import { useNavigate } from "@modern-js/runtime/router";

/**
 * Federated remotes are **router-free** by design — they emit plain `<a href>`
 * and GET `<form>` so a component renders identically standalone or inside the
 * shell (sharing `react-router` would drag each remote's runtime in and render a
 * second `<Router>`). The cost is that those links/filters do a full page load.
 *
 * This one delegated handler, mounted once in the app shell, upgrades every
 * in-app `<a href="/…">` click and every GET `<form>` submit to client-side
 * navigation — so the whole app is a SPA and no remote has to know about the
 * router. The shell's own `<Link>` components call `preventDefault()` before the
 * event reaches `document`, so they're left alone (the `defaultPrevented` guard).
 */
export function useSpaNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    const inApp = (href: string | null | undefined): href is string =>
      !!href && href.startsWith("/") && !href.startsWith("//");

    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;

      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor) return;

      const target = anchor.getAttribute("target");
      if (
        (target && target !== "_self") ||
        anchor.hasAttribute("download") ||
        (anchor.getAttribute("rel") || "").includes("external")
      )
        return;

      const href = anchor.getAttribute("href");
      if (!inApp(href)) return;

      e.preventDefault();
      navigate(href);
    };

    const onSubmit = (e: SubmitEvent) => {
      if (e.defaultPrevented) return;
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if ((form.getAttribute("method") || "get").toLowerCase() !== "get") return;

      const action = form.getAttribute("action") || window.location.pathname;
      if (!inApp(action)) return;

      e.preventDefault();
      const params = new URLSearchParams();
      for (const [k, v] of new FormData(form).entries()) {
        if (typeof v === "string") params.append(k, v);
      }
      const qs = params.toString();
      // Re-filtering the same page shouldn't stack history entries.
      navigate(qs ? `${action}?${qs}` : action, {
        replace: action === window.location.pathname,
      });
    };

    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
    };
  }, [navigate]);
}
