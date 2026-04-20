import { LayoutDashboard, Building2, Users, CalendarClock, TrendingUp, UserCog, CircleUser, HelpCircle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Accounts", url: "/accounts", icon: Building2 },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Follow-ups", url: "/follow-ups", icon: CalendarClock },
  { title: "Opportunities", url: "/opportunities", icon: TrendingUp },
  { title: "My Account", url: "/profile", icon: CircleUser },
  { title: "Help", url: "/help", icon: HelpCircle },
];

const adminItems = [
  { title: "Users", url: "/users", icon: UserCog },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAdmin } = useAuth();

  const allItems = isAdmin ? [...navItems, ...adminItems] : navItems;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        {!collapsed && (
          <div className="px-4 pb-4 mb-2 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">HC</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Motion Health</p>
                <p className="text-xs text-muted-foreground">Territory CRM</p>
              </div>
            </div>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
