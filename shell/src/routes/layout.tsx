import { Outlet } from "@modern-js/runtime/router";
import { UIProviders } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "../styles.css";

export default function RootLayout() {
  return (
    <UIProviders>
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </UIProviders>
  );
}
