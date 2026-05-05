import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { BookOpen, Hammer, BarChart2, Briefcase, User } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

export type AppLayoutOutletContext = { sidebarCollapsed: boolean };

type AppLayoutState = {
  ready: boolean;
  userId: string | null;
  email: string;
  fullName: string;
  avatarUrl: string | null;
};

const initialAppState: AppLayoutState = {
  ready: false,
  userId: null,
  email: "",
  fullName: "",
  avatarUrl: null,
};

type ProfileRow = { full_name: string | null; avatar_url: string | null };

function pageTitleForPath(pathname: string, t: (key: string) => string) {
  if (pathname === "/learn/path/report") return t("page.learnReport");
  if (pathname === "/learn/path") return t("page.learnPath");
  if (pathname === "/learn" || pathname === "/pathways") return t("nav.learn");
  if (pathname === "/develop" || pathname.startsWith("/develop/")) return t("nav.forge");
  if (pathname === "/field" || pathname === "/market") return t("nav.field");
  if (pathname === "/pipeline" || pathname === "/pmo") return t("nav.pipeline");
  if (pathname === "/trends" || pathname.startsWith("/trends/")) return t("nav.trends");
  if (pathname.startsWith("/pulse")) return t("page.pulse");
  if (pathname.startsWith("/profile")) return t("nav.profile");
  if (pathname.startsWith("/meet")) return t("nav.meet");
  return t("brand.tagline");
}

/**
 * useEffect inventory:
 * 1. [] — document dark class
 * 2. [] — auth + profile (single setAppState), onAuthStateChange
 * 3. [] — cariva:avatar-updated (single setAppState functional update)
 */
export default function AppLayout({ requireRole = "student" }: { requireRole?: "student" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const [appState, setAppState] = useState<AppLayoutState>(initialAppState);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const authInitRef = useRef(false);
  const navigateRef = useRef(navigate);
  const requireRoleRef = useRef(requireRole);
  navigateRef.current = navigate;
  requireRoleRef.current = requireRole;

  const pageTitle = useMemo(() => pageTitleForPath(location.pathname, t), [location.pathname, t]);

  const outletContext = useMemo(() => ({ sidebarCollapsed }) as AppLayoutOutletContext, [sidebarCollapsed]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  useEffect(() => {
    if (authInitRef.current) return;
    authInitRef.current = true;

    let mounted = true;

    const init = async () => {
      try {
        const { data: s } = await supabase.auth.getSession();
        if (!mounted) return;

        if (!s.session) {
          navigateRef.current("/auth", { replace: true });
          return;
        }

        const uid = s.session.user.id;

        const [{ data: roles }, { data: prof }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", uid),
          supabase.from("profiles").select("full_name, avatar_url").eq("id", uid).maybeSingle(),
        ]);
        if (!mounted) return;

        const roleSet = new Set((roles ?? []).map((r) => r.role));
        if (requireRoleRef.current === "student" && !roleSet.has("student")) {
          navigateRef.current("/auth", { replace: true });
          return;
        }

        const p = (prof as ProfileRow | null) ?? null;
        const raw = p?.avatar_url?.trim();
        const busted = raw ? `${raw.split("?")[0]}?t=${Date.now()}` : null;

        setAppState({
          ready: true,
          userId: uid,
          email: s.session.user.email ?? "",
          fullName: p?.full_name?.trim() ?? "",
          avatarUrl: busted,
        });
      } catch (err) {
        console.error("AppLayout init error:", err);
        if (mounted) {
          setAppState((prev) => ({ ...prev, ready: true }));
        }
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_OUT" || !session) {
        navigateRef.current("/auth", { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onAvatar = (e: Event) => {
      const ce = e as CustomEvent<{ url: string }>;
      const u = ce.detail?.url?.trim();
      if (!u) return;
      setAppState((prev) => ({
        ...prev,
        avatarUrl: `${u.split("?")[0]}?t=${Date.now()}`,
      }));
    };
    window.addEventListener("cariva:avatar-updated", onAvatar as EventListener);
    return () => window.removeEventListener("cariva:avatar-updated", onAvatar as EventListener);
  }, []);

  const initials = useMemo(() => {
    const name = appState.fullName?.trim();
    if (name) {
      return name
        .split(/\s+/)
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    const em = appState.email?.trim();
    if (em) {
      const local = em.split("@")[0] ?? "";
      return local.slice(0, 2).toUpperCase() || "U";
    }
    return "U";
  }, [appState.fullName, appState.email]);

  if (!appState.ready) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "#FAFAF8",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "2px solid #E5E5E5",
            borderTop: "2px solid #C8102E",
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  const pillNavStyle: CSSProperties = {
    position: "fixed",
    zIndex: 30,
    height: 52,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    borderRadius: "100px",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    background: "rgba(255, 255, 255, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.6)",
    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.06)",
    ...(isMobile
      ? { top: 12, left: 16, right: 16 }
      : {
          top: 16,
          right: 24,
          left: sidebarCollapsed ? "calc(64px + 24px)" : "calc(220px + 24px)",
          transition: "left 0.25s ease",
        }),
  };

  const sidebarOffsetPx = !isMobile ? (sidebarCollapsed ? 64 : 220) : 0;

  return (
    <div className="flex min-h-screen w-full" style={{ background: "#FAFAF8" }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapsed={handleToggleCollapse} />

      <div
        className={`main-content flex min-h-0 min-w-0 flex-1 flex-col ${isMobile ? "pb-[calc(60px+env(safe-area-inset-bottom,0px))]" : ""}`}
        style={
          !isMobile
            ? {
                marginLeft: sidebarOffsetPx,
                transition: "margin-left 0.25s ease",
              }
            : undefined
        }
      >
        <header style={pillNavStyle} className="top-nav-pill" aria-label="Page toolbar">
          <h1
            className="min-w-0 truncate text-[#0A0A0A]"
            style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: 15, fontWeight: 600 }}
          >
            {pageTitle}
          </h1>
          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 text-[12px] font-semibold text-[#0A0A0A] hover:opacity-90"
              style={{ width: 32, height: 32, background: appState.avatarUrl ? "transparent" : "#F5F5F5" }}
              aria-label="Profile"
            >
              {appState.avatarUrl ? (
                <img src={appState.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </button>
          </div>
        </header>

        <main className="w-full flex-1 bg-[#FAFAF8] pb-6 pt-[80px] md:pb-8">
          <div className="mx-auto w-full max-w-[1100px] bg-[#FAFAF8] px-5 py-6 md:px-10 md:pb-10 md:pt-12">
            <Outlet context={outletContext} />
          </div>
        </main>

        <nav
          style={{
            display: "none",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60px",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(16px)",
            borderTop: "1px solid #E5E5E5",
            zIndex: 40,
            alignItems: "center",
            justifyContent: "space-around",
            padding: "0 8px",
          }}
          className="mobile-bottom-nav"
        >
          {[
            { icon: BookOpen, label: "Learn", path: "/learn" },
            { icon: Hammer, label: "Forge", path: "/develop" },
            { icon: BarChart2, label: "Field", path: "/field" },
            { icon: Briefcase, label: "Pipeline", path: "/pipeline" },
            { icon: User, label: "Profile", path: "/profile" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 12px",
                color: location.pathname === item.path ? "#C8102E" : "#6B6B6B",
              }}
            >
              <item.icon size={20} />
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
