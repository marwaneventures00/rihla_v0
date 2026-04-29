import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check, GraduationCap, Languages, Sparkles, TrendingUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const STATS = [
  { value: 38, suffix: "%", label: "Youth unemployment in Morocco" },
  { value: 34, suffix: "%", label: "Cite education-job mismatch as #1 barrier" },
  { value: 3, suffix: "", label: "AI-powered modules" },
  { value: 90, suffix: "", label: "Day personalized action plan" },
];

const FEATURES = [
  {
    icon: Sparkles,
    gradient: "from-[#6366F1] to-[#3B82F6]",
    title: "Personalized career pathways",
    body: "Answer 3 questions. Get AI-generated career paths built for the Moroccan market — with fit scores, salary ranges, and a 90-day action plan.",
    tag: "Powered by Claude AI",
  },
  {
    icon: TrendingUp,
    gradient: "from-[#3B82F6] to-[#22D3EE]",
    title: "Real Moroccan job market data",
    body: "Explore 12 sectors, 80+ roles, and 30 top employers. Understand what the market actually wants — before you graduate.",
    tag: "Updated monthly",
  },
  {
    icon: GraduationCap,
    gradient: "from-[#8B5CF6] to-[#C8102E]",
    title: "Close your skills gap",
    body: "Practice with AI mock interviews, solve Morocco-specific business cases, and get matched to the exact Coursera courses your pathway needs.",
    tag: "Business cases · Interviews · Courses",
  },
];

const STEPS = [
  {
    title: "Tell us about yourself",
    body: "Academic background + personality profile in a guided flow.",
  },
  {
    title: "AI builds your pathways",
    body: "Claude analyzes your profile and maps the best-fit outcomes.",
  },
  {
    title: "Explore and develop",
    body: "Use market intelligence and practice modules to close your gaps.",
  },
  {
    title: "Land your dream job",
    body: "Move from uncertainty to confidence with a clear plan.",
  },
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
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      whileInView={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, amount: 0.8 });
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    if (reduceMotion) {
      setValue(target);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, reduceMotion, target]);

  return (
    <span ref={ref}>
      {value}
      {suffix}
    </span>
  );
}

export default function Landing() {
  const reduceMotion = useReducedMotion();
  const { t, toggleLanguage } = useLanguage();
  const heroWords = useMemo(() => ["Your", "career,", "personalized", "by", "AI."], []);
  const isDarkMode = true;

  return (
    <div className={`min-h-screen overflow-hidden transition-colors ${isDarkMode ? "bg-[#050508] text-white" : "bg-[#F6F7FB] text-[#141424]"}`}>
      <style>{`
        .mesh-bg-dark {
          background:
            radial-gradient(1200px 600px at 10% 0%, rgba(99,102,241,0.12), transparent 60%),
            radial-gradient(900px 500px at 90% 100%, rgba(139,92,246,0.1), transparent 60%),
            linear-gradient(180deg, #050508 0%, #0D0D1A 100%);
          animation: meshShift 24s ease-in-out infinite alternate;
        }
        .mesh-bg-light {
          background:
            radial-gradient(1200px 600px at 10% 0%, rgba(99,102,241,0.12), transparent 60%),
            radial-gradient(900px 500px at 90% 100%, rgba(200,16,46,0.08), transparent 60%),
            linear-gradient(180deg, #F6F7FB 0%, #EEF0F8 100%);
          animation: meshShift 24s ease-in-out infinite alternate;
        }
        .grid-overlay-dark {
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .grid-overlay-light {
          background-image:
            linear-gradient(rgba(20,20,36,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20,20,36,0.05) 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(90px);
          pointer-events: none;
          animation: orbFloat 26s ease-in-out infinite alternate;
        }
        .orb2 { animation-duration: 30s; animation-delay: -7s; }
        .orb3 { animation-duration: 22s; animation-delay: -4s; }
        .shimmer {
          position: relative;
          overflow: hidden;
        }
        .shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(110deg, transparent, rgba(255,255,255,0.25), transparent);
          animation: shimmer 3s linear infinite;
        }
        .cta-gradient {
          background-size: 140% 140%;
          animation: ctaShift 5s ease infinite;
        }
        @keyframes meshShift {
          0% { filter: hue-rotate(0deg); transform: scale(1); }
          100% { filter: hue-rotate(8deg); transform: scale(1.03); }
        }
        @keyframes orbFloat {
          0% { transform: translate(0px, 0px) scale(1); }
          100% { transform: translate(24px, -20px) scale(1.06); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes ctaShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .mesh-bg-dark, .mesh-bg-light, .orb, .shimmer::after, .cta-gradient { animation: none !important; }
        }
      `}</style>

      <section className={`relative min-h-screen flex items-center justify-center px-6 py-20 ${isDarkMode ? "mesh-bg-dark" : "mesh-bg-light"}`}>
        <div className={`absolute inset-0 ${isDarkMode ? "grid-overlay-dark" : "grid-overlay-light"}`} />
        <div className="orb w-[600px] h-[600px] bg-[#6366F1]/20 top-[-160px] left-[-120px]" />
        <div className="orb orb2 w-[400px] h-[400px] bg-[#3B82F6]/20 bottom-[-120px] right-[-100px]" />
        <div className="orb orb3 w-[300px] h-[300px] bg-[#8B5CF6]/15 top-[30%] right-[20%]" />

        <div className="relative z-10 max-w-5xl text-center">
          <div className="absolute -top-12 right-0">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-xs text-[#C9C9E8] hover:bg-black/45 transition-colors"
              aria-label="Toggle language"
            >
              <Languages className="w-3.5 h-3.5" />
              {t("lang.switch", "FR")}
            </button>
          </div>

          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`inline-flex shimmer items-center rounded-full border px-4 py-2 text-xs sm:text-sm ${
              isDarkMode
                ? "border-[#2A2A4A] text-[#C9C9E8] bg-gradient-to-r from-[#17172A] to-[#101021]"
                : "border-[#D4D6E5] text-[#48486A] bg-gradient-to-r from-[#FFFFFF] to-[#F2F4FB]"
            }`}
          >
            ✦ Powered by Claude AI · AI-Native Platform
          </motion.div>

          <h1 className="mt-8 text-[40px] sm:text-[56px] lg:text-[72px] leading-[1.06] font-semibold tracking-tight">
            {heroWords.map((word, i) => (
              <motion.span
                key={word + i}
                initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: reduceMotion ? 0 : 0.2 + i * 0.1 }}
                className="inline-block mr-3"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: reduceMotion ? 0 : 0.8 }}
            className={`mt-8 mx-auto max-w-3xl text-lg sm:text-xl ${isDarkMode ? "text-[#A0A0B8]" : "text-[#67678A]"}`}
          >
            Cariva maps your skills, decodes the job market, and builds your personal path to the career you want. Built for Moroccan students. Trusted by universities.
          </motion.p>

          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: reduceMotion ? 0 : 1 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/auth"
              className="cta-gradient rounded-xl px-7 py-3.5 text-sm sm:text-base font-medium bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:brightness-110 hover:scale-[1.02] transition-all"
            >
              {t("landing.cta.start", "Get started free →")}
            </Link>
            <Link
              to="/auth"
              className={`rounded-xl px-7 py-3.5 text-sm sm:text-base font-medium border transition-all ${
                isDarkMode
                  ? "border-white/35 text-white hover:bg-white hover:text-[#0A0A14]"
                  : "border-[#AEB2C9] text-[#1C1C34] hover:bg-[#1C1C34] hover:text-white"
              }`}
            >
              {t("landing.cta.universities", "For universities")}
            </Link>
          </motion.div>

          <p className={`mt-6 text-xs sm:text-sm ${isDarkMode ? "text-[#666680]" : "text-[#7A7A9E]"}`}>
            Trusted by leading Moroccan universities · Powered by frontier AI
          </p>
        </div>
      </section>

      <AnimatedSection className={`border-y px-6 py-12 ${isDarkMode ? "border-[#1E1E35] bg-[#0A0A14]" : "border-[#DDE0EF] bg-[#EEF0F8]"}`}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center lg:text-left">
              <p className="text-3xl sm:text-4xl font-semibold bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
                <CountUp target={s.value} suffix={s.suffix} />
              </p>
              <p className={`mt-2 text-sm ${isDarkMode ? "text-[#A0A0B8]" : "text-[#65658B]"}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center">Everything you need to launch your career</h2>
          <p className={`text-center mt-4 ${isDarkMode ? "text-[#A0A0B8]" : "text-[#65658B]"}`}>Three AI-powered modules working together</p>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <motion.article
                whileHover={reduceMotion ? {} : { scale: 1.02 }}
                key={f.title}
                className={`group rounded-2xl border p-6 hover:shadow-[0_0_36px_rgba(99,102,241,0.22)] transition-all ${
                  isDarkMode ? "bg-[#0F0F1A] border-[#1E1E35]" : "bg-white border-[#E3E6F3]"
                }`}
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${f.gradient}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{f.title}</h3>
                <p className={`mt-3 leading-relaxed ${isDarkMode ? "text-[#A0A0B8]" : "text-[#66668C]"}`}>{f.body}</p>
                <p className={`mt-6 text-xs ${isDarkMode ? "text-[#C9C9E8]" : "text-[#58587E]"}`}>{f.tag}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center">From lost to launched. In minutes.</h2>
          <div className="mt-12 grid md:grid-cols-4 gap-6 md:gap-4 relative">
            <div className={`hidden md:block absolute left-0 right-0 top-5 h-px bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] ${isDarkMode ? "opacity-100" : "opacity-70"}`} />
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative md:text-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white flex items-center justify-center font-semibold mx-0 md:mx-auto">
                  {i + 1}
                </div>
                <h3 className="mt-4 font-semibold text-lg">{step.title}</h3>
                <p className={`mt-2 text-sm ${isDarkMode ? "text-[#A0A0B8]" : "text-[#66668C]"}`}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-semibold text-center">Built for Morocco's generation of achievers</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {QUOTES.map((q) => (
              <motion.article
                whileHover={reduceMotion ? {} : { scale: 1.02 }}
                key={q.author}
                className={`rounded-2xl border p-6 hover:shadow-[0_0_36px_rgba(139,92,246,0.2)] transition-all ${
                  isDarkMode ? "bg-[#0F0F1A] border-[#1E1E35]" : "bg-white border-[#E3E6F3]"
                }`}
              >
                <p className={`leading-relaxed ${isDarkMode ? "text-[#FFFFFF]" : "text-[#1E1E38]"}`}>"{q.text}"</p>
                <p className={`mt-5 text-sm ${isDarkMode ? "text-[#A0A0B8]" : "text-[#66668C]"}`}>— {q.author}</p>
              </motion.article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {["ESCA", "UM6P", "UIR"].map((logo) => (
              <span key={logo} className={`px-4 py-2 rounded-full border text-sm ${isDarkMode ? "border-[#2A2A45] bg-[#0E0E18] text-[#8E8EA8]" : "border-[#D9DCEE] bg-white text-[#66668C]"}`}>
                {logo}
              </span>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-[#6366F1] tracking-[0.15em] text-xs font-semibold">FOR INSTITUTIONS</p>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">Give your students an unfair advantage</h2>
            <p className={`mt-5 leading-relaxed ${isDarkMode ? "text-[#A0A0B8]" : "text-[#66668C]"}`}>
              Cariva gives your institution a full career intelligence dashboard — cohort readiness scores, skills gap analysis, sector demand trends. The data your accreditors want to see.
            </p>
            <Link
              to="/auth"
              className="inline-flex mt-7 rounded-xl px-6 py-3 text-sm font-medium bg-[#6366F1] hover:bg-[#5558EB] transition-colors"
            >
              Request a demo →
            </Link>
            <ul className={`mt-7 space-y-3 ${isDarkMode ? "text-[#D8D8EA]" : "text-[#2F2F52]"}`}>
              {[
                "University-level analytics dashboard",
                "Student career readiness scores",
                "Skills gap heatmap by department",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-[#8B5CF6]" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <motion.div
            whileHover={reduceMotion ? {} : { scale: 1.02 }}
            className={`rounded-2xl border p-6 shadow-[0_0_40px_rgba(99,102,241,0.2)] ${
              isDarkMode
                ? "border-[#2A2A46] bg-gradient-to-br from-[#111124] to-[#0B0B16]"
                : "border-[#DBDEF0] bg-gradient-to-br from-[#FFFFFF] to-[#F3F5FC]"
            }`}
          >
            <div className="grid grid-cols-2 gap-4">
              {[
                "25 universities",
                "8,000+ students",
              ].map((item) => (
                <div key={item} className={`rounded-xl border p-4 text-sm ${isDarkMode ? "border-[#1E1E35] bg-[#0F0F1A] text-[#D2D2E5]" : "border-[#E0E3F2] bg-white text-[#3A3A5C]"}`}>
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="px-6 py-24">
        <div className={`max-w-5xl mx-auto rounded-3xl border p-10 text-center ${isDarkMode ? "border-[#2A2A45] bg-gradient-to-r from-[#111126] to-[#0A0A14]" : "border-[#DBDEF0] bg-gradient-to-r from-[#FFFFFF] to-[#F3F5FC]"}`}>
          <h2 className="text-3xl sm:text-4xl font-semibold">Your career starts with clarity.</h2>
          <p className={`mt-4 ${isDarkMode ? "text-[#A0A0B8]" : "text-[#66668C]"}`}>Join thousands of Moroccan students building their future with AI.</p>
          <Link
            to="/auth"
            className="cta-gradient inline-flex mt-8 rounded-xl px-8 py-3.5 text-base font-medium bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:brightness-110 hover:scale-[1.02] transition-all"
          >
            Start for free →
          </Link>
          <p className={`mt-4 text-sm ${isDarkMode ? "text-[#7A7A94]" : "text-[#76769A]"}`}>Free via your university · No credit card required</p>
        </div>
      </AnimatedSection>

      <footer className={`px-6 py-10 border-t ${isDarkMode ? "border-[#1B1B32] bg-[#050508]" : "border-[#DDE0EF] bg-[#F6F7FB]"}`}>
        <div className="max-w-6xl mx-auto border-t border-transparent pt-2 [border-image:linear-gradient(to_right,transparent,#3A3A64,transparent)_1]">
          <div className="grid md:grid-cols-3 gap-6 items-center text-sm">
            <div>
              <p className={`font-semibold ${isDarkMode ? "text-white" : "text-[#141424]"}`}>Cariva</p>
              <p className={`mt-1 ${isDarkMode ? "text-[#A0A0B8]" : "text-[#66668C]"}`}>AI-native career intelligence</p>
            </div>
            <div className={`flex flex-wrap gap-4 md:justify-center ${isDarkMode ? "text-[#B6B6CF]" : "text-[#5E5E82]"}`}>
              {["Product", "For Universities", "About", "Contact"].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
            <div className="md:text-right">
              <span className={`inline-flex text-xs rounded-full border px-3 py-1 ${isDarkMode ? "border-[#2A2A45] bg-[#0E0E18] text-[#C7C7E4]" : "border-[#D9DCEE] bg-white text-[#5C5C7E]"}`}>
                Powered by Claude AI
              </span>
              <p className={`mt-2 ${isDarkMode ? "text-[#8A8AA5]" : "text-[#76769A]"}`}>© 2026 Cariva. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
