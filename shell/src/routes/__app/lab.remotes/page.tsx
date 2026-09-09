import { useCallback, useEffect, useMemo, useState } from "react";
import { useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import { CheckCircle2, Loader2, XCircle, Zap } from "lucide-react";
import { formatCurrency } from "@/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, SectionCard } from "@/components/patterns/kit";
import type { LabData } from "./page.data";
import type { RemoteEntry } from "@/lib/remote-origins";

// Loaded lazily, on the client only — importing the MF runtime into an SSR'd
// route double-inits the federation host and corrupts hydration.
const mfRuntime = () => import("@module-federation/modern-js-v3/runtime");

/* -------------------------------------------------------- data-module probes */
// A tiny read per remote — proves the remote's own code is now running in the
// browser, not just that a file was downloaded.
type Probe = (mod: Record<string, unknown>) => Promise<string>;

const PROBES: Record<string, Probe> = {
  accounts: async (m) => {
    const { accounts, netWorth } = (await (m.loadAccountsList as () => Promise<any>)()) ?? {};
    return `loadAccountsList() → ${accounts?.length ?? 0} accounts, net worth ${formatCurrency(
      netWorth?.total ?? 0,
    )}`;
  },
  payments: async (m) => {
    const payees = (await (m.loadPayees as () => Promise<any[]>)()) ?? [];
    return `loadPayees() → ${payees.length} payees`;
  },
  security: async (m) => {
    const o = (await (m.loadSecurityOverview as () => Promise<any>)()) ?? {};
    return `loadSecurityOverview() → score ${o.score ?? "?"}/100`;
  },
  twofactor: async (m) => {
    const r = (await (m.verifyCode as (c: string) => Promise<any>)("000000")) ?? {};
    return `verifyCode("000000") → ${r.ok ? "accepted" : r.error ?? "rejected"}`;
  },
};

type Status = "idle" | "loading" | "ready" | "error";
interface RowState {
  status: Status;
  ms?: number;
  detail?: string;
  warmOnArrival: boolean;
}

const manifestWasFetched = (url: string) =>
  typeof performance !== "undefined" && performance.getEntriesByName(url).length > 0;

/* --------------------------------------------------------------------- page */

export default function FederationLab() {
  const { registry } = useLoaderData() as LabData;

  const idle: RowState = { status: "idle", warmOnArrival: false };
  const [rows, setRows] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(registry.map((r) => [r.name, idle])),
  );

  const set = (name: string, patch: Partial<RowState>) =>
    setRows((s) => ({ ...s, [name]: { ...(s[name] ?? idle), ...patch } }));

  // Which remotes were already warmed (by another route) when this page loaded —
  // checked on the client, after hydration.
  useEffect(() => {
    setRows((s) => {
      const next = { ...s };
      for (const r of registry) {
        next[r.name] = { ...(next[r.name] ?? idle), warmOnArrival: manifestWasFetched(r.manifest) };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(
    async (r: RemoteEntry) => {
      set(r.name, { status: "loading", detail: undefined });
      const t0 = performance.now();
      try {
        const { loadRemote } = await mfRuntime();
        // The four remotes are already declared at build time, so this uses the
        // known entry. `loadRemote` still only fetches the manifest + remoteEntry
        // the first time — nothing loads until you ask.
        const mod = (await loadRemote(`${r.name}/data`)) as Record<string, unknown> | null;
        if (!mod) throw new Error("loadRemote returned null (module not found)");
        const probe = PROBES[r.name];
        const detail = probe ? await probe(mod) : "loaded (no probe)";
        set(r.name, { status: "ready", ms: Math.round(performance.now() - t0), detail });
      } catch (e) {
        set(r.name, {
          status: "error",
          ms: Math.round(performance.now() - t0),
          detail: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [],
  );

  return (
    <>
      <Helmet>
        <title>Federation lab · Northwind Bank</title>
      </Helmet>
      <PageHeader
        title="Federation lab"
        description="Load remotes on demand from the browser — the pattern a host uses when it federates many micro-frontends."
      />

      <SectionCard
        className="mt-6"
        title="Three ways the shell can know about a remote"
        bodyClassName="space-y-2 text-sm text-muted-foreground"
      >
        <p>
          <span className="font-medium text-foreground">Build-time map</span> —{" "}
          <code>module-federation.config.ts</code> lists the remote. Route code-splitting
          means its entry still loads only when a route that imports it renders. This app
          uses this for all four remotes.
        </p>
        <p>
          <span className="font-medium text-foreground">
            <code>loadRemote(&quot;name/module&quot;)</code>
          </span>{" "}
          — pull an exposed module when you actually need it. Manifest + <code>remoteEntry.js</code>{" "}
          are fetched once, then cached.
        </p>
        <p>
          <span className="font-medium text-foreground">
            <code>registerRemotes([&#123;&#8202;name, entry&#8202;&#125;])</code>
          </span>{" "}
          — hand the runtime a remote the host was <em>never built with</em>, from a URL. This
          is how a host with 100 remotes stays lean: it ships knowing about none of them and
          looks each up from a registry as routes demand it.
        </p>
      </SectionCard>

      <SectionCard
        className="mt-4"
        title="On-demand load"
        description="Nothing below loads until you click. A remote already warmed by another page (the dashboard uses accounts, payments, security) loads instantly."
        bodyClassName="p-0"
      >
        <ul className="divide-y">
          {registry.map((r) => {
            const st = rows[r.name] ?? idle;
            return (
              <li key={r.name} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                <div className="min-w-[9rem]">
                  <p className="text-sm font-medium">{r.name}</p>
                  <a
                    href={r.manifest}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                  >
                    {r.manifest.replace(/^https?:\/\//, "")}
                  </a>
                </div>

                <Badge variant="outline" className="text-[10px]">
                  {st.warmOnArrival ? "warm on arrival" : "cold on arrival"}
                </Badge>

                <div className="min-w-0 flex-1 text-xs">
                  {st.status === "ready" && (
                    <span className="inline-flex items-center gap-1.5 text-[color:var(--pos)]">
                      <CheckCircle2 className="size-3.5" />
                      <span className="font-mono text-muted-foreground">
                        {st.detail} · {st.ms} ms
                      </span>
                    </span>
                  )}
                  {st.status === "error" && (
                    <span className="inline-flex items-center gap-1.5 text-[color:var(--neg)]">
                      <XCircle className="size-3.5" />
                      <span className="font-mono">{st.detail}</span>
                    </span>
                  )}
                  {st.status === "loading" && (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" /> loading…
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={st.status === "loading"}
                    onClick={() => load(r)}
                  >
                    Load ./data
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    title="Fetch the entry now, before it is needed"
                    onClick={() =>
                      mfRuntime().then((m) => m.preloadRemote([{ nameOrAlias: r.name }]))
                    }
                  >
                    <Zap className="size-3.5" /> Preload
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <RuntimeRegistrationDemo registry={registry} />

      <NetworkMonitor />
    </>
  );
}

/* ------------------------------------------- register a remote from a URL only */

function RuntimeRegistrationDemo({ registry }: { registry: RemoteEntry[] }) {
  const accounts = registry.find((r) => r.name === "accounts")!;
  const alias = "lab-accounts";
  const [state, setState] = useState<Status>("idle");
  const [Node, setNode] = useState<React.ReactNode>(null);

  const run = async () => {
    setState("loading");
    try {
      const { loadRemote, registerRemotes } = await mfRuntime();
      // The shell was built with no knowledge of "lab-accounts". Give the runtime
      // the manifest URL and it becomes usable.
      registerRemotes([{ name: alias, entry: accounts.manifest }], { force: true });
      const [viewMod, dataMod] = await Promise.all([
        loadRemote(`${alias}/AccountsView`) as Promise<{ default: React.ComponentType<any> }>,
        loadRemote(`${alias}/data`) as Promise<Record<string, any>>,
      ]);
      const data = await dataMod.loadAccountsList();
      const View = viewMod.default;
      setNode(<View data={data} />);
      setState("ready");
    } catch (e) {
      setNode(
        <p className="text-sm text-[color:var(--neg)]">
          {e instanceof Error ? e.message : String(e)}
        </p>,
      );
      setState("error");
    }
  };

  return (
    <SectionCard
      className="mt-4"
      title="Runtime registration"
      description={`Register "${alias}" — a remote name that appears nowhere in this app's build — from just its manifest URL, then render a real view from it.`}
      action={
        <Button size="sm" onClick={run} disabled={state === "loading"}>
          {state === "loading" ? <Loader2 className="size-4 animate-spin" /> : null}
          {state === "ready" ? "Reload" : `Register + load ${alias}`}
        </Button>
      }
    >
      {Node ? (
        <div className="mt-1 max-h-[26rem] overflow-auto rounded-lg border p-4">{Node}</div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Not registered yet. Watch the network monitor below when you click.
        </p>
      )}
    </SectionCard>
  );
}

/* ----------------------------------------------- live MF resource request log */

function NetworkMonitor() {
  // Client-only: the resource list differs between server and client, so render
  // nothing until after hydration (avoids a text-content mismatch).
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => {
    setMounted(true);
    const t = setInterval(() => setNow((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const entries = useMemo(() => {
    if (!mounted || typeof performance === "undefined") return [];
    return performance
      .getEntriesByType("resource")
      .filter((e) => /mf-manifest\.json|remoteEntry\.js/.test(e.name))
      .map((e) => ({
        name: e.name.replace(/^https?:\/\//, ""),
        at: Math.round(e.startTime),
        kind: e.name.includes("mf-manifest") ? "manifest" : "entry",
      }))
      .sort((a, b) => a.at - b.at);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, mounted]);

  return (
    <SectionCard
      className="mt-4"
      title="Federation network"
      description="Every mf-manifest.json / remoteEntry.js this tab has fetched, oldest first. Click a remote above and a new row appears."
      bodyClassName="p-0"
    >
      {entries.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          No federation entries fetched yet in this tab.
        </p>
      ) : (
        <ul className="divide-y font-mono text-[11px]">
          {entries.map((e, i) => (
            <li key={i} className="flex items-center gap-3 px-5 py-2">
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {e.kind}
              </Badge>
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{e.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">+{e.at} ms</span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
