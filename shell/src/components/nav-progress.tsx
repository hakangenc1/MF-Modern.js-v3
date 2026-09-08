import { useEffect, useRef, useState } from "react";
import { useNavigation } from "@modern-js/runtime/router";
import { cn } from "@/lib/utils";

/**
 * Top-of-window navigation progress bar + a soft focus-pull on the page content
 * while the next route's data loads. Client-side only — `useNavigation` reports
 * `idle` during SSR, so nothing renders on the first paint.
 */
export function NavProgress() {
  const nav = useNavigation();
  const busy = nav.state !== "idle";

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(hideTimer.current);

    if (busy) {
      setVisible(true);
      setProgress(10);
      // Trickle toward ~90% while we wait; never actually reach 100 until done.
      const trickle = setInterval(() => {
        setProgress((p) => (p < 90 ? p + (90 - p) * 0.14 : p));
      }, 350);
      return () => clearInterval(trickle);
    }

    if (visible) {
      setProgress(100);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 340);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className={cn(
          "h-full bg-primary shadow-[0_0_8px_1px] shadow-primary/50",
          "transition-[width] ease-out motion-reduce:transition-none",
          progress >= 100 ? "duration-200" : "duration-500",
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * Wraps the routed content. Pulls it slightly out of focus (blur + dim + a hair
 * of scale) while the next route loads, then eases it back — a smooth hand-off
 * rather than a hard content swap. Honors `prefers-reduced-motion`.
 */
export function NavTransition({ children }: { children: React.ReactNode }) {
  const nav = useNavigation();
  const leaving = nav.state === "loading";

  return (
    <div
      className={cn(
        "origin-top transition-[filter,opacity,transform] duration-300 ease-out motion-reduce:transition-none",
        // The blur/scale/dim only apply for motion-safe users; reduced-motion
        // keeps the content untouched.
        leaving
          ? "pointer-events-none select-none opacity-100 motion-safe:scale-[0.99] motion-safe:opacity-50 motion-safe:blur-[3px]"
          : "opacity-100",
      )}
    >
      {children}
    </div>
  );
}
