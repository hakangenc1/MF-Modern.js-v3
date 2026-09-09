import { Fragment } from "react";
import { Link, Outlet, useLoaderData, useLocation } from "@modern-js/runtime/router";
import { Helmet } from "@modern-js/runtime/head";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandMenu } from "@/components/command-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { NotificationBell } from "@/components/notification-bell";
import { SlidersHorizontal } from "lucide-react";
import { RenderStamp } from "@/components/patterns/render-stamp";
import { NavProgress, NavTransition } from "@/components/nav-progress";
import { useSpaNavigation } from "@/components/spa-nav";
import { EntitlementsProvider } from "@/lib/entitlements";
import type { AppLayoutData } from "./layout.data";

const LABELS: Record<string, string> = {
  accounts: "Accounts",
  payments: "Payments",
  payees: "Payees",
  activity: "Activity",
  cards: "Cards",
  budgets: "Budgets",
  insights: "Insights",
  statements: "Statements",
  notifications: "Notifications",
  settings: "Settings",
  security: "Security",
  "two-factor": "Two-factor auth",
  devices: "Devices",
  sessions: "Sessions",
};

export default function AppLayout() {
  const { user, entitlements, remoteOrigins, notifications, unreadCount } =
    useLoaderData() as AppLayoutData;
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  // Upgrade federated <a href> / GET <form> to client-side navigation.
  useSpaNavigation();

  return (
    <EntitlementsProvider value={entitlements}>
    <SidebarProvider>
      <Helmet>
        {remoteOrigins.map((o) => (
          <link key={o} rel="preconnect" href={o} crossOrigin="anonymous" />
        ))}
      </Helmet>
      <NavProgress />
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Overview</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {segments.map((seg, i) => {
                const to = "/" + segments.slice(0, i + 1).join("/");
                const label = LABELS[seg] ?? decodeURIComponent(seg);
                const last = i === segments.length - 1;
                return (
                  <Fragment key={to}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {last ? (
                        <BreadcrumbPage>{label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={to}>{label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-1.5">
            <RenderStamp />
            <Link
              to="/settings"
              title="Entitlements"
              className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <SlidersHorizontal className="size-3" />
              <span className="font-mono">{entitlements.length}/7</span>
            </Link>
            <div className="hidden sm:block">
              <CommandMenu />
            </div>
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
            <ThemeToggle />
            <Separator orientation="vertical" className="mx-1 h-5" />
            <UserMenu user={user} />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <NavTransition>
            <Outlet />
          </NavTransition>
        </main>
      </SidebarInset>
    </SidebarProvider>
    </EntitlementsProvider>
  );
}
