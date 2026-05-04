import type { CSSProperties } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BarChart2, BookOpen, Briefcase, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  /** Desktop sidebar narrow (64px) vs full (220px). */
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
};

function isActivePath(pathname: string, path: string) {
  if (path === "/learn")
    return pathname === "/learn" || pathname === "/pathways" || pathname.startsWith("/learn/");
  if (path === "/field") return pathname === "/field" || pathname === "/market";
  if (path === "/pipeline") return pathname === "/pipeline" || pathname === "/pmo";
  return pathname === path || pathname.startsWith(`${path}/`);
}

const navItemBase: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 16px",
  borderRadius: 10,
  margin: "2px 12px",
  textDecoration: "none",
  fontSize: 14,
  transition: "all 0.15s ease",
};

export function Sidebar({ isCollapsed, onToggleCollapsed }: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const isOnMentorPage = pathname === "/learn/path";

  const items = [
    { to: "/learn", path: "/learn", icon: BookOpen, labelKey: "nav.learn" as const },
    { to: "/field", path: "/field", icon: BarChart2, labelKey: "nav.field" as const },
    { to: "/pipeline", path: "/pipeline", icon: Briefcase, labelKey: "nav.pipeline" as const },
  ];

  const asideWidth = isCollapsed ? 64 : 220;

  const desktopAsideStyle: CSSProperties = {
    width: asideWidth,
    height: "100vh",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 45,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    background: "rgba(255,255,255,0.85)",
    borderRight: "1px solid rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.25s ease",
    overflow: "visible",
  };

  return (
    <>
      <aside className="hidden md:flex" style={desktopAsideStyle} aria-label="Main navigation">
        <div
          className={cn("shrink-0 transition-[padding] duration-[250ms] ease-in-out", isCollapsed ? "flex justify-center px-0" : "pl-5")}
          style={{ paddingTop: 24 }}
        >
          <Link
            to="/learn"
            className={cn("inline-flex items-center no-underline text-inherit", isCollapsed ? "justify-center gap-0" : "gap-2")}
          >
            <span className="text-[#C8102E]" style={{ fontSize: 20, lineHeight: 1 }} aria-hidden>
              ●
            </span>
            <span
              className={cn(
                "whitespace-nowrap transition-opacity duration-200 ease-in-out",
                isCollapsed ? "w-0 max-w-0 overflow-hidden opacity-0" : "opacity-100",
              )}
              style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 700, color: "#0A0A0A" }}
            >
              Cariva
            </span>
          </Link>
        </div>

        <nav style={{ marginTop: 40 }} className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {items.map(({ to, path, icon: Icon, labelKey }) => {
            const active = isActivePath(pathname, path);
            return (
              <Link
                key={to}
                to={to}
                style={{
                  ...navItemBase,
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  margin: isCollapsed ? "2px 8px" : "2px 12px",
                  padding: isCollapsed ? "10px" : "10px 16px",
                  gap: isCollapsed ? 0 : 10,
                }}
                className={cn(
                  active
                    ? "bg-[#FFF0F0] text-[#C8102E] font-semibold"
                    : "font-normal text-[#6B6B6B] hover:bg-[#F5F5F5] hover:text-[#0A0A0A]",
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                <span
                  className={cn(
                    "min-w-0 truncate transition-opacity duration-200 ease-in-out",
                    isCollapsed ? "pointer-events-none w-0 max-w-0 overflow-hidden opacity-0" : "opacity-100",
                  )}
                >
                  {t(labelKey)}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex shrink-0 flex-col">
          {!isOnMentorPage && (
            <button
              type="button"
              onClick={() => navigate("/learn/path")}
              className={cn(
                "flex shrink-0 cursor-pointer items-center border border-[#E5E5E5] bg-transparent font-medium text-[#6B6B6B] transition-all duration-150 ease-in-out hover:border-[#0A0A0A] hover:bg-transparent hover:text-[#0A0A0A]",
                isCollapsed ? "mx-auto mb-6 size-10 justify-center p-0" : "mb-6",
              )}
              style={
                isCollapsed
                  ? {
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "Inter, system-ui, sans-serif",
                    }
                  : {
                      margin: "0 12px 24px",
                      width: "calc(100% - 24px)",
                      padding: "10px 14px",
                      gap: 8,
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "Inter, system-ui, sans-serif",
                    }
              }
              aria-label={t("nav.mentor")}
            >
              <MessageCircle className="shrink-0" size={15} strokeWidth={2} aria-hidden style={{ color: "inherit" }} />
              <span
                className={cn(
                  "whitespace-nowrap transition-opacity duration-200 ease-in-out",
                  isCollapsed ? "sr-only" : "",
                )}
              >
                {t("nav.mentor")}
              </span>
            </button>
          )}
        </div>

      </aside>

      {/* Fixed so it sits above main content (sibling); absolute was painted under the main column. */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="pointer-events-auto fixed z-[60] hidden cursor-pointer items-center justify-center border-[1.5px] border-[#E5E5E5] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] md:flex"
        style={{
          bottom: 80,
          left: asideWidth - 12,
          width: 24,
          height: 24,
          borderRadius: "50%",
        }}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-[14px] w-[14px] text-[#6B6B6B]" strokeWidth={2} aria-hidden />
        ) : (
          <ChevronLeft className="h-[14px] w-[14px] text-[#6B6B6B]" strokeWidth={2} aria-hidden />
        )}
      </button>

      <nav
        className="md:hidden flex items-center justify-around border-t border-black/[0.06]"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          zIndex: 40,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          background: "rgba(255,255,255,0.85)",
        }}
        aria-label="Main navigation"
      >
        {items.map(({ to, path, icon: Icon, labelKey }) => {
          const active = isActivePath(pathname, path);
          return (
            <Link
              key={to}
              to={to}
              className="flex h-full flex-1 items-center justify-center no-underline"
              style={{ color: active ? "#C8102E" : "#6B6B6B" }}
              aria-label={t(labelKey)}
            >
              <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 2} />
            </Link>
          );
        })}
        {!isOnMentorPage && (
          <button
            type="button"
            onClick={() => navigate("/learn/path")}
            className="flex h-full flex-1 cursor-pointer items-center justify-center border-0 bg-transparent"
            style={{ color: "#0A0A0A" }}
            aria-label={t("nav.mentor")}
          >
            <MessageCircle className="h-6 w-6" strokeWidth={2} />
          </button>
        )}
      </nav>
    </>
  );
}
