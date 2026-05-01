import { useEffect, useState, type ComponentType } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "@/components/NavLink";
import CarivaLogo from "@/components/CarivaLogo";
import CarivaChatBot from "@/components/CarivaChatBot";
import { useLanguage } from "@/lib/i18n";
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
  Compass,
  Map,
  Flame,
  GitBranch,
  Zap,
  MessageCircle,
  User,
  Bell,
  LogOut,
  Loader2,
  GraduationCap,
  Users,
  BarChart3,
  TrendingUp,
  Telescope,
  Settings,
  ChevronDown,
  ShieldCheck,
  Handshake,
  Moon,
  Sun,
  Languages,
} from "lucide-react";
import { toast } from "sonner";

type Role = "student" | "admin";

type Profile = { full_name: string | null; institution_name: string | null };

const VIEW_KEY = "cariva.activeView";
const THEME_KEY = "cariva.app.theme";

export default function AppLayout({ requireRole }: { requireRole?: Role }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [adminUniversityId, setAdminUniversityId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<Role | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { t, toggleLanguage } = useLanguage();

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useDark = saved ? saved === "dark" : prefersDark;
    setIsDarkMode(useDark);
    document.documentElement.classList.toggle("dark", useDark);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { navigate("/auth", { replace: true }); return; }
      const uid = s.session.user.id;

      const [{ data: roles }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("role, university_id").eq("user_id", uid),
        supabase.from("profiles").select("full_name, institution_name").eq("user_id", uid).maybeSingle(),
      ]);
      if (!mounted) return;

      const uniqueRoles = Array.from(new Set((roles ?? []).map((r) => r.role as Role)));
      const isAdmin = uniqueRoles.includes("admin");
      const isStudent = uniqueRoles.includes("student");
      const uniForAdmin = (roles ?? []).find((r) => r.role === "admin" && r.university_id)?.university_id ?? null;
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
      setAdminUniversityId(uniForAdmin);
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

  function toggleTheme() {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/auth", { replace: true });
  }

  if (loading || !activeView) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  }

  const STUDENT_ITEMS = [
    { title: t("nav.pathways", "Compass"), url: "/pathways", icon: Compass },
    { title: t("nav.market", "Terrain"), url: "/market", icon: Map },
    { title: t("nav.develop", "Forge"), url: "/develop", icon: Flame },
    { title: "Pipeline", url: "/pmo", icon: GitBranch },
    { title: "Briefing", url: "/pulse", icon: Zap },
    { title: "Edge", url: "/profile", icon: TrendingUp },
    { title: "Meet & Greet", url: "/meet-and-greet", icon: MessageCircle },
  ];
  const ADMIN_ITEMS = [
    { title: t("nav.dashboard", "Command"), url: "/admin", icon: LayoutDashboard },
    { title: t("nav.students", "Students"), url: "/admin/students", icon: Users },
    { title: t("nav.analytics", "Analytics"), url: "/admin/analytics", icon: BarChart3 },
    ...(adminUniversityId
      ? [
          {
            title: "Observatoire",
            url: "/admin/observatoire",
            icon: Telescope,
            badge: "New",
          },
        ]
      : []),
    { title: t("nav.settings", "Settings"), url: "/admin/settings", icon: Settings },
  ];
  const items = activeView === "admin" ? ADMIN_ITEMS : STUDENT_ITEMS;
  const initials = (profile?.full_name ?? "U")
    .split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const hasBoth = availableRoles.length > 1;

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar items={items} />

        <div className="flex-1 flex flex-col min-w-0 md:pl-20">
          <header className="sticky top-0 z-30 px-4 pt-4 pb-2 bg-transparent">
            <div className="flex justify-center">
              <div className="glass-pill rounded-full inline-flex items-center gap-1.5 px-2 py-1.5 max-w-full">
                <SidebarTrigger className="h-9 w-9 rounded-full hover:bg-foreground/5" />

                {profile?.institution_name && (
                  <>
                    <span className="hidden sm:inline-block text-sm font-medium text-foreground/80 truncate max-w-[160px] px-2">
                      {profile.institution_name}
                    </span>
                    <span className="h-5 w-px bg-border/60 mx-0.5" />
                  </>
                )}

                {hasBoth && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-foreground/5">
                        {activeView === "admin" ? <ShieldCheck className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                        <span className="hidden sm:inline">{activeView === "admin" ? t("app.adminView", "Admin view") : t("app.studentView", "Student view")}</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>{t("app.switchView", "Switch view")}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => switchView("student")}>
                        <GraduationCap className="w-4 h-4 mr-2" /> {t("app.studentView", "Student view")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => switchView("admin")}>
                        <ShieldCheck className="w-4 h-4 mr-2" /> {t("app.adminView", "Admin view")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleLanguage}
                  aria-label="Toggle language"
                  className="h-9 w-9 rounded-full hover:bg-foreground/5"
                >
                  <Languages className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                  className="h-9 w-9 rounded-full hover:bg-foreground/5"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>

                <button
                  className="relative w-9 h-9 rounded-full hover:bg-foreground/5 flex items-center justify-center transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
                </button>

                <span className="h-5 w-px bg-border/60 mx-0.5" />

                <div className="flex items-center gap-2 pl-1 pr-1">
                  <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-semibold">
                    {initials}
                  </div>
                  <div className="hidden md:block text-sm leading-tight">
                    <p className="font-medium">{profile?.full_name ?? "User"}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">{activeView}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={signOut}
                    aria-label={t("app.signOut", "Sign out")}
                    className="h-9 w-9 rounded-full hover:bg-foreground/5"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 sm:px-6 lg:px-10 pb-8 pt-2">
            <div className="mx-auto w-full max-w-[1320px]">
              <Outlet />
            </div>
          </main>
          {activeView === "student" && <CarivaChatBot />}
        </div>
      </div>
    </SidebarProvider>
  );
}

type NavItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
};

function AppSidebar({ items }: { items: NavItem[] }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const activeClass = collapsed
    ? "!bg-white/20 !text-white"
    : "!bg-accent-soft !text-accent border-l-accent font-medium";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className={`${collapsed ? "px-2 py-4" : "px-4 py-5"} border-b border-sidebar-border transition-all duration-200`}>
        <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <div className="shrink-0 w-9 h-9 rounded-lg bg-gradient-accent flex items-center justify-center text-accent-foreground">
            <span className="text-sm font-semibold leading-none">C</span>
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
                    <SidebarMenuButton asChild isActive={active} tooltip={collapsed ? item.title : undefined}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className="flex items-center gap-3 rounded-md transition-colors border-l-2 border-transparent"
                        activeClassName={activeClass}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && (
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="truncate">{item.title}</span>
                            {item.badge && (
                              <span
                                className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border shrink-0"
                                style={{ backgroundColor: "rgba(200, 16, 46, 0.12)", color: "#C8102E", borderColor: "rgba(200, 16, 46, 0.35)" }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </span>
                        )}
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
