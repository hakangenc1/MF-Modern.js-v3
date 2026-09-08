import { useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import PayeesView from "payments/PayeesView";
export default function Page() {
  const { payees } = useLoaderData() as { payees: any[] };
  return (<><Helmet><title>Payees · Northwind Bank</title></Helmet><PayeesView payees={payees} /></>);
}
