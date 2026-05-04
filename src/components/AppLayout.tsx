import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

export type AppLayoutOutletContext = { sidebarCollapsed: boolean };

// INSTITUTE_ENABLED = false — admin/institute UI removed; layout is student-only.

type LayoutProfile = { full_name: string | null; institution_name: string | null; avatar_url: string | null };

function pageTitleForPath(pathname: string, t: (key: string) => string) {
  if (pathname === "/learn/path/report") return t("page.learnReport");
  if (pathname === "/learn/path") return t("page.learnPath");
  if (pathname === "/learn" || pathname === "/pathways") return t("nav.learn");
  if (pathname === "/field" || pathname === "/market") return t("nav.field");
  if (pathname === "/pipeline" || pathname === "/pmo") return t("nav.pipeline");
  if (pathname.startsWith("/develop")) return t("nav.develop");
  if (pathname.startsWith("/pulse")) return t("page.pulse");
  if (pathname.startsWith("/profile")) return t("nav.profile");
  if (pathname.startsWith("/meet")) return t("nav.meet");
  return t("brand.tagline");
}

export default function AppLayout({ requireRole = "student" }: { requireRole?: "student" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [layoutUserId, setLayoutUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<LayoutProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  const pageTitle = useMemo(() => pageTitleForPath(location.pathname, t), [location.pathname, t]);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
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
      setLayoutUserId(uid);
      setEmail(s.session.user.email ?? null);

      const [{ data: roles }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", uid),
        supabase.from("profiles").select("full_name, institution_name, avatar_url").eq("id", uid).maybeSingle(),
      ]);
      if (!mounted) return;

      const roleSet = new Set((roles ?? []).map((r) => r.role));
      if (requireRole === "student" && !roleSet.has("student")) {
        navigate("/auth", { replace: true });
        return;
      }

      const p = prof as LayoutProfile | null;
      setProfile(p);
      const raw = p?.avatar_url?.trim();
      setAvatarSrc(raw ? `${raw.split("?")[0]}?t=${Date.now()}` : null);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [navigate, requireRole, location.pathname]);

  useEffect(() => {
    if (!layoutUserId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url, full_name, institution_name")
        .eq("id", layoutUserId)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("Avatar/profile refetch:", error);
        return;
      }
      if (data) {
        setProfile((p) => ({
          full_name: data.full_name ?? p?.full_name ?? null,
          institution_name: data.institution_name ?? p?.institution_name ?? null,
          avatar_url: data.avatar_url ?? p?.avatar_url ?? null,
        }));
        const raw = data.avatar_url?.trim();
        setAvatarSrc(raw ? `${raw.split("?")[0]}?t=${Date.now()}` : null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [layoutUserId, location.pathname]);

  useEffect(() => {
    const onAvatar = (e: Event) => {
      const ce = e as CustomEvent<{ url: string }>;
      const u = ce.detail?.url?.trim();
      if (!u) return;
      setAvatarSrc(`${u.split("?")[0]}?t=${Date.now()}`);
      setProfile((p) => (p ? { ...p, avatar_url: u.split("?")[0] } : p));
    };
    window.addEventListener("cariva:avatar-updated", onAvatar as EventListener);
    return () => window.removeEventListener("cariva:avatar-updated", onAvatar as EventListener);
  }, []);

  const initials = (() => {
    const name = profile?.full_name?.trim();
    if (name) {
      return name
        .split(/\s+/)
        .map((s) => s[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    const em = email?.trim();
    if (em) {
      const local = em.split("@")[0] ?? "";
      return local.slice(0, 2).toUpperCase() || "U";
    }
    return "U";
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
    <div className="min-h-screen flex w-full" style={{ background: "#FAFAF8" }}>
      <Sidebar isCollapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed((c) => !c)} />

      <div
        className={`flex min-h-0 flex-1 flex-col min-w-0 ${isMobile ? "pb-[calc(60px+env(safe-area-inset-bottom,0px))]" : ""}`}
        style={
          !isMobile
            ? {
                marginLeft: sidebarOffsetPx,
                transition: "margin-left 0.25s ease",
              }
            : undefined
        }
      >
        <header style={pillNavStyle} aria-label="Page toolbar">
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
              style={{ width: 32, height: 32, background: avatarSrc ? "transparent" : "#F5F5F5" }}
              aria-label="Profile"
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full pt-[80px] pb-6 md:pb-8" style={{ background: "#FAFAF8" }}>
          <div
            className="mx-auto w-full max-w-[1100px] px-5 py-6 md:px-10 md:pt-12 md:pb-10"
            style={{ background: "#FAFAF8" }}
          >
            <Outlet context={{ sidebarCollapsed } as AppLayoutOutletContext} />
          </div>
        </main>
      </div>
    </div>
  );
}
