// Kill every dev/serve process started for this folder (any OS).
// Use when a `npm run dev` terminal was lost and ports 3000-3003 stay busy.
import { execFileSync } from "node:child_process";
import { ROOT } from "./apps.mjs";

const needle = ROOT.replace(/\\/g, "/").toLowerCase();
let killed = 0;

const kill = (pid) => {
  try {
    process.kill(Number(pid), "SIGKILL");
    killed++;
  } catch {
    /* already gone */
  }
};

try {
  if (process.platform === "win32") {
    // One PowerShell call: match node processes whose command line points into this folder.
    const ps =
      "Get-CimInstance Win32_Process | " +
      "Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine } | " +
      "ForEach-Object { $_.ProcessId.ToString() + '|' + ($_.CommandLine -replace '\\\\','/') }";
    const out = execFileSync("powershell", ["-NoProfile", "-Command", ps], { encoding: "utf8" });
    for (const line of out.split(/\r?\n/)) {
      const i = line.indexOf("|");
      if (i < 0) continue;
      const pid = line.slice(0, i);
      const cmd = line.slice(i + 1).toLowerCase();
      if (cmd.includes(needle)) kill(pid);
    }
  } else {
    const out = execFileSync("ps", ["-eo", "pid=,args="], { encoding: "utf8" });
    for (const line of out.split("\n")) {
      const m = line.trim().match(/^(\d+)\s+(.*)$/);
      if (m && m[2].toLowerCase().includes(needle)) kill(m[1]);
    }
  }
} catch (e) {
  console.error("stop failed:", e.message);
  process.exit(1);
}

console.log(killed ? `stopped ${killed} process(es)` : "nothing running for this folder");
