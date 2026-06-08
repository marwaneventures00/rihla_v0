import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import NavDropdown, { SoonPill, type NavDropdownItem } from "@/components/landing/NavDropdown";

const interSans = { fontFamily: "Inter, system-ui, sans-serif" } as const;

const BOOK_INTRO_MAILTO = "mailto:hello@cariva.ai";

const PRODUCTS: NavDropdownItem[] = [
  { title: "Cariva Learn", sublabel: "For students", to: "/" },
  { title: "Cariva Institute", sublabel: "For universities", to: "/institutions" },
  { title: "Cariva Firm", sublabel: "For employers", soon: true },
];

// All three routes verified present in src/App.tsx (behind the student app shell).
const CAPABILITIES: NavDropdownItem[] = [
  { title: "Mentor", sublabel: "Your AI career guide", to: "/learn/path" },
  { title: "Paths", sublabel: "Personalized pathways", to: "/learn" },
  { title: "Market data", sublabel: "Live Moroccan job data", to: "/field" },
];

const RESOURCES: NavDropdownItem[] = [
  { title: "Events", soon: true },
  { title: "Podcasts", soon: true },
];

/** Subtle, route-driven product tag shown beside the logo. */
function ContextTag({ pathname }: { pathname: string }) {
  const label = pathname.startsWith("/institutions") ? "Institute" : null;
  if (!label) return null;
  return (
    <span
      className="hidden shrink-0 rounded-full border border-[#C8102E]/15 bg-[#C8102E]/[0.06] px-2 py-0.5 text-[11px] font-medium text-[#C8102E] sm:inline-block"
      style={interSans}
    >
      {label}
    </span>
  );
}

/** Greyed-out, non-navigating top-level item with a "Soon" pill (Solutions, Pricing). */
function SoonNavItem({ label }: { label: string }) {
  return (
    <span
      className="flex cursor-default items-center gap-1.5 whitespace-nowrap text-[13px] text-gray-400"
      style={interSans}
      aria-disabled
    >
      {label}
      <SoonPill />
    </span>
  );
}

function MobileSoonRow({ label }: { label: string }) {
  return (
    <div className="flex cursor-default items-center gap-2 px-1 py-2" aria-disabled>
      <span className="text-[15px] font-medium text-gray-400" style={interSans}>
        {label}
      </span>
      <SoonPill />
    </div>
  );
}

function MobileGroup({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: NavDropdownItem[];
  onNavigate: () => void;
}) {
  return (
    <div className="py-1">
      <p
        className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400"
        style={interSans}
      >
        {label}
      </p>
      <div className="flex flex-col">
        {items.map((item) =>
          item.soon || !item.to ? (
            <div key={item.title} className="flex cursor-default items-center gap-2 px-1 py-2" aria-disabled>
              <span className="text-[15px] font-medium text-gray-400" style={interSans}>
                {item.title}
              </span>
              <SoonPill />
            </div>
          ) : (
            <Link
              key={item.title}
              to={item.to}
              onClick={onNavigate}
              className="px-1 py-2 text-[15px] font-medium text-[#0A0A0A] no-underline"
              style={interSans}
            >
              {item.title}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

export default function SiteNav() {
  const reduceMotion = useReducedMotion();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile menu on route change.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close the mobile menu on Escape + lock body scroll while open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  return (
    <div className="sticky top-0 z-50 flex justify-center px-4 pt-3 sm:px-6 sm:pt-4">
      <header className="flex h-14 w-full max-w-6xl min-w-0 items-center justify-between gap-2 rounded-2xl border border-white/30 bg-white/60 px-3 shadow-lg shadow-gray-200/40 backdrop-blur-xl sm:px-6 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-4 md:px-6">
        {/* Brand + contextual product tag */}
        <div className="flex min-w-0 shrink-0 items-center gap-2 justify-self-start">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#C8102E]" aria-hidden />
            <span
              className="text-[17px] font-bold tracking-tight text-[#0A0A0A]"
              style={{ fontFamily: "Inter, sans-serif", fontWeight: 700 }}
            >
              Cariva
            </span>
          </Link>
          <ContextTag pathname={location.pathname} />
        </div>

        {/* Desktop nav items */}
        <nav className="hidden min-w-0 justify-self-stretch overflow-visible md:flex md:items-center md:justify-center">
          <div className="flex shrink-0 items-center gap-4 text-[13px] text-zinc-600 lg:gap-6" style={interSans}>
            <NavDropdown label="Products" items={PRODUCTS} />
            <NavDropdown label="Capabilities" items={CAPABILITIES} />
            <SoonNavItem label="Solutions" />
            <NavDropdown label="Resources" items={RESOURCES} />
            <SoonNavItem label="Pricing" />
          </div>
        </nav>

        {/* Right-side actions */}
        <div className="flex shrink-0 items-center gap-3 justify-self-end">
          <Button
            asChild
            size="sm"
            className="hidden h-9 rounded-full border-0 bg-[#C8102E] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-[#A50D26] sm:inline-flex"
          >
            <a href={BOOK_INTRO_MAILTO} style={interSans}>
              Book intro
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            className="hidden h-9 rounded-full border-0 bg-[#0A0A0A] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-zinc-800 sm:inline-flex"
          >
            <Link to="/auth" style={interSans}>
              Log in
            </Link>
          </Button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#0A0A0A] transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/40 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" strokeWidth={2} /> : <Menu className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.nav
              className="fixed left-4 right-4 top-[72px] z-50 max-h-[calc(100vh-88px)] overflow-y-auto rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xl shadow-gray-300/40 md:hidden"
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              aria-label="Mobile navigation"
            >
              <MobileGroup label="Products" items={PRODUCTS} onNavigate={() => setMobileOpen(false)} />
              <div className="my-1 h-px bg-gray-100" aria-hidden />
              <MobileGroup label="Capabilities" items={CAPABILITIES} onNavigate={() => setMobileOpen(false)} />
              <div className="my-1 h-px bg-gray-100" aria-hidden />
              <MobileSoonRow label="Solutions" />
              <div className="my-1 h-px bg-gray-100" aria-hidden />
              <MobileGroup label="Resources" items={RESOURCES} onNavigate={() => setMobileOpen(false)} />
              <div className="my-1 h-px bg-gray-100" aria-hidden />
              <MobileSoonRow label="Pricing" />

              <div className="mt-3 flex flex-col gap-2">
                <a
                  href={BOOK_INTRO_MAILTO}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#C8102E] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-[#A50D26]"
                  style={interSans}
                >
                  Book intro
                </a>
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-[#0A0A0A] px-4 text-[14px] font-semibold text-white no-underline transition-colors hover:bg-zinc-800"
                  style={interSans}
                >
                  Log in
                </Link>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
