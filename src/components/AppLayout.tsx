import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Briefcase,
  User,
  Bell,
  LogOut,
  Loader2,
  GraduationCap,
  Users,
  BarChart3,
  Settings,
  ChevronDown,
  ShieldCheck,
  Handshake,
} from "lucide-react";
import { toast } from "sonner";

type Role = "student" | "admin";

const STUDENT_ITEMS = [
  { title: "Pathways", url: "/pathways", icon: LayoutDashboard },
  { title: "Job Market", url: "/market", icon: Briefcase },
  { title: "Develop", url: "/develop", icon: GraduationCap },
  { title: "Meet & Greet", url: "/meet-and-greet", icon: Handshake },
  { title: "My Profile", url: "/profile", icon: User },
];

const ADMIN_ITEMS = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Students", url: "/admin/students", icon: Users },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

type Profile = { full_name: string | null; institution_name: string | null };

const VIEW_KEY = "cariva.activeView";

export default function AppLayout({ requireRole }: { requireRole?: Role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [activeView, setActiveView] = useState<Role | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { navigate("/auth", { replace: true }); return; }
      const uid = s.session.user.id;

      const [{ data: roles }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("full_name, institution_name").eq("user_id", uid).maybeSingle(),
      ]);
      if (!mounted) return;

      const uniqueRoles = Array.from(new Set((roles ?? []).map((r) => r.role as Role)));
      const isAdmin = uniqueRoles.includes("admin");
      const isStudent = uniqueRoles.includes("student");
      // Ensure at least one role
      if (!isAdmin && !isStudent) uniqueRoles.push("student");

      // Resolve active view: respect requireRole if user has it; else stored; else default
      const stored = (typeof window !== "undefined" ? localStorage.getItem(VIEW_KEY) : null) as Role | null;
      let resolved: Role;
      if (requireRole && uniqueRoles.includes(requireRole)) {
        resolved = requireRole;
      } else if (stored && uniqueRoles.includes(stored)) {
        resolved = stored;
      } else {
        resolved = isAdmin ? "admin" : "student";
      }

      setAvailableRoles(uniqueRoles);
      setActiveView(resolved);
      setProfile(prof);
      setLoading(false);

      if (typeof window !== "undefined") localStorage.setItem(VIEW_KEY, resolved);

      // If route requires a role the user doesn't have, redirect
      if (requireRole && !uniqueRoles.includes(requireRole)) {
        navigate(resolved === "admin" ? "/admin" : "/pathways", { replace: true });
      }
    })();
    return () => { mounted = false; };
  }, [navigate, requireRole, location.pathname]);

  function switchView(next: Role) {
    if (next === activeView) return;
    localStorage.setItem(VIEW_KEY, next);
    setActiveView(next);
    navigate(next === "admin" ? "/admin" : "/pathways", { replace: true });
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/auth", { replace: true });
  }

  if (loading || !activeView) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  }

  const items = activeView === "admin" ? ADMIN_ITEMS : STUDENT_ITEMS;
  const initials = (profile?.full_name ?? "U")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const hasBoth = availableRoles.length > 1;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar items={items} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-card flex items-center px-4 gap-3 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">{profile?.institution_name ?? "—"}</p>
            </div>

            {hasBoth && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {activeView === "admin" ? <ShieldCheck className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                    <span className="hidden sm:inline">{activeView === "admin" ? "Admin view" : "Student view"}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Switch view</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => switchView("student")}>
                    <GraduationCap className="w-4 h-4 mr-2" /> Student view
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => switchView("admin")}>
                    <ShieldCheck className="w-4 h-4 mr-2" /> Admin view
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button className="relative w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center transition-colors" aria-label="Notifications">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-semibold">
                {initials}
              </div>
              <div className="hidden sm:block text-sm">
                <p className="font-medium leading-tight">{profile?.full_name ?? "User"}</p>
                <p className="text-xs text-muted-foreground capitalize">{activeView}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({ items }: { items: typeof STUDENT_ITEMS }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-gradient-accent flex items-center justify-center text-accent-foreground">
            <GraduationCap className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold leading-none">Cariva</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = location.pathname === item.url || (item.url !== "/admin" && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className="flex items-center gap-3 rounded-md transition-colors border-l-2 border-transparent"
                        activeClassName="!bg-accent-soft !text-accent border-l-accent font-medium"
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
