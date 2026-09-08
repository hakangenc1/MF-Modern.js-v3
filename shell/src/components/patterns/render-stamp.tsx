import { useEffect, useState } from "react";
import { useMatches } from "@modern-js/runtime/router";
import { MonitorSmartphone, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ServerRenderInfo {
  where: "server";
  at: string;
  runtime: string;
  pid: number;
  app: string;
}

// Slice the time straight out of the ISO string (UTC) rather than
// `toLocaleTimeString`, which formats in the runtime's timezone — the server
// (UTC) and the browser would produce different text and break hydration.
const hhmmss = (iso: string) => iso.slice(11, 19);

/**
 * Header badge. Reads the deepest matched route's `render` value:
 * - a server stamp  → this route was server-rendered (SSR + streaming)
 * - `null`          → this route fetches its own data in the browser (CSR)
 */
export function RenderStamp() {
  const matches = useMatches();
  const leaf = [...matches].reverse().find((m) => m.data && "render" in (m.data as object));
  const server = (leaf?.data as { render?: ServerRenderInfo | null } | undefined)?.render ?? null;
  const isServer = !!server;

  const [clientAt, setClientAt] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Mount the Radix Popover only after hydration. Radix `useId` is numbered by
  // tree position and Modern.js streaming SSR can flush the header inside a
  // Suspense boundary whose id-space differs from the client's, which shows up
  // as "Prop `aria-controls` did not match". The trigger badge is plain markup
  // and hydrates identically; the popover is client-only so there is nothing to
  // mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setClientAt(new Date().toISOString());
  }, [leaf?.pathname]);

  const viewSource = async () => {
    setBusy(true);
    try {
      const html = await fetch(window.location.href).then((r) => r.text());
      const doc = new DOMParser().parseFromString(html, "text/html");
      const main = doc.querySelector("main")?.textContent ?? "";
      setSrc(main.replace(/\s+/g, " ").trim().slice(0, 1400));
    } finally {
      setBusy(false);
    }
  };

  const badgeClass =
    "inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";
  const badgeInner = (
    <>
      {isServer ? (
        <Server className="size-3" />
      ) : (
        <MonitorSmartphone className="size-3" />
      )}
      {isServer ? "SSR" : "CSR"}
      {(isServer ? server?.at : mounted ? clientAt : null) ? (
        <span className="hidden font-mono sm:inline">
          · {hhmmss((isServer ? server?.at : clientAt) as string)}
        </span>
      ) : null}
    </>
  );

  // Pre-hydration (and SSR): plain, non-interactive badge — no Radix, nothing to mismatch.
  if (!mounted) {
    return (
      <span className={badgeClass} title="How this page was rendered">
        {badgeInner}
      </span>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className={badgeClass} title="How this page was rendered">
          {badgeInner}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem]">
        <p className="text-sm font-semibold">
          {isServer ? "Server-side rendered" : "Client-side rendered"}
        </p>
        {isServer ? (
          <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <p>
              This route's HTML was produced by the{" "}
              <span className="font-medium text-foreground">“{server.app}”</span> app at{" "}
              <span className="font-mono text-foreground">{hhmmss(server.at)}</span> on{" "}
              <span className="font-mono text-foreground">{server.runtime}</span> (pid{" "}
              {server.pid}).
            </p>
            <p>Federated widgets from :3001–:3003 are streamed into that same response.</p>
            {clientAt ? (
              <p className="text-[color:var(--pos)]">Hydrated in your browser at {hhmmss(clientAt)}.</p>
            ) : null}
          </div>
        ) : (
          <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <p>
              The server sends only an empty shell for this route. The numbers you see were
              computed in your browser{clientAt ? ` at ${hhmmss(clientAt)}` : ""} — the same
              federated <span className="font-mono">accounts/data</span> module, called
              client-side.
            </p>
          </div>
        )}
        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={viewSource} disabled={busy}>
          {busy ? "Fetching…" : "Show what the server actually sent"}
        </Button>
        {src !== null ? (
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 font-mono text-[10px] leading-snug text-muted-foreground">
            {src || "(the server HTML has no rendered content for this route)"}
            {src ? "…" : ""}
          </pre>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
