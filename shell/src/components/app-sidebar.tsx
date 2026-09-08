import { NavLink, useLocation } from "@modern-js/runtime/router";
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  CreditCard,
  ShieldCheck,
  LifeBuoy,
  Landmark,
  LineChart,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

type NavItem = {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { title: string; to: string }[];
};

const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Banking",
    items: [
      { title: "Overview", to: "/", icon: LayoutDashboard },
      { title: "Accounts", to: "/accounts", icon: Wallet },
      {
        title: "Payments",
        to: "/payments",
        icon: ArrowLeftRight,
        children: [
          { title: "Send money", to: "/payments" },
          { title: "Payees", to: "/payments/payees" },
          { title: "Activity", to: "/payments/activity" },
        ],
      },
      { title: "Cards", to: "/cards", icon: CreditCard },
      { title: "Insights", to: "/insights", icon: LineChart },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Security",
        to: "/security",
        icon: ShieldCheck,
        children: [
          { title: "Overview", to: "/security" },
          { title: "Two-factor auth", to: "/security/two-factor" },
          { title: "Devices", to: "/security/devices" },
          { title: "Sessions", to: "/security/sessions" },
        ],
      },
    ],
  },
];

export function AppSidebar() {
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Landmark className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Northwind Bank</span>
                  <span className="truncate text-xs text-muted-foreground">Premier</span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active =
                    item.to === "/"
                      ? pathname === "/"
                      : pathname === item.to || pathname.startsWith(`${item.to}/`);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <NavLink to={item.to} end={item.to === "/"}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                      {item.children && active ? (
                        <SidebarMenuSub>
                          {item.children.map((child) => (
                            <SidebarMenuSubItem key={child.to}>
                              <SidebarMenuSubButton asChild isActive={pathname === child.to}>
                                <NavLink to={child.to}>{child.title}</NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Help & support">
              <a href="mailto:support@northwind.example">
                <LifeBuoy className="size-4" />
                <span>Help &amp; support</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
