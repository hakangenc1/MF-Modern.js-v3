// Ping every deployed service so free-tier hosting doesn't spin them down.
//
// SSR module federation needs ALL remotes reachable when the shell renders, so a
// single cold remote 500s the shell until it wakes (~30s). Running this every
// ~10 min keeps the whole set warm.
//
//   BASE_HOSTS="https://northwind-shell.onrender.com,https://northwind-accounts.onrender.com,..." node scripts/keep-warm.mjs
//
// On Render: create a free **Cron Job** service pointing at this repo, schedule
// `*/10 * * * *`, command `node scripts/keep-warm.mjs`, and set BASE_HOSTS (or
// rely on the default list below).
const HOSTS = (
  process.env.BASE_HOSTS ||
  [
    "https://northwind-shell.onrender.com",
    "https://northwind-accounts.onrender.com",
    "https://northwind-payments.onrender.com",
    "https://northwind-security.onrender.com",
    "https://northwind-twofactor.onrender.com",
  ].join(",")
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const paths = {
  shell: "/login",
  default: "/static/mf-manifest.json",
};

await Promise.all(
  HOSTS.map(async (host) => {
    const path = host.includes("shell") ? paths.shell : paths.default;
    const started = Date.now();
    try {
      const res = await fetch(host + path, { headers: { "user-agent": "keep-warm" } });
      console.log(`${res.status}  ${((Date.now() - started) / 1000).toFixed(1)}s  ${host}${path}`);
    } catch (e) {
      console.log(`ERR  ${host}${path}  ${(e && e.message) || e}`);
    }
  }),
);
