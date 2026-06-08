import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Check,
  FileCheck2,
  LineChart,
  Map as MapIcon,
  Target,
} from "lucide-react";

import InstituteDashboardMock from "@/components/landing/InstituteDashboardMock";
import SiteNav from "@/components/landing/SiteNav";

const interSans = { fontFamily: "Inter, system-ui, sans-serif" } as const;

const DEMO_MAILTO = "mailto:hello@cariva.ai?subject=Cariva%20Institute%20%E2%80%94%20Demo%20request";

const PROBLEM_STATS = [
  {
    stat: "38%",
    description: "youth unemployment in Morocco — the steepest barrier your graduates face.",
  },
  {
    stat: "34%",
    description: "of graduates cite the education–job mismatch as their #1 barrier to employment.",
  },
] as const;

const OBSERVATOIRE_POINTS = [
  {
    title: "Graduate employment tracking",
    body: "Follow every cohort from graduation into the workforce — by program, by year.",
  },
  {
    title: "Time-to-job analytics",
    body: "Measure how long it takes graduates to land their first relevant role.",
  },
  {
    title: "Field-alignment data",
    body: "See how closely graduates' jobs match the field they studied.",
  },
  {
    title: "Accreditation-ready exports",
    body: "Turn outcomes into clean, defensible reports your accreditors can read at a glance.",
  },
] as const;

const FEATURES = [
  {
    icon: Target,
    title: "Cohort readiness scores",
    body: "See how prepared each cohort is, by department — before they ever hit the job market.",
  },
  {
    icon: BarChart3,
    title: "Skills-gap heatmaps",
    body: "Identify exactly where your curricula lag behind real market demand.",
  },
  {
    icon: MapIcon,
    title: "Sector demand intelligence",
    body: "Morocco-specific data on where the jobs actually are — and where they're heading.",
  },
] as const;

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

export default function Institutions() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-white text-zinc-950 antialiased">
      <SiteNav />

      {/* 1 — HERO */}
      <section className="relative overflow-hidden bg-white px-5 pt-24 pb-12 sm:px-8 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16">
        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <motion.p
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C8102E]"
              style={interSans}
            >
              For institutions
            </motion.p>
            <motion.h1
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: reduceMotion ? 0 : 0.06 }}
              className="mt-4 text-balance font-black leading-[1.0] tracking-[-0.045em] text-[#0A0A0A]"
              style={{
                ...interSans,
                fontSize: "clamp(40px, 6vw, 72px)",
              }}
            >
              Prove your students&apos; outcomes.
            </motion.h1>
            <motion.p
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.12 }}
              className="mx-auto mt-8 max-w-[36rem] text-pretty text-[17px] font-normal leading-[1.55] text-[#404040] sm:mt-10 sm:text-[18px] lg:mx-0"
              style={interSans}
            >
              Cariva gives your institution the career intelligence and graduate-outcomes data
              your accreditors want — and your students need.
            </motion.p>
            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.18 }}
              className="mt-10 flex flex-col items-center gap-4 sm:mt-12 lg:items-start"
            >
              <a
                href={DEMO_MAILTO}
                className="inline-flex w-full max-w-sm items-center justify-center rounded-full border-0 bg-[#C8102E] px-10 py-4 text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-[#A50D26] sm:w-auto sm:max-w-none sm:px-12 sm:py-4"
                style={interSans}
              >
                Request a demo
              </a>
              <a
                href={DEMO_MAILTO}
                className="text-[14px] font-medium text-[#525252] underline-offset-4 transition-colors hover:text-[#0A0A0A] hover:underline"
                style={interSans}
              >
                Talk to our team
              </a>
            </motion.div>
          </div>
          <div className="relative mx-auto w-full max-w-lg px-2 lg:mx-0 lg:max-w-none">
            <InstituteDashboardMock />
          </div>
        </div>
      </section>

      {/* 2 — THE PROBLEM */}
      <AnimatedSection id="problem" className="bg-[#F5F5F7] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <h2
            className="text-center text-[clamp(32px,4vw,48px)] font-bold tracking-[-0.02em] text-[#0A0A0A]"
            style={interSans}
          >
            The gap your students face is measurable.
          </h2>
          <div className="mt-14 grid grid-cols-1 gap-10 divide-y divide-y-[0.5px] divide-zinc-200/60 sm:grid-cols-2 sm:gap-12 sm:divide-x sm:divide-x-[0.5px] sm:divide-y-0">
            {PROBLEM_STATS.map((s, i) => (
              <motion.div
                key={s.stat}
                className="flex flex-col items-center gap-4 py-8 text-center sm:px-10 sm:py-4 sm:first:pl-0"
                initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                whileInView={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: reduceMotion ? 0 : i * 0.08, ease: "easeOut" }}
                style={interSans}
              >
                <p className="text-[clamp(3.5rem,8vw,5.5rem)] font-black leading-[0.95] tracking-[-0.04em] text-[#C8102E]">
                  {s.stat}
                </p>
                <p className="max-w-[20rem] text-[15px] leading-[1.55] text-[#404040]">
                  {s.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* 3 — THE DIFFERENTIATOR: OBSERVATOIRE */}
      <AnimatedSection id="observatoire" className="bg-[#0E0E10] px-5 py-28 sm:px-8 sm:py-36">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C8102E]">
              The Observatoire
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl" style={interSans}>
              Track every graduate&apos;s outcome.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-zinc-400 sm:text-base" style={interSans}>
              No Moroccan university has successfully built graduate-outcomes tracking at scale.
              Cariva makes your institution the first — turning scattered alumni signals into a
              living record of where your graduates go and how fast they get there.
            </p>
            <ul className="mt-8 space-y-4">
              {OBSERVATOIRE_POINTS.map((p) => (
                <li key={p.title} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C451]" strokeWidth={2.5} aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-white" style={interSans}>
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-400" style={interSans}>
                      {p.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-lg px-2 lg:mx-0 lg:max-w-none">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#C8102E]/25 via-[#F5C451]/10 to-white/5 opacity-90 blur-2xl"
            />
            <div className="relative">
              <InstituteDashboardMock />
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* 4 — WHAT INSTITUTIONS GET */}
      <AnimatedSection id="capabilities" className="bg-white px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <h2
            className="text-center text-[clamp(32px,4vw,48px)] font-bold tracking-[-0.02em] text-[#0A0A0A]"
            style={interSans}
          >
            What your institution gets
          </h2>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="flex flex-col rounded-2xl border border-[#EAEAEA] bg-white px-6 py-8 transition-shadow duration-[250ms] ease-in-out hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
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

      {/* 5 — ACCREDITATION ANGLE */}
      <AnimatedSection id="accreditation" className="bg-[#F5F5F7] px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <FileCheck2 className="mx-auto h-8 w-8 text-[#C8102E]" strokeWidth={1.5} aria-hidden />
          <h2
            className="mt-6 text-[clamp(30px,3.6vw,44px)] font-bold tracking-[-0.02em] text-[#0A0A0A]"
            style={interSans}
          >
            The data your accreditors want to see.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-[1.65] text-[#404040]" style={interSans}>
            Accreditation increasingly hinges on graduate outcomes — yet most of that evidence
            lives in spreadsheets, surveys, and inboxes. Cariva turns scattered alumni data into
            defensible institutional metrics: employment rates, time-to-job, and field alignment,
            all tracked continuously and ready to export. When the review comes, your case is
            already built.
          </p>
        </div>
      </AnimatedSection>

      {/* 6 — FINAL CTA */}
      <section className="w-full bg-[#0E0E10] px-6 py-[100px]" aria-labelledby="institutions-cta-heading">
        <div className="mx-auto max-w-3xl text-center">
          <LineChart className="mx-auto h-8 w-8 text-[#C8102E]" strokeWidth={1.5} aria-hidden />
          <h2
            id="institutions-cta-heading"
            className="mt-6 font-black leading-[1.1] tracking-[-0.02em] text-white"
            style={{ ...interSans, fontSize: "clamp(34px, 4.5vw, 60px)" }}
          >
            Give your students an unfair advantage.
          </h2>
          <a
            href={DEMO_MAILTO}
            className="mt-8 inline-flex rounded-full bg-[#C8102E] px-9 py-4 text-base font-semibold text-white transition-colors duration-200 hover:bg-[#A50D26]"
            style={interSans}
          >
            Request a demo
          </a>
          <p className="mt-4 text-[13px] text-zinc-400" style={interSans}>
            Free pilot for partner universities · No setup required
          </p>
        </div>
      </section>

      {/* Footer — shared with the student landing page */}
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
              Products
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link to="/" className="text-[13px] text-[#6B6B6B] no-underline hover:underline" style={interSans}>
                  Cariva Learn
                </Link>
                <span className="ml-2 text-[11px] text-[#9B9B9B]" style={interSans}>
                  For students
                </span>
              </li>
              <li>
                <Link to="/institutions" className="text-[13px] text-[#6B6B6B] no-underline hover:underline" style={interSans}>
                  Cariva Institute
                </Link>
                <span className="ml-2 text-[11px] text-[#9B9B9B]" style={interSans}>
                  For universities
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="cursor-default text-[13px] text-gray-400" style={interSans}>
                  Cariva Firm
                </span>
                <span
                  className="rounded-full bg-[#F0F0F0] px-2 py-0.5 text-[10px] font-medium text-gray-400"
                  style={interSans}
                >
                  Soon
                </span>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0A0A0A]" style={interSans}>
              Company
            </p>
            <ul className="mt-3 space-y-2">
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
