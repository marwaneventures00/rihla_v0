import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Check, GraduationCap, Sparkles, TrendingUp } from "lucide-react";

import HeroReportMock from "@/components/landing/HeroReportMock";
import InstituteDashboardMock from "@/components/landing/InstituteDashboardMock";
import SiteNav from "@/components/landing/SiteNav";

const STATS = [
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
      <SiteNav />

      {/* Hero — two-column on desktop (headline + CTA left, product mock right), stacked on mobile */}
      <section className="relative overflow-hidden bg-white px-5 pt-24 pb-12 sm:px-8 sm:pt-28 sm:pb-14 md:pt-32 md:pb-16">
        <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
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
              className="mx-auto mt-8 max-w-[34rem] text-pretty text-[17px] font-normal leading-[1.55] text-[#404040] sm:mt-10 sm:text-[18px] lg:mx-0"
              style={interSans}
            >
              Cariva maps your skills, reads the job market, and builds your personal action plan in minutes.
            </motion.p>
            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.16 }}
              className="mt-10 flex flex-col items-center gap-4 sm:mt-12 lg:items-start"
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
          <div className="w-full min-w-0">
            <HeroReportMock />
          </div>
        </div>
      </section>

      {/* Trust strip — understated social-proof wordmarks right under the hero */}
      <section className="bg-white px-5 py-10 sm:px-8 sm:py-12" aria-label="Trusted by students from leading institutions">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm text-gray-500" style={interSans}>
            Built with students from Morocco&apos;s top institutions
          </p>
          <div
            className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-12"
            style={interSans}
          >
            {["ESCA", "UM6P", "Al Akhawayn University", "ENCG"].map((name) => (
              <span key={name} className="text-base font-medium text-gray-400">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <AnimatedSection id="product" className="bg-[#F5F5F7] px-5 pt-20 pb-24 sm:px-8 sm:pt-28 sm:pb-32">
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
                className="flex flex-col bg-transparent px-6 py-8 transition-[background-color,box-shadow,border-radius] duration-[250ms] ease-in-out hover:rounded-2xl hover:bg-white hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
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

      <section id="stats" className="bg-white px-5 py-12 sm:px-8 sm:py-16" aria-label="Key statistics">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-8 divide-y divide-y-[0.5px] divide-zinc-200/30 md:grid-cols-3 md:gap-12 md:divide-x md:divide-x-[0.5px] md:divide-y-0">
            {STATS.map((s, i) => (
              <motion.div
                key={s.kicker}
                className="flex flex-col items-center gap-3 py-8 text-center md:gap-4 md:py-11 md:pl-12 md:first:pl-0"
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
                <p className="max-w-[14rem] text-[13px] font-normal leading-snug text-[#0A0A0A]">
                  {s.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="bg-red-50/40 px-5 py-24 sm:px-8 sm:py-32" aria-labelledby="how-heading">
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

      <AnimatedSection id="stories" className="bg-white px-5 py-24 sm:px-8 sm:py-32">
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

      <AnimatedSection id="institutions" className="bg-[#0E0E10] px-5 py-28 sm:px-8 sm:py-36">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C8102E]">For institutions</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Give your students an unfair advantage
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-zinc-400 sm:text-base">
              Cariva gives your institution a full career intelligence dashboard — cohort readiness scores, skills gap
              analysis, sector demand trends. The data your accreditors want to see.
            </p>
            <Link
              to="/auth"
              className="mt-8 inline-flex rounded-md bg-white px-6 py-2.5 text-sm font-medium text-[#0E0E10] transition-opacity hover:opacity-90"
            >
              Request a demo →
            </Link>
            <ul className="mt-8 space-y-3 text-sm text-zinc-200">
              {["University-level analytics dashboard", "Student career readiness scores", "Skills gap heatmap by department"].map(
                (item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#C8102E]" strokeWidth={2} />
                    {item}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-lg px-2 lg:mx-0 lg:max-w-none">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-[#C8102E]/20 via-transparent to-white/5 opacity-90 blur-2xl"
            />
            <div className="relative">
              <InstituteDashboardMock />
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
