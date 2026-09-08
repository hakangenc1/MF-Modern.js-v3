import { Outlet } from "@modern-js/runtime/router";
import { UIProviders } from "@/components/providers";
import "../styles.css";

export default function RootLayout() {
  return (
    <UIProviders>
      <div className="mx-auto min-h-svh max-w-2xl p-6 md:p-10">
        <Outlet />
      </div>
    </UIProviders>
  );
}
