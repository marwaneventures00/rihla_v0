import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Building2, Check, GraduationCap, Sparkles, TrendingUp, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

const STATS = [
  {
    kicker: "National indicator",
    stat: "38%",
    description: "youth unemployment in Morocco",
  },
  {
    kicker: "Graduate survey",
    stat: "34%",
    description: "cite education–job mismatch as their #1 barrier",
  },
  {
    kicker: "Cariva platform",
    stat: "3",
    description: "AI-powered modules in one workspace",
  },
  {
    kicker: "Every pathway",
    stat: "90",
    description: "days in your personalized action plan",
  },
  {
    kicker: "Job market map",
    stat: "12+",
    description: "sectors with Morocco-specific intelligence",
  },
] as const;

const FEATURES = [
  {
    icon: Sparkles,
    title: "Personalized career pathways",
    body: "Answer 3 questions. Get AI-generated career paths built for the Moroccan market — with fit scores, salary ranges, and a 90-day action plan.",
  },
  {
    icon: TrendingUp,
    title: "Real Moroccan job market data",
    body: "Explore 12 sectors, 80+ roles, and 30 top employers. Understand what the market actually wants — before you graduate.",
  },
  {
    icon: GraduationCap,
    title: "Close your skills gap",
    body: "Practice with AI mock interviews, solve Morocco-specific business cases, and get matched to the exact Coursera courses your pathway needs.",
  },
];

const STEPS = [
  { title: "Tell us about yourself", body: "Academic background + personality profile in a guided flow." },
  { title: "AI builds your pathways", body: "Claude analyzes your profile and maps the best-fit outcomes." },
  { title: "Explore and develop", body: "Use market intelligence and practice modules to close your gaps." },
  { title: "Land your dream job", body: "Move from uncertainty to confidence with a clear plan." },
];

const INSTITUTION_STATS = [
  { value: "25", label: "Partner universities", Icon: Building2 },
  { value: "8,000+", label: "Students on the platform", Icon: Users },
] as const;

const QUOTES = [
  {
    text: "Finally a platform that understands the Moroccan job market. The pathway engine gave me clarity I never had before.",
    name: "Yasmine",
    title: "Business Student, ESCA",
  },
  {
    text: "The business case simulator is addictive. I practiced 10 cases before my McKinsey interview.",
    name: "Mehdi",
    title: "Engineering Student, UM6P",
  },
  {
    text: "Our students engagement with career planning went from near-zero to active weekly usage.",
    name: "Career Services Director",
    title: "Private University",
  },
];

const interSans = { fontFamily: "Inter, system-ui, sans-serif" } as const;

function AnimatedSection({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      id={id}
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

  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      {/* Floating frosted top bar — centered, clipped so controls stay inside the glass */}
      <div className="sticky top-0 z-50 flex justify-center px-4 pt-3 sm:px-6 sm:pt-4">
        <header className="app-topbar flex h-14 w-full max-w-6xl min-w-0 items-center justify-between gap-2 overflow-hidden rounded-2xl px-3 sm:px-6 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-4 md:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2 justify-self-start">
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#C8102E]" aria-hidden />
            <span className="font-serif text-[17px] font-bold tracking-tight text-[#0A0A0A]">Cariva</span>
          </Link>
          <nav className="hidden min-w-0 justify-self-stretch overflow-x-auto md:flex md:items-center md:justify-center">
            <div
              className="flex shrink-0 items-center gap-4 text-[13px] text-zinc-600 lg:gap-6"
              style={interSans}
            >
              <a href="#product" className="whitespace-nowrap transition-colors hover:text-[#0A0A0A]">
                Products
              </a>
              <a href="#how" className="whitespace-nowrap transition-colors hover:text-[#0A0A0A]">
                Capabilities
              </a>
              <a href="#product" className="whitespace-nowrap transition-colors hover:text-[#0A0A0A]">
                Solutions
              </a>
              <a href="#stories" className="whitespace-nowrap transition-colors hover:text-[#0A0A0A]">
                Resources
              </a>
              <a href="#institutions" className="whitespace-nowrap transition-colors hover:text-[#0A0A0A]">
                Pricing
              </a>
            </div>
          </nav>
          <div className="flex shrink-0 items-center justify-self-end">
            <Button
              asChild
              size="sm"
              className="h-9 rounded-full border-0 bg-[#0A0A0A] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-zinc-800"
            >
              <Link to="/auth" style={interSans}>
                Log in
              </Link>
            </Button>
          </div>
        </header>
      </div>

      {/* Hero — minimal centered stack (large headline, narrow sub, black pill CTA) */}
      <section className="relative overflow-hidden bg-white px-5 pt-24 pb-24 text-center sm:px-8 sm:pt-28 sm:pb-28 md:pt-32 md:pb-32">
        <div className="relative mx-auto w-full max-w-[920px] text-center">
          <motion.h1
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="text-balance font-black leading-[0.98] tracking-[-0.045em] text-[#0A0A0A]"
            style={{
              ...interSans,
              fontSize: "clamp(42px, 7vw, 80px)",
            }}
          >
            <span className="block sm:inline">Your career, </span>
            <span className="block sm:inline">decoded.</span>
          </motion.h1>
          <motion.p
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.08 }}
            className="mx-auto mt-8 max-w-[34rem] text-pretty text-[17px] font-normal leading-[1.55] text-[#404040] sm:mt-10 sm:text-[18px]"
            style={interSans}
          >
            Cariva maps your skills, reads the job market, and builds your personal action plan in minutes.
          </motion.p>
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.16 }}
            className="mt-10 flex flex-col items-center gap-4 sm:mt-12"
          >
            <Link
              to="/auth"
              className="inline-flex w-full max-w-sm items-center justify-center rounded-full border-0 bg-[#C8102E] px-10 py-4 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#A50D26] sm:w-auto sm:max-w-none sm:px-12 sm:py-4"
              style={interSans}
            >
              Get started free
            </Link>
            <Link
              to="/auth"
              className="text-[14px] font-medium text-[#525252] underline-offset-4 transition-colors hover:text-[#0A0A0A] hover:underline"
              style={interSans}
            >
              For universities
            </Link>
          </motion.div>
        </div>
      </section>

      <section id="stats" className="bg-white px-5 sm:px-8" aria-label="Key statistics">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 divide-y divide-y-[0.5px] divide-zinc-200/30 md:grid-cols-5 md:divide-x md:divide-x-[0.5px] md:divide-y-0">
            {STATS.map((s, i) => (
              <motion.div
                key={s.kicker}
                className="flex flex-col items-start gap-3 py-8 md:gap-4 md:py-11 md:pl-5 md:first:pl-0 lg:pl-6 lg:first:pl-0"
                initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                whileInView={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: reduceMotion ? 0 : i * 0.06, ease: "easeOut" }}
                style={interSans}
              >
                <p className="text-[13px] font-normal leading-snug text-[#525252]">{s.kicker}</p>
                <p className="text-[clamp(2rem,3.5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#0A0A0A]">
                  {s.stat}
                </p>
                <p className="max-w-[14rem] text-[13px] font-normal leading-snug text-[#0A0A0A] md:max-w-[11.5rem] lg:max-w-[13rem]">
                  {s.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AnimatedSection id="product" className="bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.p
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            whileInView={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-auto max-w-[min(100%,36rem)] px-2 text-center"
            style={interSans}
          >
            <span className="inline-block rounded-full border border-[#C8102E]/25 bg-gradient-to-r from-[#C8102E]/[0.14] via-[#C8102E]/[0.08] to-[#C8102E]/[0.14] px-5 py-2.5 text-[clamp(1.0625rem,2.1vw,1.25rem)] font-semibold leading-snug tracking-tight text-[#0A0A0A] shadow-[0_2px_16px_rgba(200,16,46,0.12)] sm:px-6 sm:py-3">
              Three AI-powered modules working together
            </span>
          </motion.p>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="flex flex-col bg-white px-6 py-8 transition-[box-shadow,border-radius] duration-[250ms] ease-in-out hover:rounded-2xl hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
              >
                <f.icon className="h-6 w-6 shrink-0 text-[#C8102E]" strokeWidth={1.5} aria-hidden />
                <h3 className="mt-4 text-[17px] font-semibold text-[#0A0A0A]" style={interSans}>
                  {f.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-[#6B6B6B]" style={interSans}>
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <section id="how" className="px-5 py-[80px] sm:px-8" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl">
          <h2
            id="how-heading"
            className="text-center text-[clamp(32px,4vw,48px)] font-bold tracking-[-0.02em] text-[#0A0A0A]"
            style={interSans}
          >
            From lost to launched. In minutes.
          </h2>
          <div className="relative mx-auto mt-14 max-w-5xl md:mt-16">
            <div
              className="pointer-events-none absolute left-8 right-8 top-5 z-0 hidden h-px bg-[#E5E5E5] md:block md:left-12 md:right-12 lg:left-16 lg:right-16"
              aria-hidden
            />
            <div className="relative z-10 flex flex-col items-stretch gap-0 md:flex-row md:items-start">
              {STEPS.map((step, i) => (
                <motion.div
                  key={step.title}
                  className="flex w-full min-w-0 flex-1 flex-col items-center"
                  initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  whileInView={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: reduceMotion ? 0 : i * 0.15, ease: "easeOut" }}
                >
                  {i > 0 && (
                    <div className="mx-auto h-10 w-px shrink-0 bg-[#E5E5E5] md:hidden" aria-hidden />
                  )}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8102E] text-base font-bold leading-none text-white"
                    style={interSans}
                  >
                    {i + 1}
                  </div>
                  <h3 className="mt-4 text-center text-[15px] font-semibold text-[#0A0A0A]" style={interSans}>
                    {step.title}
                  </h3>
                  <p
                    className="mt-1.5 max-w-[180px] text-center text-[13px] leading-[1.5] text-[#6B6B6B]"
                    style={interSans}
                  >
                    {step.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AnimatedSection id="stories" className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <h2
            id="stories-heading"
            className="text-center text-[clamp(32px,4vw,48px)] font-bold tracking-[-0.02em] text-[#0A0A0A]"
            style={interSans}
          >
            Built for Morocco&apos;s generation of achievers
          </h2>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {QUOTES.map((q) => (
              <blockquote
                key={q.name + q.title}
                className="rounded-2xl bg-white p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
              >
                <span
                  className="mb-4 block font-black leading-[0] text-[#C8102E]"
                  style={{ ...interSans, fontSize: "48px" }}
                  aria-hidden
                >
                  &ldquo;
                </span>
                <p
                  className="text-[15px] italic leading-[1.7] text-[#0A0A0A]"
                  style={interSans}
                >
                  {q.text}
                </p>
                <footer className="mt-5 text-[13px] text-[#6B6B6B]" style={interSans}>
                  <span className="text-[#6B6B6B]">— {q.name}</span>
                  <span className="mx-1.5 text-[8px] leading-none text-[#C8102E]" aria-hidden>
                    ●
                  </span>
                  <span className="text-[#6B6B6B]">{q.title}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection id="institutions" className="border-t border-zinc-200 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">For institutions</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
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
          <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-br from-[#C8102E]/[0.12] via-transparent to-zinc-200/40 opacity-90"
            />
            <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] ring-1 ring-zinc-900/[0.06] sm:p-10">
              <div className="flex flex-col divide-y divide-zinc-200/60">
                {INSTITUTION_STATS.map((stat) => (
                  <div key={stat.label} className="flex flex-row items-center gap-5 py-7 first:pt-2 last:pb-2 sm:gap-6 sm:py-8">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#C8102E]/10 text-[#C8102E] sm:h-16 sm:w-16">
                      <stat.Icon className="h-7 w-7 sm:h-8 sm:w-8" strokeWidth={1.75} aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p
                        className="text-[clamp(2.5rem,6vw,3.5rem)] font-bold leading-none tracking-[-0.04em] text-zinc-900"
                        style={interSans}
                      >
                        {stat.value}
                      </p>
                      <p className="mt-2 text-[15px] font-medium leading-snug text-zinc-600 sm:text-base" style={interSans}>
                        {stat.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <section className="w-full bg-[#ECECEC] px-6 py-[100px]" aria-labelledby="landing-cta-heading">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="landing-cta-heading"
            className="font-black leading-[1.1] tracking-[-0.02em] text-[#0A0A0A]"
            style={{ ...interSans, fontSize: "clamp(36px, 5vw, 64px)" }}
          >
            Ready when you are.
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl text-lg leading-snug text-[#0A0A0A]"
            style={interSans}
          >
            Join thousands of Moroccan students building their future with AI — no stress, just next steps.
          </p>
          <Link
            to="/auth"
            className="mt-8 inline-flex rounded-full bg-[#C8102E] px-9 py-4 text-base font-semibold text-white transition-colors duration-200 hover:bg-[#A50D26]"
            style={interSans}
          >
            Get started free
          </Link>
          <p className="mt-4 text-[13px] text-[#0A0A0A]" style={interSans}>
            Free via your university · No credit card required
          </p>
        </div>
      </section>

      <footer className="border-t border-[#E5E5E5] bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div>
            <p className="text-[13px] font-semibold text-[#0A0A0A]" style={interSans}>
              Cariva
            </p>
            <p className="mt-2 text-[13px] text-[#6B6B6B]" style={interSans}>
              AI-native career intelligence for Moroccan students.
            </p>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0A0A0A]" style={interSans}>
              Product
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <a href="#product" className="text-[13px] text-[#6B6B6B] no-underline hover:underline" style={interSans}>
                  Pathways
                </a>
              </li>
              <li>
                <a href="#product" className="text-[13px] text-[#6B6B6B] no-underline hover:underline" style={interSans}>
                  Market data
                </a>
              </li>
              <li>
                <a href="#how" className="text-[13px] text-[#6B6B6B] no-underline hover:underline" style={interSans}>
                  How it works
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0A0A0A]" style={interSans}>
              Company
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/auth" className="text-[13px] text-[#6B6B6B] no-underline hover:underline" style={interSans}>
                  For universities
                </Link>
              </li>
              <li>
                <span className="text-[13px] text-[#6B6B6B]" style={interSans}>
                  About
                </span>
              </li>
              <li>
                <span className="text-[13px] text-[#6B6B6B]" style={interSans}>
                  Contact
                </span>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0A0A0A]" style={interSans}>
              Connect
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] text-[#6B6B6B] no-underline hover:underline"
                  style={interSans}
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="mailto:hello@cariva.app" className="text-[13px] text-[#6B6B6B] no-underline hover:underline" style={interSans}>
                  Email
                </a>
              </li>
            </ul>
            <p className="mt-6 text-[13px] text-[#6B6B6B]" style={interSans}>
              © {new Date().getFullYear()} Cariva. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
