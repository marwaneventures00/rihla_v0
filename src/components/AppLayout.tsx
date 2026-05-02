import { useEffect, useState, type ComponentType } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "@/components/NavLink";
import CarivaChatBot from "@/components/CarivaChatBot";
import { useLanguage } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarSeparator,
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
  const isMobile = useIsMobile();
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
      if (!s.session) {
        navigate("/auth", { replace: true });
        return;
      }
      const uid = s.session.user.id;

      const [{ data: roles }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("role, university_id").eq("user_id", uid),
        supabase.from("profiles").select("full_name, institution_name").eq("id", uid).maybeSingle(),
      ]);
      if (!mounted) return;

      const uniqueRoles = Array.from(new Set((roles ?? []).map((r) => r.role as Role)));
      const isAdmin = uniqueRoles.includes("admin");
      const isStudent = uniqueRoles.includes("student");
      const uniForAdmin = (roles ?? []).find((r) => r.role === "admin" && r.university_id)?.university_id ?? null;
      if (!isAdmin && !isStudent) uniqueRoles.push("student");

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

      if (requireRole && !uniqueRoles.includes(requireRole)) {
        navigate(resolved === "admin" ? "/admin" : "/pathways", { replace: true });
      }
    })();
    return () => {
      mounted = false;
    };
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

  const STUDENT_ITEMS: NavItem[] = [
    { title: t("nav.pathways", "Compass"), url: "/pathways", icon: Compass },
    { title: t("nav.market", "Terrain"), url: "/market", icon: Map },
    { title: t("nav.develop", "Forge"), url: "/develop", icon: Flame },
    { title: "Pipeline", url: "/pmo", icon: GitBranch },
    { title: "Briefing", url: "/pulse", icon: Zap },
    { title: t("nav.profile", "Profile"), url: "/profile", icon: TrendingUp },
  ];
  const ADMIN_ITEMS: NavItem[] = [
    { title: t("nav.dashboard", "Command"), url: "/admin", icon: LayoutDashboard },
    { title: t("nav.students", "Students"), url: "/admin/students", icon: Users },
    { title: t("nav.analytics", "Analytics"), url: "/admin/analytics", icon: BarChart3 },
    ...(adminUniversityId
      ? [{ title: "Observatoire", url: "/admin/observatoire", icon: Telescope, badge: "New" as const }]
      : []),
    { title: t("nav.settings", "Settings"), url: "/admin/settings", icon: Settings },
  ];
  const items = activeView === "admin" ? ADMIN_ITEMS : STUDENT_ITEMS;
  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const hasBoth = availableRoles.length > 1;
  const showMobileStudentNav = isMobile && activeView === "student";

  if (loading || !activeView) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar items={items} profile={profile} activeView={activeView} />

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="sticky top-0 z-[100] flex shrink-0 justify-center px-3 pt-3 md:px-6 md:pt-3">
            <header className="app-topbar flex h-14 w-full max-w-[1100px] min-w-0 items-center justify-between gap-2 overflow-hidden rounded-xl px-2 sm:gap-3 sm:px-4 md:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              {!showMobileStudentNav && (
                <SidebarTrigger className="h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" />
              )}
              {profile?.institution_name && (
                <span className="hidden min-w-0 truncate text-[13px] text-muted-foreground sm:inline md:max-w-[min(280px,40vw)]">
                  {profile.institution_name}
                </span>
              )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 md:gap-2">
              {hasBoth && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 rounded-md px-2 text-muted-foreground sm:gap-2 sm:px-3">
                      {activeView === "admin" ? <ShieldCheck className="h-4 w-4 shrink-0" /> : <GraduationCap className="h-4 w-4 shrink-0" />}
                      <span className="hidden max-w-[8rem] truncate text-xs font-medium lg:inline">
                        {activeView === "admin" ? t("app.adminView", "Admin view") : t("app.studentView", "Student view")}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
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

              <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label="Toggle language" className="h-8 w-8 rounded-md text-muted-foreground">
                <Languages className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                className="h-8 w-8 rounded-md text-muted-foreground"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              <button type="button" className="relative h-8 w-8 rounded-md text-muted-foreground hover:bg-muted flex items-center justify-center" aria-label="Notifications">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
              </button>

              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">{initials}</div>

              <Button variant="ghost" size="icon" onClick={signOut} aria-label={t("app.signOut", "Sign out")} className="h-8 w-8 rounded-md text-muted-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
              </div>
            </header>
          </div>

          <main className={`flex-1 w-full px-4 py-6 sm:px-6 md:px-10 md:py-8 lg:px-12 ${showMobileStudentNav ? "pb-24" : ""}`}>
            <div className="mx-auto w-full max-w-[1100px]">
              <Outlet />
            </div>
          </main>

          {showMobileStudentNav && <MobileStudentNav pathname={location.pathname} />}

          {activeView === "student" && <CarivaChatBot dockAboveMobileNav={showMobileStudentNav} />}
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

function MobileStudentNav({ pathname }: { pathname: string }) {
  const { t } = useLanguage();
  const links = [
    { to: "/pathways", label: "Compass", icon: Compass },
    { to: "/market", label: "Terrain", icon: Map },
    { to: "/develop", label: "Forge", icon: Flame },
    { to: "/pmo", label: "Pipeline", icon: GitBranch },
    { to: "/profile", label: t("nav.profile", "Profile"), icon: User },
  ];
  return (
    <nav className="mobile-bottom-nav fixed bottom-0 inset-x-0 z-[90] h-16 md:hidden flex items-stretch justify-around pt-1 pb-safe">
      {links.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || (to !== "/pathways" && pathname.startsWith(to));
        return (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 text-muted-foreground"
            activeClassName="text-primary"
          >
            {active && <span className="w-1 h-1 rounded-full bg-primary mb-0.5" />}
            {!active && <span className="h-1 mb-0.5" />}
            <Icon className={`w-5 h-5 shrink-0 ${active ? "text-primary" : ""}`} />
            <span className="text-[10px] font-medium truncate max-w-full">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function AppSidebar({
  items,
  profile,
  activeView,
}: {
  items: NavItem[];
  profile: Profile | null;
  activeView: Role;
}) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const activeClass = collapsed
    ? "!bg-white/15 !text-white"
    : "!rounded-md !border-l-2 !border-l-white !bg-white/10 !text-white !font-medium";

  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar collapsible="icon" className="hidden md:flex">
      <SidebarHeader className={`${collapsed ? "px-2 py-4 h-16" : "px-3 py-4 h-16"} flex items-center border-b border-sidebar-border`}>
        <div className={`flex w-full items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-sm font-semibold leading-none text-[hsl(var(--sidebar-background))] hover:bg-white/90"
          >
            C
          </button>
          {!collapsed && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-sidebar-primary" aria-hidden />
              <p className="truncate text-[17px] font-semibold leading-none tracking-tight text-sidebar-foreground">Cariva</p>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        <SidebarGroup className="py-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {items.map((item) => {
                const active = location.pathname === item.url || (item.url !== "/admin" && location.pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={collapsed ? item.title : undefined}>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className="flex h-9 items-center gap-3 rounded-md border-l-2 border-transparent px-3 text-sm font-normal text-sidebar-foreground/80 transition-colors hover:bg-white/10 hover:text-sidebar-foreground"
                        activeClassName={activeClass}
                      >
                        <item.icon className="w-4 h-4 shrink-0" />
                        {!collapsed && (
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="truncate">{item.title}</span>
                            {item.badge && (
                              <span
                                className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 border border-white/25 bg-white/10 text-sidebar-foreground"
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
      {!collapsed && profile && (
        <SidebarFooter className="mt-auto border-t border-sidebar-border p-3">
          <SidebarSeparator className="mb-3 bg-sidebar-border" />
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-sidebar-foreground truncate">{profile.full_name ?? "User"}</p>
              <p className="text-[11px] text-sidebar-foreground/65 truncate">
                {profile.institution_name ?? (activeView === "admin" ? "Admin" : "Student")}
              </p>
            </div>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
