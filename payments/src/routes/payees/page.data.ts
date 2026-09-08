import { loadPayees } from "@/federation/data";
export const loader = async () => ({ payees: await loadPayees() });
