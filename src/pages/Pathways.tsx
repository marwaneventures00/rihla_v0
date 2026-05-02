import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, TrendingUp, Users, ArrowRight, RotateCcw } from "lucide-react";
import type { PathwayResult } from "@/lib/onboarding";
import { useLanguage } from "@/lib/i18n";

export default function Compass() {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PathwayResult | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; field_of_study: string | null } | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [selectedPathway, setSelectedPathway] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        navigate("/auth", { replace: true });
        return;
      }
      const uid = s.session.user.id;

      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("full_name, field_of_study, onboarding_completed").eq("user_id", uid).maybeSingle(),
        supabase.from("pathway_results").select("result_json").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (!p?.onboarding_completed || !r) {
        navigate("/onboarding", { replace: true });
        return;
      }

      setProfile({ full_name: p.full_name, field_of_study: p.field_of_study });
      const parsed = r.result_json as unknown as PathwayResult;
      setResult(parsed);
      setSelectedPathway(0);
      setLoading(false);
    })();
  }, [navigate]);

  // Animate readiness score
  useEffect(() => {
    if (!result) return;
    const target = result.readinessScore;
    const start = performance.now();
    const duration = 1500;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!result) return null;
  const topPathways = result.pathways.slice(0, 3);
  const activePathway = topPathways[selectedPathway] ?? topPathways[0] ?? null;

  return (
    <div className="space-y-10 md:space-y-12 max-w-[1100px]">
      <Card className="p-6 md:p-8 border-border/80 bg-card/90 backdrop-blur-md relative overflow-hidden">
        <div className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-10 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground mb-2">{tr("Your career profile", "Votre profil de carriere")}</p>
            <h1 className="text-[1.75rem] md:text-[2rem] font-medium text-foreground mb-2 tracking-tight">
              {profile?.full_name ?? tr("Your", "Vos")} {tr("Compass", "Compass")}
            </h1>
            <p className="text-sm text-muted-foreground mb-5">
              {profile?.field_of_study} · {tr("Personalized for the Moroccan market", "Personnalise pour le marche marocain")}
            </p>
            <div className="flex flex-wrap gap-2">
              {result.topTraits.map((t) => (
                <span
                  key={t}
                  className="text-xs px-3 py-1 rounded-full border border-primary/35 bg-transparent text-foreground font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-4 flex flex-col items-center md:items-end">
            <ScoreRing score={animatedScore} />
            <Button asChild variant="outline" size="sm" className="w-full md:w-auto">
              <Link to="/onboarding">
                <RotateCcw className="w-4 h-4" /> {tr("Redo questionnaire", "Refaire le questionnaire")}
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <h2 className="text-[var(--text-h2)] font-medium">{tr("Top 3 jobs for you", "Top 3 metiers pour vous")}</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {topPathways.map((p, idx) => (
            <button
              key={p.title}
              type="button"
              onClick={() => setSelectedPathway(idx)}
              className={`text-left rounded-[14px] border p-4 transition-colors ${
                idx === selectedPathway
                  ? "border-primary/40 bg-[var(--red-subtle)]"
                  : "border-border bg-card hover:bg-muted/40 hover:border-border"
              }`}
            >
              <p className="font-semibold text-sm leading-snug">{cleanPathwayTitle(p.title)}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.fitScore}% fit</p>
            </button>
          ))}
        </div>
        {activePathway && (
          <div className="mt-5">
            <PathwayCard pathway={activePathway} />
          </div>
        )}
      </section>

      {/* Action plan */}
      <Card className="p-6 md:p-8 border-border/80">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-[var(--text-h2)] font-medium">{tr("Your 90-day action plan", "Votre plan d'action sur 90 jours")}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-8">{tr("Concrete steps to bridge your skills gap and start building momentum.", "Des actions concretes pour reduire vos ecarts de competences et prendre de l'elan.")}</p>
        <ol className="space-y-4">
          {result.actionPlan.map((a, i) => (
            <li key={i} className="flex gap-4 items-start">
              <div className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm leading-[1.8] text-muted-foreground pt-0.5">{a}</p>
            </li>
          ))}
        </ol>
      </Card>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link to="/market">{tr("Explore the job market", "Explorer le marche de l'emploi")} <ArrowRight className="w-4 h-4" /></Link>
        </Button>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        <defs>
          <linearGradient id="compassScoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={radius} stroke="hsl(var(--border))" strokeWidth="10" fill="none" />
        <circle
          cx="70" cy="70" r={radius}
          stroke="url(#compassScoreGradient)" strokeWidth="10" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground">{tr("readiness", "maturite")}</span>
      </div>
    </div>
  );
}

function cleanPathwayTitle(title: string) {
  return title.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
}

function PathwayCard({ pathway: p }: { pathway: PathwayResult["pathways"][number] }) {
  const { language } = useLanguage();
  const tr = (en: string, fr: string) => (language === "fr" ? fr : en);
  return (
    <Card className="p-6 flex flex-col gap-5 border-border/80 hover:border-border transition-colors">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden" aria-hidden>
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${p.fitScore}%` }} />
          </div>
          <span className="text-sm font-medium text-muted-foreground tabular-nums shrink-0">{p.fitScore}%</span>
        </div>
        <h3 className="text-[17px] font-medium leading-snug pr-2">{cleanPathwayTitle(p.title)}</h3>
      </div>

      <ul className="space-y-2 text-sm text-muted-foreground">
        {p.whyItFits.map((w, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-primary shrink-0">•</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-border pt-4">
        <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-3">{tr("Trajectory", "Trajectoire")}</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm">
          {(["Y1", "Y3", "Y5"] as const).map((key, i) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full shrink-0 ${i === 0 ? "bg-primary" : "border border-muted-foreground/60 bg-transparent"}`} />
              <span className="font-medium text-foreground">{key}</span>
              <span className="text-muted-foreground hidden sm:inline">→</span>
              <span className="text-muted-foreground sm:ml-0">{p.trajectory[key]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {tr("Salary (MAD/mo)", "Salaire (MAD/mois)")}
          </p>
          <p className="font-semibold">{p.salaryRange.min.toLocaleString()}–{p.salaryRange.max.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
            <Users className="w-3 h-3" /> {tr("Top employers", "Principaux employeurs")}
          </p>
          <p className="text-xs leading-tight">{p.topEmployers.join(' · ')}</p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground mb-2">{tr("Skills gap", "Ecarts de competences")}</p>
        <div className="flex flex-wrap gap-2">
          {p.skillsGap.map((s) => (
            <span
              key={s}
              className="text-xs leading-tight px-2.5 py-1 rounded-full border border-[var(--red-border)] bg-[var(--red-subtle)] text-primary font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      <Button asChild className="mt-1 border border-primary/25 bg-[var(--red-subtle)] text-primary hover:bg-[var(--red-subtle)] hover:opacity-90">
        <a href={`/develop?tab=interview&role=${encodeURIComponent(cleanPathwayTitle(p.title))}`}>
          {tr("Prepare this job in Forge", "Preparer ce metier dans Forge")} <ArrowRight className="w-4 h-4" />
        </a>
      </Button>
    </Card>
  );
}
