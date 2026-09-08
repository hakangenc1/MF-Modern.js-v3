import { startTransition, useEffect, useState } from "react";
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

interface Inspection {
  serverKB: number;
  serverEls: number;
  serverChars: number;
  liveEls: number;
  liveChars: number;
  html: string;
}

const cleanText = (el: Element | null) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

/**
 * Header badge. Reads the deepest matched route's `render` value:
 * - a server stamp  → this route was server-rendered (SSR + streaming)
 * - `null`          → this route fetches its own data in the browser (CSR)
 *
 * The popover's "Compare" button re-fetches the current URL and measures the
 * HTML the server sent against what's in the live DOM now — so the SSR vs CSR
 * difference is concrete, not just a claim.
 */
export function RenderStamp() {
  const matches = useMatches();
  const leaf = [...matches].reverse().find((m) => m.data && "render" in (m.data as object));
  const server = (leaf?.data as { render?: ServerRenderInfo | null } | undefined)?.render ?? null;
  const isServer = !!server;

  const [clientAt, setClientAt] = useState<string | null>(null);
  const [report, setReport] = useState<Inspection | null>(null);
  const [busy, setBusy] = useState(false);
  // Mount the Radix Popover only after hydration. Radix `useId` is numbered by
  // tree position and Modern.js streaming SSR can flush the header inside a
  // Suspense boundary whose id-space differs from the client's, which shows up
  // as "Prop `aria-controls` did not match". The trigger badge is plain markup
  // and hydrates identically; the popover is client-only so there is nothing to
  // mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // non-urgent: let hydration of streamed Suspense boundaries finish first (React #421)
    startTransition(() => setMounted(true));
  }, []);

  useEffect(() => {
    setClientAt(new Date().toISOString());
    setReport(null); // stale once the route changes
  }, [leaf?.pathname]);

  const inspect = async () => {
    setBusy(true);
    try {
      const raw = await fetch(window.location.href, { credentials: "same-origin" }).then((r) =>
        r.text(),
      );
      const serverMain = new DOMParser().parseFromString(raw, "text/html").querySelector("main");
      const liveMain = document.querySelector("main");
      setReport({
        serverKB: Math.round((new Blob([raw]).size / 1024) * 10) / 10,
        serverEls: serverMain?.querySelectorAll("*").length ?? 0,
        serverChars: cleanText(serverMain).length,
        liveEls: liveMain?.querySelectorAll("*").length ?? 0,
        liveChars: cleanText(liveMain).length,
        html: (serverMain?.innerHTML ?? "").replace(/\s{2,}/g, " ").trim(),
      });
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
      <PopoverContent align="end" className="w-[24rem]">
        <p className="text-sm font-semibold">
          {isServer ? "Server-side rendered" : "Client-side rendered"}
        </p>
        {isServer ? (
          <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <p>
              This route's HTML was produced by the{" "}
              <span className="font-medium text-foreground">“{server.app}”</span> app at{" "}
              <span className="font-mono text-foreground">{hhmmss(server.at)}</span> on{" "}
              <span className="font-mono text-foreground">{server.runtime}</span> (pid {server.pid}).
            </p>
            <p>Federated widgets from :3001–:3004 are streamed into that same response.</p>
            {clientAt ? (
              <p className="text-[color:var(--pos)]">Hydrated in your browser at {hhmmss(clientAt)}.</p>
            ) : null}
          </div>
        ) : (
          <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <p>
              The server sends only a near-empty shell for this route. The numbers you see were
              computed in your browser{clientAt ? ` at ${hhmmss(clientAt)}` : ""} — the same
              federated <span className="font-mono">accounts/data</span> module, called
              client-side.
            </p>
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full"
          onClick={inspect}
          disabled={busy}
        >
          {busy ? "Fetching…" : report ? "Re-run comparison" : "Compare: server HTML vs your screen"}
        </Button>

        {report ? (
          <div className="mt-3 space-y-2 text-xs">
            <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-1 tabular-nums">
              <span className="text-muted-foreground">inside &lt;main&gt;</span>
              <span className="text-right font-medium">server sent</span>
              <span className="text-right font-medium">on screen now</span>

              <span className="text-muted-foreground">Elements</span>
              <span className="text-right">{report.serverEls}</span>
              <span className="text-right">{report.liveEls}</span>

              <span className="text-muted-foreground">Text characters</span>
              <span className="text-right">{report.serverChars.toLocaleString()}</span>
              <span className="text-right">{report.liveChars.toLocaleString()}</span>

              <span className="text-muted-foreground">HTML payload</span>
              <span className="text-right">{report.serverKB} KB</span>
              <span className="text-right text-muted-foreground">—</span>
            </div>

            <p className={isServer ? "text-[color:var(--pos)]" : "text-[color:var(--warning)]"}>
              {isServer
                ? `The server did the work — ${report.serverEls} elements arrived as HTML, readable before any JavaScript ran. Hydration just re-attached listeners.`
                : `The server sent ${report.serverEls} elements; your browser then built the ${report.liveEls} you see. View source on this URL shows an empty container.`}
            </p>

            <details>
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                View the raw HTML the server sent
              </summary>
              <pre className="mt-1 max-h-44 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 font-mono text-[10px] leading-snug text-muted-foreground">
                {report.html.slice(0, 2200) || "(the <main> in the server response is empty)"}
                {report.html.length > 2200 ? "…" : ""}
              </pre>
            </details>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
