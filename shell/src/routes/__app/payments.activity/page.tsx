import { useLoaderData } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import ActivityView from "payments/ActivityView";

export default function Page() {
  return (
    <>
      <Helmet>
        <title>Payment activity · Northwind Bank</title>
      </Helmet>
      <ActivityView data={useLoaderData()} />
    </>
  );
}
