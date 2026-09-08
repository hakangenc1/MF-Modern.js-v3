import { defer, type LoaderFunctionArgs } from "@modern-js/runtime/router";
import { getSession } from "@/mock/session";
import { loadAccountsList, loadDashboardWidgets } from "accounts/data";
import { loadPayees } from "payments/data";
import { loadSecurityOverview } from "security/data";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = getSession(request);
  const [{ accounts, netWorth }, payees, security] = await Promise.all([
    loadAccountsList(),
    loadPayees(),
    loadSecurityOverview(),
  ]);
  const widgets = loadDashboardWidgets();
  return defer({
    firstName: session?.user.firstName ?? "there",
    accounts,
    netWorth,
    payees,
    security,
    // Streamed — flushed after the shell as each resolves.
    cashflow: widgets.cashflow,
    spending: widgets.spending,
    activity: widgets.activity,
  });
};
