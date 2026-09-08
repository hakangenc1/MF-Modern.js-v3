import { defer, type LoaderFunctionArgs } from "@modern-js/runtime/router";
import { getSession } from "@/mock/session";
import { formatDate } from "@/mock/format";
import {
  loadAccountsList,
  loadBudgetProgress,
  loadDashboardWidgets,
  loadSavingsGoals,
} from "accounts/data";
import { loadPayees } from "payments/data";
import { loadSecurityOverview } from "security/data";

// Time-of-day + date are resolved here, on the server, so the client hydrates
// against the value baked into the HTML. Computing `new Date()` in the component
// would differ between the server clock/timezone and the browser and throw a
// hydration mismatch (React #418 / #425).
function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = getSession(request);
  const [{ accounts, netWorth }, payees, security, budget, goals] = await Promise.all([
    loadAccountsList(),
    loadPayees(),
    loadSecurityOverview(),
    loadBudgetProgress(),
    loadSavingsGoals(),
  ]);
  const widgets = loadDashboardWidgets();
  const now = new Date();
  const firstName = session?.user.firstName ?? "there";
  return defer({
    firstName,
    heading: `${greeting(now)}, ${firstName}`,
    today: formatDate(now.toISOString(), "long"),
    accounts,
    netWorth,
    payees,
    security,
    budget,
    goal: goals[0] ?? null,
    // Streamed — flushed after the shell as each resolves.
    cashflow: widgets.cashflow,
    spending: widgets.spending,
    activity: widgets.activity,
  });
};
