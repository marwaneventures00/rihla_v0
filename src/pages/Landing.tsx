import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Check, GraduationCap, Languages, Sparkles, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const PARTNER_UNIVERSITIES = [
  "UM6P",
  "UIR",
  "ENCG Settat",
  "ISCAE",
  "ESSEC",
  "ESCA",
  "Centrale Casablanca",
] as const;

const STATS = [
  { value: "38%", label: "Youth unemployment in Morocco" },
  { value: "34%", label: "Cite education-job mismatch as #1 barrier" },
  { value: "3", label: "AI-powered modules" },
  { value: "90", label: "Day personalized action plan" },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "Personalized career pathways",
    body: "Answer 3 questions. Get AI-generated career paths built for the Moroccan market — with fit scores, salary ranges, and a 90-day action plan.",
    tag: "Powered by AI",
  },
  {
    icon: TrendingUp,
    title: "Real Moroccan job market data",
    body: "Explore 12 sectors, 80+ roles, and 30 top employers. Understand what the market actually wants — before you graduate.",
    tag: "Updated monthly",
  },
  {
    icon: GraduationCap,
    title: "Close your skills gap",
    body: "Practice with AI mock interviews, solve Morocco-specific business cases, and get matched to the exact Coursera courses your pathway needs.",
    tag: "Business cases · Interviews · Courses",
  },
];

const STEPS = [
  { title: "Tell us about yourself", body: "Academic background + personality profile in a guided flow." },
  { title: "AI builds your pathways", body: "Claude analyzes your profile and maps the best-fit outcomes." },
  { title: "Explore and develop", body: "Use market intelligence and practice modules to close your gaps." },
  { title: "Land your dream job", body: "Move from uncertainty to confidence with a clear plan." },
];

const QUOTES = [
  {
    text: "Finally a platform that understands the Moroccan job market. The pathway engine gave me clarity I never had before.",
    author: "Yasmine, Business Student, ESCA",
  },
  {
    text: "The business case simulator is addictive. I practiced 10 cases before my McKinsey interview.",
    author: "Mehdi, Engineering Student, UM6P",
  },
  {
    text: "Our students engagement with career planning went from near-zero to active weekly usage.",
    author: "Career Services Director, Private University",
  },
];

function AnimatedSection({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className={className}
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      whileInView={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

export default function Landing() {
  const reduceMotion = useReducedMotion();
  const { t, toggleLanguage } = useLanguage();
  const heroLine = useMemo(() => "Superintelligence for careers", []);

  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      {/* Floating frosted top bar — centered, clipped so controls stay inside the glass */}
      <div className="sticky top-0 z-50 flex justify-center px-4 pt-3 sm:px-6 sm:pt-4">
        <header className="app-topbar flex h-14 w-full max-w-6xl min-w-0 items-center justify-between gap-2 overflow-hidden rounded-2xl px-3 sm:px-6 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-4 md:px-6">
          <Link to="/" className="shrink-0 justify-self-start text-[15px] font-semibold tracking-tight text-zinc-900">
            Cariva
          </Link>
          <nav className="hidden min-w-0 justify-self-stretch overflow-x-auto md:flex md:items-center md:justify-center">
            <div className="flex shrink-0 items-center gap-5 text-[13px] text-zinc-600 lg:gap-8">
              <a href="#product" className="whitespace-nowrap transition-colors hover:text-zinc-900">
                Product
              </a>
              <a href="#how" className="whitespace-nowrap transition-colors hover:text-zinc-900">
                How it works
              </a>
              <a href="#stories" className="whitespace-nowrap transition-colors hover:text-zinc-900">
                Stories
              </a>
              <a href="#institutions" className="whitespace-nowrap transition-colors hover:text-zinc-900">
                Universities
              </a>
            </div>
          </nav>
          <div className="flex shrink-0 items-center justify-self-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white/40 px-2.5 text-xs text-zinc-600 transition-colors hover:bg-white/70"
              aria-label="Toggle language"
            >
              <Languages className="h-3.5 w-3.5" />
              {t("lang.switch", "FR")}
            </button>
            <Link to="/auth" className="text-[13px] font-medium text-zinc-600 transition-colors hover:text-zinc-900">
              Log in
            </Link>
          </div>
        </header>
      </div>

      {/* Hero — playful accents, student-forward */}
      <section className="relative overflow-hidden border-b border-zinc-200 px-5 pb-24 pt-14 sm:px-8 sm:pb-28 sm:pt-20">
        <div
          className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <motion.h1
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="text-balance text-[2.25rem] font-semibold leading-[1.12] tracking-tight text-zinc-900 sm:text-[2.5rem] sm:leading-[1.1] lg:text-[2.75rem]"
          >
            {heroLine}
          </motion.h1>
          <motion.p
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.08 }}
            className="mx-auto mt-7 max-w-2xl text-pretty text-base font-normal leading-relaxed text-zinc-700 sm:text-lg sm:leading-relaxed"
          >
            Cariva maps your skills, decodes the job market, and builds your personal path to the career you want.
          </motion.p>
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.16 }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <motion.div className="w-full sm:w-auto" whileHover={reduceMotion ? {} : { scale: 1.03 }} whileTap={reduceMotion ? {} : { scale: 0.98 }}>
              <Link
                to="/auth"
                className="inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-opacity hover:opacity-95 sm:w-auto"
              >
                {t("landing.cta.start", "Get started free →")}
              </Link>
            </motion.div>
            <Link
              to="/auth"
              className="inline-flex w-full items-center justify-center rounded-full border-2 border-dashed border-zinc-300 bg-white px-8 py-3 text-sm font-medium text-zinc-800 transition-colors hover:border-primary/40 hover:bg-zinc-50 sm:w-auto"
            >
              {t("landing.cta.universities", "For universities")}
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: reduceMotion ? 0 : 0.24 }}
          className="relative mx-auto mt-14 max-w-6xl"
        >
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 sm:rounded-2xl sm:px-8 sm:py-7">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-10 md:gap-x-12">
              {PARTNER_UNIVERSITIES.map((name) => (
                <span
                  key={name}
                  className="whitespace-nowrap text-center text-[12px] font-semibold tracking-tight text-zinc-600 sm:text-[13px]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="relative z-[1] mx-auto mt-10 max-w-2xl text-center text-xs text-zinc-500 sm:text-sm">
          Trusted by leading Moroccan universities · Powered by frontier AI
        </p>
      </section>

      <AnimatedSection id="stats" className="border-b border-zinc-200 px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 lg:grid-cols-4 lg:gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center lg:text-left">
              <p className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">{s.value}</p>
              <p className="mt-2 text-sm leading-snug text-zinc-600">{s.label}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection id="product" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Everything you need to launch your career
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-600">Three AI-powered modules working together</p>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">
                  <f.icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-900">{f.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600">{f.body}</p>
                <p className="mt-6 text-xs font-medium text-zinc-500">{f.tag}</p>
              </article>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="how" className="border-y border-zinc-200 bg-zinc-50/50 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            From lost to launched. In minutes.
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative md:text-center">
                <div className="mx-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 md:mx-auto">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-base font-semibold text-zinc-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="stories" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Built for Morocco&apos;s generation of achievers
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {QUOTES.map((q) => (
              <blockquote
                key={q.author}
                className="rounded-xl border border-zinc-200 bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
              >
                <p className="text-sm leading-relaxed text-zinc-800">&ldquo;{q.text}&rdquo;</p>
                <footer className="mt-5 text-sm text-zinc-500">— {q.author}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="institutions" className="border-t border-zinc-200 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">For institutions</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Give your students an unfair advantage
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-zinc-600 sm:text-base">
              Cariva gives your institution a full career intelligence dashboard — cohort readiness scores, skills gap
              analysis, sector demand trends. The data your accreditors want to see.
            </p>
            <Link
              to="/auth"
              className="mt-8 inline-flex rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Request a demo →
            </Link>
            <ul className="mt-8 space-y-3 text-sm text-zinc-800">
              {["University-level analytics dashboard", "Student career readiness scores", "Skills gap heatmap by department"].map(
                (item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-zinc-900" strokeWidth={2} />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="grid grid-cols-2 gap-4">
              {["25 universities", "8,000+ students"].map((item) => (
                <div key={item} className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50/80 px-8 py-14 text-center shadow-sm sm:px-12">
          <p className="text-2xl" aria-hidden>
            🚀
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">Ready when you are.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-600 sm:text-base">
            Join thousands of Moroccan students building their future with AI — no stress, just next steps.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-opacity hover:opacity-95"
          >
            Start for free →
          </Link>
          <p className="mt-4 text-xs text-zinc-500 sm:text-sm">Free via your university · No credit card required</p>
        </div>
      </AnimatedSection>

      <footer className="border-t border-zinc-200 bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="text-[15px] font-semibold text-zinc-900">Cariva</p>
            <p className="mt-2 text-sm text-zinc-600">AI-native career intelligence</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li>
                <a href="#product" className="hover:text-zinc-900">
                  Pathways
                </a>
              </li>
              <li>
                <a href="#product" className="hover:text-zinc-900">
                  Market data
                </a>
              </li>
              <li>
                <a href="#how" className="hover:text-zinc-900">
                  How it works
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li>
                <span>For universities</span>
              </li>
              <li>
                <span>About</span>
              </li>
              <li>
                <span>Contact</span>
              </li>
            </ul>
          </div>
          <div className="md:text-right">
            <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-600">
              Powered by AI
            </span>
            <p className="mt-4 text-xs text-zinc-500">© {new Date().getFullYear()} Cariva. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
