import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, TrendingUp, Users, ArrowRight, RotateCcw } from "lucide-react";
import type { PathwayResult } from "@/lib/onboarding";

export default function Pathways() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<PathwayResult | null>(null);
  const [profile, setProfile] = useState<{ full_name: string | null; field_of_study: string | null } | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

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
      setResult(r.result_json as unknown as PathwayResult);
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
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Profile summary */}
      <Card className="p-8 shadow-card">
        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Your career profile</p>
            <h1 className="text-3xl font-bold mb-3">
              {profile?.full_name ?? "Your"} pathways
            </h1>
            <p className="text-muted-foreground mb-4">
              {profile?.field_of_study} · Personalized for the Moroccan market
            </p>
            <div className="flex flex-wrap gap-2">
              {result.topTraits.map((t) => (
                <Badge key={t} variant="secondary" className="text-sm bg-accent-soft text-accent border-0">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <ScoreRing score={animatedScore} />
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/onboarding">
                <RotateCcw className="w-4 h-4" /> Redo questionnaire
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Pathways */}
      <section>
        <h2 className="text-xl font-bold mb-4">Recommended pathways</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {result.pathways.map((p) => (
            <PathwayCard key={p.title} pathway={p} />
          ))}
        </div>
      </section>

      {/* Action plan */}
      <Card className="p-8 shadow-card">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold">Your 90-day action plan</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Concrete steps to bridge your skills gap and start building momentum.</p>
        <ol className="space-y-3">
          {result.actionPlan.map((a, i) => (
            <li key={i} className="flex gap-4 p-4 rounded-lg border border-border hover:border-accent/40 transition-colors">
              <div className="shrink-0 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-bold">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed pt-1">{a}</p>
            </li>
          ))}
        </ol>
      </Card>

      <div className="flex justify-end">
        <Button asChild variant="outline">
          <Link to="/market">Explore the job market <ArrowRight className="w-4 h-4" /></Link>
        </Button>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} stroke="hsl(var(--border))" strokeWidth="10" fill="none" />
        <circle
          cx="70" cy="70" r={radius}
          stroke="hsl(var(--accent))" strokeWidth="10" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{score}</span>
        <span className="text-xs text-muted-foreground">readiness</span>
      </div>
    </div>
  );
}

function PathwayCard({ pathway: p }: { pathway: PathwayResult["pathways"][number] }) {
  return (
    <Card className="p-6 flex flex-col gap-4 hover:shadow-elevated transition-shadow">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-lg leading-snug">{p.title}</h3>
          <Badge className="bg-accent-soft text-accent border-0 shrink-0">{p.fitScore}%</Badge>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-accent rounded-full transition-all duration-700"
            style={{ width: `${p.fitScore}%` }}
          />
        </div>
      </div>

      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {p.whyItFits.map((w, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-accent shrink-0">•</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>

      <div className="border-t border-border pt-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Trajectory</p>
        <div className="space-y-1 text-sm">
          <p><span className="font-semibold text-accent">Y1</span> · {p.trajectory.Y1}</p>
          <p><span className="font-semibold text-accent">Y3</span> · {p.trajectory.Y3}</p>
          <p><span className="font-semibold text-accent">Y5</span> · {p.trajectory.Y5}</p>
        </div>
      </div>

      <div className="border-t border-border pt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Salary (MAD/mo)
          </p>
          <p className="font-semibold">{p.salaryRange.min.toLocaleString()}–{p.salaryRange.max.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1 flex items-center gap-1">
            <Users className="w-3 h-3" /> Top employers
          </p>
          <p className="text-xs leading-tight">{p.topEmployers.join(' · ')}</p>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Skills gap</p>
        <div className="flex flex-wrap gap-1.5">
          {p.skillsGap.map((s) => (
            <span key={s} className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">{s}</span>
          ))}
        </div>
      </div>
    </Card>
  );
}
