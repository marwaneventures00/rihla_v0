import { motion, useReducedMotion } from "framer-motion";

const interSans = { fontFamily: "Inter, system-ui, sans-serif" } as const;

type SkillStep = {
  label: string;
  hint: string;
};

const SKILL_STEPS: SkillStep[] = [
  { label: "Financial modeling & valuation", hint: "3 cases" },
  { label: "LBO & deal analysis", hint: "Mock deal" },
  { label: "Bulge-bracket interview prep", hint: "AI mock interview" },
];

export default function HeroReportMock() {
  const reduceMotion = useReducedMotion();

  const hidden = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 };
  const visible = { opacity: 1, y: 0 };
  const d = (delay: number) => (reduceMotion ? 0 : delay);

  return (
    <motion.div
      initial={hidden}
      animate={visible}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50 lg:mx-0 lg:max-w-none"
      style={interSans}
      aria-hidden
    >
      {/* Minimal browser top bar */}
      <div className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
      </div>

      <div className="p-5 sm:p-6">
        {/* Chat exchange with Mentor */}
        <div className="flex flex-col gap-2">
          <motion.div
            initial={hidden}
            animate={visible}
            transition={{ duration: 0.45, ease: "easeOut", delay: d(0.2) }}
            className="flex justify-end"
          >
            <p className="max-w-[75%] rounded-2xl bg-gray-100 px-3 py-2 text-sm text-[#0A0A0A]">
              I&apos;m a finance student — strong in modeling and markets, want something high-stakes and fast-paced.
            </p>
          </motion.div>

          <motion.div
            initial={hidden}
            animate={visible}
            transition={{ duration: 0.45, ease: "easeOut", delay: d(0.35) }}
            className="flex flex-col items-start"
          >
            <span className="mb-1 text-xs text-gray-400">Mentor</span>
            <p className="max-w-[80%] rounded-2xl bg-red-50 px-3 py-2 text-sm text-[#0A0A0A]">
              Clear signal. Your profile maps to the most competitive finance tracks — here&apos;s the fit 👇
            </p>
          </motion.div>
        </div>

        {/* Divider between conversation and results */}
        <div className="my-3 border-t border-gray-100" />

        {/* Results header */}
        <motion.div
          initial={hidden}
          animate={visible}
          transition={{ duration: 0.45, ease: "easeOut", delay: d(0.5) }}
        >
          <h3 className="text-lg font-bold tracking-tight text-[#0A0A0A] sm:text-xl">
            Here&apos;s who you are, Marwane.
          </h3>
          <p className="mt-1 text-sm text-[#6B6B6B]">Based on your conversation with Mentor</p>
        </motion.div>

        <div className="mt-5 flex flex-col gap-3">
          {/* #1 match — visual anchor */}
          <motion.div
            initial={hidden}
            animate={visible}
            transition={{ duration: 0.5, ease: "easeOut", delay: d(0.65) }}
            className="rounded-xl border-2 border-[#C8102E] p-4"
          >
            <span className="inline-block rounded-full bg-[#FFF0F0] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#C8102E]">
              #1 Match
            </span>
            <p className="mt-3 text-base font-bold leading-tight text-[#0A0A0A]">
              Investment Banking Analyst
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold leading-none text-[#C8102E]">94%</span>
              <span className="text-sm text-[#6B6B6B]">match</span>
            </div>
          </motion.div>

          {/* #2 match — condensed single-line row */}
          <motion.div
            initial={hidden}
            animate={visible}
            transition={{ duration: 0.5, ease: "easeOut", delay: d(0.8) }}
            className="flex items-center gap-3 rounded-xl border border-gray-200 p-3"
          >
            <span className="shrink-0 rounded-full bg-[#F7F7F7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B6B6B]">
              #2
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#0A0A0A]">
              Private Equity Analyst
            </p>
            <span className="shrink-0 text-base font-bold leading-none text-[#C8102E]">91%</span>
          </motion.div>
        </div>

        {/* Skill path — "here's how you get there" */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <motion.p
            initial={hidden}
            animate={visible}
            transition={{ duration: 0.45, ease: "easeOut", delay: d(0.95) }}
            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Your path to get there
          </motion.p>
          <div className="mt-3 flex flex-col gap-2.5">
            {SKILL_STEPS.map((step, idx) => (
              <motion.div
                key={step.label}
                initial={hidden}
                animate={visible}
                transition={{ duration: 0.4, ease: "easeOut", delay: d(1.05 + idx * 0.1) }}
                className="flex items-center gap-3"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF0F0] text-[11px] font-bold text-[#C8102E]">
                  {idx + 1}
                </span>
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#0A0A0A]">
                  {step.label}
                </p>
                <span className="shrink-0 text-xs text-gray-400">{step.hint}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
