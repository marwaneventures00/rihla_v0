import { motion, useReducedMotion } from "framer-motion";

const interSans = { fontFamily: "Inter, system-ui, sans-serif" } as const;

const METRICS = [
  { label: "Cohort readiness", value: "72%", accent: true },
  { label: "Active students", value: "1,240", accent: false },
] as const;

const SKILL_GAPS = [
  { label: "Financial modeling", pct: 64 },
  { label: "Data analysis", pct: 48 },
  { label: "Case interviewing", pct: 37 },
] as const;

export default function InstituteDashboardMock() {
  const reduceMotion = useReducedMotion();

  const hidden = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 };
  const visible = { opacity: 1, y: 0 };
  const d = (delay: number) => (reduceMotion ? 0 : delay);

  return (
    <motion.div
      initial={hidden}
      whileInView={visible}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none"
      style={{ ...interSans, transform: "rotate(-2deg)" }}
      aria-hidden
    >
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_30px_70px_-25px_rgba(0,0,0,0.8)]">
        {/* App top bar */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          </div>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0A0A0A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C8102E]" />
            Cariva Institute — ESCA
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {/* Metric tiles */}
          <div className="grid grid-cols-2 gap-3">
            {METRICS.map((m, idx) => (
              <motion.div
                key={m.label}
                initial={hidden}
                whileInView={visible}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: d(0.2 + idx * 0.1) }}
                className="rounded-lg border border-gray-100 bg-[#FAFAFA] p-3"
              >
                <p className="text-[11px] font-medium text-[#6B6B6B]">{m.label}</p>
                <p
                  className={`mt-1 text-2xl font-bold leading-none tracking-[-0.02em] ${
                    m.accent ? "text-[#C8102E]" : "text-[#0A0A0A]"
                  }`}
                >
                  {m.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Top skills gap highlight */}
          <motion.div
            initial={hidden}
            whileInView={visible}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: d(0.4) }}
            className="mt-3 rounded-lg border border-[#C8102E]/20 bg-[#FFF0F0] px-3 py-2.5"
          >
            <p className="text-[11px] font-medium text-[#6B6B6B]">Top skills gap</p>
            <p className="mt-0.5 text-sm font-semibold text-[#0A0A0A]">Financial modeling</p>
          </motion.div>

          {/* Skills gap bars */}
          <div className="mt-4 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Skills gap by area
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {SKILL_GAPS.map((g, idx) => (
                <div key={g.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[#0A0A0A]">{g.label}</span>
                    <span className="text-[11px] font-medium text-[#6B6B6B]">{g.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      className="h-full rounded-full bg-[#C8102E]"
                      initial={reduceMotion ? { width: `${g.pct}%` } : { width: 0 }}
                      whileInView={{ width: `${g.pct}%` }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.7, ease: "easeOut", delay: d(0.55 + idx * 0.12) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
