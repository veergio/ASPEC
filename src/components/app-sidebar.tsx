import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  FileBarChart2,
  Settings,
  LogOut,
  Boxes,
  ClipboardList,
  History,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { AspecLogo } from "@/components/aspec-logo";
import { useRole, clearRole } from "@/lib/role";

const managerItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Asset Monitoring", url: "/assets", icon: Activity },
  { title: "Asset Details", url: "/asset-details", icon: Boxes },
  // { title: "Reports", url: "/reports", icon: FileBarChart2 },
  { title: "Settings", url: "/settings", icon: Settings },
];

const technicianItems = [
  { title: "Work Report Form", url: "/work-report", icon: ClipboardList },
  { title: "Report History", url: "/report-history", icon: History },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const currentPath = usePathname();
  const role = useRole();

  const items =
    role === "technician" ? technicianItems : managerItems;

  const isActive = (path: string) =>
    path === "/"
      ? currentPath === "/"
      : currentPath.startsWith(path);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <AspecLogo
          size={collapsed ? 28 : 36}
          withText={!collapsed}
        />

        {!collapsed && (
          <div className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full border border-sidebar-border bg-sidebar-accent/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" />

            {role === "technician"
              ? "Technician"
              : "Asset Manager"}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="relative h-11 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3"
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-cyan" />
                        )}

                        <item.icon className="h-4 w-4 shrink-0" />

                        {!collapsed && (
                          <span className="text-sm">
                            {item.title}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-11 text-white hover:text-destructive"
            >
              <Link
                href="/login"
                onClick={() => clearRole()}
                className="flex items-center gap-3"
              >
                <LogOut className="h-4 w-4" />

                {!collapsed && (
                  <span className="text-sm">
                    Logout
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}