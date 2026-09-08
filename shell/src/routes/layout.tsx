import { Outlet } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import { UIProviders } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "../styles.css";

export default function RootLayout() {
  return (
    <UIProviders>
      <Helmet>
        <html lang="en" />
      </Helmet>
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </UIProviders>
  );
}
