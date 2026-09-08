import { createContext, useContext } from "react";
import { ALL_ENTITLEMENTS, type Entitlement } from "@/mock";

export type { Entitlement };
export { ALL_ENTITLEMENTS };

/** Human-readable copy for the toggle UI + docs. Order = display order. */
export const ENTITLEMENT_META: Record<Entitlement, { label: string; description: string }> = {
  budgets: {
    label: "Budgets & goals",
    description: "Budgets nav, the /budgets page, and the dashboard budget + savings-goal cards.",
  },
  insights: {
    label: "Insights",
    description: "The Insights analytics page and its nav entry.",
  },
  "cards.virtual": {
    label: "Virtual cards",
    description: "Create and list virtual cards on the Cards page.",
  },
  "payments.advanced": {
    label: "Advanced transfers",
    description: "“Between my accounts” transfers and the Recurring payments tab.",
  },
  "statements.export": {
    label: "Statement export",
    description: "The CSV download button on Statements.",
  },
  "security.advanced": {
    label: "Device & session management",
    description: "The Devices and Sessions pages (the Security overview is always available).",
  },
  wealth: {
    label: "Wealth view",
    description: "The investment account and the net-worth asset breakdown (also filtered server-side).",
  },
};

const Ctx = createContext<Entitlement[]>([]);
export const EntitlementsProvider = Ctx.Provider;

export function useEntitlements(): Entitlement[] {
  return useContext(Ctx);
}

export function useCan(entitlement: Entitlement): boolean {
  return useContext(Ctx).includes(entitlement);
}
