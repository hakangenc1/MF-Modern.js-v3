import { useEffect, useState } from "react";
import { useRouteError, isRouteErrorResponse } from "@modern-js/runtime/router";
import { Button } from "@/components/ui/button";

/** Coerce an unknown route-error value to a displayable string. */
function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const m = (value as { message?: unknown }).message;
    if (typeof m === "string") return m.trim();
  }
  return "";
}

export default function ErrorBoundary() {
  const error = useRouteError();
  const message = asText(isRouteErrorResponse(error) ? error.data : error);
  // A cold free-tier remote returns its HTML "waking up" page instead of the
  // federation manifest — recoverable in ~30s, so offer an auto-retry.
  const warming = /manifest|Federation|Unexpected token '<'|RUNTIME-003/i.test(message);

  const [secs, setSecs] = useState(8);
  useEffect(() => {
    if (!warming) return;
    const t = setInterval(() => setSecs((s) => s - 1), 1000);
    const r = setTimeout(() => window.location.reload(), 8000);
    return () => {
      clearInterval(t);
      clearTimeout(r);
    };
  }, [warming]);

  if (warming) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">Northwind Bank</p>
        <h1 className="text-2xl font-semibold tracking-tight">Warming up…</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          One of the services is starting from cold (free hosting spins them down when idle).
          Retrying in {Math.max(secs, 0)}s.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry now
        </Button>
      </div>
    );
  }

  const title =
    (isRouteErrorResponse(error) && `${error.status} ${error.statusText}`.trim()) ||
    "Something went wrong";
  // `message` is already coerced to a string above — a route-error `.data` can be
  // a serialized error object in dev, and handing a non-string to JSX would make
  // the boundary itself throw (blank screen).
  const detail = message || "An unexpected error occurred.";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">Northwind Bank</p>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{detail}</p>
      <Button asChild variant="outline">
        <a href="/">Back to dashboard</a>
      </Button>
    </div>
  );
}
