import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const interSans = { fontFamily: "Inter, system-ui, sans-serif" } as const;

export type NavDropdownItem = {
  title: string;
  sublabel?: string;
  to?: string;
  soon?: boolean;
};

/** Shared "coming soon" pill — kept identical everywhere (Firm, Solutions, Pricing, Events, Podcasts). */
export function SoonPill() {
  return (
    <span
      className="rounded-full bg-[#F0F0F0] px-2 py-0.5 text-[10px] font-medium text-gray-400"
      style={interSans}
    >
      Soon
    </span>
  );
}

type NavDropdownProps = {
  label: string;
  items: NavDropdownItem[];
  /** Accessible label for the menu panel; defaults to `label`. */
  ariaLabel?: string;
};

/**
 * Single reusable click-to-open nav dropdown. Drives Products, Capabilities and
 * Resources so they behave identically: click to toggle, chevron rotates, closes
 * on outside-click / Escape / route-change, panel portaled above the blurred nav.
 */
export default function NavDropdown({ label, items, ariaLabel }: NavDropdownProps) {
  const reduceMotion = useReducedMotion();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({ top: rect.bottom + 8, left: rect.left });
  }, []);

  // Position the panel from the trigger's viewport rect before paint.
  useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  // Keep aligned to the trigger while the panel is open.
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Close whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1 whitespace-nowrap rounded-md text-[13px] text-zinc-600 transition-colors hover:text-[#0A0A0A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8102E]/40"
        style={interSans}
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
          aria-hidden
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              role="menu"
              aria-label={ariaLabel ?? label}
              initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed z-[60] w-64 rounded-xl border border-gray-200/80 bg-white p-1.5 shadow-lg shadow-gray-300/40"
              style={{ ...interSans, top: coords.top, left: coords.left }}
            >
              {items.map((item) =>
                item.soon || !item.to ? (
                  <div
                    key={item.title}
                    role="menuitem"
                    aria-disabled
                    className="flex cursor-default items-start gap-2.5 rounded-lg px-3 py-2.5"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" aria-hidden />
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-gray-400">{item.title}</span>
                        <SoonPill />
                      </span>
                      {item.sublabel && (
                        <span className="mt-0.5 block text-[12px] text-gray-400">{item.sublabel}</span>
                      )}
                    </span>
                  </div>
                ) : (
                  <Link
                    key={item.title}
                    to={item.to}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 no-underline transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8102E]" aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-[#0A0A0A]">{item.title}</span>
                      {item.sublabel && (
                        <span className="mt-0.5 block text-[12px] text-[#6B6B6B]">{item.sublabel}</span>
                      )}
                    </span>
                  </Link>
                ),
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
