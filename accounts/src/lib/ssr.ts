/**
 * Proof-of-render helper. `serverStamp()` can only run on a Node server (it
 * reads `process`), so any component that displays its output is proving the
 * HTML it lives in was produced server-side.
 */
export interface ServerStamp {
  where: "server";
  at: string;
  runtime: string;
  pid: number;
  app: string;
}

export function serverStamp(app: string): ServerStamp {
  return {
    where: "server",
    at: new Date().toISOString(),
    runtime: `Node ${process.version}`,
    pid: process.pid,
    app,
  };
}
